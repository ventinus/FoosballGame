const path = require('path')
const { spawn } = require('child_process')
const { assign } = require('xstate')
const { Game, Player } = require('../models')
const { formatTeams, sendToScoreboard, prompt } = require('../utils/helpers')

// ---------------- Actions ---------------- //
exports.resetGame = assign({
  players: () => [],
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
  players: ({ players }, { data }) => [data].concat(players).slice(0, 4)
})

exports.appendCharacter = assign({
  newPlayer: ({ newPlayer }, { character }) => ({ ...newPlayer, alias: `${newPlayer.alias}${character}` })
})

exports.backspace = assign({
  newPlayer: ({ newPlayer }) => ({ ...newPlayer, alias: newPlayer.alias.slice(0, -1) })
})

exports.seedNewPlayer = assign({
  newPlayer: (ctx, event) => ({
    id: event.data.id,
    alias: ''
  })
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
  players: ({ players }) => {
    if (players.length === 4) {
      return players.slice(2, 4).concat(players.slice(0, 2))
    }

    return Array.from(players).reverse()
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
  players: ({ selectedPlayerIndices, players }) => {
    if (selectedPlayerIndices.length < 2) return players
    const [first, second] = selectedPlayerIndices

    const out = []
    if (first === 0) {
      out.push(players[second + 2])
      out.push(players[1])
    } else {
      out.push(players[0])
      out.push(players[second + 2])
    }

    if (second === 0) {
      out.push(players[first])
      out.push(players[3])
    } else {
      out.push(players[2])
      out.push(players[first])
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
  currentGame: ({ players }) => {
    const [team1, team2] = formatTeams(players)
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
