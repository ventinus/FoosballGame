const { Gpio } = require('onoff')

module.exports = (pin = '17', forever = false) => {
  const buzzer = new Gpio(pin, 'out')

  buzzer.write(1)

  if (!forever) {
    setTimeout(() => buzzer.write(0), 400)
  }

  return () => buzzer.write(0)
}
