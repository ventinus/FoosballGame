import socket
import sys

UDP_PORT = 5005
UDP_IP = sys.argv[1]
MESSAGE = sys.argv[2]

print("sending message:", MESSAGE)

sock = socket.socket(socket.AF_INET, # Internet
                     socket.SOCK_DGRAM) # UDP
sock.sendto(MESSAGE.encode('utf-8'), (UDP_IP, UDP_PORT))
