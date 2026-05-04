import { Router } from 'express';
// Router = ตัวจัดการ route เช่น /register, /login

import db from '../config/db.js';
// db = pool ที่เชื่อมต่อ MySQL ไว้แล้ว (ไฟล์ db.js)

import bcrypt from 'bcrypt';
// bcrypt = ใช้เข้ารหัสรหัสผ่าน (hash) ก่อนเก็บลง DB

import jwt from 'jsonwebtoken';
// jwt = สร้าง token สำหรับยืนยันตัวตน (เหมือนบัตรผ่าน)

const router = Router();
// สร้างกลุ่ม route ขึ้นมา 1 ชุด

const SECRET = process.env.JWT_SECRET || 'your_secret_key';
// คีย์ลับสำหรับเซ็น token — ดึงจาก .env
// ถ้าไม่มีใน .env ใช้ 'your_secret_key' แทน (⚠️ ไม่ควรใช้ใน production)


// ─────────────────────────────────────────
// ✅ REGISTER — สมัครสมาชิก
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
// รับ HTTP POST ที่ path /register

  const { name, email, password } = req.body;
  // ดึงข้อมูลที่ส่งมาจาก body ของ request

  if (!name || !email || !password)
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  // ถ้าขาดอะไรสักอย่าง → หยุดทันที ส่ง error 400 กลับ

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // เข้ารหัสรหัสผ่าน เช่น "1234" → "$2b$10$xK9..."
    // เลข 10 = ความซับซ้อน (saltRounds) — ยิ่งสูงยิ่งปลอดภัย แต่ช้ากว่า

    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
      // ? = placeholder ป้องกัน SQL Injection
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId: result.insertId });
    // 201 = Created สำเร็จ
    // insertId = id ของ row ที่เพิ่งสร้างใน DB

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
    // ER_DUP_ENTRY = MySQL แจ้งว่า email ซ้ำ (เพราะ email เป็น UNIQUE ใน DB)

    res.status(500).json({ message: 'server error' });
    // error อื่นๆ ที่ไม่คาดคิด → ส่ง 500 กลับ
  }
});


// ─────────────────────────────────────────
// 🔑 LOGIN — เข้าสู่ระบบ
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {

  const { email, password } = req.body;
  // ดึง email และ password จาก request

  if (!email || !password)
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  // ถ้าส่งมาไม่ครบ → หยุดทันที

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    // ค้นหา user ใน DB ด้วย email

    if (rows.length === 0)
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    // ถ้าไม่เจอ email นี้ใน DB → ส่ง 401 (Unauthorized)

    const user = rows[0];
    // เอา user แถวแรก (แถวเดียว) มาใช้

    const isMatch = await bcrypt.compare(password, user.password);
    // เปรียบเทียบรหัสผ่านที่พิมพ์ กับ hash ใน DB
    // bcrypt จะ hash รหัสใหม่แล้วเทียบ — ไม่สามารถถอดรหัสย้อนกลับได้

    if (!isMatch)
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    // รหัสผ่านไม่ตรง → ส่ง 401

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      // payload = ข้อมูลที่แนบใน token (อย่าใส่รหัสผ่าน!)
      SECRET,
      // เซ็นด้วยคีย์ลับ
      { expiresIn: '1d' }
      // token หมดอายุใน 1 วัน
    );

    res.json({ message: 'เข้าสู่ระบบสำเร็จ', token, user: { id: user.id, name: user.name, email: user.email } });
    // ส่ง token กลับไปให้ client เก็บไว้
    // client จะเอา token นี้แนบทุก request ที่ต้องการสิทธิ์

  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
// ส่งออก router นี้ให้ไฟล์หลัก (app.js) เอาไปใช้ต่อ