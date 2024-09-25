const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketTeam.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      cricket_team;`

  const playersArray = await db.all(getPlayersQuery)

  response.send(
    playersArray.map(eachPlayer => convertDbObjectToResponseObject(eachPlayer)),
  )
})

app.post('/players/', async (request, response) => {
  const {playerName, jerseyNumber, role} = request.body
  const addPlayerQuery = `
    INSERT INTO
      cricket_team (player_name, jersey_number, role)
    VALUES
      (?, ?, ?);`

  const dbResponse = await db.run(addPlayerQuery, [
    playerName,
    jerseyNumber,
    role,
  ])
  const playerId = dbResponse.lastID
  response.send('Player Added to Team')
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT
      *
    FROM
      cricket_team
    WHERE
      player_id = ?;`

  const player = await db.get(getPlayerQuery, [playerId])
  response.send(player)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails
  const updatePlayerQuery = `
    UPDATE
      cricket_team
    SET
      player_name = ?,
      jersey_number = ?,
      role = ?
    WHERE
      player_id = ?;`
  await db.run(updatePlayerQuery, [playerName, jerseyNumber, role, playerId])
  response.send('Player Details Updated')
})

app.delete('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const deleteplayerQuery = `
    DELETE FROM
      cricket_team
    WHERE
      player_id = ?;`
  await db.run(deleteplayerQuery, [playerId])
  response.send('Player Removed')
})

module.exports = app
