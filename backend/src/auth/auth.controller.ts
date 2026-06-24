import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const mockUser = {
      id: '1',
      username: 'admin',
      password: '$2b$12$exampleHashedPasswordHere',
    };
    if (body.username !== mockUser.username) {
      throw new UnauthorizedException('ไม่พบผู้ใช้งาน');
    }
    return this.authService.login(body.username, body.password, mockUser);
  }

  @Post('hash-test')
  async hashTest() {
    const hashed = await this.authService.hashPassword('test');
    return { hash: hashed };
  }
}