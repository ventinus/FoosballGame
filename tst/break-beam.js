const { Gpio } = require('onoff')

const sensors = ['4', '5', '6'].map((pin) => new Gpio(pin, 'in', 'both'))

const handleChange = (index) => (err, value) => {
  if (err) {
    console.log(`POINT ERROR: ${err}`)
    return
  }

  if (value === 1) {
    console.log(`Detected on sensor ${index}`)
  }
}

sensors.forEach((sensor, i) => sensor.watch(handleChange(i)))
