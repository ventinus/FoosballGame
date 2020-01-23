const path = require('path')
const { fork } = require('child_process')

module.exports = (filename, onMessage) => {
  const program = path.resolve(`src/utils/deviceHandlers/${filename}`)
  const options = {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  }

  const child = fork(program, [], options)
  child.on('message', onMessage)
  return child
}
