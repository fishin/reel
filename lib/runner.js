var Child = require('child_process');
var Pail = require('pail');

var internals = {
    activeRuns: []
};

module.exports = internals.Runner = function (options) {

    this.settings = options;
    internals.Runner.settings = options;
    this.start = exports.start;
    this.getPids = exports.getPids;
    internals.Runner.serialCall = internals.serialCall;
};

internals.splitCommand = function(cmd) {
  
    var parts = cmd.split(" ");
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
         args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
};

exports.getPids = function(runId) {

    //console.log('getting pids for: ' + runId);
    var runIndex = internals.getRunIndex(runId);
    if (internals.activeRuns[runIndex]) {
       return internals.activeRuns[runIndex].pids;
    }
    else {
       return [];
    }
};

internals.getRunIndex = function(runId) {

    for (var i = 0; i < internals.activeRuns.length; i++ ) {
        if (internals.activeRuns[i].runId === runId) {
            return i;
        }
    }
    return null;
};

exports.start = function(runId) {

    var pail = new Pail(this.settings.reel);
    var config = pail.getPail(runId);
    config.status = 'starting';
    var runConfig = pail.updatePail(config);
    //console.log('starting runId: ' + runConfig.id);
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
    internals.serialCall(runConfig.id, commands, internals.onFinish);
    return runConfig.id;
};

/*
exports.registerQueue = function() {

   // register with master job reelner and register the queue name if it doesnt exist
   // by default it will just register with "global" queue
   console.log('made it to registerQueue');
};

internals.executeParallel = function (cmds) {

   var paraResult = [];
   for (var i = 0; i < cmds.length; i++) {
       var command = internals.splitCommand(cmds[i]);
       var subResult = internals.executeSerial(command.cmd + ' ' + command.args);
       paraResult.push(subResult);
   }
   //console.log('made it to end of loop');
   return paraResult;
};
*/

internals.onFinish = function (runId, err, results) {

    var runIndex = internals.getRunIndex(runId);
    internals.activeRuns.splice(runIndex, 1);
    var pail = new Pail(internals.Runner.settings.reel);
    var finishConfig = pail.getPail(runId);
    var updateConfig;
    if (err) {
       if (err.match('signal')) {
           finishConfig.status = 'cancelled';
       }
       else {
           finishConfig.status = 'failed';
       }
       updateConfig = pail.updatePail(finishConfig);
    }
    else {
        finishConfig.status = 'succeeded';
        updateConfig = pail.updatePail(finishConfig);
    }
};

internals.serialCall = function (runId, commands, ready) {

    //console.log('made it to serial call') 
    //console.log('initializing run pids');
    internals.activeRuns.push({ runId: runId, pids: []});
    var results = [];
    var pail = new Pail(internals.Runner.settings.reel);
    var runConfig = pail.getPail(runId);
    var index = 0;
    iterate();

    function iterate() {

        var err = null;
        var nextCommand = commands.shift();
        var prevDir = process.cwd();
        //console.log('prevDir: ' + prevDir);
        process.chdir(internals.Runner.settings.reel.dirpath + '/' + internals.Runner.settings.reel.workspace);
        var startTime = new Date().getTime();
        if (!nextCommand) {
            //console.log('changing back to dir: ' + prevDir);
            process.chdir(prevDir);
            return ready(runId, null, results);
        }
        if (typeof nextCommand === 'object') {

            console.log('parallel time: ' + nextCommand);
            //result = internals.executeParallel(commands[index]);
            for (var i = 0; i < nextCommand.length; i++) {
                //console.log('push it: ' + nextCommand[i]);
                runConfig.commands.push({ command: nextCommand[i] });
                commands.push(nextCommand[i]);
            }
            index++;
            //console.log('changing back to dir: ' + prevDir);
            process.chdir(prevDir);
            return iterate(); 
        }
        console.log('serialCall: ' + nextCommand);
        var command = internals.splitCommand(nextCommand);
        var subprocess = Child.spawn.apply(Child.spawn, [ command.cmd, command.args ]);
        var stdout;
        var stderr;
        var error;
        var runIndex = internals.getRunIndex(runId);
        //console.log('adding pid for run: ' + runId);
        internals.activeRuns[runIndex].pids.push(subprocess.pid);

        // capture stdout and stderr
        subprocess.stdout.on('data', function(data) {

            stdout = data.toString();
        });

        subprocess.stderr.on('data', function(data) {

            stderr = data.toString();
        });

        subprocess.on('error', function(err) {

            internals.activeRuns[runIndex].pids.pop();
            runConfig.commands[index].startTime = startTime;
            runConfig.commands[index].pid = subprocess.pid;
            runConfig.commands[index].signal = "";
            runConfig.commands[index].stdout = stdout;
            runConfig.commands[index].stderr = stderr;
            runConfig.commands[index].error = err.toString('utf8');
            runConfig.commands[index].code = "";
            runConfig.commands[index].finishTime = new Date().getTime();
            runConfig.commands[index].status = 'failed';
            var updateConfig = pail.updatePail(runConfig);
            //console.log('changing back to dir: ' + prevDir);
            process.chdir(prevDir);
            return ready(runId, runConfig.commands[index].error);
        });

        subprocess.on('exit', function(code, signal) {

            internals.activeRuns[runIndex].pids.pop();
            //console.log('exiting.....' + nextCommand);
            runConfig.commands[index].startTime = startTime;
            runConfig.commands[index].pid = subprocess.pid;
            runConfig.commands[index].signal = signal;
            runConfig.commands[index].stdout = stdout;
            runConfig.commands[index].stderr = stderr;
            runConfig.commands[index].error = "";
            runConfig.commands[index].code = code;
            runConfig.commands[index].finishTime = new Date().getTime();
            if (code !== 0) {

                //console.log('code: ' + code);
                err = stderr;
            };
            if (signal) {

                //console.log(signal);
                //console.log('i received a signal');
                err = 'signal ' + signal + ' sent.';
            };
            var updateConfig = pail.updatePail(runConfig);
            if (err) {
                //console.log('all done due to err');
                //console.log('changing back to dir: ' + prevDir);
                process.chdir(prevDir);
                return ready(runId, err);
            }
            index++;
            //console.log('changing back to dir: ' + prevDir);
            process.chdir(prevDir);
            return iterate();
        });
    }
};

/*
internals.runCommand = function (command) {

    var result = {};
    result.startTime = new Date().getTime();
    var subprocess = Child.spawn.apply(Child.spawn, [ command.cmd, command.args ]);
    var runIndex = internals.getRunIndex(runId);
    //console.log('adding pid for run: ' + runId);
    internals.activeRuns[runIndex].pids.push(subprocess.pid);

    // capture stdout and stderr
    subprocess.stdout.on('data', function(data) {

        result.stdout = data.toString();
    });

    subprocess.stderr.on('data', function(data) {

        result.stderr = data.toString();
    });

    subprocess.on('error', function(err) {

        result.finishTime = new Date().getTime();
        internals.activeRuns[runIndex].pids.pop();
        result.error = err;
        return result;
    });

    subprocess.on('exit', function(code, signal) {

        result.finishTime = new Date().getTime();
        internals.activeRuns[runIndex].pids.pop();
        result.code = code;
        result.signal = signal;
        return result;
    });
};

*/
