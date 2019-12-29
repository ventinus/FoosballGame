const Gpio = require('onoff').Gpio;

module.exports = (pin = 17) => {
  const buzzer = new Gpio(pin, 'out')

  buzzer.write(1)

  setTimeout(() => {
    buzzer.write(0)
  }, 400)
}
