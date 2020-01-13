const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");
const { beep } = require('../helpers')

const send = process.send

//# This loop keeps checking for chips. If one is near it will get the UID and authenticate
send({ message: "scanning..." });
send({ message: "Please put chip or keycard in the antenna inductive zone!" });
send({ message: "Press Ctrl-C to stop." });

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24 // pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522(softSPI).setResetPin(22);

setInterval(function() {
  //# reset card
  mfrc522.reset();

  //# Scan for cards
  let response = mfrc522.findCard();
  if (!response.status) {
    send({ message: "No Card" });
    return;
  }

  send({ message: `Card detected, CardType: ${response.bitSize}` });
  beep()

  //# Get the UID of the card
  send({ message: 'before response' })
  response = mfrc522.getUid();
  if (!response.status) {
    send({ message: "UID Scan Error" });
    return;
  }
  //# If we have the UID, continue
  const uid = response.data;
  let cardId = 0
  for (let i = 0; i < uid.length; i++) {
    cardId = cardId * 256 + uid[i]
  }
  send({ message: cardId })
  send({ message: `after response ${response.status}` })
  // send(
  //   "Card read UID: %s %s %s %s",
  //   uid[0].toString(16),
  //   uid[1].toString(16),
  //   uid[2].toString(16),
  //   uid[3].toString(16)
  // );

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  // send("Card Memory Capacity: " + memoryCapacity);

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  //# Authenticate on Block 8 with key and uid
  if (!mfrc522.authenticate(8, key, uid)) {
    send({ message: "Authentication Error" });
    return;
  }

  //# Dump Block 8
  const value = String.fromCharCode(...mfrc522.getDataForBlock(8))
  send({ message: `Block: 8 Data: ${value}` });

  // send({ message: JSON.stringify({value, cardId}, null, 2) })
  send({ id: cardId })

  //# Stop
  mfrc522.stopCrypto();
}, 500);
