import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database tables...\n');

    // Check Users
    const users = await prisma.user.findMany();
    console.log(`✅ Users table: ${users.length} records`);
    users.forEach((u: { name: string; email: string }) => console.log(`   - ${u.name} (${u.email})`));

    // Check Products
    const products = await prisma.product.findMany();
    console.log(`\n✅ Products table: ${products.length} records`);
    products.forEach((p: { name: string }) => console.log(`   - ${p.name}`));

    // Check Batches
    const batches = await prisma.batch.findMany();
    console.log(`\n✅ Batches table: ${batches.length} records`);
    batches.forEach((b: { name: string }) => console.log(`   - ${b.name}`));

    // Check Expenses
    const expenses = await prisma.expense.findMany();
    console.log(`\n✅ Expenses table: ${expenses.length} records`);
    expenses.forEach((e: { type: string; amount: number }) => console.log(`   - ${e.type}: $${e.amount}`));

    // Check Tasks
    const tasks = await prisma.task.findMany();
    console.log(`\n✅ Tasks table: ${tasks.length} records`);
    tasks.forEach((t: { title: string; status: string }) => console.log(`   - ${t.title} (${t.status})`));

    // Check PasswordResetToken
    const tokens = await prisma.passwordResetToken.findMany();
    console.log(`\n✅ PasswordResetToken table: ${tokens.length} records`);

    console.log('\n✅ All tables exist and are accessible!');
  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
