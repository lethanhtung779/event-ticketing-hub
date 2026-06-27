import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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

  await prisma.ticket.deleteMany({ where: { ticketType: { eventId: { in: ['event-1', 'event-2', 'event-3'] } } } });
  await prisma.ticketType.deleteMany({ where: { eventId: { in: ['event-1', 'event-2', 'event-3'] } } });

  const cat1 = await prisma.category.upsert({ where: { name: 'Nhạc sống' }, update: {}, create: { name: 'Nhạc sống' } });
  const cat2 = await prisma.category.upsert({ where: { name: 'Sân khấu & Nghệ thuật' }, update: {}, create: { name: 'Sân khấu & Nghệ thuật' } });
  const cat3 = await prisma.category.upsert({ where: { name: 'Thể Thao' }, update: {}, create: { name: 'Thể Thao' } });
  const cat4 = await prisma.category.upsert({ where: { name: 'Hội thảo & Workshop' }, update: {}, create: { name: 'Hội thảo & Workshop' } });
  const cat5 = await prisma.category.upsert({ where: { name: 'Tham quan & Trải nghiệm' }, update: {}, create: { name: 'Tham quan & Trải nghiệm' } });
  const cat6 = await prisma.category.upsert({ where: { name: 'Khác' }, update: {}, create: { name: 'Khác' } });
  const cat7 = await prisma.category.upsert({ where: { name: 'Vé bán lại' }, update: {}, create: { name: 'Vé bán lại' } });
  const cat8 = await prisma.category.upsert({ where: { name: 'Blog' }, update: {}, create: { name: 'Blog' } });

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

  const event4 = await prisma.event.upsert({
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

  await prisma.ticketTypeTranslation.deleteMany();
  await prisma.ticketType.deleteMany({
    where: { eventId: { in: [event1.id, event2.id, event3.id] } },
  });

  const ttVip = await prisma.ticketType.create({ data: { eventId: event1.id, name: 'VIP', price: 500000, totalQuantity: 100, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 5 } });
  const ttThuong = await prisma.ticketType.create({ data: { eventId: event1.id, name: 'Thường', price: 200000, totalQuantity: 500, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 10 } });
  const ttStd = await prisma.ticketType.create({ data: { eventId: event2.id, name: 'Standard', price: 150000, totalQuantity: 1000, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 20 } });
  const ttVipRunner = await prisma.ticketType.create({ data: { eventId: event2.id, name: 'Vip Runner', price: 500000, totalQuantity: 50, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 2 } });
  const ttAdult = await prisma.ticketType.create({ data: { eventId: event3.id, name: 'Người lớn', price: 100000, totalQuantity: 300, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 10 } });
  const ttStudent = await prisma.ticketType.create({ data: { eventId: event3.id, name: 'Sinh viên', price: 50000, totalQuantity: 200, soldQuantity: 0, minPerOrder: 1, maxPerOrder: 5 } });

  await prisma.ticketTypeTranslation.createMany({
    data: [
      { ticketTypeId: ttVip.id, language: 'en', name: 'VIP' },
      { ticketTypeId: ttThuong.id, language: 'en', name: 'Regular' },
      { ticketTypeId: ttStd.id, language: 'en', name: 'Standard' },
      { ticketTypeId: ttVipRunner.id, language: 'en', name: 'VIP Runner' },
      { ticketTypeId: ttAdult.id, language: 'en', name: 'Adult' },
      { ticketTypeId: ttStudent.id, language: 'en', name: 'Student' },
    ],
  });

  // Event translations
  await prisma.eventTranslation.deleteMany();
  await prisma.eventTranslation.createMany({
    data: [
      { eventId: event1.id, language: 'en', title: 'Anh Tuan Concert 2026', description: 'A special night with famous singer Anh Tuan performing his greatest hits', location: 'Hanoi Opera House' },
      { eventId: event2.id, language: 'en', title: 'Marathon 2026', description: 'Annual Ho Chi Minh City marathon - 42km road race', location: 'Thong Nhat Park, HCMC' },
      { eventId: event3.id, language: 'en', title: 'Contemporary Art Exhibition', description: 'Exhibition of works by young Vietnamese artists', location: 'Ho Chi Minh City Museum of Fine Arts' },
      { eventId: event4.id, language: 'en', title: 'AI & Blockchain Conference 2026', description: 'In-depth conference on artificial intelligence and blockchain technology', location: 'National Convention Center Hanoi' },
    ],
  });

  // Category translations
  await prisma.categoryTranslation.deleteMany();
  await prisma.categoryTranslation.createMany({
    data: [
      { categoryId: cat1.id, language: 'en', name: 'Live Music' },
      { categoryId: cat2.id, language: 'en', name: 'Stage & Arts' },
      { categoryId: cat3.id, language: 'en', name: 'Sports' },
      { categoryId: cat4.id, language: 'en', name: 'Workshops & Seminars' },
      { categoryId: cat5.id, language: 'en', name: 'Tours & Experiences' },
      { categoryId: cat6.id, language: 'en', name: 'Other' },
      { categoryId: cat7.id, language: 'en', name: 'Resale Tickets' },
      { categoryId: cat8.id, language: 'en', name: 'Blog' },
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
