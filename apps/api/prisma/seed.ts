import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5433/ticketing_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ticketing.com' },
    update: {},
    create: { email: 'admin@ticketing.com', password: adminPassword, fullName: 'Admin', role: 'ADMIN', isVerified: true },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@ticketing.com' },
    update: {},
    create: { email: 'staff@ticketing.com', password: staffPassword, fullName: 'Nhân viên', role: 'STAFF', isVerified: true },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: { email: 'user@test.com', password: userPassword, fullName: 'Nguyen Van A', role: 'USER', isVerified: true },
  });

  await prisma.ticket.deleteMany({ where: { ticketTypeId: { startsWith: 'tt-' } } });
  await prisma.ticketType.deleteMany({ where: { id: { startsWith: 'tt-' } } });

  const cat1 = await prisma.category.upsert({ where: { name: 'Âm nhạc' }, update: {}, create: { name: 'Âm nhạc' } });
  const cat2 = await prisma.category.upsert({ where: { name: 'Thể thao' }, update: {}, create: { name: 'Thể thao' } });
  const cat3 = await prisma.category.upsert({ where: { name: 'Nghệ thuật' }, update: {}, create: { name: 'Nghệ thuật' } });
  const cat4 = await prisma.category.upsert({ where: { name: 'Hội nghị' }, update: {}, create: { name: 'Hội nghị' } });
  const cat5 = await prisma.category.upsert({ where: { name: 'Giáo dục' }, update: {}, create: { name: 'Giáo dục' } });

  const event1 = await prisma.event.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      title: 'Concert Anh Tuấn 2026',
      description: 'Đêm nhạc đặc biệt của ca sĩ Anh Tuấn với nhiều ca khúc nổi tiếng',
      location: 'Nhà hát lớn Hà Nội',
      categoryId: cat1.id,
      status: 'PUBLISHED',
      startTime: new Date('2026-07-15T19:00:00Z'),
      endTime: new Date('2026-07-15T22:00:00Z'),
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 'event-2' },
    update: {},
    create: {
      id: 'event-2',
      title: 'Giải chạy Marathon 2026',
      description: 'Giải chạy thường niên thành phố Hồ Chí Minh - đường đua 42km',
      location: 'Công viên Thống Nhất, HCM',
      categoryId: cat2.id,
      status: 'PUBLISHED',
      startTime: new Date('2026-08-20T05:00:00Z'),
      endTime: new Date('2026-08-20T12:00:00Z'),
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: 'event-3' },
    update: {},
    create: {
      id: 'event-3',
      title: 'Triển lãm hội họa đương đại',
      description: 'Triển lãm các tác phẩm của họa sĩ trẻ Việt Nam',
      location: 'Bảo tàng Mỹ thuật TP.HCM',
      categoryId: cat3.id,
      status: 'PUBLISHED',
      startTime: new Date('2026-09-10T08:00:00Z'),
      endTime: new Date('2026-09-15T18:00:00Z'),
    },
  });

  await prisma.event.upsert({
    where: { id: 'event-4' },
    update: {},
    create: {
      id: 'event-4',
      title: 'Hội thảo AI & Blockchain 2026',
      description: 'Hội thảo chuyên sâu về trí tuệ nhân tạo và công nghệ blockchain',
      location: 'Trung tâm hội nghị quốc gia Hà Nội',
      categoryId: cat4.id,
      status: 'DRAFT',
      startTime: new Date('2026-10-05T08:00:00Z'),
      endTime: new Date('2026-10-06T17:00:00Z'),
    },
  });

  await prisma.ticketType.deleteMany({
    where: { eventId: { in: [event1.id, event2.id, event3.id] } },
  });

  await prisma.ticketType.createMany({
    data: [
      { eventId: event1.id, name: 'VIP', price: 500000, totalQuantity: 100, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 5 },
      { eventId: event1.id, name: 'Thường', price: 200000, totalQuantity: 500, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 10 },
      { eventId: event2.id, name: 'Standard', price: 150000, totalQuantity: 1000, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 20 },
      { eventId: event2.id, name: 'Vip Runner', price: 500000, totalQuantity: 50, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 2 },
      { eventId: event3.id, name: 'Người lớn', price: 100000, totalQuantity: 300, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 10 },
      { eventId: event3.id, name: 'Sinh viên', price: 50000, totalQuantity: 200, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 5 },
    ],
  });

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', discountPct: 10, maxUses: 100, usedCount: 0, isActive: true },
  });
  await prisma.promoCode.upsert({
    where: { code: 'VIP50' },
    update: {},
    create: { code: 'VIP50', discountPct: 50, maxUses: 10, usedCount: 0, isActive: true, expiresAt: new Date('2026-12-31T23:59:59Z') },
  });
  await prisma.promoCode.upsert({
    where: { code: 'SUMMER20' },
    update: {},
    create: { code: 'SUMMER20', discountPct: 20, maxUses: 50, usedCount: 0, isActive: true, expiresAt: new Date('2026-09-30T23:59:59Z') },
  });

  console.log('Seed completed successfully!');
  console.log('---');
  console.log('Admin: admin@ticketing.com / admin123');
  console.log('Staff: staff@ticketing.com / staff123');
  console.log('User:  user@test.com / user123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
