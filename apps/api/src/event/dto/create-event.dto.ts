import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
