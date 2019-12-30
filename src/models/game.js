const api = require('../utils/api')
const { toCompetitionId } = require('../utils')

const Game = (t1, t2, initialProps = {}) => {
  if (!t1 && !t2) {
    console.log('Two teams must be present to create a game, ending')
    return
  }

  const props = {
    t1: t1,
    t2: t2,
    t1Points: initialProps.t1Points || 0,
    t2Points: initialProps.t2Points || 0,
    startedAt: initialProps.startedAt || new Date(),
    endedAt: initialProps.endedAt || null,
  }

  const competitionId = toCompetitionId(props.t1, props.t2)

  const updateGame = () => api.updateCurrent(competitionId, props)

  const deleteGame = () => api.deleteCurrent(competitionId)

  const finalizeGame = () => api.finalize(competitionId, props)

  const endGame = () => props.endedAt = new Date()

  const scorePoint = index => props[`t${index + 1}Points`]++

  return {
    updateGame,
    deleteGame,
    finalizeGame,
    endGame,
    scorePoint,
    competitionId,
    get props() {
      return props
    },
    get completed() {
      return props.endedAt !== null
    },
    get teamPoints() {
      return [props.t1Points, props.t2Points]
    }
  }
}

Game.initializeCompetition = async (t1, t2) => {
  const data = await api.initializeCompetition(toCompetitionId(t1, t2))
  return data
}

// Game.findCurrent = (t1, t2) => {
//   // TODO make api call to find games with team configuration
//   // TODO: use attrs to refine results, including allowing checking if completed

//   const foundGame = Game(t1, t2, {
//     t1Points: 3,
//     t2Points: 2,
//     startedAt: new Date(),
//     endedAt: null
//   })

//   return Promise.resolve(foundGame)
// }

module.exports = Game
