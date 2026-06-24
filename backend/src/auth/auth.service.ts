import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(private jwtService: JwtService) {}

  // Hash password ก่อนเก็บใน DB
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  // เช็ค password ที่ user ใส่มา vs hash ใน DB
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Login: ตรวจสอบ user แล้วออก JWT token
  async login(username: string, plainPassword: string, user: { id: string; username: string; password: string }) {
    const isValid = await this.verifyPassword(plainPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Migrate: แปลง plain text password จาก Google Sheet → bcrypt hash
  // ใช้ครั้งเดียวตอน migrate ข้อมูลเก่า
  async migratePassword(plainPassword: string): Promise<string> {
    console.log('Migrating password to bcrypt hash...');
    return this.hashPassword(plainPassword);
  }
}
