import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const users = await p.user.findMany({
  select: { username: true, role: true, status: true },
  take: 5,
});
console.log(JSON.stringify(users, null, 2));
await p.$disconnect();
