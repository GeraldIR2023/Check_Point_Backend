import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
