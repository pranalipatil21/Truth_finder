const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:Skill%40123%40%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
      }
    }
  });
  try {
    const user = await prisma.user.findFirst();
    console.log("Connected successfully.", user ? "User found." : "No users.");
  } catch (e) {
    console.error("Connection error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
