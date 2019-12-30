const { assign } = require('xstate')
const { Game, Player } = require('../models')
const { formatTeams } = require('../utils')

exports.findNewOrCurrentGame = async ({ players }) => {
  const [team1, team2] = formatTeams(players)

  const data = await Game.initializeCompetition(team1, team2)

  if (!data.current) {
    return Game(team1, team2)
  }

  throw Game(team1, team2, data.current)
}

exports.completeGame = ({ currentGame }) => {
  currentGame.endGame()
  currentGame.finalizeGame()
  return Promise.resolve()
}

exports.findPlayer = async (ctx, { id }) => {
  const player = await Player.find(id)

  if (!player.alias) throw player

  return player
}
