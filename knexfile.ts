export default {
  development: {
    client: 'postgresql',
    connection: {
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD as string,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT as unknown as number
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
}