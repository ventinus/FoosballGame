const path = require('path')
const { spawn } = require('child_process')

exports.formatTeams = playerIds => {
  let team1, team2
  if (playerIds.length === 2) {
    team1 = `${playerIds[0]}`
    team2 = `${playerIds[1]}`
  } else if (playerIds.length === 4) {
    team1 = playerIds.slice(0, 2).sort().join('::')
    team2 = playerIds.slice(2, 4).sort().join('::')
  }
  return [team1, team2]
}

exports.toCompetitionId = (t1, t2) => [t1, t2].sort().join('V')

exports.sendToScoreboard = ({ teamPoints }) => {
  console.log('send to scoreboard', teamPoints)
  // NOTE: does any previously spawned process need to be killed before starting a new one for memory management?
  const scoreProcess = spawn('python', [
    path.resolve('src/utils/deviceHandlers/sendScore.py'),
    '192.168.0.32', // NOTE: will need updating
    teamPoints.join(' ')
  ])

  // scoreProcess.stdout.on('data', data => {
  //   console.log('updateScore stdout:', data.toString())
  // })
}

exports.prompt = (msg = []) => {
  spawn('python', [
     path.resolve('src/utils/deviceHandlers/display.py'),
     ...msg
  ])
}
