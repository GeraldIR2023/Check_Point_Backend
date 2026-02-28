import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { checkPassword, hashPassword } from '../utils/auth';
import { errorHandler } from '../utils/error-handler.utils';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { generateToken } from '../utils/token';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-current-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });

    if (userExists)
      throw errorHandler('User already exists', 'Conflict Exception');

    const token = generateToken();
    const user = this.usersRepository.create({
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
      isAdmin: false,
      token,
    });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.checkPointConfirmationToken = token;
    }

    const savedUser = await this.usersRepository.save(user);

    if (process.env.SKIP_MAIL !== 'true') {
      try {
        await this.mailService.sendToken(
          savedUser.email,
          savedUser.userTag,
          token,
        );
      } catch (error) {
        console.error('MailService Error:', error);
      }
    } else {
      console.log('--- MAIL SERVICE SKIPPED (SKIP_MAIL=true) ---');
      console.log(`Token for ${savedUser.userTag}: ${token}`);
    }

    return savedUser;
  }

  findAll() {
    return this.usersRepository.find();
  }

  async loginUser(email: string, password: string): Promise<LoginResponse> {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) throw errorHandler('User not found', 'Not Found');

    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect)
      throw errorHandler('Password is incorrect', 'Unauthorized Exception');

    const payload = {
      sub: user.id,
      userTag: user.userTag,
      isAdmin: user.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    //* Exclude password from the user object before returning it
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async confirmAccount(token: string) {
    const user = await this.usersRepository.findOne({
      where: { token },
    });
    console.log(`Token recibido: "${token}" | Largo: ${token?.length}`);
    console.log(user);

    if (!user) throw errorHandler('User Not found', 'Not Found');

    user.isConfirmed = true;
    user.token = '';
    await this.usersRepository.save(user);

    return {
      id: user.id,
      userTag: user.userTag,
      email: user.email,
      message: 'The account has been confirmed',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) throw errorHandler('User Not found', 'Not Found');

    user.token = generateToken();
    await this.usersRepository.save(user);

    // await this.mailService.sendPasswordResetToken(
    //   user.email,
    //   user.userTag,
    //   user.token,
    // );

    if (process.env.SKIP_MAIL !== 'true') {
      await this.mailService.sendPasswordResetToken(
        user.email,
        user.userTag,
        user.token,
      );
    } else {
      console.log('--- RESET MAIL SKIPPED ---');
      console.log(`Reset Token para ${user.userTag}: ${user.token}`);
    }

    return {
      id: user.id,
      userTag: user.userTag,
      email: user.email,
      message: 'Check your email to reset your password',
    };
  }

  async validateToken(token: string) {
    const tokenExists = await this.usersRepository.findOneBy({ token });

    if (!tokenExists) throw errorHandler('Token not found', 'Not Found');

    return {
      id: tokenExists.id,
      userTag: tokenExists.userTag,
      email: tokenExists.email,
      message: 'Check your email to reset your password',
    };
  }

  async resetPasswordWithToken(token: string, password: string) {
    const user = await this.usersRepository.findOneBy({ token });

    if (!user) throw errorHandler('Token not found', 'Not Found');

    user.password = await hashPassword(password);
    user.token = '';
    await this.usersRepository.save(user);

    return {
      id: user.id,
      userTag: user.userTag,
      email: user.email,
      message: 'Password has been changed',
    };
  }

  async findOne(userTag: string) {
    const user = await this.usersRepository.findOneBy({
      userTag: userTag,
    });

    if (!user) throw errorHandler('User not found', 'Not Found');

    //*Delete password and token before return the result
    const { password, token, ...result } = user;

    return result;
  }

  async updateCurrentUserPassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    console.log(user);

    if (!user) throw errorHandler('User not found', 'Not Found');

    const isPasswordCorrect = await checkPassword(
      updatePasswordDto.current_password,
      user.password,
    );

    if (!isPasswordCorrect)
      throw errorHandler(
        'Current password is incorrect',
        'Unauthorized Exception',
      );

    user.password = await hashPassword(updatePasswordDto.password);
    await this.usersRepository.save(user);

    return { message: 'Password has been changed' };
  }

  async checkPassword(password: string, id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw errorHandler('User not found', 'Not Found');

    const isPasswordCorrect = await checkPassword(password, user.password!);
    if (!isPasswordCorrect)
      throw errorHandler('Password is incorrect', 'Unauthorized Exception');

    return 'Password is correct';
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw errorHandler('User not found', 'Not Found');

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    const savedUser = await this.usersRepository.save(updatedUser);

    //*Generate new Jwt with updated user data
    const payload = {
      sub: savedUser.id,
      userTag: savedUser.userTag,
      isAdmin: savedUser.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      ...userWithoutPassword,
      token,
    };
  }

  async remove(id: number, password: string) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw errorHandler('User not found', 'Not Found');

    const validPassword = await checkPassword(password, user.password);

    if (!validPassword)
      throw errorHandler('Invalid password', 'Unauthorized Exception');

    await this.usersRepository.delete(id);

    return {
      message: `User with tag "${user.userTag}" has been successfully deleted`,
    };
  }

  async createByAdmin(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });

    if (userExists)
      throw errorHandler('User already exists', 'Conflict Exception');

    const token = generateToken();

    //*Create a temporal password
    const tempPass = createUserDto.password || generateToken().slice(0, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: await hashPassword(tempPass),
      isAdmin: createUserDto.isAdmin ?? false,
      token,
    });

    const savedUser = await this.usersRepository.save(user);

    if (process.env.SKIP_MAIL !== 'true') {
      try {
        await this.mailService.sendToken(
          savedUser.email,
          savedUser.userTag,
          token,
        );
      } catch (error) {
        console.error('MailService Error:', error);
      }
    }

    const { password, token: _, ...result } = savedUser;
    return result;
  }

  async updateByAdmin(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw errorHandler('User not found', 'Not Found');

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    const savedUser = await this.usersRepository.save(updatedUser);

    const { password, token, ...userWithoutSensitiveData } = savedUser;

    return userWithoutSensitiveData;
  }

  async removeByAdmin(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw errorHandler('User not found', 'Not Found');

    await this.usersRepository.delete(id);

    return {
      message: `User with tag "${user.userTag}" has been deleted by administrator`,
    };
  }
}
