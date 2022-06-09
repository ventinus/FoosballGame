const path = require('path')
const { fork } = require('child_process')

module.exports = (filename, onMessage, onError) => {
  const program = path.resolve(`src/utils/deviceHandlers/${filename}`)
  const options = {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  }

  const child = fork(program, [], options)
  child.on('message', onMessage)
  if (onError) {
    child.on('error', onError)
  } else {
    console.log(`No onError handler defined for ${filename}`)
  }

  return child
}
