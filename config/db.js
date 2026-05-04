import mysql from 'mysql2/promise';

const pool = mysql.createPool({
//  createPool = สร้าง "กลุ่ม connection" สำเร็จรูป
//  แทนที่จะต่อ-ตัดทุกครั้ง เปิดไว้เลย 10 ช่อง

  uri: process.env.DATABASE_URL,
//  ที่อยู่ DB เช่น mysql://user:pass@host/dbname
//  ดึงจากไฟล์ .env เพื่อไม่ให้รหัสผ่านโผล่ในโค้ด

  ssl: {
//  เข้ารหัสข้อมูลระหว่างแอปกับ DB (เหมือน https)

    rejectUnauthorized: false
//  false = ยอมรับใบรับรอง SSL แม้ไม่สมบูรณ์
//  ⚠️ ใช้ได้ตอน dev — production ควรเปลี่ยนเป็น true

  },

  waitForConnections: true,
//  ถ้า connection เต็มทั้ง 10 ช่อง
//  true  = รอจนมีช่องว่าง ✅
//  false = error ทันที ❌

  connectionLimit: 10,
//  เปิด connection พร้อมกันได้สูงสุด 10 ช่อง
//  ถ้าแอปมีคนใช้เยอะ ปรับตัวเลขนี้ให้มากขึ้นได้

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