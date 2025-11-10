import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/lib/auth';

const prisma = new PrismaClient();

async function addUser() {
  try {
    const hashedPassword = await hashPassword('Mm@12345');
    
    const user = await prisma.user.create({
      data: {
        name: 'Mark Yaacoub',
        email: 'markyaacoub@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ User created successfully:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('ID:', user.id);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ User with this email already exists');
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
