import { Controller, Get, Post, Patch, Body, UseGuards, Req, BadRequestException, Query } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { UploadService } from '../common/services/upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import multer from 'multer';

@Controller('organizer')
@UseGuards(JwtAuthGuard)
export class OrganizerController {
  constructor(
    private organizerService: OrganizerService,
    private uploadService: UploadService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() body: { name: string; description?: string; email?: string; phone?: string; website?: string }) {
    return this.organizerService.create(req.user.sub, body);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.organizerService.getProfile(req.user.sub);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() body: { name?: string; description?: string; email?: string; phone?: string; website?: string }) {
    return this.organizerService.update(req.user.sub, body);
  }

  @Post('logo')
  async uploadLogo(@Req() req: any) {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_r, file, cb) => {
        if (!file.mimetype.startsWith('image/')) cb(new Error('Only images allowed'));
        else cb(null, true);
      },
    }).single('file');

    await new Promise<void>((resolve, reject) => {
      upload(req, req.res as any, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = (req as any).file;
    if (!file) throw new BadRequestException('No file uploaded');

    const url = await this.uploadService.validateAndResize(file);
    return this.organizerService.update(req.user.sub, { logo: url } as any);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const organizer = await this.organizerService.findByUserId(req.user.sub);
    return this.organizerService.getStats(organizer.id);
  }

  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
  ) {
    const organizer = await this.organizerService.findByUserId(req.user.sub);
    return this.organizerService.getTransactions(
      organizer.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      eventId,
      status,
    );
  }
}
