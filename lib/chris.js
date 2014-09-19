var spawn = require('child_process').spawn
var concat = require('concat-stream')

var pidHolder = {pid: null}

serialCall([
  ['git', ['clone', 'https://github.com/fishin/reel', '/tmp/chris']],
  ['./bin/test.sh', []],
  ['echo', ['all done']]
], pidHolder, onfinish)

function onfinish(err, results) {
  if (err) throw err

  console.log(results)
}

function serialCall(commands, currentPidObject, ready) {
  var results = []

  iterate()

  function iterate() {
    var nextCommand = commands.shift()

    if (!nextCommand) {
      return ready(null, results)
    }

    var subprocess = spawn.apply(spawn, nextCommand)
    var start = Date.now()
    var stdout
    var stderr

    currentPidObject.pid = subprocess.pid

    // capture stdout and stderr
    subprocess.stdout.pipe(concat(function(buf) {
      stdout = buf.toString('utf8')
    }))

    subprocess.stderr.pipe(concat(function(buf) {
      stderr = buf.toString('utf8')
    }))

    subprocess.on('exit', function(code, signal) {
      if (signal) {
        return ready(new Error('caught signal:' + signal))
      }

      if (code) {
        return ready(new Error('exited with code: ' + code))
      }

      results.push({
          command: nextCommand[0] + ' ' + nextCommand[1].join(' '),
          stderr: stderr,
          stdout: stdout,
          duration: Date.now() - start,
          start: start
      })

      return iterate()
    })
  }
}

