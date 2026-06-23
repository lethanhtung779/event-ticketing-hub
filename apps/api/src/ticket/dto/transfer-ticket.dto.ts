import { IsEmail } from 'class-validator';

export class TransferTicketDto {
  @IsEmail()
  targetEmail: string;
}
