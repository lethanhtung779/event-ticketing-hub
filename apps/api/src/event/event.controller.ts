import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import type { Request } from 'express';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createEvent(@Req() req: any, @Body() body: CreateEventDto) {
    return this.eventService.createEvent(req.user.sub, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateEvent(@Req() req: any, @Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventService.updateEvent(req.user.sub, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.deleteEvent(req.user.sub, id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  publishEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.publishEvent(req.user.sub, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  cancelEvent(@Req() req: any, @Param('id') id: string) {
    return this.eventService.cancelEvent(req.user.sub, id);
  }

  @Post(':id/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => { if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true }); cb(null, UPLOAD_DIR); },
      filename: (_req, file, cb) => { cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`); },
    }),
    fileFilter: (_req, file, cb) => { file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images'), false); },
  }))
  async uploadBanner(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.eventService.updateEvent(req.user.sub, id, { bannerUrl: `/uploads/${file.filename}` });
  }

  @Post(':id/ticket-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createTicketType(@Param('id') id: string, @Body() body: any) {
    return this.eventService.createTicketType({ ...body, eventId: id });
  }

  @Patch(':id/ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateTicketType(@Param('ticketTypeId') ticketTypeId: string, @Body() body: any) {
    return this.eventService.updateTicketType(ticketTypeId, body);
  }

  @Get()
  findAll(@Query() query: QueryEventDto) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }
}
