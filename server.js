import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/user.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const PORT = 3001;

// สร้าง express application ขึ้นมา
// app คือตัวแทนของ server ทั้งหมด ใช้ตั้งค่าและรับ request
const app = express();

// อนุญาตให้ frontend (localhost:5173) เรียก API ได้
// ถ้าไม่มี cors() → browser จะบล็อก request จาก frontend ทันที
// เพราะ frontend (port 5173) กับ backend (port 3001) คนละ port กัน
app.use(cors());

// บอกให้ express อ่าน request body ที่เป็น JSON ได้
// ถ้าไม่มีบรรทัดนี้ → req.body จะเป็น undefined ตลอด
// เช่น ตอน frontend ส่ง { email, password } มา จะอ่านไม่ได้เลย
app.use(express.json());

// route สำหรับ login และ register
// ไม่มี authMiddleware → ใครก็เรียกได้โดยไม่ต้องมี token
// เพราะตอน login ยังไม่มี token อยู่แล้ว
app.use('/api/auth', authRouter);

// route สำหรับจัดการ user ทั้งหมด (ดู/เพิ่ม/แก้/ลบ)
// มี authMiddleware คั่นกลาง → ต้องมี token ถูกต้องก่อนถึงจะเข้าได้
// ลำดับการทำงาน: request เข้ามา → authMiddleware เช็ค token → ผ่านแล้วค่อยเข้า userRoutes
app.use('/api/users', authMiddleware, userRoutes);

// สั่งให้ server เริ่มรับ request ที่ port 3001
app.listen(PORT, async () => {
    try {
        // เชื่อมต่อ database หลังจาก server เริ่มทำงาน
        // ถ้าเชื่อมต่อสำเร็จ → พิมพ์ข้อความยืนยัน
        await connectDB();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        // ถ้าเชื่อมต่อ database ไม่ได้ → พิมพ์ error และหยุดทำงาน
        console.error('Failed to connect to the database. Server is not running.', error);
    }
});