import jwt from 'jsonwebtoken';

// SECRET คือรหัสลับที่ใช้เซ็น token ตอนสร้าง และใช้ตรวจสอบตอนถอดรหัส
// ถ้ามี .env จะใช้ค่าจาก .env ถ้าไม่มีจะใช้ 'your_secret_key' แทน
const SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const authMiddleware = (req, res, next) => {

  // ดึงค่า Authorization จาก header ที่ frontend ส่งมา
  // ตัวอย่างที่ frontend ส่งมา: Authorization: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  // เช็คว่ามี header ส่งมาไหม และต้องขึ้นต้นด้วย "Bearer " เสมอ
  // ถ้าไม่มีหรือรูปแบบผิด → หยุดทันที ส่ง 401 กลับไป
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });

  // ตัด "Bearer " ออก เหลือแค่ตัว token
  // เช่น "Bearer eyJhbGci..." → "eyJhbGci..."
  const token = authHeader.split(' ')[1];

  try {
    // ถอดรหัส token โดยใช้ SECRET ที่ตั้งไว้
    // ถ้า token ถูกต้อง → decoded จะได้ข้อมูลที่แอบซ่อนไว้ตอนสร้าง token
    // เช่น { id: 1, name: "aun", email: "aun@gmail.com" }
    const decoded = jwt.verify(token, SECRET);

    // เอาข้อมูล user ที่ถอดได้ไปแปะไว้ใน req.user
    // ทำให้ route ถัดไปสามารถเรียกใช้ req.user.id หรือ req.user.name ได้เลย
    req.user = decoded;

    // next() คือบอกว่า "ผ่านแล้ว ไปทำงานต่อได้"
    // ถ้าไม่เรียก next() request จะค้างอยู่ตรงนี้ไม่ไปไหน
    next();

  } catch {
    // ถ้า token ผิด เช่น ถูกแก้ไข หรือหมดอายุ (เกิน 1 วัน)
    // jwt.verify จะ throw error → โดนจับตรงนี้ → ส่ง 401 กลับไป
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};