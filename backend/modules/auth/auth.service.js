const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'nhatki_secret';

const register = async (username, email, password) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw new Error('Email hoặc username đã tồn tại');

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Email không tồn tại');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Mật khẩu không đúng');

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
};

module.exports = { register, login };
