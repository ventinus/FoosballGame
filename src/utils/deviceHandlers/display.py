# SPDX-FileCopyrightText: 2017 Tony DiCola for Adafruit Industries
# SPDX-FileCopyrightText: 2017 James DeVito for Adafruit Industries
# SPDX-License-Identifier: MIT

# This example is for use on (Linux) computers that are using CPython with
# Adafruit Blinka to support CircuitPython libraries. CircuitPython does
# not support PIL/pillow (python imaging library)!

import time
import subprocess

from board import SCL, SDA
import busio
from PIL import Image, ImageDraw, ImageFont
import adafruit_ssd1306

import subprocess
import sys

MSG_1 = sys.argv[1] if (len(sys.argv) > 1) else ""
MSG_2 = sys.argv[2] if (len(sys.argv) > 2) else ""
MSG_3 = sys.argv[3] if (len(sys.argv) > 3) else ""
MSG_4 = sys.argv[4] if (len(sys.argv) > 4) else ""
MSG_5 = int(sys.argv[5]) if (len(sys.argv) > 5) else -1


# Create the I2C interface.
i2c = busio.I2C(SCL, SDA)

# Create the SSD1306 OLED class.
# The first two parameters are the pixel width and pixel height.  Change these
# to the right size for your display!
disp = adafruit_ssd1306.SSD1306_I2C(128, 32, i2c)

# Clear display.
disp.fill(0)
disp.show()

# Create blank image for drawing.
# Make sure to create image with mode '1' for 1-bit color.
width = disp.width
height = disp.height
image = Image.new('1', (width, height))

# Get drawing object to draw on image.
draw = ImageDraw.Draw(image)

# Draw a black filled box to clear the image.
draw.rectangle((0,0,width,height), outline=0, fill=0)

# Draw some shapes.
# First define some constants to allow easy resizing of shapes.
padding = -2
top = padding
bottom = height-padding
# Move left to right keeping track of the current x position for drawing shapes.
x = 0
y = 2
circle_size = 5


# Load default font.
font = ImageFont.load_default()

# Alternatively load a TTF font.  Make sure the .ttf font file is in the same directory as the python script!
# Some other nice fonts to try: http://www.dafont.com/bitmap.php
# font = ImageFont.truetype('Minecraftia.ttf', 8)

# Draw a black filled box to clear the image.
draw.rectangle((0,0,width,height), outline=0, fill=0)

draw.text((x, top),       MSG_1, font=font, fill=255)
draw.text((x, top+9),     MSG_2, font=font, fill=255)
draw.text((x, top+17),    MSG_3, font=font, fill=255)
draw.text((x, top+25),    MSG_4, font=font, fill=255)

# top left
if (MSG_5 == 0):
  draw.ellipse((x, y, x + circle_size, y + circle_size), outline=0, fill=255)

# bottom left
if (MSG_5 == 1):
  draw.ellipse((x, height - circle_size, x + circle_size, height), outline=0, fill=255)

# top right
if (MSG_5 == 2):
  draw.ellipse((width - circle_size, y, width, y + circle_size), outline=0, fill=255)

# bottom right
if (MSG_5 == 3):
  draw.ellipse((width - circle_size, height - circle_size, width, height), outline=0, fill=255)

# Display image.
disp.image(image)
disp.show()
