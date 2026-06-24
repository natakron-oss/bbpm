import type { Patient, NewPatientInput, NewTreatmentInput, TreatmentRecord } from '../patientTypes';

const API_BASE = 'http://localhost:3000';

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients`);
  if (!res.ok) throw new Error('ดึงข้อมูลผู้ป่วยไม่สำเร็จ');
  return res.json();
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const res = await fetch(`${API_BASE}/patients/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createPatient(input: NewPatientInput): Promise<Patient> {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('เพิ่มผู้ป่วยไม่สำเร็จ');
  return res.json();
}

export async function updatePatient(id: string, input: Partial<NewPatientInput>): Promise<void> {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('แก้ไขข้อมูลไม่สำเร็จ');
}

export async function deletePatient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('ลบข้อมูลไม่สำเร็จ');
}

export async function addTreatment(input: NewTreatmentInput): Promise<TreatmentRecord> {
  const res = await fetch(`${API_BASE}/treatments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('บันทึกการรักษาไม่สำเร็จ');
  return res.json();
}

export async function deleteTreatment(treatmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/treatments/${treatmentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('ลบการรักษาไม่สำเร็จ');
}