// src/LoginPage.tsx
import { useState, useRef } from 'react';
import { Lock, User } from 'lucide-react';
import logoImg from './assets/logo.jpg';

const SPREADSHEET_ID = (import.meta.env.VITE_PATIENT_SPREADSHEET_ID as string) ?? '';
const API_KEY        = (import.meta.env.VITE_GOOGLE_API_KEY as string) ?? '';
const SHEETS_BASE    = 'https://sheets.googleapis.com/v4/spreadsheets';
const USERS_SHEET    = 'user';

const isMockMode = () => !SPREADSHEET_ID || !API_KEY;

const MOCK_USERS = [
  { id: 'U-001', username: 'admin', password: 'admin123' },
  { id: 'U-002', username: 'user',  password: 'user123'  },
];

async function fetchUsers() {
  const res = await fetch(`${SHEETS_BASE}/${SPREADSHEET_ID}/values/${USERS_SHEET}?key=${API_KEY}`);
  if (!res.ok) throw new Error('อ่าน Sheet user ไม่สำเร็จ');
  const rows: string[][] = ((await res.json()) as { values?: string[][] }).values ?? [];
  return rows.slice(1).filter((r) => r[0]?.trim()).map((r) => ({
    id: r[0], username: r[1] ?? '', password: r[2] ?? '',
  }));
}

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // --- mouse parallax state (background only) ---
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;  // -1 ... 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;  // -1 ... 1
    setMouse({ x, y });
  };

  const handleLogin = async () => {
  if (!username || !password) {
    setError('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    onLogin(data.user.username);
  } catch (error) {
    console.error(error);
    setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      className="login-page-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        fontFamily: "'Sarabun', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* keyframes for fast drifting blobs */}
      <style>{`
        @keyframes drift1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(60px, 90px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-80px, -50px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(50px, -80px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .login-card-anim {
          animation: cardIn 0.5s ease;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background blobs: faster drift + stronger mouse parallax */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-100px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #f9a8d4, transparent 70%)',
          filter: 'blur(10px)',
          opacity: 0.6,
          animation: 'drift1 6s ease-in-out infinite',
          transform: `translate(${mouse.x * 40}px, ${mouse.y * 40}px)`,
          transition: 'transform 0.25s ease-out',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          right: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 60%, #db2777, transparent 70%)',
          filter: 'blur(14px)',
          opacity: 0.35,
          animation: 'drift2 8s ease-in-out infinite',
          transform: `translate(${mouse.x * -50}px, ${mouse.y * -50}px)`,
          transition: 'transform 0.25s ease-out',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '8%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #fbcfe8, transparent 70%)',
          filter: 'blur(8px)',
          opacity: 0.5,
          animation: 'drift3 7s ease-in-out infinite',
          transform: `translate(${mouse.x * 30}px, ${mouse.y * 30}px)`,
          transition: 'transform 0.25s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Login card — fixed, does NOT move with mouse */}
      <div
        className="login-card-anim"
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          width: '380px',
          boxShadow: '0 8px 40px rgba(219,39,119,0.12)',
          border: '1px solid #fce7f3',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            overflow: 'hidden', margin: '0 auto 14px',
            boxShadow: '0 4px 16px rgba(219,39,119,0.2)',
            border: '3px solid #fbcfe8',
          }}>
            <img src={logoImg} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#1a0a12' }}>ระบบผู้ป่วย</div>
          <div style={{ fontSize: '13px', color: '#c084ab', marginTop: '4px' }}>เทศบาลตำบลสันผักหวาน</div>

          {/* divider */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #fbcfe8, transparent)', margin: '18px 0 0' }} />
        </div>

        {/* Username */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', color: '#6b2145', fontWeight: 600, display: 'block', marginBottom: '6px' }}>ชื่อผู้ใช้</label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f472b6' }} />
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="กรอกชื่อผู้ใช้"
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: '1.5px solid #fbcfe8', borderRadius: '10px',
                fontSize: '14px', boxSizing: 'border-box', outline: 'none',
                fontFamily: "'Sarabun', sans-serif", color: '#1a0a12',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#f472b6'}
              onBlur={(e) => e.target.style.borderColor = '#fbcfe8'}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#6b2145', fontWeight: 600, display: 'block', marginBottom: '6px' }}>รหัสผ่าน</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f472b6' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="กรอกรหัสผ่าน"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: '1.5px solid #fbcfe8', borderRadius: '10px',
                fontSize: '14px', boxSizing: 'border-box', outline: 'none',
                fontFamily: "'Sarabun', sans-serif", color: '#1a0a12',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#f472b6'}
              onBlur={(e) => e.target.style.borderColor = '#fbcfe8'}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', color: '#ef4444',
            borderRadius: '8px', padding: '10px 14px',
            fontSize: '13px', marginBottom: '14px',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        {/* Button */}
        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #db2777, #be185d)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: "'Sarabun', sans-serif",
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(219,39,119,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}