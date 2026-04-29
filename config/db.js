import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
});

export async function connectDB() {
  try {
    const con = await pool.getConnection();
    console.log('Database connected successfully');
    con.release();
  } catch (error) {
    console.error('เชื่อมไม่ได้', error);
    throw error;
  }
}

export default pool;