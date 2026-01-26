import { IsNotEmpty, IsString } from 'class-validator';

export class AuthenticateUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Invalid email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Invalid password' })
  password: string;
}
