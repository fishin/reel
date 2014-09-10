var Child = require('child_process');
var Pail = require('pail');

var internals = {
    defaults: {
        apiPath: '/api',
        pail: {
            pailPath: '/tmp/reel',
            workspace: 'workspace',
            configFile: 'config.json'
        }
    }
};

var pail = new Pail(internals.defaults.pail);

internals.executeSerial = function(cmd) {

    var result = {}; 
    //console.log('cmd: ' + cmd);
    var command = internals.splitCommand(cmd);
    console.log('running command (serial): ' + command.cmd + ' ' + command.args);
    result.startTime = new Date().getTime();
    var executer = Child.spawnSync(command.cmd, command.args, {encoding: 'utf8'} );
    console.log(executer);
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

exports.start = function(id) {

    var config = pail.getPail(id);
    config.status = 'starting';
    var reelConfig = pail.savePail(config);
    //console.log('starting id: ' + reelConfig.id);
    var commands = [];
    // need to get this back to a plain array list for exec
    for (var i = 0; i < reelConfig.commands.length; i++) { 

        if (JSON.stringify(reelConfig.commands[i]).match(',')) {
            var json = JSON.parse(JSON.stringify(reelConfig.commands[i]));
            var parallelCommands = [];
            for (var j = 0; j < json.length; j++) {

                parallelCommands.push(json[j].command);
            }
            commands.push(parallelCommands);
        }
        else {
            commands.push(reelConfig.commands[i].command);
        }
    }
    // need to check for results.stderr
    var prevDir = process.cwd();
    process.chdir(internals.defaults.pail.pailPath + '/' + id + '/' + internals.defaults.pail.workspace);
    console.log('changed to dir: ' + process.cwd());
    var err = internals.recurse(id, 0, commands, null);
    process.chdir(prevDir);
    console.log('changed back to dir: ' + process.cwd());
    var finishConfig = pail.getPail(id);
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
    //return reelConfig;
};
/*
exports.registerQueue = function() {

   // register with master job reelner and register the queue name if it doesnt exist
   // by default it will just register with "global" queue
   console.log('made it to registerQueue');
};
*/
internals.recurse = function (id, index, commands, err) {
    var result = {};
    var reelConfig = pail.getPail(id);
    if (index < commands.length) {

        if (typeof commands[index] === 'object') {
            result = internals.executeParallel(commands[index]);
            //console.log('blah: ' + JSON.stringify(result, null, 4));
            for (var i = 0; i < commands[index].length; i++) {
                //console.log('not saving');
                reelConfig.commands[index][i].startTime = result[i].startTime;
                reelConfig.commands[index][i].pid = result[i].pid;
                reelConfig.commands[index][i].signal = result[i].signal;
                reelConfig.commands[index][i].stdout = result[i].stdout;
                reelConfig.commands[index][i].stderr = result[i].stderr;
                reelConfig.commands[index][i].error = result[i].error;
                reelConfig.commands[index][i].finishTime = result[i].finishTime;
                if (result[i].error) {
                    err = result[i].error;
                };
                if (result[i].stderr) {
                    err = result[i].stderr;
                };
                var saveConfig = pail.savePail(reelConfig);
            }
        }
        else {
            result = internals.executeSerial(commands[index]);
            //console.log('result output:\n' + JSON.stringify(result, null, 4));
            reelConfig.commands[index].startTime = result.startTime;
            reelConfig.commands[index].pid = result.pid;
            reelConfig.commands[index].signal = result.signal;
            reelConfig.commands[index].stdout = result.stdout;
            reelConfig.commands[index].stderr = result.stderr;
            reelConfig.commands[index].finishTime = result.finishTime;
            err = result.stderr;
            var saveConfig = pail.savePail(reelConfig);
        }
        //console.log('err: ' + err);
	if (!err) {
            return internals.recurse(id, ++index, commands, err);
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
