const path = require('path')
const { spawn } = require('child_process')
const soundBuzzer = require('./deviceHandlers/beep')

exports.formatTeams = players => {
  let team1, team2
  const ids = players.map(player => player.id)
  if (ids.length === 2) {
    team1 = `${ids[0]}`
    team2 = `${ids[1]}`
  } else if (ids.length === 4) {
    team1 = ids.slice(0, 2).sort().join('::')
    team2 = ids.slice(2, 4).sort().join('::')
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

const toOledRows = str => {
  if (typeof str !== 'string') {
    return str
  }

  return str.split(' ').reduce((acc, cur) => {
    if (!acc.length) return [cur]
    const lastI = acc.length - 1
    if (acc[lastI].length + cur.length > 21) {
      return [...acc, cur]
    }
    return acc.slice(0, lastI).concat(`${acc[lastI]} ${cur}`)
  }, [])
}

exports.toOledRows = toOledRows

const prompt = (msg = []) => {
  spawn('python', [
     path.resolve('src/utils/deviceHandlers/display.py'),
     ...toOledRows(msg)
  ])
}

exports.prompt = prompt

/**
 * While the actual max length is 21 on the screen, I'm trimming off 2 characters so that the
 * cursor dot can be shown on the outsides, hence the leading space being returned
 */
const fillOledRow = (beginning, end) => {
  // const MAX_LEN = 21 // the amount of characters that can fit in a row on the oled screen
  const MAX_LEN = 19

  if (!end) return ` ${beginning}`

  if (beginning.length >= end.length) {
    const maxBeginningLength = Math.min(beginning.length, MAX_LEN - end.length - 1)
    const spacesCount = (MAX_LEN - maxBeginningLength - end.length) + 1
    const spaces = new Array(spacesCount).join(' ')
    return ` ${beginning.slice(0, maxBeginningLength)}${spaces}${end}`
  } else {
    const maxEndLength = Math.min(end.length, MAX_LEN - beginning.length - 1)
    const spacesCount = (MAX_LEN - maxEndLength - beginning.length) + 1
    const spaces = new Array(spacesCount).join(' ')
    return ` ${beginning}${spaces}${end.slice(0, maxEndLength)}`
  }
}

exports.fillOledRow = fillOledRow

const cursorPositionToCorner = ({ x, y }) => {
  if (x === 0) {
    return y === 0 ? 0 : 1
  } else {
    return y === 0 ? 2 : 3
  }
}

exports.cursorPositionToCorner = cursorPositionToCorner

exports.showCompetition = (players, cursorPosition, showCursor) => {
  const aliases = players.map(player => player.alias)

  if (!aliases.length) {
    prompt('Scan badge to start!')
    return
  }

  let pairs
  switch (aliases.length) {
    case 3:
    case 4:
      pairs = [[0,2], [1,3]]
      break;
    default:
      pairs = [[0, 1]]
      break;
  }

  const msg = pairs.map(([first, second]) => fillOledRow(aliases[first], aliases[second]))

  if (msg.length === 1) {
    prompt(msg)
  } else {
    const cursor = showCursor ? cursorPositionToCorner(cursorPosition) : undefined
    prompt([msg[0], '', '', msg[1], cursor])
  }
}

exports.minToMs = min => 1000 * 60 * min

exports.beep = forever => soundBuzzer(undefined, forever)
