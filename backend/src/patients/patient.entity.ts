import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  first_name: string;

  @Column({ name: 'last_name' })
  last_name: string;

  @Column({ name: 'birth_date', type: 'date' })
  birth_date: string;

  @Column({ type: 'varchar', default: 'ไม่ระบุ' })
  gender: 'ชาย' | 'หญิง' | 'ไม่ระบุ';

  @Column()
  phone: string;

  @Column({ name: 'emergency_contact', nullable: true })
  emergency_contact: string;

  @Column({ name: 'emergency_phone', nullable: true })
  emergency_phone: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  subdistrict: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  allergies: string;

  @Column({ type: 'simple-array', default: '' })
  conditions: string[];

  @Column({ type: 'varchar', default: 'general' })
  status: 'general' | 'disabled' | 'elderly' | 'finished';

  @Column({ type: 'float', default: 0 })
  lat: number;

  @Column({ type: 'float', default: 0 })
  lng: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}