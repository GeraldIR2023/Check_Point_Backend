import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidateTokenDto } from './dto/confirm-user.dto';
import { UpdatePasswordDto } from './dto/update-current-password.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CheckPasswordDto } from './dto/check-password.dto';
import { AuthenticateUserDto } from './dto/authenticate-user-dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { IdValidationPipe } from 'src/common/pipes/id-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() authenticateUserDto: AuthenticateUserDto) {
    const logedUser = await this.usersService.loginUser(
      authenticateUserDto.email,
      authenticateUserDto.password,
    );

    return {
      message: `Welcome ${logedUser.user.userTag}`,
      token: logedUser.token,
    };
  }

  @Post('confirm-account')
  async confirmAccount(@Body() validateTokenDto: ValidateTokenDto) {
    return this.usersService.confirmAccount(validateTokenDto.token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('validate-token')
  async validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    return this.usersService.validateToken(validateTokenDto.token);
  }

  @Post('reset-password/:token')
  async resetPasswordWithToken(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPasswordWithToken(
      token,
      resetPasswordDto.password,
    );
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':userTag')
  @UseGuards(AuthGuard, AdminGuard)
  async findOne(@Param('userTag') userTag: string) {
    return this.usersService.findOne(userTag);
  }

  @Post('update-password')
  @UseGuards(AuthGuard)
  async updateCurrentUserPassword(
    @Req() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updateCurrentUserPassword(
      req.user.id,
      updatePasswordDto,
    );
  }

  @Post('check-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkPassword(
    @Req() req: any,
    @Body() checkPasswordDto: CheckPasswordDto,
  ) {
    return this.usersService.checkPassword(
      checkPasswordDto.password,
      req.user.id,
    );
  }

  @Patch('update')
  @UseGuards(AuthGuard)
  async update(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(req.user.id, updateUserDto);
  }

  @Delete('delete-account')
  @UseGuards(AuthGuard)
  async remove(@Req() req: any, @Body() checkPasswordDto: CheckPasswordDto) {
    const userId = req.user.id;
    return this.usersService.remove(userId, checkPasswordDto.password);
  }

  @Post('admin/create')
  @UseGuards(AuthGuard, AdminGuard)
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createByAdmin(createUserDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateByAdmin(
    @Param('id', IdValidationPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateByAdmin(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async removeByAdmin(@Param('id', IdValidationPipe) id: string) {
    return this.usersService.removeByAdmin(+id);
  }
}
