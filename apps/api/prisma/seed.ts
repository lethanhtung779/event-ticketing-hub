import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5433/ticketing_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function banner(seed: string): string {
  return `https://picsum.photos/seed/${seed}/800/400`;
}

async function main() {
  // ─── Users ──────────────────────────────────────────
  const userData = [
    { email: 'admin@ticketing.com', password: await bcrypt.hash('admin123', 10), fullName: 'Admin', role: 'ADMIN' as const },
    { email: 'staff@ticketing.com', password: await bcrypt.hash('staff123', 10), fullName: 'Nhân viên', role: 'STAFF' as const },
    { email: 'user@test.com', password: await bcrypt.hash('user123', 10), fullName: 'Nguyen Van A', role: 'USER' as const },
    { email: 'organizer1@test.com', password: await bcrypt.hash('org123', 10), fullName: 'Nhà tổ chức Sự kiện ABC', role: 'USER' as const },
    { email: 'organizer2@test.com', password: await bcrypt.hash('org123', 10), fullName: 'Công ty TNHH Sự kiện XYZ', role: 'USER' as const },
  ];
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const u of userData) {
    const user = await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
    users.push(user);
  }

  // ─── Organizers ─────────────────────────────────────
  await prisma.organizer.deleteMany();
  // Mỗi user chỉ có một hồ sơ nhà tổ chức
  const organizerProfiles = [
    { name: 'ABC Entertainment', description: 'Công ty tổ chức sự kiện hàng đầu Việt Nam', email: 'info@abcentertainment.com', phone: '0901234567', website: 'https://abcentertainment.com', userId: users[3].id },
    { name: 'Công ty TNHH Sự kiện XYZ', description: 'Công ty tổ chức sự kiện chuyên nghiệp', email: 'info@xyzevents.com', phone: '0909876543', website: 'https://xyzevents.com', userId: users[4].id },
    { name: 'Nguyen Van A - Organizer', description: 'Cá nhân tổ chức sự kiện', userId: users[2].id },
  ];
  const organizers: Record<string, string> = {};
  for (const d of organizerProfiles) {
    const org = await prisma.organizer.create({ data: d });
    organizers[org.userId] = org.id;
  }

  // ─── Categories ─────────────────────────────────────
  const catNhacSong = await prisma.category.upsert({ where: { name: 'Nhạc sống' }, update: {}, create: { name: 'Nhạc sống' } });
  const catSanKhau = await prisma.category.upsert({ where: { name: 'Sân khấu & Nghệ thuật' }, update: {}, create: { name: 'Sân khấu & Nghệ thuật' } });
  const catTheThao = await prisma.category.upsert({ where: { name: 'Thể Thao' }, update: {}, create: { name: 'Thể Thao' } });
  const catHoiThao = await prisma.category.upsert({ where: { name: 'Hội thảo & Workshop' }, update: {}, create: { name: 'Hội thảo & Workshop' } });
  const catThamQuan = await prisma.category.upsert({ where: { name: 'Tham quan & Trải nghiệm' }, update: {}, create: { name: 'Tham quan & Trải nghiệm' } });
  const catKhac = await prisma.category.upsert({ where: { name: 'Khác' }, update: {}, create: { name: 'Khác' } });
  const catVeBanLai = await prisma.category.upsert({ where: { name: 'Vé bán lại' }, update: {}, create: { name: 'Vé bán lại' } });
  const catBlog = await prisma.category.upsert({ where: { name: 'Blog' }, update: {}, create: { name: 'Blog' } });

  // ─── Events ─────────────────────────────────────────
  // Xoá dữ liệu cũ trước khi tạo mới (theo thứ tự foreign key)
  await prisma.categoryTranslation.deleteMany();
  await prisma.ticketTypeTranslation.deleteMany();
  await prisma.eventTranslation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.waitingListEntry.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();

  interface EventInput {
    id: string;
    title: string;
    description: string;
    location: string;
    categoryId: string;
    status: 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED';
    startTime: Date;
    endTime: Date;
    bannerUrl?: string;
    organizerId?: string;
    venueName?: string;
    province?: string;
    district?: string;
    streetAddress?: string;
    isOnline?: boolean;
    googleMapsLink?: string;
  }

  const eventsInput: EventInput[] = [
    { id: 'event-nhac-1', title: 'Concert Anh Tuấn 2026', description: 'Đêm nhạc đặc biệt của ca sĩ Anh Tuấn với nhiều ca khúc nổi tiếng nhất.', location: 'Nhà hát lớn Hà Nội', categoryId: catNhacSong.id, status: 'PUBLISHED', startTime: new Date('2026-07-15T19:00:00Z'), endTime: new Date('2026-07-15T22:00:00Z'), bannerUrl: banner('anh-tuan-concert'), venueName: 'Nhà hát Lớn Hà Nội', province: 'Hà Nội', district: 'Hoàn Kiếm', streetAddress: '1 Tràng Tiền', googleMapsLink: 'https://goo.gl/maps/example1' },
    { id: 'event-nhac-2', title: 'Đêm nhạc Acoustic: Tình khúc mùa hè', description: 'Đêm nhạc acoustic ấm cúng với những ca khúc về mùa hè.', location: 'Cà phê Acoustic, 22 Nguyễn Văn Chiêm', categoryId: catNhacSong.id, status: 'PUBLISHED', startTime: new Date('2026-07-04T19:30:00Z'), endTime: new Date('2026-07-04T22:00:00Z'), bannerUrl: banner('acoustic-summer'), venueName: 'Acoustic Coffee House', province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', streetAddress: '22 Nguyễn Văn Chiêm' },
    { id: 'event-nhac-3', title: 'Lễ hội âm nhạc đường phố 2026', description: 'Lễ hội âm nhạc đường phố lớn nhất năm với sự tham gia của 20+ nghệ sĩ.', location: 'Phố đi bộ Nguyễn Huệ', categoryId: catNhacSong.id, status: 'PUBLISHED', startTime: new Date('2026-07-11T16:00:00Z'), endTime: new Date('2026-07-12T23:00:00Z'), bannerUrl: banner('street-music-fest'), venueName: 'Phố đi bộ Nguyễn Huệ', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: 'Đường Nguyễn Huệ' },
    { id: 'event-nhac-4', title: 'Rock Storm 2026', description: 'Đại nhạc hội Rock với các ban nhạc mạnh nhất Việt Nam.', location: 'Sân vận động Mỹ Đình', categoryId: catNhacSong.id, status: 'PUBLISHED', startTime: new Date('2026-08-01T18:00:00Z'), endTime: new Date('2026-08-01T23:59:00Z'), bannerUrl: banner('rock-storm'), venueName: 'Sân vận động Quốc gia Mỹ Đình', province: 'Hà Nội', district: 'Nam Từ Liêm', streetAddress: 'Đường Lê Đức Thọ' },
    { id: 'event-nhac-5', title: 'Hòa nhạc giao hưởng mùa thu', description: 'Đêm hòa nhạc của dàn nhạc giao hưởng quốc gia với các tác phẩm kinh điển.', location: 'Nhà hát TP. Hồ Chí Minh', categoryId: catNhacSong.id, status: 'PUBLISHED', startTime: new Date('2026-09-20T20:00:00Z'), endTime: new Date('2026-09-20T22:30:00Z'), bannerUrl: banner('symphony-autumn'), venueName: 'Nhà hát Thành phố Hồ Chí Minh', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: '7 Công trường Lam Sơn' },
    { id: 'event-skhau-1', title: 'Triển lãm hội họa đương đại', description: 'Triển lãm các tác phẩm của họa sĩ trẻ Việt Nam với nhiều phong cách đa dạng.', location: 'Bảo tàng Mỹ thuật TP.HCM', categoryId: catSanKhau.id, status: 'PUBLISHED', startTime: new Date('2026-09-10T08:00:00Z'), endTime: new Date('2026-09-15T18:00:00Z'), bannerUrl: banner('art-exhibition'), venueName: 'Bảo tàng Mỹ thuật TP.HCM', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: '97A Phó Đức Chính' },
    { id: 'event-skhau-2', title: 'Vở kịch "Ngày xưa"', description: 'Vở kịch nói đặc sắc của tác giả Nguyễn Quang Thắng.', location: 'Nhà hát kịch Việt Nam', categoryId: catSanKhau.id, status: 'PUBLISHED', startTime: new Date('2026-07-05T19:30:00Z'), endTime: new Date('2026-07-05T22:00:00Z'), bannerUrl: banner('play-ngay-xua'), venueName: 'Nhà hát Kịch Việt Nam', province: 'Hà Nội', district: 'Hoàn Kiếm', streetAddress: '1 Tràng Tiền' },
    { id: 'event-skhau-3', title: 'Múa rối nước truyền thống', description: 'Chương trình múa rối nước đặc sắc với những tích trò dân gian Việt Nam.', location: 'Nhà hát Múa rối Thăng Long', categoryId: catSanKhau.id, status: 'PUBLISHED', startTime: new Date('2026-06-30T18:00:00Z'), endTime: new Date('2026-06-30T20:00:00Z'), bannerUrl: banner('water-puppet'), venueName: 'Nhà hát Múa rối Thăng Long', province: 'Hà Nội', district: 'Hoàn Kiếm', streetAddress: '57B Đinh Tiên Hoàng' },
    { id: 'event-skhau-4', title: 'Triển lãm điêu khắc đương đại', description: 'Triển lãm điêu khắc của các nghệ sĩ trẻ với chất liệu đa dạng.', location: 'Trung tâm Nghệ thuật Đương đại', categoryId: catSanKhau.id, status: 'PUBLISHED', startTime: new Date('2026-07-18T09:00:00Z'), endTime: new Date('2026-07-25T19:00:00Z'), bannerUrl: banner('sculpture-expo'), venueName: 'Trung tâm Nghệ thuật Đương đại', province: 'TP. Hồ Chí Minh', district: 'Quận 2', streetAddress: '123 Nguyễn Văn Hưởng' },
    { id: 'event-skhau-5', title: 'Đêm nhạc kịch "Tình yêu và số phận"', description: 'Nhạc kịch kinh điển được dàn dựng công phu.', location: 'Nhà hát Thành phố Hồ Chí Minh', categoryId: catSanKhau.id, status: 'PUBLISHED', startTime: new Date('2026-08-15T20:00:00Z'), endTime: new Date('2026-08-15T23:00:00Z'), bannerUrl: banner('musical-love'), venueName: 'Nhà hát Thành phố Hồ Chí Minh', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: '7 Công trường Lam Sơn' },
    { id: 'event-tt-1', title: 'Giải chạy Marathon 2026', description: 'Giải chạy thường niên thành phố Hồ Chí Minh với các cự ly 42km, 21km và 5km.', location: 'Công viên Thống Nhất, HCM', categoryId: catTheThao.id, status: 'PUBLISHED', startTime: new Date('2026-08-20T05:00:00Z'), endTime: new Date('2026-08-20T12:00:00Z'), bannerUrl: banner('marathon-2026'), venueName: 'Công viên Thống Nhất', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: 'Công viên Thống Nhất' },
    { id: 'event-tt-2', title: 'Giải bóng đá giao hữu quốc tế', description: 'Giải bóng đá giao hữu giữa các câu lạc bộ Việt Nam và quốc tế.', location: 'Sân vận động Hàng Đẫy', categoryId: catTheThao.id, status: 'PUBLISHED', startTime: new Date('2026-07-05T17:00:00Z'), endTime: new Date('2026-07-05T21:00:00Z'), bannerUrl: banner('friendly-football'), venueName: 'Sân vận động Hàng Đẫy', province: 'Hà Nội', district: 'Đống Đa', streetAddress: 'Đường Trịnh Hoài Đức' },
    { id: 'event-tt-3', title: 'Giải tennis mở rộng 2026', description: 'Giải tennis quy tụ các tay vợt hàng đầu trong nước và quốc tế.', location: 'Trung tâm Thể thao Lan Anh', categoryId: catTheThao.id, status: 'PUBLISHED', startTime: new Date('2026-07-20T08:00:00Z'), endTime: new Date('2026-07-25T18:00:00Z'), bannerUrl: banner('tennis-open'), venueName: 'Trung tâm Thể thao Lan Anh', province: 'TP. Hồ Chí Minh', district: 'Quận 10', streetAddress: '312 Lý Thường Kiệt' },
    { id: 'event-tt-4', title: 'Giải đua xe đạp toàn quốc', description: 'Giải đua xe đạp vòng quanh thành phố với lộ trình 100km.', location: 'Đường ven biển Vũng Tàu', categoryId: catTheThao.id, status: 'PUBLISHED', startTime: new Date('2026-09-05T06:00:00Z'), endTime: new Date('2026-09-05T12:00:00Z'), bannerUrl: banner('cycling-race'), venueName: 'Bãi sau Vũng Tàu', province: 'Bà Rịa - Vũng Tàu', district: 'Thành phố Vũng Tàu', streetAddress: 'Đường ven biển' },
    { id: 'event-tt-5', title: 'Giải võ thuật cổ truyền Việt Nam', description: 'Giải đấu võ thuật cổ truyền với sự tham gia của các võ sư trên cả nước.', location: 'Nhà thi đấu Phú Thọ', categoryId: catTheThao.id, status: 'PUBLISHED', startTime: new Date('2026-08-10T08:00:00Z'), endTime: new Date('2026-08-12T20:00:00Z'), bannerUrl: banner('martial-arts'), venueName: 'Nhà thi đấu Phú Thọ', province: 'TP. Hồ Chí Minh', district: 'Quận 11', streetAddress: '1 Lạc Long Quân' },
    { id: 'event-ht-1', title: 'Hội thảo AI & Blockchain 2026', description: 'Hội thảo chuyên sâu về trí tuệ nhân tạo và công nghệ blockchain.', location: 'Trung tâm hội nghị quốc gia Hà Nội', categoryId: catHoiThao.id, status: 'PUBLISHED', startTime: new Date('2026-10-05T08:00:00Z'), endTime: new Date('2026-10-06T17:00:00Z'), bannerUrl: banner('ai-blockchain'), venueName: 'Trung tâm Hội nghị Quốc gia', province: 'Hà Nội', district: 'Từ Liêm', streetAddress: 'Phạm Hùng' },
    { id: 'event-ht-2', title: 'Workshop: Lập trình Web với Next.js', description: 'Workshop thực hành xây dựng ứng dụng web hiện đại với Next.js, React và TypeScript.', location: 'Đại học Bách Khoa Hà Nội', categoryId: catHoiThao.id, status: 'PUBLISHED', startTime: new Date('2026-07-04T08:00:00Z'), endTime: new Date('2026-07-04T17:00:00Z'), bannerUrl: banner('nextjs-workshop'), venueName: 'Đại học Bách Khoa Hà Nội', province: 'Hà Nội', district: 'Hai Bà Trưng', streetAddress: '1 Đại Cồ Việt' },
    { id: 'event-ht-3', title: 'Hội thảo Khởi nghiệp 2026', description: 'Hội thảo dành cho startup với sự tham gia của các quỹ đầu tư.', location: 'Trung tâm Khởi nghiệp Sài Gòn', categoryId: catHoiThao.id, status: 'PUBLISHED', startTime: new Date('2026-07-12T08:00:00Z'), endTime: new Date('2026-07-12T17:30:00Z'), bannerUrl: banner('startup-seminar'), venueName: 'Trung tâm Khởi nghiệp Sài Gòn', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: '123 Nguyễn Huệ' },
    { id: 'event-ht-4', title: 'Workshop Nhiếp ảnh chuyên nghiệp', description: 'Workshop nhiếp ảnh với nhiếp ảnh gia nổi tiếng.', location: 'Studio 23, Quận 2', categoryId: catHoiThao.id, status: 'PUBLISHED', startTime: new Date('2026-08-02T09:00:00Z'), endTime: new Date('2026-08-02T16:00:00Z'), bannerUrl: banner('photography-ws'), venueName: 'Studio 23', province: 'TP. Hồ Chí Minh', district: 'Quận 2', streetAddress: '23 Nguyễn Văn Hưởng' },
    { id: 'event-ht-5', title: 'Hội thảo Digital Marketing 2026', description: 'Cập nhật xu hướng digital marketing mới nhất, SEO, content marketing.', location: 'Khách sạn Rex Sài Gòn', categoryId: catHoiThao.id, status: 'PUBLISHED', startTime: new Date('2026-09-15T08:00:00Z'), endTime: new Date('2026-09-15T17:00:00Z'), bannerUrl: banner('digital-marketing'), venueName: 'Khách sạn Rex', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: '141 Nguyễn Huệ' },
    { id: 'event-tq-1', title: 'Tour du lịch Đà Lạt mùa hoa', description: 'Tour 3 ngày 2 đêm khám phá Đà Lạt mùa hoa dã quỳ.', location: 'Đà Lạt, Lâm Đồng', categoryId: catThamQuan.id, status: 'PUBLISHED', startTime: new Date('2026-07-10T07:00:00Z'), endTime: new Date('2026-07-12T18:00:00Z'), bannerUrl: banner('dalat-tour'), venueName: 'Đà Lạt', province: 'Lâm Đồng', district: 'Thành phố Đà Lạt', streetAddress: 'Trung tâm thành phố Đà Lạt' },
    { id: 'event-tq-2', title: 'Trải nghiệm làm gốm Bát Tràng', description: 'Một ngày làm nghệ nhân gốm tại làng gốm Bát Tràng.', location: 'Làng gốm Bát Tràng, Hà Nội', categoryId: catThamQuan.id, status: 'PUBLISHED', startTime: new Date('2026-07-05T08:00:00Z'), endTime: new Date('2026-07-05T17:00:00Z'), bannerUrl: banner('bat-trang-pottery'), venueName: 'Làng gốm Bát Tràng', province: 'Hà Nội', district: 'Gia Lâm', streetAddress: 'Bát Tràng' },
    { id: 'event-tq-3', title: 'Leo núi Fansipan', description: 'Chinh phục đỉnh Fansipan - nóc nhà Đông Dương. Tour 2 ngày 1 đêm.', location: 'Sa Pa, Lào Cai', categoryId: catThamQuan.id, status: 'PUBLISHED', startTime: new Date('2026-08-15T06:00:00Z'), endTime: new Date('2026-08-16T18:00:00Z'), bannerUrl: banner('fansipan-climb'), venueName: 'Fansipan', province: 'Lào Cai', district: 'Sa Pa', streetAddress: 'Trạm Tôn' },
    { id: 'event-tq-4', title: 'Khám phá vịnh Hạ Long', description: 'Tour du thuyền khám phá vịnh Hạ Long, tham quan hang động và chèo kayak.', location: 'Vịnh Hạ Long, Quảng Ninh', categoryId: catThamQuan.id, status: 'PUBLISHED', startTime: new Date('2026-07-25T08:00:00Z'), endTime: new Date('2026-07-26T17:00:00Z'), bannerUrl: banner('halong-bay'), venueName: 'Vịnh Hạ Long', province: 'Quảng Ninh', district: 'Thành phố Hạ Long', streetAddress: 'Bến tàu du lịch' },
    { id: 'event-tq-5', title: 'Trải nghiệm nông trại hữu cơ', description: 'Một ngày về với thiên nhiên tại nông trại hữu cơ.', location: 'Nông trại EcoFarm, Đà Lạt', categoryId: catThamQuan.id, status: 'PUBLISHED', startTime: new Date('2026-08-30T07:00:00Z'), endTime: new Date('2026-08-30T17:00:00Z'), bannerUrl: banner('organic-farm'), venueName: 'EcoFarm Đà Lạt', province: 'Lâm Đồng', district: 'Đức Trọng', streetAddress: 'Thôn 4, xã Hiệp An' },
    { id: 'event-khac-1', title: 'Hội chợ ẩm thực quốc tế', description: 'Hội chợ ẩm thực với các món ăn đến từ 30 quốc gia trên thế giới.', location: 'Công viên 23/9, Quận 1', categoryId: catKhac.id, status: 'PUBLISHED', startTime: new Date('2026-07-04T09:00:00Z'), endTime: new Date('2026-07-06T22:00:00Z'), bannerUrl: banner('food-festival'), venueName: 'Công viên 23/9', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: 'Đường Nguyễn Thị Nghĩa' },
    { id: 'event-khac-2', title: 'Phiên chợ đồ cũ cuối tuần', description: 'Phiên chợ đồ cũ với nhiều mặt hàng độc đáo.', location: 'Khu đô thị Ecopark', categoryId: catKhac.id, status: 'PUBLISHED', startTime: new Date('2026-07-11T07:00:00Z'), endTime: new Date('2026-07-11T18:00:00Z'), bannerUrl: banner('vintage-market'), venueName: 'Khu đô thị Ecopark', province: 'Hưng Yên', district: 'Văn Giang', streetAddress: 'Khu đô thị Ecopark' },
    { id: 'event-khac-3', title: 'Hội sách mùa hè 2026', description: 'Hội sách với hàng ngàn đầu sách giảm giá, giao lưu tác giả.', location: 'Đường sách TP. Hồ Chí Minh', categoryId: catKhac.id, status: 'PUBLISHED', startTime: new Date('2026-07-17T08:00:00Z'), endTime: new Date('2026-07-21T21:00:00Z'), bannerUrl: banner('book-fair'), venueName: 'Đường sách Thành phố Hồ Chí Minh', province: 'TP. Hồ Chí Minh', district: 'Quận 1', streetAddress: 'Đường Nguyễn Văn Bình' },
    { id: 'event-khac-4', title: 'Triển lãm xe hơi 2026', description: 'Triển lãm xe hơi với các mẫu xe mới nhất từ các thương hiệu nổi tiếng.', location: 'Trung tâm Hội chợ Triển lãm Sài Gòn', categoryId: catKhac.id, status: 'PUBLISHED', startTime: new Date('2026-08-05T09:00:00Z'), endTime: new Date('2026-08-09T20:00:00Z'), bannerUrl: banner('car-expo'), venueName: 'SECC', province: 'TP. Hồ Chí Minh', district: 'Quận 7', streetAddress: '799 Nguyễn Văn Linh' },
    { id: 'event-draft-1', title: 'Sự kiện đang chuẩn bị', description: 'Sự kiện đang trong quá trình chuẩn bị.', location: 'Địa điểm sẽ thông báo', categoryId: catKhac.id, status: 'DRAFT', startTime: new Date('2026-11-01T08:00:00Z'), endTime: new Date('2026-11-02T17:00:00Z'), bannerUrl: banner('draft-event') },
  ];

  // Map event → organizerId (chia đều cho các organizer)
  const orgIds = Object.values(organizers);
  const eventOrganizers: Record<string, string> = {};
  eventsInput.forEach((e, i) => { eventOrganizers[e.id] = orgIds[i % orgIds.length]; });

  const createdEvents: Awaited<ReturnType<typeof prisma.event.create>>[] = [];
  for (const data of eventsInput) {
    const event = await prisma.event.create({ data: { ...data, organizerId: eventOrganizers[data.id] } });
    createdEvents.push(event);
  }

  // ─── Ticket Types ───────────────────────────────────
  const ticketTypesInput: { eventId: string; name: string; price: number; totalQuantity: number; soldQuantity?: number; minPerOrder?: number; maxPerOrder?: number; saleStartTime?: Date; saleEndTime?: Date }[] = [
    // Concert Anh Tuấn 2026
    { eventId: 'event-nhac-1', name: 'VIP', price: 500000, totalQuantity: 100, soldQuantity: 35, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-nhac-1', name: 'Thường', price: 200000, totalQuantity: 500, soldQuantity: 120, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-nhac-1', name: 'Sinh viên', price: 100000, totalQuantity: 200, soldQuantity: 80, minPerOrder: 1, maxPerOrder: 2 },
    // Đêm nhạc Acoustic
    { eventId: 'event-nhac-2', name: 'Cơ bản', price: 150000, totalQuantity: 80, soldQuantity: 45, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-nhac-2', name: 'VIP', price: 300000, totalQuantity: 30, soldQuantity: 20, minPerOrder: 1, maxPerOrder: 3 },
    // Lễ hội âm nhạc đường phố
    { eventId: 'event-nhac-3', name: 'Vé ngày (Thứ 7)', price: 100000, totalQuantity: 2000, soldQuantity: 800, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-nhac-3', name: 'Vé ngày (Chủ nhật)', price: 100000, totalQuantity: 2000, soldQuantity: 600, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-nhac-3', name: 'Vé 2 ngày', price: 150000, totalQuantity: 1000, soldQuantity: 500, minPerOrder: 1, maxPerOrder: 5 },
    // Rock Storm
    { eventId: 'event-nhac-4', name: 'Khu A', price: 400000, totalQuantity: 500, soldQuantity: 200, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-nhac-4', name: 'Khu B', price: 250000, totalQuantity: 1000, soldQuantity: 300, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-nhac-4', name: 'Khu VIP', price: 800000, totalQuantity: 100, soldQuantity: 60, minPerOrder: 1, maxPerOrder: 3 },
    // Hòa nhạc giao hưởng
    { eventId: 'event-nhac-5', name: 'Ghế thường', price: 300000, totalQuantity: 300, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-nhac-5', name: 'Ghế VIP', price: 600000, totalQuantity: 100, soldQuantity: 50, minPerOrder: 1, maxPerOrder: 3 },
    // Triển lãm hội họa
    { eventId: 'event-skhau-1', name: 'Người lớn', price: 100000, totalQuantity: 300, soldQuantity: 80, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-skhau-1', name: 'Sinh viên', price: 50000, totalQuantity: 200, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 5 },
    // Vở kịch Ngày xưa
    { eventId: 'event-skhau-2', name: 'Ghế thường', price: 200000, totalQuantity: 200, soldQuantity: 120, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-skhau-2', name: 'Ghế VIP', price: 400000, totalQuantity: 50, soldQuantity: 30, minPerOrder: 1, maxPerOrder: 3 },
    // Múa rối nước
    { eventId: 'event-skhau-3', name: 'Người lớn', price: 80000, totalQuantity: 150, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-skhau-3', name: 'Trẻ em', price: 40000, totalQuantity: 80, soldQuantity: 50, minPerOrder: 1, maxPerOrder: 3 },
    // Triển lãm điêu khắc
    { eventId: 'event-skhau-4', name: 'Vé vào cửa', price: 60000, totalQuantity: 500, soldQuantity: 150, minPerOrder: 1, maxPerOrder: 10 },
    // Nhạc kịch
    { eventId: 'event-skhau-5', name: 'Hạng 1', price: 500000, totalQuantity: 100, soldQuantity: 70, minPerOrder: 1, maxPerOrder: 4 },
    { eventId: 'event-skhau-5', name: 'Hạng 2', price: 350000, totalQuantity: 200, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 6 },
    { eventId: 'event-skhau-5', name: 'Hạng 3', price: 200000, totalQuantity: 300, soldQuantity: 90, minPerOrder: 1, maxPerOrder: 8 },
    // Marathon
    { eventId: 'event-tt-1', name: 'Standard', price: 150000, totalQuantity: 1000, soldQuantity: 400, minPerOrder: 1, maxPerOrder: 20 },
    { eventId: 'event-tt-1', name: 'VIP Runner', price: 500000, totalQuantity: 50, soldQuantity: 25, minPerOrder: 1, maxPerOrder: 2 },
    // Bóng đá giao hữu
    { eventId: 'event-tt-2', name: 'Khán đài A', price: 100000, totalQuantity: 2000, soldQuantity: 800, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-tt-2', name: 'Khán đài VIP', price: 300000, totalQuantity: 200, soldQuantity: 150, minPerOrder: 1, maxPerOrder: 5 },
    // Tennis
    { eventId: 'event-tt-3', name: 'Vé ngày', price: 100000, totalQuantity: 1000, soldQuantity: 200, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-tt-3', name: 'Vé trọn giải', price: 400000, totalQuantity: 200, soldQuantity: 80, minPerOrder: 1, maxPerOrder: 5 },
    // Đua xe đạp
    { eventId: 'event-tt-4', name: 'Cổ động', price: 50000, totalQuantity: 500, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 20 },
    // Võ thuật
    { eventId: 'event-tt-5', name: 'Vé thường', price: 80000, totalQuantity: 1500, soldQuantity: 400, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-tt-5', name: 'Vé VIP', price: 200000, totalQuantity: 200, soldQuantity: 80, minPerOrder: 1, maxPerOrder: 5 },
    // AI & Blockchain
    { eventId: 'event-ht-1', name: 'Cá nhân', price: 500000, totalQuantity: 200, soldQuantity: 60, minPerOrder: 1, maxPerOrder: 3 },
    { eventId: 'event-ht-1', name: 'Doanh nghiệp', price: 2000000, totalQuantity: 50, soldQuantity: 15, minPerOrder: 1, maxPerOrder: 5 },
    // Next.js Workshop
    { eventId: 'event-ht-2', name: 'Sinh viên', price: 100000, totalQuantity: 50, soldQuantity: 30, minPerOrder: 1, maxPerOrder: 2 },
    { eventId: 'event-ht-2', name: 'Chuyên nghiệp', price: 300000, totalQuantity: 50, soldQuantity: 40, minPerOrder: 1, maxPerOrder: 3 },
    // Khởi nghiệp
    { eventId: 'event-ht-3', name: 'Vé thường', price: 200000, totalQuantity: 200, soldQuantity: 100, minPerOrder: 1, maxPerOrder: 5 },
    // Nhiếp ảnh
    { eventId: 'event-ht-4', name: 'Vé tham dự', price: 500000, totalQuantity: 30, soldQuantity: 18, minPerOrder: 1, maxPerOrder: 2 },
    // Digital Marketing
    { eventId: 'event-ht-5', name: 'Cá nhân', price: 300000, totalQuantity: 150, soldQuantity: 60, minPerOrder: 1, maxPerOrder: 3 },
    { eventId: 'event-ht-5', name: 'Nhóm (3 người)', price: 700000, totalQuantity: 30, soldQuantity: 10, minPerOrder: 1, maxPerOrder: 3 },
    // Tour Đà Lạt
    { eventId: 'event-tq-1', name: 'Người lớn', price: 2500000, totalQuantity: 40, soldQuantity: 20, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-tq-1', name: 'Trẻ em', price: 1500000, totalQuantity: 15, soldQuantity: 8, minPerOrder: 1, maxPerOrder: 3 },
    // Gốm Bát Tràng
    { eventId: 'event-tq-2', name: 'Người lớn', price: 350000, totalQuantity: 50, soldQuantity: 25, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-tq-2', name: 'Trẻ em', price: 200000, totalQuantity: 30, soldQuantity: 15, minPerOrder: 1, maxPerOrder: 3 },
    // Fansipan
    { eventId: 'event-tq-3', name: 'Tour trọn gói', price: 3500000, totalQuantity: 20, soldQuantity: 10, minPerOrder: 1, maxPerOrder: 4 },
    // Hạ Long
    { eventId: 'event-tq-4', name: 'Người lớn', price: 1800000, totalQuantity: 50, soldQuantity: 25, minPerOrder: 1, maxPerOrder: 5 },
    { eventId: 'event-tq-4', name: 'Trẻ em', price: 900000, totalQuantity: 20, soldQuantity: 10, minPerOrder: 1, maxPerOrder: 3 },
    // Nông trại
    { eventId: 'event-tq-5', name: 'Vé tham quan', price: 200000, totalQuantity: 60, soldQuantity: 20, minPerOrder: 1, maxPerOrder: 10 },
    // Hội chợ ẩm thực
    { eventId: 'event-khac-1', name: 'Vé vào cửa', price: 30000, totalQuantity: 5000, soldQuantity: 1500, minPerOrder: 1, maxPerOrder: 20 },
    // Chợ đồ cũ
    { eventId: 'event-khac-2', name: 'Vé tham quan', price: 20000, totalQuantity: 1000, soldQuantity: 300, minPerOrder: 1, maxPerOrder: 20 },
    // Hội sách
    { eventId: 'event-khac-3', name: 'Vé vào cửa', price: 10000, totalQuantity: 10000, soldQuantity: 2000, minPerOrder: 1, maxPerOrder: 50 },
    // Triển lãm xe
    { eventId: 'event-khac-4', name: 'Vé thường', price: 50000, totalQuantity: 5000, soldQuantity: 800, minPerOrder: 1, maxPerOrder: 10 },
    { eventId: 'event-khac-4', name: 'VIP', price: 200000, totalQuantity: 200, soldQuantity: 50, minPerOrder: 1, maxPerOrder: 3 },
  ];

  const createdTicketTypes: Awaited<ReturnType<typeof prisma.ticketType.create>>[] = [];
  for (const data of ticketTypesInput) {
    const tt = await prisma.ticketType.create({ data });
    createdTicketTypes.push(tt);
  }

  // ─── Ticket Type Translations ──────────────────────
  const ttTranslations: { ticketTypeId: string; language: string; name: string }[] = [];
  for (const tt of createdTicketTypes) {
    const viName = tt.name;
    let enName = viName;
    const nameMap: Record<string, string> = {
      'VIP': 'VIP',
      'Thường': 'Regular',
      'Sinh viên': 'Student',
      'Cơ bản': 'Basic',
      'Vé ngày (Thứ 7)': 'Saturday Pass',
      'Vé ngày (Chủ nhật)': 'Sunday Pass',
      'Vé 2 ngày': '2-Day Pass',
      'Khu A': 'Zone A',
      'Khu B': 'Zone B',
      'Khu VIP': 'VIP Zone',
      'Ghế thường': 'Regular Seat',
      'Ghế VIP': 'VIP Seat',
      'Người lớn': 'Adult',
      'Trẻ em': 'Child',
      'Vé vào cửa': 'Entry Ticket',
      'Hạng 1': 'Tier 1',
      'Hạng 2': 'Tier 2',
      'Hạng 3': 'Tier 3',
      'Standard': 'Standard',
      'VIP Runner': 'VIP Runner',
      'Khán đài A': 'Stand A',
      'Khán đài VIP': 'VIP Stand',
      'Vé ngày': 'Daily Pass',
      'Vé trọn giải': 'Tournament Pass',
      'Cổ động': 'Cheer Ticket',
      'Vé thường': 'Regular Ticket',
      'Cá nhân': 'Individual',
      'Doanh nghiệp': 'Corporate',
      'Chuyên nghiệp': 'Professional',
      'Vé tham dự': 'Attendance Ticket',
      'Nhóm (3 người)': 'Group of 3',
      'Tour trọn gói': 'All-inclusive Tour',
      'Vé tham quan': 'Sightseeing Ticket',
    };
    if (nameMap[viName]) enName = nameMap[viName];
    ttTranslations.push({ ticketTypeId: tt.id, language: 'en', name: enName });
  }
  await prisma.ticketTypeTranslation.createMany({ data: ttTranslations });

  // ─── Event Translations ─────────────────────────────
  const eventTranslations: { eventId: string; language: string; title: string; description: string; location: string }[] = [
    { eventId: 'event-nhac-1', language: 'en', title: 'Anh Tuan Concert 2026', description: 'A special night with famous singer Anh Tuan performing his greatest hits with a symphony orchestra.', location: 'Hanoi Opera House' },
    { eventId: 'event-nhac-2', language: 'en', title: 'Acoustic Night: Summer Love Songs', description: 'Cozy acoustic night with summer songs. Gentle, romantic atmosphere.', location: 'Acoustic Coffee, 22 Nguyen Van Chiem' },
    { eventId: 'event-nhac-3', language: 'en', title: 'Street Music Festival 2026', description: 'The biggest street music festival of the year with 20+ artists performing.', location: 'Nguyen Hue Walking Street' },
    { eventId: 'event-nhac-4', language: 'en', title: 'Rock Storm 2026', description: 'The ultimate rock festival with Vietnam\'s heaviest bands. Massive sound and spectacular stage.', location: 'My Dinh Stadium' },
    { eventId: 'event-nhac-5', language: 'en', title: 'Autumn Symphony Concert', description: 'An evening with the national symphony orchestra performing classical masterpieces.', location: 'Ho Chi Minh City Opera House' },
    { eventId: 'event-skhau-1', language: 'en', title: 'Contemporary Art Exhibition', description: 'Exhibition of works by young Vietnamese artists with diverse styles.', location: 'Ho Chi Minh City Museum of Fine Arts' },
    { eventId: 'event-skhau-2', language: 'en', title: 'Play "Ngay xua" (Once Upon a Time)', description: 'A special play by author Nguyen Quang Thang, telling childhood memories.', location: 'Vietnam Drama Theater' },
    { eventId: 'event-skhau-3', language: 'en', title: 'Traditional Water Puppet Show', description: 'Special water puppet performance with Vietnamese folk tales.', location: 'Thang Long Water Puppet Theater' },
    { eventId: 'event-skhau-4', language: 'en', title: 'Contemporary Sculpture Exhibition', description: 'Sculpture exhibition by young artists with diverse materials.', location: 'Contemporary Art Center' },
    { eventId: 'event-skhau-5', language: 'en', title: 'Musical "Love and Destiny"', description: 'Classic musical elaborately staged with talented cast.', location: 'Ho Chi Minh City Opera House' },
    { eventId: 'event-tt-1', language: 'en', title: 'Marathon 2026', description: 'Annual Ho Chi Minh City marathon with 42km, 21km and 5km distances.', location: 'Thong Nhat Park, HCMC' },
    { eventId: 'event-tt-2', language: 'en', title: 'International Friendly Football Match', description: 'Friendly football match between Vietnamese and international clubs.', location: 'Hang Day Stadium' },
    { eventId: 'event-tt-3', language: 'en', title: 'Tennis Open 2026', description: 'Tennis tournament featuring top domestic and international players.', location: 'Lan Anh Sports Center' },
    { eventId: 'event-tt-4', language: 'en', title: 'National Cycling Race', description: 'City cycling race with a 100km route along the coast.', location: 'Vung Tau Coastal Road' },
    { eventId: 'event-tt-5', language: 'en', title: 'Traditional Vietnamese Martial Arts Championship', description: 'Traditional martial arts tournament with masters from across the country.', location: 'Phu Tho Indoor Stadium' },
    { eventId: 'event-ht-1', language: 'en', title: 'AI & Blockchain Conference 2026', description: 'In-depth conference on artificial intelligence and blockchain technology with international speakers.', location: 'National Convention Center Hanoi' },
    { eventId: 'event-ht-2', language: 'en', title: 'Workshop: Web Development with Next.js', description: 'Hands-on workshop building modern web applications with Next.js, React and TypeScript.', location: 'Hanoi University of Science and Technology' },
    { eventId: 'event-ht-3', language: 'en', title: 'Startup Seminar 2026', description: 'Seminar for startups with investment funds and experienced mentors.', location: 'Saigon Innovation Hub' },
    { eventId: 'event-ht-4', language: 'en', title: 'Professional Photography Workshop', description: 'Photography workshop with famous photographers. Learn portrait and landscape photography.', location: 'Studio 23, District 2' },
    { eventId: 'event-ht-5', language: 'en', title: 'Digital Marketing Conference 2026', description: 'Latest digital marketing trends, SEO, content marketing and advertising.', location: 'Rex Hotel Saigon' },
    { eventId: 'event-tq-1', language: 'en', title: 'Da Lat Flower Season Tour', description: '3-day-2-night tour exploring Da Lat in sunflower season, visiting famous attractions.', location: 'Da Lat, Lam Dong' },
    { eventId: 'event-tq-2', language: 'en', title: 'Bat Trang Pottery Experience', description: 'A day as a pottery artisan at Bat Trang village with guidance from master craftsmen.', location: 'Bat Trang Village, Hanoi' },
    { eventId: 'event-tq-3', language: 'en', title: 'Fansipan Mountain Climb', description: 'Conquer Fansipan - the roof of Indochina. 2-day-1-night tour with professional guides.', location: 'Sapa, Lao Cai' },
    { eventId: 'event-tq-4', language: 'en', title: 'Ha Long Bay Discovery', description: 'Cruise tour exploring Ha Long Bay, visiting caves and kayaking.', location: 'Ha Long Bay, Quang Ninh' },
    { eventId: 'event-tq-5', language: 'en', title: 'Organic Farm Experience', description: 'A day in nature at an organic farm, harvesting vegetables and cooking.', location: 'EcoFarm, Da Lat' },
    { eventId: 'event-khac-1', language: 'en', title: 'International Food Festival', description: 'Food festival with dishes from 30 countries around the world.', location: '23/9 Park, District 1' },
    { eventId: 'event-khac-2', language: 'en', title: 'Weekend Vintage Market', description: 'Vintage market with unique items: old books, vinyl records, antiques, vintage clothes.', location: 'Ecopark Urban Area' },
    { eventId: 'event-khac-3', language: 'en', title: 'Summer Book Fair 2026', description: 'Book fair with thousands of discounted books, author meet-and-greets and reading activities.', location: 'Ho Chi Minh City Book Street' },
    { eventId: 'event-khac-4', language: 'en', title: 'Car Expo 2026', description: 'Car exhibition with the latest models from famous brands.', location: 'Saigon Exhibition and Convention Center' },
    { eventId: 'event-draft-1', language: 'en', title: 'Upcoming Event', description: 'This event is being prepared. Information will be updated later.', location: 'TBD' },
  ];
  await prisma.eventTranslation.createMany({ data: eventTranslations });

  // ─── Category Translations ─────────────────────────
  const catTranslations: { categoryId: string; language: string; name: string }[] = [
    { categoryId: catNhacSong.id, language: 'en', name: 'Live Music' },
    { categoryId: catSanKhau.id, language: 'en', name: 'Stage & Arts' },
    { categoryId: catTheThao.id, language: 'en', name: 'Sports' },
    { categoryId: catHoiThao.id, language: 'en', name: 'Workshops & Seminars' },
    { categoryId: catThamQuan.id, language: 'en', name: 'Tours & Experiences' },
    { categoryId: catKhac.id, language: 'en', name: 'Other' },
    { categoryId: catVeBanLai.id, language: 'en', name: 'Resale Tickets' },
    { categoryId: catBlog.id, language: 'en', name: 'Blog' },
  ];
  await prisma.categoryTranslation.createMany({ data: catTranslations });

  // ─── Reviews ─────────────────────────────────────────
  const reviews = [
    { eventId: 'event-nhac-1', userId: 3, rating: 5, comment: 'Buổi hòa nhạc tuyệt vời! Âm thanh và ánh sáng đều rất chuyên nghiệp.' },
    { eventId: 'event-nhac-1', userId: 4, rating: 4, comment: 'Rất hay, nhưng chỗ ngồi hơi chật.' },
    { eventId: 'event-nhac-2', userId: 3, rating: 5, comment: 'Không gian acoustic ấm cúng, âm nhạc tuyệt vời!' },
    { eventId: 'event-skhau-2', userId: 4, rating: 5, comment: 'Vở kịch cảm động, diễn viên xuất sắc.' },
    { eventId: 'event-skhau-3', userId: 3, rating: 4, comment: 'Múa rối nước rất đặc sắc, trẻ em rất thích.' },
    { eventId: 'event-tt-1', userId: 4, rating: 5, comment: 'Giải chạy tổ chức chuyên nghiệp, đường chạy đẹp.' },
    { eventId: 'event-ht-2', userId: 3, rating: 5, comment: 'Workshop rất hữu ích, giảng viên nhiệt tình.' },
    { eventId: 'event-tq-2', userId: 4, rating: 4, comment: 'Trải nghiệm thú vị, phù hợp cho gia đình.' },
    { eventId: 'event-khac-1', userId: 3, rating: 5, comment: 'Nhiều món ăn ngon, không khí sôi động!' },
  ];

  // Get actual user records
  const userRecords = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
  const userIds = userRecords.map(u => u.id);

  for (const review of reviews) {
    const userId = userIds[review.userId - 1] || userIds[0];
    await prisma.review.create({
      data: {
        eventId: review.eventId,
        userId,
        rating: review.rating,
        comment: review.comment,
      },
    });
  }

  // ─── Promo Codes ────────────────────────────────────
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
  await prisma.promoCode.upsert({
    where: { code: 'EARLYBIRD' },
    update: {},
    create: { code: 'EARLYBIRD', discountPct: 15, maxUses: 200, usedCount: 0, isActive: true, expiresAt: new Date('2026-08-31T23:59:59Z') },
  });
  await prisma.promoCode.upsert({
    where: { code: 'STUDENT50' },
    update: {},
    create: { code: 'STUDENT50', discountPct: 50, maxUses: 50, usedCount: 0, isActive: true, expiresAt: new Date('2026-12-31T23:59:59Z') },
  });

  console.log('========================================');
  console.log('  Seed completed successfully!');
  console.log('========================================');
  console.log(`  Events:       ${createdEvents.length}`);
  console.log(`  Ticket types: ${createdTicketTypes.length}`);
  console.log('----------------------------------------');
  console.log('  Admin:    admin@ticketing.com / admin123');
  console.log('  Staff:    staff@ticketing.com / staff123');
  console.log('  User:     user@test.com / user123');
  console.log('  Org 1:    organizer1@test.com / org123');
  console.log('  Org 2:    organizer2@test.com / org123');
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
