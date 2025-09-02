// db/pgConnection.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Create a new pool instance for PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // Adjust SSL settings if needed
  },
});

// Function to query the database
export async function db_query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result; // return the full pg result object, not result.rows
  } catch (err) {
    console.error("DB Query Error:", err);
    throw err;
  }
}

// Function to check DB connection
export const checkConnection = async () => {
  try {
    await pool.connect();  // This attempts to connect to the DB
    console.log('PG DB connected successfully');
  } catch (err) {
    console.error('Failed to connect to PG DB:', err);
    process.exit(1); // Exit process with failure code
  }
};
