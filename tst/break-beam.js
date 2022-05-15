const { Gpio } = require('onoff')

const [sensor1, sensor2] = [4, 5].map(pin => new Gpio(pin, 'in', 'both'))

const handleChange = index => (err, value) => {
  if (err) {
    console.log(`POINT ERROR: ${err}`)
    return
  }

  if (value === 1) {
    console.log(`Detected on sensor ${index}`)
  }
}

sensor1.watch(handleChange(0))
sensor2.watch(handleChange(1))
