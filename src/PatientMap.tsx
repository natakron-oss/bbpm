// src/PatientMap.tsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { Patient } from './patientTypes';
import {
  PATIENT_STATUS_CONFIG,
  calcAge,
  getConditionColor,
  avatarColor,
  initials,
} from './patientTypes';
import './Patient.css';

// Fix default icon paths
const iconProto = (L.Icon.Default as any).prototype;
delete iconProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAP_CENTER: [number, number] = [18.7060, 98.9510];
const MAP_ZOOM = 14;

// ตำแหน่งเทศบาลตำบลสันผักหวาน อ.หางดง จ.เชียงใหม่
const TOWN_HALL_POSITION: [number, number] = [18.7049294, 98.9661012];
const TOWN_HALL_NAME = 'เทศบาลตำบลสันผักหวาน';
const TOWN_HALL_ADDRESS = '258 หมู่ 2 ถ.รอบเมืองเชียงใหม่ 121 ต.สันผักหวาน อ.หางดง จ.เชียงใหม่ 50230';

// OSRM public demo server — คำนวณเส้นทางตามถนนจริง (driving)
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// คำนวณระยะทางแบบเส้นตรง (Haversine) หน่วยกิโลเมตร — ใช้เป็น fallback เท่านั้น
function haversineDistanceKm(a: [number, number], b: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// เรียก OSRM เพื่อดึงเส้นทางตามถนนจริง คืนค่า [lat,lng][] + ระยะทาง(กม.) + เวลา(นาที)
async function fetchRoadRoute(
  from: [number, number],
  to: [number, number]
): Promise<{ coords: [number, number][]; distanceKm: number; durationMin: number } | null> {
  try {
    const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    return {
      coords,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch {
    return null;
  }
}

interface PatientMapProps {
  patients: Patient[];
  selectedId?: string | null;
  onSelectPatient: (patient: Patient) => void;
  onAddPatientAtLocation?: (lat: number, lng: number) => void; // เปิด modal พร้อมพิกัด
}

export default function PatientMap({
  patients,
  selectedId,
  onSelectPatient,
  onAddPatientAtLocation,
}: PatientMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const markersRef      = useRef<Map<string, L.Marker>>(new Map());
  const tempMarkerRef   = useRef<L.Marker | null>(null);
  const townHallMarkerRef   = useRef<L.Marker | null>(null);
  const routeLineRef       = useRef<L.Polyline | null>(null);
  const routeRequestIdRef  = useRef(0); // ป้องกัน race condition ตอนสลับผู้ป่วยเร็วๆ
  const addModeRef         = useRef(false); // ref เพื่อให้ click handler อ่านค่าปัจจุบันได้
  const onSelectPatientRef = useRef(onSelectPatient); // ป้องกัน stale closure
  const sidebarListRef     = useRef<HTMLDivElement>(null); // สำหรับเลื่อนรายชื่อผู้ป่วย

  const [addMode, setAddMode] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // sync ref ทุกครั้งที่ prop เปลี่ยน
  useEffect(() => { onSelectPatientRef.current = onSelectPatient; }, [onSelectPatient]);

  // ─── เลื่อนรายชื่อผู้ป่วยขึ้น/ลง ─────────────────────────────────────────
  const scrollList = (direction: 'up' | 'down') => {
    const el = sidebarListRef.current;
    if (!el) return;
    const amount = el.clientHeight * 0.7;
    el.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
  };

  // ─── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // ─── หมุดเทศบาลตำบลสันผักหวาน ───────────────────────────────────────
    const townHallIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          width: 42px; height: 42px; border-radius: 50%;
          background: #1d4ed8; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          border: 3px solid white;
          box-shadow: 0 0 0 3px #1d4ed888, 0 4px 12px rgba(0,0,0,0.4);
        ">🏛️</div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    const townHallMarker = L.marker(TOWN_HALL_POSITION, { icon: townHallIcon, zIndexOffset: 1000 })
      .bindPopup(
        `<div style="font-family:'Sarabun',sans-serif;padding:4px;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;">🏛️ ${TOWN_HALL_NAME}</div>
          <div style="font-size:12px;color:#475569;margin-top:6px;">📍 ${TOWN_HALL_ADDRESS}</div>
          <div style="font-size:12px;color:#64748b;margin-top:6px;">📞 053-131532</div>
        </div>`,
        { closeButton: false }
      )
      .addTo(map);
    townHallMarkerRef.current = townHallMarker;

    // คลิกบนแผนที่ — ถ้าอยู่ใน add mode วาง marker ชั่วคราวแล้วเปิด modal
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;

      const { lat, lng } = e.latlng;

      // ลบ temp marker เก่า
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }

      // วาง temp marker สีเขียว
      const tempIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 40px; height: 40px; border-radius: 50%;
            background: #10b981; color: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 0 0 3px #10b98188, 0 4px 12px rgba(0,0,0,0.4);
            animation: ptPulse 1s ease infinite;
          ">+</div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const tempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
      tempMarker.bindPopup(
        `<div style="font-family:'Sarabun',sans-serif;text-align:center;padding:4px 8px;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">📍 ตำแหน่งที่เลือก</div>
          <div style="font-size:12px;color:#64748b;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>`,
        { closeButton: false }
      ).openPopup();

      tempMarkerRef.current = tempMarker;

      // ปิด add mode แล้วเปิด form modal พร้อมพิกัด
      addModeRef.current = false;
      setAddMode(false);
      onAddPatientAtLocation?.(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      tempMarkerRef.current = null;
      townHallMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // sync addModeRef ให้ตรงกับ state เสมอ
  useEffect(() => {
    addModeRef.current = addMode;
    // เปลี่ยน cursor แผนที่
    const container = mapRef.current?.getContainer();
    if (container) {
      container.style.cursor = addMode ? 'crosshair' : '';
    }
    // ถ้าออก add mode ลบ temp marker
    if (!addMode && tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  }, [addMode]);

  // ─── Sync markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      if (!patients.find((p) => p.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    patients.forEach((pt) => {
      if (!Number.isFinite(pt.lat) || !Number.isFinite(pt.lng)) return;

      const color      = avatarColor(pt.first_name);
      const isSelected = pt.id === selectedId;
      const size       = isSelected ? 44 : 36;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:${size}px; height:${size}px; border-radius:50%;
            background:${color}; color:white;
            display:flex; align-items:center; justify-content:center;
            font-weight:700; font-size:${isSelected ? 15 : 13}px;
            border:${isSelected ? '3px' : '2px'} solid white;
            box-shadow:${isSelected
              ? `0 0 0 3px ${color}88, 0 4px 12px rgba(0,0,0,0.4)`
              : '0 2px 8px rgba(0,0,0,0.3)'};
            font-family:'Sarabun',sans-serif; transition:all 0.2s;
          ">${initials(pt.first_name, pt.last_name)}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const conditionHtml = pt.conditions.slice(0, 3).map((c) =>
        `<span style="display:inline-block;background:${getConditionColor(c)}22;color:${getConditionColor(c)};
          padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;margin:2px 2px 0;">${c}</span>`
      ).join('');

      const popup = L.popup({ maxWidth: 240, closeButton: false }).setContent(`
        <div style="font-family:'Sarabun',sans-serif;padding:4px;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;">${pt.first_name} ${pt.last_name}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;"> อายุ ${calcAge(pt.birth_date)} ปี</div>
          <div style="margin-top:6px;">${conditionHtml}</div>
          <div style="font-size:12px;color:#475569;margin-top:8px;">📍 ${pt.address}</div>
          <div style="margin-top:6px;">
            <span style="display:inline-flex;align-items:center;gap:4px;
              padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;
              background:${PATIENT_STATUS_CONFIG[pt.status].bg};
              color:${PATIENT_STATUS_CONFIG[pt.status].color};">
              ${PATIENT_STATUS_CONFIG[pt.status].label}
            </span>
          </div>
        </div>
      `);

      const existing = markersRef.current.get(pt.id);
      if (existing) {
        existing.setIcon(icon);
        existing.bindPopup(popup);
        existing.off('click');
        existing.on('click', () => {
          if (addModeRef.current) return;
          onSelectPatientRef.current(pt);
          existing.openPopup();
        });
      } else {
        const marker = L.marker([pt.lat, pt.lng], { icon })
          .bindPopup(popup)
          .addTo(map);
        marker.on('click', () => {
          if (addModeRef.current) return; // ไม่ select ถ้าอยู่ใน add mode
          onSelectPatientRef.current(pt);
          marker.openPopup();
        });
        markersRef.current.set(pt.id, marker);
      }
    });
  }, [patients, selectedId]);

  // ─── Fly to selected + วาดเส้นทางถนนจริงไปเทศบาล ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // ลบเส้นทางเก่าก่อนทุกครั้ง
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    setRouteLoading(false);

    if (!selectedId) return;
    const pt = patients.find((p) => p.id === selectedId);
    if (!pt || !Number.isFinite(pt.lat) || !Number.isFinite(pt.lng)) return;

    const patientPos: [number, number] = [pt.lat, pt.lng];
    const requestId = ++routeRequestIdRef.current;

    // ซูมไปที่บ้านผู้ป่วยก่อนระหว่างรอเส้นทาง
    map.flyTo(patientPos, 16, { duration: 0.6 });
    markersRef.current.get(pt.id)?.openPopup();
    setRouteLoading(true);

    fetchRoadRoute(patientPos, TOWN_HALL_POSITION).then((result) => {
      // ถ้าเลือกผู้ป่วยคนอื่นไปแล้วระหว่างรอ ให้ทิ้งผลลัพธ์นี้
      if (requestId !== routeRequestIdRef.current) return;
      setRouteLoading(false);

      let pathCoords: [number, number][];
      let distanceKm: number;
      let labelPrefix: string;
      let durationLabel = '';

      if (result) {
        pathCoords = result.coords;
        distanceKm = result.distanceKm;
        labelPrefix = '🚗 เส้นทางถนน';
        durationLabel = ` · ⏱️ ~${Math.round(result.durationMin)} นาที`;
      } else {
        // fallback: เส้นตรงถ้า OSRM ใช้ไม่ได้
        pathCoords = [patientPos, TOWN_HALL_POSITION];
        distanceKm = haversineDistanceKm(patientPos, TOWN_HALL_POSITION);
        labelPrefix = '📏 เส้นตรง (ประมาณ)';
      }

      const line = L.polyline(pathCoords, {
        color: '#1d4ed8',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
        dashArray: result ? undefined : '8, 8',
      }).addTo(map);

      line.bindTooltip(
        `🏛️ ${labelPrefix} ~${distanceKm.toFixed(2)} กม.${durationLabel}`,
        { permanent: true, direction: 'center', className: 'pt-route-tooltip' }
      );

      routeLineRef.current = line;

      // ปรับมุมมองให้เห็นเส้นทางทั้งหมด
      map.fitBounds(line.getBounds(), { padding: [60, 60], maxZoom: 17, animate: true });
    });
  }, [selectedId, patients]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="pt-map-layout">

      {/* แผนที่ */}
      <div ref={mapContainerRef} className="pt-map-container" />

      {/* แถบบอกสถานะ add mode */}
      {addMode && (
        <div className="pt-map-addmode-banner" style={{ left: 'calc(50% - 140px)', transform: 'none' }}>
          <span>📍 คลิกบนแผนที่เพื่อเลือกตำแหน่งบ้านผู้ป่วย</span>
          <button
            className="pt-map-addmode-cancel"
            onClick={() => setAddMode(false)}
          >
            <X size={14} /> ยกเลิก
          </button>
        </div>
      )}

      {/* แถบบอกสถานะกำลังโหลดเส้นทาง */}
      {routeLoading && (
        <div
          style={{
            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
            background: 'white', borderRadius: '999px', padding: '6px 16px',
            fontSize: '13px', color: '#1d4ed8', fontWeight: 600,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 1000,
            fontFamily: "'Sarabun', sans-serif",
          }}
        >
          🚗 กำลังค้นหาเส้นทางถนน...
        </div>
      )}

      {/* Sidebar */}
      <div className="pt-map-sidebar pt-map-sidebar-right" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="pt-map-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="#2563eb" />
            ที่บ้านผู้ป่วย ({patients.length} ราย)
          </div>
          {/* ปุ่มเพิ่มผู้ป่วย */}
          <button
            className={`pt-map-add-btn ${addMode ? 'active' : ''}`}
            onClick={() => setAddMode((v) => !v)}
            title={addMode ? 'ยกเลิกการเพิ่ม' : 'เพิ่มผู้ป่วยใหม่'}
          >
            {addMode ? <X size={15} /> : <Plus size={15} />}
            {addMode ? 'ยกเลิก' : 'เพิ่ม'}
          </button>
        </div>

        {/* คำแนะนำตอน add mode */}
        {addMode && (
          <div className="pt-map-hint">
            👆 คลิกบนแผนที่เพื่อปักหมุดตำแหน่งบ้าน
          </div>
        )}

        {/* แถวเดียวกัน: รายชื่อ + ปุ่มเลื่อนขึ้นลง */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '4px' }}>
          <div ref={sidebarListRef} className="pt-map-list" style={{ flex: 1, overflowY: 'auto' }}>
            {patients.map((pt) => {
              const sc = PATIENT_STATUS_CONFIG[pt.status];
              return (
                <div
                  key={pt.id}
                  className={`pt-map-item ${selectedId === pt.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (addMode) return;
                    onSelectPatient(pt);
                  }}
                  style={{ cursor: addMode ? 'not-allowed' : 'pointer', opacity: addMode ? 0.5 : 1 }}
                >
                  <div
                    className="pt-avatar pt-avatar-sm"
                    style={{ background: avatarColor(pt.first_name) }}
                  >
                    {initials(pt.first_name, pt.last_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pt-patient-name" style={{ fontSize: '13px' }}>
                      {pt.first_name} {pt.last_name}
                    </div>
                    <div className="pt-patient-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pt.address}
                    </div>
                  </div>
                  <span className="pt-dot" style={{ background: sc.color, width: 8, height: 8, flexShrink: 0 }} />
                </div>
              );
            })}
            {patients.length === 0 && (
              <div className="pt-empty">ไม่มีข้อมูลผู้ป่วย</div>
            )}
          </div>

          {/* ปุ่มเลื่อนขึ้น/ลง */}
          {patients.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              gap: '6px', paddingRight: '2px',
            }}>
              <button
                onClick={() => scrollList('up')}
                title="เลื่อนขึ้น"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => scrollList('down')}
                title="เลื่อนลง"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}