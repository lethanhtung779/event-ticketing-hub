import { IsString, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['USER', 'STAFF', 'ADMIN'])
  role: string;
}
