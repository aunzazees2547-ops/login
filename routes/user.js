import { Router } from "express";
import db from '../config/db.js';
import bcrypt from 'bcrypt';

const router = Router();

// ฟังก์ชัน validate ข้อมูลก่อนบันทึกลงฐานข้อมูล
// เช็คว่า email ถูกรูปแบบไหม เช่น test@gmail.com
const isEnglishOnly = (str) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(str);
// เช็คว่า password มีตัวอักษรและตัวเลขอย่างน้อย 8 ตัวไหม
const isValidPassword = (str) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(str);
// เช็คว่า name เป็นภาษาอังกฤษเท่านั้นไหม
const isValidName = (str) => /^[A-Za-z\s]+$/.test(str);

// GET / — ดึงรายชื่อผู้ใช้ทั้งหมด
// ใช้ในหน้า table.jsx ตอนโหลดรายชื่อ
// ไม่ดึง password มาด้วย เพราะไม่จำเป็นและไม่ปลอดภัย
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email FROM users');
    res.json(rows); // ส่งข้อมูลทั้งหมดกลับเป็น array
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /:id — ดึงข้อมูลผู้ใช้รายคน
// ใช้ในหน้า Edit.jsx ตอนโหลดข้อมูลเดิมมาใส่ฟอร์ม
// :id คือ id ที่รับมาจาก URL เช่น /api/users/1
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [req.params.id] // ดึง id จาก URL parameter
    );
    // ถ้าไม่เจอ id นี้ในฐานข้อมูล → ส่ง 404 กลับไป
    if (rows.length === 0)
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    res.json(rows[0]); // ส่งข้อมูล user คนแรกที่เจอกลับไป
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /:id — ลบผู้ใช้
// ใช้ในหน้า table.jsx ตอนกดปุ่มลบ
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );
    // affectedRows คือจำนวนแถวที่ถูกลบ ถ้าเป็น 0 แสดงว่าไม่เจอ id นี้
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST / — สร้างผู้ใช้ใหม่
// ใช้ในหน้า Form.jsx ตอนสมัครสมาชิก
router.post('/', async (req, res) => {
    const { name, email, password } = req.body;

    // validate ข้อมูลก่อนบันทึก ถ้าผิดรูปแบบ → หยุดทันที
    if (!name || !email || !password)
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    if (!isValidName(name))
        return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษเท่านั้น' });
    if (!isEnglishOnly(email))
        return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    if (!isValidPassword(password))
        return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข' });

    try {
        // เข้ารหัส password ก่อนบันทึก ไม่เก็บ password จริงลงฐานข้อมูล
        // เลข 10 คือความแข็งแกร่งของการเข้ารหัส ยิ่งมากยิ่งปลอดภัยแต่ช้ากว่า
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword]
        );
        // ส่ง 201 Created กลับไปพร้อม id ของ user ที่เพิ่งสร้าง
        res.status(201).json({ message: 'ผู้ใช้ถูกสร้างสำเร็จ', userId: result.insertId });
    } catch (err) {
        // ER_DUP_ENTRY คือ error code ของ MySQL เมื่อ email ซ้ำ
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' });
    }
});

// PUT /:id — แก้ไขข้อมูลผู้ใช้
// ใช้ในหน้า Edit.jsx ตอนกดบันทึกการแก้ไข
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // validate ข้อมูลก่อนอัปเดต
  if (!name || !email)
    return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });
  if (!isValidName(name))
    return res.status(400).json({ message: 'ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษเท่านั้น' });
  if (!isEnglishOnly(email))
    return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
  // password ไม่บังคับ ถ้าส่งมาค่อย validate
  if (password && !isValidPassword(password))
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลข' });

  try {
    // เช็คว่า email ซ้ำกับคนอื่นไหม ยกเว้น id ตัวเอง
    // เช่น user id=1 อยากเปลี่ยน email เป็น test@gmail.com
    // ต้องเช็คว่า test@gmail.com ถูกใช้โดย id อื่นอยู่ไหม
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    if (existing.length > 0)
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });

    let sql, values;
    // ถ้ากรอก password ใหม่มา → เข้ารหัสแล้วอัปเดตด้วย
    // ถ้าไม่กรอก → อัปเดตแค่ name กับ email
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?';
      values = [name, email, hashedPassword, id];
    } else {
      sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
      values = [name, email, id];
    }

    const [result] = await db.query(sql, values);
    // ถ้า affectedRows เป็น 0 แสดงว่าไม่เจอ id นี้ในฐานข้อมูล
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });

    res.json({ message: 'อัปเดตสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;