const fetch = require('node-fetch')

const competitionsRoot = 'https://v7d5lb2fn6.execute-api.us-west-2.amazonaws.com/prod/Competitions'
const playersRoot = 'https://v7d5lb2fn6.execute-api.us-west-2.amazonaws.com/prod/Players'

exports.initializeCompetition = async competitionId => {
  try {
    const response = await fetch(`${competitionsRoot}/${competitionId}/Initialize`, {
      method: 'POST',
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('initializeCompetition err', err)
    throw err
  }
}

exports.updateCurrent = async (competitionId, updates) => {
  try {
    const response = await fetch(`${competitionsRoot}/${competitionId}/Current`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('updateCurrent err', err)
    throw err
  }
}

exports.deleteCurrent = async competitionId => {
  try {
    const response = await fetch(`${competitionsRoot}/${competitionId}/Current`, {
      method: 'DELETE',
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('deleteCurrent err', err)
    throw err
  }
}

exports.finalize = async (competitionId, updates) => {
  try {
    const response = await fetch(`${competitionsRoot}/${competitionId}/Finalize`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('finalize err', err)
    throw err
  }
}

exports.findPlayer = async playerId => {
  try {
    const response = await fetch(`${playersRoot}/${playerId}/Find`, {
      method: 'GET',
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('findPlayer err', err)
    throw err
  }
}

exports.createPlayer = async ({ playerId, alias }) => {
  try {
    const response = await fetch(`${playersRoot}/${playerId}/Add`, {
      method: 'PUT',
      body: JSON.stringify({ alias }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('updateCurrent err', err)
    throw err
  }
}
