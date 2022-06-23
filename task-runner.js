require('dotenv').config()
const taskRunner = require('./src/controllers/taskRunner')

if (process.env.DATABASE_URL) {
  const workingVariable = process.env.DATABASE_URL.replace('postgres://', '')
  process.env.PGUSER = workingVariable.split('@')[0].split(':')[0]
  process.env.PGPASSWORD = workingVariable.split('@')[0].split(':')[1]
  process.env.PGHOST = workingVariable.split('@')[1].split(':')[0]
  process.env.PSPORT = workingVariable.split('@')[1].split(':')[1].split('/')[0]
  process.env.PGDATABASE = workingVariable.split('@')[1].split(':')[1].split('/')[1]
}

async function main () {
  try {
    await taskRunner.run()
  } catch (error) {
    console.error(error)
  }
  process.exit()
}

main()
