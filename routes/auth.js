// นำเข้า Router จาก express สำหรับสร้าง route แยกไฟล์
import { Router } from 'express';
// นำเข้า db สำหรับติดต่อฐานข้อมูล
import db from '../config/db.js';
// นำเข้า bcrypt สำหรับเปรียบเทียบรหัสผ่านที่เข้ารหัสไว้
import bcrypt from 'bcrypt';
// นำเข้า jsonwebtoken สำหรับสร้าง token หลังล็อคอินสำเร็จ
import jwt from 'jsonwebtoken';

const router = Router();

// รหัสลับสำหรับสร้างและตรวจสอบ token
// ควรเก็บไว้ใน .env ไม่ควร hardcode ไว้ในโค้ด
const SECRET = process.env.JWT_SECRET || 'your_secret_key';

// รับ POST request ที่ /api/auth/login
router.post('/login', async (req, res) => {

  // ดึง email และ password ที่ frontend ส่งมาใน body
  const { email, password } = req.body;

  // ถ้าไม่ส่งมาครบ → หยุดทันที ส่ง 400 กลับไป
  if (!email || !password)
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });

  try {
    // ค้นหา user ในฐานข้อมูลด้วย email ที่ส่งมา
    // ใช้ ? แทนค่าจริงเพื่อป้องกัน SQL Injection
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    // ถ้าไม่เจอ email นี้ในฐานข้อมูล → ส่ง 401 กลับไป
    // บอกแค่ "ไม่ถูกต้อง" ไม่บอกว่า email หรือ password ผิด
    // เพื่อไม่ให้คนอื่นรู้ว่า email นี้มีอยู่จริงหรือเปล่า
    if (rows.length === 0)
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    // เอา user แรกที่เจอมาใช้ (email ไม่ซ้ำกันอยู่แล้ว)
    const user = rows[0];

    // เปรียบเทียบ password ที่กรอกมา กับ password ที่เข้ารหัสไว้ในฐานข้อมูล
    // bcrypt.compare จะถอดรหัสแล้วเทียบให้อัตโนมัติ
    const isMatch = await bcrypt.compare(password, user.password);

    // ถ้า password ไม่ตรง → ส่ง 401 กลับไป
    if (!isMatch)
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    // ล็อคอินสำเร็จ → สร้าง JWT token
    // เก็บ id, name, email ไว้ใน token เพื่อให้ authMiddleware ดึงใช้ได้ทีหลัง
    // token จะหมดอายุใน 1 วัน หลังจากนั้นต้องล็อคอินใหม่
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      SECRET,
      { expiresIn: '1d' }
    );

    // ส่ง token และข้อมูล user กลับไปให้ frontend
    // frontend จะเอา token ไปเก็บใน localStorage และแนบไปทุก request
    // ไม่ส่ง password กลับไปด้วยเพราะไม่จำเป็นและไม่ปลอดภัย
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    // ถ้าเกิด error ที่ไม่คาดคิด เช่น database ล่ม
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;