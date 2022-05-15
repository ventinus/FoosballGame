const Mfrc522 = require('mfrc522-rpi')
const SoftSPI = require('rpi-softspi')

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
console.log({ message: 'scanning...' })
console.log({ message: 'Please put chip or keycard in the antenna inductive zone!' })
console.log({ message: 'Press Ctrl-C to stop.' })

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24, // pin number of CS
})

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522(softSPI).setResetPin(22)

setInterval(function() {
  //# reset card
  mfrc522.reset()

  //# Scan for cards
  let response = mfrc522.findCard()
  if (!response.status) {
    console.log({ message: 'No Card' })
    return
  }

  console.log({ message: `Card detected, CardType: ${response.bitSize}` })

  //# Get the UID of the card
  console.log({ message: 'before response' })
  response = mfrc522.getUid()
  if (!response.status) {
    console.log({ message: 'UID Scan Error' })
    return
  }
  //# If we have the UID, continue
  const uid = response.data
  let cardId = 0
  for (let i = 0; i < uid.length; i++) {
    cardId = cardId * 256 + uid[i]
  }
  console.log({ message: cardId })
  console.log({ message: `after response ${response.status}` })
  // console.log(
  //   "Card read UID: %s %s %s %s",
  //   uid[0].toString(16),
  //   uid[1].toString(16),
  //   uid[2].toString(16),
  //   uid[3].toString(16)
  // );

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid)
  // console.log({ message: "Card Memory Capacity: " + memoryCapacity });

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff]

  //# Authenticate on Block 8 with key and uid
  if (!mfrc522.authenticate(8, key, uid)) {
    console.log({ message: 'Authentication Error' })
    return
  }

  //# Dump Block 8
  const value = String.fromCharCode(...mfrc522.getDataForBlock(8))
  console.log({ message: `Block: 8 Data: ${value}` })

  console.log({ message: JSON.stringify({ value, cardId }, null, 2) })

  //# Stop
  mfrc522.stopCrypto()
}, 500)
