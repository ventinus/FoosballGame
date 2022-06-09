const { Gpio } = require('onoff')

const pin = 6
const sensor = new Gpio(pin, 'in', 'both')

let isPushed = false

const emit = process?.send ? process.send : console.log
console.log(emit)
const handleChange = (err, value) => {
  if (err) {
    emit(`GAME START ERROR: ${err}`)
    return
  }

  if (isPushed && value === 0) {
    isPushed = false
    emit(true)
  } else if (!isPushed && value === 1) {
    isPushed = true
  }
}

sensor.watch(handleChange)
