import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  findByUsername(username: string) {
    return this.usersRepository.findOneBy({ username });
  }

  create(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>) {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.usersRepository.delete(id);
    return { message: 'ลบข้อมูลสำเร็จ' };
  }
}