const fetch = require('node-fetch')

const apiRoot = 'https://v7d5lb2fn6.execute-api.us-west-2.amazonaws.com/prod/Competitions'

exports.initializeCompetition = async (competitionId) => {
  try {
    const response = await fetch(`${apiRoot}/${competitionId}/Initialize`, {
      method: 'POST'
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('err', err)
  }
}

exports.updateCurrent = async (competitionId, updates) => {
  try {
    const response = await fetch(`${apiRoot}/${competitionId}/Current`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('err', err)
  }
}

exports.deleteCurrent = async (competitionId) => {
  try {
    const response = await fetch(`${apiRoot}/${competitionId}/Current`, {
      method: 'DELETE'
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('err', err)
  }
}

exports.finalize = async (competitionId, updates) => {
  try {
    const response = await fetch(`${apiRoot}/${competitionId}/Finalize`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    return data
  } catch (err) {
    console.log('err', err)
  }
}
