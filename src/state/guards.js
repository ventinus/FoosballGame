// ---------------- Guards -----------------
exports.canActivate = ({ playerIds }) => playerIds.length >= 2

exports.gameComplete = ({ currentGame }) => Math.max(...currentGame.teamPoints) >= 5
