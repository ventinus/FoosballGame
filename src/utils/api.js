const AWS = require('aws-sdk')
const { pick } = require('lodash')
const uuid = require('uuid4')

const { generateGameId, switchSides } = require('.')

// make call to players.json file s3 foosball bucket to find player by id
exports.GetPlayer = id => Promise.resolve(uuid())

const gameGenerator = gameId => ({
  [gameId]: {
    complete: Math.random() < .5,
    team1Points: 3,
    team2Points: 4,
  }
})

// minimally returns an empty object so other things dont break
const GetGames = () => Promise.resolve({
  ...gameGenerator('123V456_G1'),
  ...gameGenerator('123V456_G2'),
})

const GetPreviousGame = async gameIdPrefix => {
  const games = await GetGames()
  const previousGameId = Object.keys(games)
    .filter(id => id.includes(gameIdPrefix))
    .sort()
    .reverse()[0]

  return Promise.resolve(Object.assign({}, { id: previousGameId }, games[previousGameId]))
}

// retrieve all game ids matching player combination
const GetIncompleteGame = async gameIdPrefix => {
  const previousGame = await GetPreviousGame(gameIdPrefix)
  if (!previousGame.complete) {
    Promise.resolve(previousGame)
    return
  }

  // no previous game to complete
  Promise.resolve(null)
}

exports.StartGame = gameId => console.log('StartGame')
exports.ScoreGoal = team => console.log('ScoreGoal')
exports.EndGame = () => console.log('EndGame')
exports.DeleteGame = gameId => console.log('DeleteGame')
