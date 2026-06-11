import 'dotenv/config';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const email = 'test@evalogical.com';
    const password = 'password123';
    
    // 1. Try to register
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Test', email, password: hashedPassword },
      });
      console.log('Registered user.');
    }

    // 2. Try to login
    console.log('Attempting login...');
    const loginUser = await prisma.user.findUnique({ where: { email } });
    if (!loginUser || !loginUser.password) {
      console.error('Invalid email or password (user not found or no password)');
      return;
    }
    const isMatch = await bcrypt.compare(password, loginUser.password);
    if (!isMatch) {
      console.error('Invalid email or password (bcrypt mismatch)');
      return;
    }
    console.log('Login successful:', { id: loginUser.id, email: loginUser.email });
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
