#!/bin/bash

if [[ $(cat /var/log/syslog | egrep start.primary.sh | wc -m) -eq 0 ]]; then
  cd ~/shared/FoosballGame
  npm run start:primary
fi
