// ---------------- Guards ----------------- //
exports.canActivate = ({ players, selectedPlayerIndices }) =>
  players.length >= 2 && selectedPlayerIndices.length === 0

exports.notPresent = ({ players }, { id }) => !players.find(player => player.id === id)

exports.canMoveCursor = ({ players, selectedPlayerIndices, cursorPosition }, { direction }) => {
  const len = players.length
  if (len === 3) {
    return selectedPlayerIndices.length === 0
  }
  return len === 4
}

exports.canConfirmPlayerSelected = ({ players }) => players.length >= 2

exports.gameComplete = ({ currentGame }) => Math.max(...currentGame.teamPoints) >= 5
