#!/bin/bash

if [[ $(cat /var/log/syslog | egrep start.secondary.sh | wc -m) -eq 0 ]]; then
  cd ~/shared/FoosballGame
  npm run start:secondary
fi
