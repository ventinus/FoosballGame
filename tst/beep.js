const { Gpio } = require('onoff')

const pin = '17'
const buzzer = new Gpio(pin, 'out')

buzzer.write(1)

setTimeout(() => buzzer.write(0), 400)
