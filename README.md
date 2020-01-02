# FoosballGame
Receives input from connected sensors on a Raspberry Pi, keeping track of score and saving games

# Next Steps:
- how to pause a game, how long until timeout and which sensors are responsible for determining inactivity (table vibration sensor?)
- literally wire everything up and try it out!

# TODOS (no particular order):
- statically assign ip address for pi with led displays
- support multi-game matches
- support changing the amount of points needed to win (5 or 10 or whatever)
- support cut-throat game format
- add a button to undo last point
- somehow pin the player selection dot when choosing the second player to swap teams with
- add `pausedAt` and `resumedAt` attributes for the game so a completed game that was paused doesnt count the time between plays
