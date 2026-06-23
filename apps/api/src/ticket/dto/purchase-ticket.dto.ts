import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseTicketDto {
  @IsUUID()
  ticketTypeId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
