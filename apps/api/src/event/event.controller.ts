import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { EventService } from './event.service';
import { UploadService } from '../common/services/upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import multer from 'multer';
import type { Request } from 'express';

@Controller('events')
export class EventController {
  constructor(
    private eventService: EventService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  createEvent(@Req() req: any, @Body() body: CreateEventDto) {
    return this.eventService.createEvent(req.user.sub, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  updateEvent(@Req() req: any, @Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventService.updateEvent(req.user.sub, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  deleteEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.deleteEvent(req.user.sub, id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  publishEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.publishEvent(req.user.sub, id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approveEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.approveEvent(req.user.sub, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  rejectEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.rejectEvent(req.user.sub, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  cancelEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.cancelEvent(req.user.sub, id);
  }

  @Post(':id/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  async uploadBanner(@Req() req: any, @Param('id') id: string) {
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
    return this.eventService.updateEvent(req.user.sub, id, { bannerUrl: url });
  }

  @Post(':id/ticket-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  createTicketType(@Param('id') id: string, @Body() body: any) {
    return this.eventService.createTicketType({ ...body, eventId: id });
  }

  @Patch(':id/ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  updateTicketType(@Param('ticketTypeId') ticketTypeId: string, @Body() body: any) {
    return this.eventService.updateTicketType(ticketTypeId, body);
  }

  @Delete(':id/ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'USER')
  deleteTicketType(@Param('id') id: string, @Param('ticketTypeId') ticketTypeId: string) {
    return this.eventService.deleteTicketType(id, ticketTypeId);
  }

  @Get()
  findAll(@Query() query: QueryEventDto) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.eventService.findOne(id, lang);
  }
}
