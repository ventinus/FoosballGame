const api = require('../utils/api')

const Player = ({ id, alias }) => {
  const props = {
    alias,
    id
  }

  return {
    get props() {
      return props
    }
  }
}

Player.find = async id => await api.findPlayer(id)

Player.create = async ({ id, alias }) => {
  await api.createPlayer({ alias, playerId: id })
}

module.exports = Player
