import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-change-me',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, PasswordController, VerificationController],
  providers: [AuthService, PasswordService, VerificationService],
})
export class AuthModule {}
