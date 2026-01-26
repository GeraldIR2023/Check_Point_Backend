import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'UserTag is required' })
  @IsString({ message: 'Invalid userTag' })
  userTag: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Invalid email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Invalid password' })
  password: string;

  @IsOptional()
  @IsBoolean({ message: 'isAdmin must be a boolean value' })
  isAdmin?: boolean;
}
