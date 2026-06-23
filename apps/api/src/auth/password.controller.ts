import { Controller, Post, Body } from '@nestjs/common';
import { PasswordService } from './password.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.passwordService.resetPassword(body.token, body.newPassword);
  }
}
