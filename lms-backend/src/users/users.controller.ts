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

  @Patch(':id')
  update(@Param('id') id: string, @Body() userData: Partial<User>) {
    return this.usersService.update(id, userData);
  }
}
