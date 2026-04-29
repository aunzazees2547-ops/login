import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/user.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

// ✅ สมัครสมาชิกไม่ต้องมี token
app.post('/api/users', (req, res, next) => userRoutes(req, res, next));

// ✅ route อื่นต้องมี token
app.use('/api/users', authMiddleware, userRoutes);

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error('Failed to connect to the database. Server is not running.', error);
    }
});