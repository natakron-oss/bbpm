// import.js
// รัน: node import.js
// ต้องรัน NestJS backend ก่อน (npm run start:dev)

const API_URL = 'http://localhost:3000';

const patients = [
  {
    old_id: 'PT-001',
    first_name: 'สมชาย', last_name: 'ใจดี',
    birth_date: '1965-03-12', gender: 'ชาย',
    phone: '081-234-5678', emergency_contact: 'สมหญิง ใจดี', emergency_phone: '081-234-5679',
    address: '12 หมู่ 1 บ้านสันผักหวาน', subdistrict: 'สันผักหวาน', district: 'หางดง',
    allergies: 'ยาเพนิซิลิน',
    conditions: ['เบาหวาน', 'ความดันโลหิตสูง'],
    status: 'general', lat: 18.7065, lng: 98.9645,
  },
  {
    old_id: 'PT-002',
    first_name: 'มาลี', last_name: 'รักสุขภาพ',
    birth_date: '1978-11-25', gender: 'หญิง',
    phone: '089-876-5432', emergency_contact: 'วิชัย รักสุขภาพ', emergency_phone: '089-876-5433',
    address: '45 หมู่ 2 บ้านต้นงิ้ว', subdistrict: 'สันผักหวาน', district: 'หางดง',
    allergies: '-',
    conditions: ['โรคหัวใจ'],
    status: 'disabled', lat: 18.7082, lng: 98.9672,
  },
  {
    old_id: 'PT-003',
    first_name: 'ประเสริฐ', last_name: 'แข็งแรง',
    birth_date: '1950-07-04', gender: 'ชาย',
    phone: '062-111-2222', emergency_contact: 'สุนิสา แข็งแรง', emergency_phone: '062-111-2223',
    address: '78 หมู่ 3 บ้านท้าวผายู', subdistrict: 'สันผักหวาน', district: 'หางดง',
    allergies: 'แอสไพริน',
    conditions: ['เบาหวาน', 'ต้อกระจก'],
    status: 'finished', lat: 18.7035, lng: 98.9700,
  },
  {
    old_id: 'PT-004',
    first_name: 'สุนีย์', last_name: 'ยืนยาว',
    birth_date: '1988-02-14', gender: 'หญิง',
    phone: '094-555-6666', emergency_contact: 'ธนา ยืนยาว', emergency_phone: '094-555-6667',
    address: '200 หมู่ 4 บ้านป่าตาล', subdistrict: 'สันผักหวาน', district: 'หางดง',
    allergies: '-',
    conditions: ['ไทรอยด์'],
    status: 'elderly', lat: 18.7010, lng: 98.9625,
  },
  {
    old_id: 'PT-005',
    first_name: 'บุญมี', last_name: 'สุขใจ',
    birth_date: '1942-09-30', gender: 'ชาย',
    phone: '065-333-4444', emergency_contact: 'บุปผา สุขใจ', emergency_phone: '065-333-4445',
    address: '15 หมู่ 5 บ้านเบ้อ', subdistrict: 'สันผักหวาน', district: 'หางดง',
    allergies: 'Sulfa drugs',
    conditions: ['ความดันโลหิตสูง', 'โรคไต', 'เบาหวาน'],
    status: 'finished', lat: 18.7055, lng: 98.9590,
  },
];

const treatments = [
  {
    old_patient_id: 'PT-001',
    date: '2024-06-01', doctor: 'นพ.วิชัย สุขสม',
    diagnosis: 'ติดตามเบาหวาน', note: 'น้ำตาลลดลงดี HbA1c 7.2',
    next_visit: '2024-09-01', procedure: 'therapeutic_exercise',
    treatment_type: 'MS', treatments_list: ['therapeutic_exercise', 'bicycle_ergometer'],
  },
  {
    old_patient_id: 'PT-001',
    date: '2024-03-15', doctor: 'นพ.วิชัย สุขสม',
    diagnosis: 'ความดันโลหิตสูง', note: 'ปรับยา Amlodipine 10mg',
    next_visit: '2024-06-01', procedure: 'bicycle_ergometer',
    treatment_type: 'MS', treatments_list: ['bicycle_ergometer', 'therapeutic_exercise'],
  },
  {
    old_patient_id: 'PT-002',
    date: '2024-06-10', doctor: 'นพ.ประยุทธ หัวใจดี',
    diagnosis: 'ตรวจหัวใจประจำปี', note: 'EKG ปกติ ยังคงยาเดิม',
    next_visit: '2024-12-10', procedure: 'ambulation_training',
    treatment_type: 'neuro', treatments_list: ['ambulation_training', 'balance_training'],
  },
  {
    old_patient_id: 'PT-003',
    date: '2024-05-20', doctor: 'นพ.สมศักดิ์ มองดี',
    diagnosis: 'ตรวจตา', note: 'ผ่าตัดต้อกระจกข้างขวาเรียบร้อย',
    next_visit: '2024-08-20', procedure: 'balance_training',
    treatment_type: 'neuro', treatments_list: ['balance_training', 'ambulation_training'],
  },
  {
    old_patient_id: 'PT-004',
    date: '2024-06-15', doctor: 'นพ.กิตติ ต่อมดี',
    diagnosis: 'ติดตามไทรอยด์', note: 'TSH ปกติ ลดยาลง',
    next_visit: '2024-09-15', procedure: 'therapeutic_exercise',
    treatment_type: 'MS', treatments_list: ['therapeutic_exercise', 'tens'],
  },
  {
    old_patient_id: 'PT-005',
    date: '2024-06-20', doctor: 'นพ.วิทยา ไตดี',
    diagnosis: 'ติดตามโรคไต', note: 'Creatinine 2.1 ต้องติดตามใกล้ชิด',
    next_visit: '2024-07-20', procedure: 'bed_mobility_training',
    treatment_type: 'neuro', treatments_list: ['bed_mobility_training', 'electrical_stimulation'],
  },
];

async function run() {
  const idMap = {}; // PT-001 -> uuid ใหม่

  console.log('=== เริ่ม import ผู้ป่วย ===');
  for (const p of patients) {
    const { old_id, ...body } = p;
    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      idMap[old_id] = data.id;
      console.log(`✅ ${old_id} → ${data.id} (${p.first_name} ${p.last_name})`);
    } catch (err) {
      console.error(`❌ ${old_id} ล้มเหลว:`, err.message);
    }
  }

  console.log('\n=== เริ่ม import การรักษา ===');
  for (const t of treatments) {
    const { old_patient_id, ...body } = t;
    const patient_id = idMap[old_patient_id];
    if (!patient_id) {
      console.error(`❌ หา uuid ของ ${old_patient_id} ไม่เจอ ข้าม...`);
      continue;
    }
    try {
      const res = await fetch(`${API_URL}/treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, patient_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      console.log(`✅ treatment ของ ${old_patient_id} (${body.date}) → ${data.id}`);
    } catch (err) {
      console.error(`❌ treatment ของ ${old_patient_id} ล้มเหลว:`, err.message);
    }
  }

  console.log('\n=== เสร็จสิ้น ===');
}

run();