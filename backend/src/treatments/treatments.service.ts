import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from './treatment.entity';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentsRepository: Repository<Treatment>,
  ) {}

  findAll() {
    return this.treatmentsRepository.find();
  }

  findByPatient(patientId: string) {
    return this.treatmentsRepository.find({ where: { patient_id: patientId } });
  }

  create(data: Partial<Treatment>) {
    const treatment = this.treatmentsRepository.create(data);
    return this.treatmentsRepository.save(treatment);
  }

  async remove(id: string) {
    await this.treatmentsRepository.delete(id);
    return { message: 'ลบการรักษาสำเร็จ' };
  }
}