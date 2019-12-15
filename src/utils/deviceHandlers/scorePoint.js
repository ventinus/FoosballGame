const debounce = require('lodash.debounce')
const { Gpio } = require('onoff');

const [sensor1, sensor2] = [4, 5].map(pin => new Gpio(pin, 'in', 'both'))

const trackingValues = [0, 0]

const handleChange = index => (err, value) => {
  if (err) {
    process.send(`POINT ERROR: ${err}`)
    return
  }

  if (trackingValues[index] !== value && value === 1) {
    process.send(index)
  }

  trackingValues[index] = value
}

sensor1.watch(handleChange(0))
sensor2.watch(handleChange(1))
