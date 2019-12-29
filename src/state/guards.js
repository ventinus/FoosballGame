
// ---------------- Guards ----------------- //
exports.canActivate = ({ playerIds, selectedPlayerIndices }) => playerIds.length >= 2 && selectedPlayerIndices.length === 0

exports.gameComplete = ({ currentGame }) => Math.max(...currentGame.teamPoints) >= 5
