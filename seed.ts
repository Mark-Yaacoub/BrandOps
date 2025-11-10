import prisma from "./src/lib/db";

async function seed() {
  console.log("Seeding database...");

  // Create some users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@brandops.com",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        name: "John Manager",
        email: "john@brandops.com",
        role: "manager",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jane Smith",
        email: "jane@brandops.com",
        role: "user",
      },
    }),
  ]);
  console.log("✓ Created users:", users.length);

  // Create some products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Premium T-Shirt",
        description: "High-quality cotton t-shirt",
        cost: 5.50,
        price: 19.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Classic Hoodie",
        description: "Comfortable fleece hoodie",
        cost: 12.00,
        price: 39.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Baseball Cap",
        description: "Adjustable baseball cap",
        cost: 4.00,
        price: 14.99,
      },
    }),
  ]);
  console.log("✓ Created products:", products.length);

  // Create some batches
  const batches = await Promise.all([
    prisma.batch.create({
      data: {
        productId: products[0].id,
        name: "T-Shirt Batch #1",
        quantity: 500,
        cost: 2750,
        status: "completed",
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-10-15"),
      },
    }),
    prisma.batch.create({
      data: {
        productId: products[1].id,
        name: "Hoodie Batch #1",
        quantity: 200,
        cost: 2400,
        status: "in-progress",
        startDate: new Date("2025-11-01"),
        endDate: null,
      },
    }),
    prisma.batch.create({
      data: {
        productId: products[2].id,
        name: "Cap Batch #1",
        quantity: 1000,
        cost: 4000,
        status: "pending",
        startDate: null,
        endDate: null,
      },
    }),
  ]);
  console.log("✓ Created batches:", batches.length);

  // Create some expenses
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        type: "Materials",
        amount: 2500,
        date: new Date("2025-10-05"),
        notes: "Cotton fabric for t-shirts",
        productId: products[0].id,
        batchId: batches[0].id,
      },
    }),
    prisma.expense.create({
      data: {
        type: "Labor",
        amount: 1500,
        date: new Date("2025-10-10"),
        notes: "Production labor costs",
        productId: products[0].id,
        batchId: batches[0].id,
      },
    }),
    prisma.expense.create({
      data: {
        type: "Shipping",
        amount: 350,
        date: new Date("2025-11-05"),
        notes: "Shipping materials",
        productId: products[1].id,
        batchId: batches[1].id,
      },
    }),
    prisma.expense.create({
      data: {
        type: "Equipment",
        amount: 800,
        date: new Date("2025-11-01"),
        notes: "New printing equipment",
        productId: null,
        batchId: null,
      },
    }),
  ]);
  console.log("✓ Created expenses:", expenses.length);

  // Create some tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Quality check batch #1",
        description: "Inspect completed t-shirt batch for quality issues",
        status: "completed",
        priority: "high",
        dueDate: new Date("2025-10-16"),
        productId: products[0].id,
        batchId: batches[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Order hoodie materials",
        description: "Order fleece material for next batch",
        status: "in-progress",
        priority: "high",
        dueDate: new Date("2025-11-12"),
        productId: products[1].id,
        batchId: batches[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Review cap designs",
        description: "Review and approve cap designs before production",
        status: "pending",
        priority: "medium",
        dueDate: new Date("2025-11-20"),
        productId: products[2].id,
        batchId: batches[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Update inventory system",
        description: "Update inventory tracking system with new features",
        status: "pending",
        priority: "low",
        dueDate: new Date("2025-11-30"),
        productId: null,
        batchId: null,
      },
    }),
  ]);
  console.log("✓ Created tasks:", tasks.length);

  console.log("\n✅ Database seeded successfully!");
  console.log("Summary:");
  console.log("- Users:", users.length);
  console.log("- Products:", products.length);
  console.log("- Batches:", batches.length);
  console.log("- Expenses:", expenses.length);
  console.log("- Tasks:", tasks.length);
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
