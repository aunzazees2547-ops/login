import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT,
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