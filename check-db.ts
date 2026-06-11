import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, password: true } });
    console.log('Users in DB:');
    users.forEach(u => {
      console.log(`- ${u.email}: password exists? ${!!u.password}`);
    });
  } catch(e) {
    console.error('Error fetching users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
