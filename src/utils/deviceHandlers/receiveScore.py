#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import socket

from luma.led_matrix.device import max7219
from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from luma.core.virtual import viewport
from luma.core.legacy import text, show_message
from luma.core.legacy.font import proportional, CP437_FONT, SINCLAIR_FONT, LCD_FONT, TINY_FONT

UDP_IP = "192.168.0.32" # NOTE: IP address will need updating to match the pi this code is running on
UDP_PORT = 5005

sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP
sock.bind((UDP_IP, UDP_PORT))

def run(n, block_orientation, rotate, inreverse):
  serial = spi(port=0, device=0, gpio=noop())
  device = max7219(serial, cascaded=n or 1, width=16, height=8, block_orientation=block_orientation,
                   rotate=rotate or 0, blocks_arranged_in_reverse_order=inreverse)
  virtual = viewport(device, width=16, height=16)

  device.contrast(16)

  while True:
    data, addr = sock.recvfrom(1024) # buffer size is 1024 bytes
    print "received message:", data
    with canvas(virtual) as draw:
      text(draw, (0, 0), data, fill="white", font=proportional(LCD_FONT))

try:
  run(2, 90, 0, False)
except KeyboardInterrupt:
  pass
