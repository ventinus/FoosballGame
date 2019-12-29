const { assign } = require('xstate')
const { Game } = require('../models')
const { formatTeams } = require('../utils')

exports.findNewOrCurrentGame = async ({ playerIds }) => {
  // find a previous game, if there is a game, prompt whether or not to resume.
  // if no previous game or no desire to resume, just resolve with nothing
  // if user wants to resume, resolve with the previous score in teamPoints
  const [team1, team2] = formatTeams(playerIds)

  const data = await Game.initializeCompetition(team1, team2)

  if (!data.current) {
    return Promise.resolve(Game(team1, team2))
  }

  return Promise.reject(Game(team1, team2, data.current))
}

exports.completeGame = ({ currentGame }) => {
  currentGame.endGame()
  currentGame.finalizeGame()
  return Promise.resolve()
}
