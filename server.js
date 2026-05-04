import express from 'express';
// express = framework หลักสำหรับสร้าง web server

import cors from 'cors';
// cors = อนุญาตให้ frontend (ต่าง domain) เรียก API ได้
// เช่น React รัน localhost:3000 เรียก API localhost:3001

import { connectDB } from './config/db.js';
// ฟังก์ชันทดสอบเชื่อมต่อ DB ที่เขียนไว้แล้ว

import userRoutes from './routes/user.js';
// route จัดการข้อมูล user เช่น ดู/แก้ไข/ลบ

import authRouter from './routes/auth.js';
// route จัดการ login/register

import { authMiddleware } from './middleware/auth.js';
// middleware ตรวจสอบ token ก่อนเข้า route


const PORT = 3001;
// server จะรันที่ port 3001

const app = express();
// สร้าง app จาก express ขึ้นมา 1 ตัว


// ─────────────────────────────────────────
// ⚙️ MIDDLEWARE — ทำงานก่อนทุก request
// ─────────────────────────────────────────

app.use(cors());
// เปิดให้ทุก domain เรียก API นี้ได้
// (ถ้าต้องการจำกัด ใส่ option เพิ่มได้)

app.use(express.json());
// แปลง body ของ request จาก JSON string → JavaScript object
// ถ้าไม่มีบรรทัดนี้ req.body จะเป็น undefined


// ─────────────────────────────────────────
// 🛣️ ROUTES — กำหนดเส้นทาง API
// ─────────────────────────────────────────

app.use('/api/auth', authRouter);
// ทุก request ที่มาที่ /api/auth → ส่งให้ authRouter จัดการ
// เช่น POST /api/auth/login
//      POST /api/auth/register


app.post('/api/users', (req, res, next) => userRoutes(req, res, next));
// เฉพาะ POST /api/users (สมัครสมาชิก)
// → ข้าม authMiddleware ไปเลย ไม่ต้องมี token
// เพราะคนสมัครใหม่ยังไม่มี token อยู่แล้ว


app.use('/api/users', authMiddleware, userRoutes);
// route อื่นๆ ของ /api/users ต้องผ่าน authMiddleware ก่อน
// authMiddleware = เช็ค token ว่าถูกต้องไหม
// ถ้าผ่าน → ไปต่อที่ userRoutes
// ถ้าไม่ผ่าน → ส่ง error 401 กลับทันที


// ─────────────────────────────────────────
// 🚀 START SERVER
// ─────────────────────────────────────────

app.listen(PORT, async () => {
// เริ่มรัน server ที่ port 3001
// async เพราะข้างในมีการ await

    try {
        await connectDB();
        // ทดสอบเชื่อมต่อ DB ตอน server เริ่มทำงาน

        console.log(`Server is running on port ${PORT}`);
        // ถ้าสำเร็จ → แจ้งว่า server พร้อมใช้งาน

    } catch (error) {
        console.error('Failed to connect to the database. Server is not running.', error);
        // ถ้าเชื่อม DB ไม่ได้ → แจ้ง error
        // ⚠️ server ยังรันอยู่ แต่ query DB ไม่ได้
    }
});