const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST || 'db',  // Use 'db' as the default if not set
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT || 5432,
});

async function connectWithRetry() {
  try {
    await pool.connect();
    // console.log('Connected to the database successfully!');
  } catch (err) {
    setTimeout(connectWithRetry, 3000); // Wait 5 seconds before retrying
  }
}
connectWithRetry();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
