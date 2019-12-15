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

  const updateGame = () => {
    console.log('TODO: Saving game in storage')
  }

  const deleteGame = () => {
    console.log('TODO: Delete game in storage')
  }

  const finalizeGame = () => props.endedAt = new Date()

  const scorePoint = index => props[`t${index + 1}Points`]++

  return {
    updateGame,
    deleteGame,
    finalizeGame,
    scorePoint,
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

Game.find = (t1, t2, attrs = {}) => {
  console.log('TODO: query for game')
  // make api call to find a game by criteria
  const foundGame = Game(t1, t2, {
    t1Points: 3,
    t2Points: 2,
    startedAt: new Date(),
    endedAt: null
  })

  // use attrs to refine results, including allowing checking if completed
  for (let key in attrs) {

  }

  return Promise.resolve(foundGame)
}

module.exports = Game
