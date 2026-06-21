// src/App.tsx
import { useState } from 'react';
import PatientPage from './PatientPage';
import LoginPage from './LoginPage';
import './Patient.css';

const AUTH_STORAGE_KEY = 'sanpakwan_auth';

interface AuthSession {
  currentUser: string;
  isLoggedIn: boolean;
}

// อ่าน session เดิมจาก localStorage (ถ้ามี) ตอนแอปเริ่มโหลด
function loadStoredSession(): AuthSession {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { currentUser: '', isLoggedIn: false };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.currentUser === 'string' && typeof parsed.isLoggedIn === 'boolean') {
      return parsed;
    }
  } catch {
    // ถ้า parse ไม่ได้ ก็ถือว่าไม่มี session
  }
  return { currentUser: '', isLoggedIn: false };
}

function saveStoredSession(session: AuthSession) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // เผื่อ localStorage ใช้งานไม่ได้ (เช่น private mode) ก็ไม่ให้แอปพัง
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  // ใช้ lazy initializer ดึงค่าจาก localStorage มาตั้งต้น state ตั้งแต่แรก
  const initialSession = loadStoredSession();

  const [isLoggedIn, setIsLoggedIn] = useState(initialSession.isLoggedIn);
  const [currentUser, setCurrentUser] = useState(initialSession.currentUser);
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <LoginPage
        onLogin={(username) => {
          setCurrentUser(username);
          setIsLoggedIn(true);
          setShowLogin(false);
          // เซฟ session ไว้ ถ้ารีเฟรชจะไม่หลุดจากการ login
          saveStoredSession({ currentUser: username, isLoggedIn: true });
        }}
      />
    );
  }

  return (
    <PatientPage
      currentUser={currentUser}
      isLoggedIn={isLoggedIn}
      onLogin={() => setShowLogin(true)}
      onLogout={() => {
        setCurrentUser('');
        setIsLoggedIn(false);
        // ล้าง session ออกจาก localStorage ตอน logout
        clearStoredSession();
      }}
    />
  );
}