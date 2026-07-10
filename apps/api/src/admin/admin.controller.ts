import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Res, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import type { Response, Request } from 'express';

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
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.adminService.getAuditLogs(
      parseInt(page || '1'), parseInt(limit || '50'),
      { action, entity, fromDate, toDate },
    );
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

  // Orders
  @Get('orders')
  getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
      search,
    );
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  // Reviews
  @Get('reviews')
  getReviews(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getReviews(parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  // Waiting list
  @Get('events/:id/waiting-list')
  getWaitingList(@Param('id') id: string) {
    return this.adminService.getWaitingList(id);
  }

  // Export
  @Get('export/events')
  async exportEvents(@Res({ passthrough: true }) res?: Response) {
    const csv = await this.adminService.exportEvents();
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename=events.csv');
    res!.send(csv);
  }

  @Get('export/users')
  async exportUsers(@Res({ passthrough: true }) res?: Response) {
    const csv = await this.adminService.exportUsers();
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res!.send(csv);
  }

  // Bulk actions
  @Post('events/bulk/publish')
  bulkPublishEvents(@Body('ids') ids: string[]) {
    return this.adminService.bulkPublishEvents(ids);
  }

  @Post('events/bulk/cancel')
  bulkCancelEvents(@Body('ids') ids: string[]) {
    return this.adminService.bulkCancelEvents(ids);
  }

  // Analytics
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  // Notifications
  @Post('notifications/send')
  sendNotification(@Body() body: { userIds?: string[]; allUsers?: boolean; subject: string; message: string }) {
    return this.adminService.sendNotification(body);
  }

  // Event report
  @Get('events/:id/report')
  getEventReport(@Param('id') id: string) {
    return this.adminService.getEventReport(id);
  }

  // Organizers
  @Get('organizers')
  getOrganizers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
  ) {
    return this.adminService.getOrganizers(
      parseInt(page || '1'), parseInt(limit || '20'), search, verified,
    )
  }

  @Patch('organizers/:id/verify')
  verifyOrganizer(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.adminService.verifyOrganizer(id, verified)
  }

  // Translations
  @Post('translations/events/:id')
  upsertEventTranslation(
    @Param('id') id: string,
    @Body() body: { language: string; title?: string; description?: string; location?: string },
  ) {
    return this.adminService.upsertEventTranslation(id, body.language, body);
  }

  @Post('translations/categories/:id')
  upsertCategoryTranslation(
    @Param('id') id: string,
    @Body() body: { language: string; name: string },
  ) {
    return this.adminService.upsertCategoryTranslation(id, body.language, body);
  }

  @Post('translations/ticket-types/:id')
  upsertTicketTypeTranslation(
    @Param('id') id: string,
    @Body() body: { language: string; name: string },
  ) {
    return this.adminService.upsertTicketTypeTranslation(id, body.language, body);
  }

}
