import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.usersService.findByUsername(body.username);

    if (!user) {
      throw new UnauthorizedException('ไม่พบผู้ใช้งาน');
    }

    if (body.password !== user.password) {
      throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    }

    return {
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  @Post('hash-test')
  async hashTest() {
    const hashed = await this.authService.hashPassword('test');
    return { hash: hashed };
  }
}