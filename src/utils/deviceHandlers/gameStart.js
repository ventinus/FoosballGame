const { Gpio } = require('onoff')

const pin = 999 // TODO: determine a pin
const sensor = new Gpio(pin, 'in', 'both')

let isPushed = false;

const handleChange = (err, value) => {
  if (err) {
    process.send(`GAME START ERROR: ${err}`)
    return
  }

  if (isPushed && value === 0) {
    isPushed = false
    process.send(true)
  } else if (!isPushed && value === 1) {
    isPushed = true
  }
}

sensor.watch(handleChange)
