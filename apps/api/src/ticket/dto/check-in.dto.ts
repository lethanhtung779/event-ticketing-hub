import { IsString } from 'class-validator';

export class CheckInDto {
  @IsString()
  qrCodeToken: string;
}
