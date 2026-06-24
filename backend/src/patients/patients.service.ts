import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  findAll() {
    return this.patientsRepository.find();
  }

  findOne(id: string) {
    return this.patientsRepository.findOneBy({ id });
  }

  create(data: Partial<Patient>) {
    const patient = this.patientsRepository.create(data);
    return this.patientsRepository.save(patient);
  }

  async update(id: string, data: Partial<Patient>) {
    await this.patientsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.patientsRepository.delete(id);
    return { message: 'ลบข้อมูลสำเร็จ' };
  }
}