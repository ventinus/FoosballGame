const path = require('path')
const { spawn } = require('child_process')
const { assign } = require('xstate')
const { Game, Player } = require('../models')
const { formatTeams, sendToScoreboard, prompt } = require('../utils/helpers')

// ---------------- Actions ---------------- //
exports.resetGame = assign({
  playerIds: () => [],
  currentGame: () => null,
  bestOfLimit: () => 1,
  cursorPosition: () => ({
    x: 0,
    y: 0,
  }),
  selectedPlayerIndices: () => [],
  newPlayer: () => ({
    id: '',
    alias: '',
  })
})

exports.addPlayer = assign({
  playerIds: ({ playerIds }, { data }) => [data].concat(playerIds).slice(0, 4)
})

exports.appendCharacter = assign({
  newPlayer: ({ newPlayer }, { character }) => ({ ...newPlayer, alias: `${newPlayer.alias}${character}` })
})

exports.backspace = assign({
  newPlayer: ({ newPlayer }) => ({ ...newPlayer, alias: newPlayer.alias.slice(0, -1) })
})

exports.seedNewPlayer = assign({
  newPlayer: (ctx, event) => {
    return {
      id: event.data,
      alias: ''
    }
  }
})

exports.createPlayer = assign({
  newPlayer: ({ newPlayer }) => {
    Player.create(newPlayer)

    return {
      id: '',
      alias: '',
    }
  }
})

exports.switchSides = assign({
  playerIds: ({ playerIds }) => {
    if (playerIds.length === 4) {
      return playerIds.slice(2, 4).concat(playerIds.slice(0, 2))
    }

    return Array.from(playerIds).reverse()
  }
})

exports.moveCursor = assign({
  cursorPosition: ({ cursorPosition }, { direction }) => {
    const maxY = 1
    if (direction === 'up') {
      const newY = cursorPosition.y - 1
      return {
        ...cursorPosition,
        y: newY < 0 ? maxY : newY
      }
    } else if (direction === 'down') {
      const newY = cursorPosition.y + 1
      return {
        ...cursorPosition,
        y: newY > maxY ? 0 : newY
      }
    }

    return cursorPosition
  }
})

exports.setSelectedPlayer = assign({
  selectedPlayerIndices: ({ selectedPlayerIndices, cursorPosition }) =>
    selectedPlayerIndices.concat(cursorPosition.y)
})

exports.exchangePlayers = assign({
  playerIds: ({ selectedPlayerIndices, playerIds }) => {
    if (selectedPlayerIndices.length < 2) return playerIds
    const [first, second] = selectedPlayerIndices

    const out = []
    if (first === 0) {
      out.push(playerIds[second + 2])
      out.push(playerIds[1])
    } else {
      out.push(playerIds[0])
      out.push(playerIds[second + 2])
    }

    if (second === 0) {
      out.push(playerIds[first])
      out.push(playerIds[3])
    } else {
      out.push(playerIds[2])
      out.push(playerIds[first])
    }

    return out
  }
})

exports.resetSelectedPlayers = assign({
  selectedPlayerIndices: ({ selectedPlayerIndices }) =>
    selectedPlayerIndices.length === 2 ? [] : selectedPlayerIndices
})

exports.scorePoint = assign({
  currentGame: ({ currentGame }, { index }) => {
    currentGame.scorePoint(index)
    return currentGame
  }
})

exports.updateScoreboard = assign({
  currentGame: ({ currentGame }) => {
    sendToScoreboard(currentGame)

    return currentGame
  }
})

exports.promptResume = assign({
  currentGame: ({ currentGame }) => {
    prompt(["Would you like to",
      "resume previous",
      "unfinished game?",
      "Y/n"
    ])
    return currentGame
  }
})

exports.clearPrompt = assign({
  currentGame: ({ currentGame }) => {
    prompt()
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
  currentGame: ({ currentGame }) => {
    currentGame.deleteGame()
    return null
  }
})
