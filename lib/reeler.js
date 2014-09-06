var Child = require('child_process');
var Fs = require('fs');
var Store = require('./store/file');
var Uuid = require('node-uuid');

var internals = {};

internals.executeSerial = function(cmd) {

    var result = {}; 
    //console.log('cmd: ' + cmd);
    var command = internals.splitCommand(cmd);
    console.log('running command (serial): ' + command.cmd + ' ' + command.args);
    result.startTime = new Date().getTime();
    var executer = Child.spawnSync(command.cmd, command.args, {encoding: 'utf8'} );
    //if (executer.signal) {
    //    err = 'aborted';
    //} else {
    // err =  executer.error;
    //}
    result.finishTime = new Date().getTime();
    result.pid = executer.pid;
    result.signal = executer.signal;
    if (executer.error) {
       result.stderr = executer.error;
    }
    else {
       result.stdout = executer.stdout;
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
    config.status = 'starting';
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
    var result = {};
    var reelConfig = Store.getReelConfig(reel_id);
    if (index < commands.length) {
        if (typeof commands[index] === 'object') {
            var paraResult = [];
            for (var i = 0; i < commands[index].length; i++) {
                var command = internals.splitCommand(commands[index][i]);
                //var subResult = internals.executeSerial(command.cmd + ' ' + command.args);
                var subResult = internals.executeParallel(command.cmd + ' ' + command.args);
                paraResult.push(subResult);
            }
            result = paraResult;
            for (var i = 0; i < commands[index].length; i++) {
                reelConfig.commands[index][i].startTime = result[i].startTime;
                reelConfig.commands[index][i].pid = result[i].pid;
                reelConfig.commands[index][i].signal = result[i].signal;
                reelConfig.commands[index][i].stdout = result[i].stdout;
                reelConfig.commands[index][i].stderr = result[i].stderr;
                reelConfig.commands[index][i].finishTime = result[i].finishTime;
                if (result[i].stderr) {
                    err = result[i].stderr;
                };
                var saveConfig = Store.saveReelConfig(reelConfig);
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
            var saveConfig = Store.saveReelConfig(reelConfig);
        }
        //console.log('err: ' + err);
	if (!err) {
            return internals.recurse(reel_id, ++index, commands, err);
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

internals.executeParallel = function (cmd) {

   //console.log('cmd: ' + cmd);
   var command = internals.splitCommand(cmd);
   console.log('running command (parallel): ' + command.cmd + ' ' + command.args);
   var result = internals.executeSerial(cmd);
   return result;
/*
   var result = {}; 
   var command = internals.splitCommand(cmd);
   result.startTime = new Date().getTime();
   var executer = Child.spawn(command.cmd, command.args, {encoding: 'utf8'} );
   //if (executer.signal) {
   //    err = 'aborted';
   //} else {
   // err =  executer.error;
   //}
   result.finishTime = new Date().getTime();
   result.pid = executer.pid;
   result.signal = executer.signal;
   result.stdout = '';
   result.stderr = '';
   executer.stdout.on('data', function (data) {

       result.stdout += data; 
   });

   executer.stderr.on('data', function (data) {

       result.stderr += data; 
   });

   executer.on('close', function (code) {
       console.log(result);
       return result;
       //return callback(null, code); 
   });
*/
}
