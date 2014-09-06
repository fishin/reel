var Child = require('child_process');
var Fs = require('fs');
var Store = require('./store/file');
var Uuid = require('node-uuid');

var internals = {};

internals.executeSync = function(cmd) {

    var result = {}; 
    //console.log('cmd: ' + cmd);
    if (typeof cmd === 'object') {
       var paraResult = [];
       for (var i = 0; i < cmd.length; i++) {
          var command = internals.splitCommand(cmd[i]);
          console.log('running command in parallel: ' + command.cmd + ' ' + command.args);
          var subResult = internals.executeSync(command.cmd + ' ' + command.args);
          paraResult.push(subResult);
       }
       result = paraResult;
    }
    else {
       var command = internals.splitCommand(cmd);
       console.log('running command serially: ' + command.cmd + ' ' + command.args);
       var executer = Child.spawnSync(command.cmd, command.args, {encoding: 'utf8'} );
       //if (executer.signal) {
       //    err = 'aborted';
       //} else {
       // err =  executer.error;
       //}
       result.pid = executer.pid;
       result.signal = executer.signal;
       if (executer.err) {
           result.stderr = executer.err;
       }
       else {
           result.stdout = executer.stdout;
       }
    }
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

exports.start = function(reel_id) {

    var config = Store.getReelConfig(reel_id);
    config.status = 'started';
    var reelConfig = Store.saveReelConfig(config);
    //console.log('starting reel_id: ' + reelConfig.reel_id);
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
    var err = internals.recurse(reel_id, 0, commands, null);
    var finishConfig = Store.getReelConfig(reel_id);
    var saveConfig;
    if (err) {
       finishConfig.status = 'failed';
       saveConfig = Store.saveReelConfig(finishConfig);
    }
    else {
        finishConfig.status = 'succeeded';
        saveConfig = Store.saveReelConfig(finishConfig);
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
internals.recurse = function (reel_id, index, commands, err) {

    var that = this;
    if (index < commands.length) {
        var executeResult = internals.executeSync(commands[index]);
        //console.log('result output:\n' + JSON.stringify(executeResult, null, 4));
        var reelConfig = Store.getReelConfig(reel_id);
        if (typeof commands[index] === 'string') {
            reelConfig.commands[index].pid = executeResult.pid;
            reelConfig.commands[index].signal = executeResult.signal;
            reelConfig.commands[index].stdout = executeResult.stdout;
            reelConfig.commands[index].stderr = executeResult.stderr;
            var saveConfig = Store.saveReelConfig(reelConfig);
        }
        else {
            for (var i = 0; i < executeResult.length; i++) {
                reelConfig.commands[index][i].pid = executeResult[i].pid;
                reelConfig.commands[index][i].signal = executeResult[i].signal;
                reelConfig.commands[index][i].stdout = executeResult[i].stdout;
                reelConfig.commands[index][i].stderr = executeResult[i].stderr;
                var saveConfig = Store.saveReelConfig(reelConfig);
            }
        }
	if (!executeResult.stderr) {
            return internals.recurse(reel_id, ++index, commands, executeResult.stderr);
        }
        else {
            return executeResult.stderr;
        }
    }
    else {
        // maybe move save finish logic here
        //console.log('finished');
        return null;
    }
}

/*
internals.perform = function (job_id, reel_id, cmd, callback) {

  
  var command = Exec(cmd.command, cmd.args, cmd.options);
  command.stdout.on('data', function (data) {

    Store.saveConsoleLog(job_id, reel_id, data.toString());
  });

  command.on('close', function (code) {

    return callback(null, code); 
  });

  command.stderr.on('data', function (data) {

    Store.saveConsoleLog(job_id, reel_id, 'ERROR: '  + data.toString());
  });
}
*/
