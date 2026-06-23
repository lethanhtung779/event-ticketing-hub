import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import type { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private auditLogService: AuditLogService,
  ) {}

  @Get('stats')
  getStats(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.adminService.getStats(fromDate, toDate);
  }

  @Get('revenue-report')
  getRevenueReport(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.adminService.getRevenueReport(fromDate, toDate);
  }

  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: string, @Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    const result = await this.adminService.getAttendees(id, format);
    if (format === 'csv') {
      res!.setHeader('Content-Type', 'text/csv');
      res!.setHeader('Content-Disposition', `attachment; filename=attendees-${id}.csv`);
      res!.send(result);
    } else {
      return result;
    }
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.auditLogService.findAll(parseInt(page || '1'), parseInt(limit || '50'));
  }

  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.adminService.getUsers(parseInt(page || '1'), parseInt(limit || '20'), search);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Get('promo-codes')
  getPromoCodes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getPromoCodes(parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Post('promo-codes')
  createPromoCode(@Body() body: CreatePromoCodeDto) {
    return this.adminService.createPromoCode(body);
  }

  @Patch('promo-codes/:id')
  updatePromoCode(@Param('id') id: string, @Body() body: UpdatePromoCodeDto) {
    return this.adminService.updatePromoCode(id, body);
  }

  @Delete('promo-codes/:id')
  deletePromoCode(@Param('id') id: string) {
    return this.adminService.deletePromoCode(id);
  }
}
