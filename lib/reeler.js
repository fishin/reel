var Child = require('child_process');
var Fs = require('fs');
var Store = require('./store/file');
var Uuid = require('node-uuid');

var internals = {};

internals.executeSync = function(cmd) {

    var result = {
        stdout: []
    }; 
    if (typeof cmd === 'object') {
       var cmds = cmd.toString().split(','); 
       //console.log(cmds);
       for (var i = 0; i < cmds.length; i++) {
          var command = internals.splitCommand(cmds[i]);
          console.log('running command in parallel: ' + command.cmd + ' ' + command.args);
          var subResult = internals.executeSync(cmds[i]);
          //console.log(subResult);
          if (subResult.stderr) {
             result.stderr = subResult.stderr;
          }
          else {
             result.stdout.push(subResult.stdout);
          }
       }
    }
    else {
       var command = internals.splitCommand(cmd);
       console.log('running command serially: ' + command.cmd + ' ' + command.args);
       var executer  = Child.spawnSync(command.cmd, command.args, {encoding: 'utf8'} );
       //if (executer.signal) {
       //    err = 'aborted';
       //} else {
       // err =  executer.error;
       //}
       if (executer.err) {
           result.stderr = executer.err;
       }
       else {
           result.stdout.push(executer.stdout);
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
    config.startTime = new Date().getTime();
    var reelConfig = Store.saveReelConfig(config);
    console.log('starting reel_id: ' + reelConfig.reel_id);
    Store.saveConsoleLog(reelConfig.reel_id, 'start reel: ' + reelConfig.reel_id +' at time: '+ reelConfig.startTime +'\n');
    /*
    var postExec = function (err, stdout, stderr) {

            //handle any after stuff here, anything can be added

            return null;
    };
    */
    var results = internals.recurse(0, reelConfig.commands, []);
    internals.displayResults(results);
    //console.log(typeof results);
    for (var i = 0; i < results.length; i++) { 
        if (results[i].stderr) {
            reelConfig.status = 'failed';
            reelConfig.finishTime = new Date().getTime();
            var finishConfig = Store.saveReelConfig(reelConfig);
        }
    }
    reelConfig.status = 'succeeded';
    reelConfig.finishTime = new Date().getTime();
    var finishConfig = Store.saveReelConfig(reelConfig);
    return finishConfig;
};
/*
exports.registerQueue = function() {

   // register with master job reelner and register the queue name if it doesnt exist
   // by default it will just register with "global" queue
   console.log('made it to registerQueue');
};
*/
internals.recurse = function (index, commands, result) {

    var that = this;
    if (index < commands.length) {
        var executeResult = internals.executeSync(commands[index]);
        //console.log('result output:\n' + JSON.stringify(executeResult, null, 4));
        result.push(executeResult);
	if (!executeResult.stderr) {
            return internals.recurse(++index, commands, result);
        }
        else {
            return result;
        }
    }
    else {
        console.log('finished');
        return result;
    }
}

internals.displayResults = function (results) {

   //console.log(results);
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
