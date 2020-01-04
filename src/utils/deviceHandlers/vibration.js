const { Gpio } = require('onoff');

// TODO: determine correct pin usage
const sensor = new Gpio(18, 'in', 'both')

let currentValue = 0

const handleChange = (err, value) => {
  if (err) {
    process.send(`VIBRATION ERROR: ${err}`)
    return
  }

  if (currentValue !== value) {
    process.send(index)
  }

  currentValue = value
}

sensor.watch(handleChange)
