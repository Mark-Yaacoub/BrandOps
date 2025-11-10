import prisma from "./src/lib/db";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test connection
    await prisma.$connect();
    console.log("✓ Successfully connected to PostgreSQL database");

    // Test creating a product
    const product = await prisma.product.create({
      data: {
        name: "Test Product",
        description: "This is a test product",
        cost: 10.50,
        price: 19.99,
      },
    });
    console.log("✓ Successfully created test product:", product);

    // Test reading products
    const products = await prisma.product.findMany();
    console.log("✓ Successfully retrieved products:", products.length, "product(s) found");

    // Clean up - delete test product
    await prisma.product.delete({
      where: { id: product.id },
    });
    console.log("✓ Successfully deleted test product");

    console.log("\n✅ All database operations completed successfully!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
