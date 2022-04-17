import { Synor } from '@synor/core'
import 'dotenv/config' 

const synor = Synor({
  DatabaseEngine: '@synor/database-postgresql',
  databaseUri: `postgresql://smunch@1qazZAQ!:127.0.0.1:9955/Pantry`,
  SourceEngine: '@synor/source-file',
  sourceUri: 'file://./schema-migrations'
})

async function showCurrentRecord() {
  this.synor.migrator
    .on('open:start', () => {
      console.log('Opening connections to underlying database and source...')
    })
    .on('open:end', () => {
      console.log('Connections established!')
    })
    .on('close:start', () => {
      console.log('Closing connections...')
    })
    .on('close:end', () => {
      console.log('Connections closed!')
    })
    .on('current', record => {
      console.log('Database is currently at: ', JSON.stringify(record, null, 2))
    })

  await synor.migrator.open()

  await synor.migrator.current()

  await synor.migrator.close()
}

showCurrentRecord().catch(err => {
  console.error(err)
  process.exit(1)
})