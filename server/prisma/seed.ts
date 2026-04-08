import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  const commonPassword = await bcrypt.hash('Password123', SALT_ROUNDS);
  const adminPassword = await bcrypt.hash('Admin123', SALT_ROUNDS);

  console.log('--- Reseting Existing Users ---');
  const emailsToReset = [
    'krishna@gmail.com',
    'krishna9898@gmail.com',
    'info@gmail.com',
    'krishnashinde9898@gmail.com'
  ];

  for (const email of emailsToReset) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash: commonPassword }
      });
      console.log(`Updated password for: ${email} (${user.role})`);
    } else {
      // Create if doesn't exist for some reason (though we found them)
      const role = email.includes('9898') ? UserRole.RECRUITER : UserRole.CANDIDATE;
      await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash: commonPassword,
          role
        }
      });
      console.log(`Created user: ${email} (${role})`);
    }
  }

  console.log('\n--- Ensuring Admin User ---');
  const adminEmail = 'admin@test.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: adminPassword, role: UserRole.ADMIN }
    });
    console.log(`Updated Admin password: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        passwordHash: adminPassword,
        role: UserRole.ADMIN
      }
    });
    console.log(`Created Admin user: ${adminEmail}`);
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
