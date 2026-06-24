import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Patient } from '../patients/patient.entity';

@Entity()
export class Treatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  doctor: string;

  @Column()
  diagnosis: string;

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'next_visit', type: 'date', nullable: true })
  next_visit: string;

  @Column({ nullable: true })
  procedure: string;

  @Column({ name: 'treatment_type', nullable: true })
  treatment_type: string;

  @Column({ name: 'treatments_list', type: 'simple-array', nullable: true })
  treatments_list: string[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}