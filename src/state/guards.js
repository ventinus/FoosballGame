// ---------------- Guards ----------------- //
exports.canActivate = ({ players, selectedPlayerIndices }) => players.length >= 2 && selectedPlayerIndices.length === 0

exports.notPresent = ({ players }, { id }) => !players.find(player => player.id === id)

exports.gameComplete = ({ currentGame }) => Math.max(...currentGame.teamPoints) >= 5
