import { IsString, IsNumber, Min, Max, IsInt, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPct: number;

  @IsInt()
  @Min(1)
  maxUses: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
