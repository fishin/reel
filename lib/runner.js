var Child = require('child_process');
var Concat = require('concat-stream');
var Pail = require('pail');

var internals = { pid: null };

module.exports = internals.Runner = function (options) {

    this.settings = options;
    internals.Runner.settings = options;
    this.start = exports.start;
    this.recurse = exports.recurse;
    internals.Runner.serialCall = internals.serialCall;
};

internals.executeSerial = function(cmd) {

    var result = {}; 
    //console.log('cmd: ' + cmd);
    var command = internals.splitCommand(cmd);
    console.log('running command (serial): ' + command.cmd + ' ' + command.args);
    result.startTime = new Date().getTime();
    var executer = Child.spawnSync(command.cmd, command.args, {encoding: 'utf8'} );
    //console.log(executer);
    //if (executer.signal) {
    //    err = 'aborted';
    //} else {
    // err =  executer.error;
    //}
    result.finishTime = new Date().getTime();
    result.pid = executer.pid;
    result.signal = executer.signal;
    result.stdout = executer.stdout;
    result.stderr = executer.stderr;
    result.error = executer.error;
    result.code = executer.status;
    return result;
}

internals.splitCommand = function(cmd) {
  
    var parts = cmd.split(" ");
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
         args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
}

exports.start = function(run_id) {

    var pail = new Pail(this.settings.reel);
    var config = pail.getPail(run_id);
    config.status = 'starting';
    var runConfig = pail.savePail(config);
    //console.log('starting run_id: ' + runConfig.id);
    var commands = [];
    // need to get this back to a plain array list for exec
    for (var i = 0; i < runConfig.commands.length; i++) { 

        if (JSON.stringify(runConfig.commands[i]).match(',')) {
            var json = JSON.parse(JSON.stringify(runConfig.commands[i]));
            var parallelCommands = [];
            for (var j = 0; j < json.length; j++) {

                parallelCommands.push(json[j].command);
            }
            commands.push(parallelCommands);
        }
        else {
            commands.push(runConfig.commands[i].command);
        }
    }
/*
    internals.serialCall(runConfig.id, commands, internals.onFinish);
    return internals.pid;
*/
    // need to check for results.stderr
    var prevDir = process.cwd();
    process.chdir(this.settings.reel.pailPath + '/' + run_id + '/' + this.settings.reel.workspace);
    //console.log('changed to dir: ' + process.cwd());
     
    //internals.serialCall(commands, internals.onFinish);
    var err = this.recurse(run_id, 0, commands, null);
    process.chdir(prevDir);
    //console.log('changed back to dir: ' + process.cwd());
    var finishConfig = pail.getPail(run_id);
    var saveConfig;
    if (err) {
       finishConfig.status = 'failed';
       saveConfig = pail.savePail(finishConfig);
    }
    else {
        finishConfig.status = 'succeeded';
        saveConfig = pail.savePail(finishConfig);
    }
    return saveConfig;
};
/*
exports.registerQueue = function() {

   // register with master job reelner and register the queue name if it doesnt exist
   // by default it will just register with "global" queue
   console.log('made it to registerQueue');
};
*/
exports.recurse = function (run_id, index, commands, err) {

    var result = {};
    var pail = new Pail(this.settings.reel);
    var runConfig = pail.getPail(run_id);
    if (index < commands.length) {

        if (typeof commands[index] === 'object') {
            result = internals.executeParallel(commands[index]);
            //console.log('blah: ' + JSON.stringify(result, null, 4));
            for (var i = 0; i < commands[index].length; i++) {
                //console.log('not saving');
                runConfig.commands[index][i].startTime = result[i].startTime;
                runConfig.commands[index][i].pid = result[i].pid;
                runConfig.commands[index][i].signal = result[i].signal;
                runConfig.commands[index][i].stdout = result[i].stdout;
                runConfig.commands[index][i].stderr = result[i].stderr;
                runConfig.commands[index][i].error = result[i].error;
                runConfig.commands[index][i].code = result[i].code;
                runConfig.commands[index][i].finishTime = result[i].finishTime;
                if (result[i].error) {
                    err = result[i].error;
                }
                else if (result[i].code !== 0) {
                    err = result[i].stderr;
                }
                var saveConfig = pail.savePail(runConfig);
            }
        }
        else {
            result = internals.executeSerial(commands[index]);
            //console.log('result output:\n' + JSON.stringify(result, null, 4));
            runConfig.commands[index].startTime = result.startTime;
            runConfig.commands[index].pid = result.pid;
            runConfig.commands[index].signal = result.signal;
            runConfig.commands[index].stdout = result.stdout;
            runConfig.commands[index].stderr = result.stderr;
            runConfig.commands[index].error = result.error;
            runConfig.commands[index].code = result.code;
            runConfig.commands[index].finishTime = result.finishTime;
            if (result.error) {
                err = result.error;
            }
            else if (result.code !== 0) {
                err = result.stderr;
            };
            var saveConfig = pail.savePail(runConfig);
        }
        //console.log('err: ' + err);
	if (!err) {
            return this.recurse(run_id, ++index, commands, err);
        }
        else {
            return err;
        }
    }
    else {
        // maybe move save finish logic here
        //console.log('finished');
        return err;
    }
}

internals.executeParallel = function (cmds) {

   var paraResult = [];
   for (var i = 0; i < cmds.length; i++) {
       var command = internals.splitCommand(cmds[i]);
       var subResult = internals.executeSerial(command.cmd + ' ' + command.args);
       paraResult.push(subResult);
/*
       var subResult = {}; 
       console.log('running command (parallel): ' + command.cmd + ' ' + command.args);
       subResult.startTime = new Date().getTime();
       var executer = Child.spawn(command.cmd, command.args, {encoding: 'utf8'} );
       subResult.pid = executer.pid;
       subResult.signal = executer.signal;
       subResult.stdout = '';
       subResult.stderr = '';
       executer.stdout.on('data', function (data) {

           subResult.stdout += data; 
       });

       executer.stderr.on('data', function (data) {

           subResult.stderr += data; 
       });

       executer.on('exit', function (code) {
           console.log('i exited: ' + code);
           console.log(subResult);
           subResult.finishTime = new Date().getTime();
           paraResult.push(subResult);
       });
*/
   }
   console.log('made it to end of loop');
   return paraResult;
}

/*

internals.onFinish = function (run_id, err, results) {

    //var err = this.recurse(run_id, 0, commands, null);
    //console.log('changed back to dir: ' + process.cwd());
    var pail = new Pail(internals.Runner.settings.reel);
    var finishConfig = pail.getPail(run_id);
    var saveConfig;
    if (err) {
       finishConfig.status = 'failed';
       saveConfig = pail.savePail(finishConfig);
    }
    else {
        finishConfig.status = 'succeeded';
        saveConfig = pail.savePail(finishConfig);
    }
};

internals.serialCall = function (run_id, commands, ready) {

    console.log('made it to serial call') 
    var results = [];
    var pail = new Pail(internals.Runner.settings.reel);
    var runConfig = pail.getPail(run_id);
    var index = 0;
    iterate();

    function iterate() {

        var err = null;
        var nextCommand = commands.shift();
        var prevDir = process.cwd();
        var startTime = new Date().getTime();
        if (!nextCommand) {
            console.log('changing back to dir: ' + prevDir);
            process.chdir(prevDir);
            return ready(run_id, null, results);
        }
        if (typeof nextCommand === 'object') {

            console.log('parallel time: ' + nextCommand);
            //result = internals.executeParallel(commands[index]);
            for (var i = 0; i < nextCommand.length; i++) {
                console.log('push it: ' + nextCommand[i]);
                runConfig.commands.push({ command: nextCommand[i] });
                commands.push(nextCommand[i]);
            }
            index++;
            return iterate(); 
        }
        console.log('serialCall: ' + nextCommand);
        var command = internals.splitCommand(nextCommand);
        process.chdir(internals.Runner.settings.reel.pailPath + '/' + run_id + '/' + internals.Runner.settings.reel.workspace);
        var subprocess = Child.spawn.apply(Child.spawn, [ command.cmd, command.args ]);
        var stdout;
        var stderr;
        internals.pid = subprocess.pid;
        // capture stdout and stderr
        subprocess.stdout.pipe(Concat(function(buf) {
            stdout = buf.toString('utf8');
            console.log('stdout: ' + stdout);
        }));

        subprocess.stderr.pipe(Concat(function(buf) {

            stderr = buf.toString('utf8');
        }));

        subprocess.on('exit', function(code, signal) {

            console.log('exiting.....' + nextCommand);
            runConfig.commands[index].startTime = startTime;
            runConfig.commands[index].pid = subprocess.pid;
            runConfig.commands[index].signal = subprocess.signal;
            runConfig.commands[index].stdout = stdout;
            runConfig.commands[index].stderr = stderr;
            runConfig.commands[index].error = subprocess.error;
            runConfig.commands[index].code = code;
            runConfig.commands[index].finishTime = new Date().getTime();
            if (subprocess.error) {
                console.log('i had an error');
                err = subprocess.error;
            }
            else if (code !== 0) {

                console.log(code);
                console.log('i had an non-zero code');
                err = subprocess.stderr;
            };
            var saveConfig = pail.savePail(runConfig);
            if (err) {
                console.log('all done due to err');
                return ready(run_id, err);
            }
            index++;
            return iterate();
        });
    }
};
*/
