import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user created/updated:", adminUser.username);

  const config = await prisma.configuration.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      defaultMoneda: "PEN",
      defaultTipoTasa: "EFECTIVA",
      defaultCapitalizacion: 30,
      defaultBaseAnual: 360,
    },
  });
  console.log("Config created/updated for user:", config.userId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
