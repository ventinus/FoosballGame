const path = require('path')
const { spawn } = require('child_process')
const { assign } = require('xstate')
const { Game } = require('../models')
const { formatTeams } = require('../utils')

// ---------------- Actions ----------------
exports.resetGame = assign({
  playerIds: () => [],
  currentGame: () => null,
  bestOfLimit: () => 1,
})

exports.addPlayer = assign({
  playerIds: ({ playerIds }, { id }) => [id].concat(playerIds).slice(0, 4)
})

exports.scorePoint = assign({
  currentGame: ({ currentGame }, { index }) => {
    currentGame.scorePoint(index)
    return currentGame
  }
})

let displayProcess
exports.updateScoreboard = assign({
  currentGame: ({ currentGame }) => {
    // NOTE: does any previously spawned process need to be killed before starting a new one for memory management?
    displayProcess = spawn('python', [
      path.resolve('src/utils/deviceHandlers/sendScore.py'),
      '192.168.0.32', // NOTE: will need updating
      currentGame.teamPoints.join(' ')
    ])

    // displayProcess.stdout.on('data', data => {
    //   console.log('updateScore stdout:', data.toString())
    // })

    return currentGame
  }
})

exports.setGame = assign({
  currentGame: (ctx, { data }) => data
})

exports.createGame = assign({
  currentGame: ({ playerIds }) => {
    const [team1, team2] = formatTeams(playerIds)
    return Game(team1, team2)
  }
})

// save current game state
exports.updateGame = assign({
  currentGame: ({ currentGame }) => {
    currentGame.updateGame()
    return currentGame
  }
})

exports.deleteGame = assign({
  currentGame: (ctx, event) => {
    event.data.deleteGame()
    return null
  }
})
