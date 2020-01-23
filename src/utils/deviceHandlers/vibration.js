const { Gpio } = require('onoff')

// TODO: determine correct pin usage
const sensor = new Gpio(18, 'in', 'both')

const emit = (err, value) => {
  if (err) {
    process.send(`VIBRATION ERROR: ${err}`)
    return
  }

  process.send(value)
}

sensor.watch(emit)
