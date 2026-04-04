import { Controller, Get, Param, Post, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/notifications')
  getNotifications(@Param('id') id: string) {
    return this.usersService.getNotifications(id);
  }

  @Post()
  create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }

  @Post('signup')
  signup(@Body() userData: Partial<User>) {
    return this.usersService.signup(userData);
  }

  @Post('login')
  login(
    @Body()
    credentials: {
      email?: string;
      password?: string;
      role?: 'student' | 'teacher' | 'educator' | 'admin';
    },
  ) {
    return this.usersService.login(credentials);
  }

  @Post('verify-2fa')
  verifyLoginTwoFactor(
    @Body()
    payload: {
      userId: string;
      token: string;
    },
  ) {
    return this.usersService.verifyLoginTwoFactor(payload.userId, payload.token);
  }

  @Post(':id/generate-2fa')
  generateTwoFactorSecret(@Param('id') id: string) {
    return this.usersService.generateTwoFactorSecret(id);
  }

  @Post(':id/enable-2fa')
  enableTwoFactor(
    @Param('id') id: string,
    @Body() payload: { token: string },
  ) {
    return this.usersService.enableTwoFactor(id, payload.token);
  }

  @Post(':id/disable-2fa')
  disableTwoFactor(
    @Param('id') id: string,
    @Body() payload: { token: string },
  ) {
    return this.usersService.disableTwoFactor(id, payload.token);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() userData: Partial<User>) {
    return this.usersService.update(id, userData);
  }
}
