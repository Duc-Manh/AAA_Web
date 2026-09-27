// Database 3ahome - Bảng simu quản lý người dùng phòng mô phỏng
export interface SimuRecord {
  id?: number;
  time: string;
  full_name: string;
  email: string;
  phone: string;
  count: number;
}

const DB_NAME = '3ahome';
const DB_VERSION = 1;
const STORE_NAME = 'simu';
const STORAGE_BACKUP_KEY = '3ahome_simu_db';

// Định dạng thời gian
export function getCurrentFormattedTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(now.getDate());
  const m = pad(now.getMonth() + 1);
  const y = now.getFullYear();
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `${h}:${min}:${s} ${d}/${m}/${y}`;
}

export function formatDbTime(timeVal: any): string {
  if (!timeVal) return getCurrentFormattedTime();
  if (typeof timeVal === 'string' && timeVal.includes('/')) return timeVal;
  const d = new Date(timeVal);
  if (isNaN(d.getTime())) return String(timeVal);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Mở kết nối IndexedDB "3ahome" (Dự phòng khi offline)
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trong trình duyệt này.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Đọc danh sách bản ghi: Ưu tiên API MySQL Server -> dự phòng IndexedDB/LocalStorage
export async function getAllSimuRecords(): Promise<SimuRecord[]> {
  try {
    const res = await fetch('/api/simu');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const records: SimuRecord[] = json.data.map((r: any) => ({
          ...r,
          time: formatDbTime(r.time),
        }));
        localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(records));
        return records;
      }
    }
  } catch (err) {
    console.warn('[simuDb] Không thể kết nối API MySQL, chuyển sang đọc IndexedDB:', err);
  }

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as SimuRecord[];
        if (records.length > 0) {
          localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(records));
        }
        resolve(records);
      };

      req.onerror = () => {
        const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
        resolve(backup ? JSON.parse(backup) : []);
      };
    });
  } catch {
    const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
    return backup ? JSON.parse(backup) : [];
  }
}

// Lưu hoặc cập nhật người dùng vào MySQL Server database 3ahome bảng simu
export async function saveOrUpdateSimuUser(
  fullName: string,
  email: string,
  phone: string
): Promise<{ isReturning: boolean; record: SimuRecord }> {
  const cleanName = fullName.trim();
  const cleanEmail = email.trim();
  const cleanPhone = phone.trim();
  const currentTime = getCurrentFormattedTime();

  // 1. Thử gửi trực tiếp đến Backend MySQL Server qua /api/simu
  try {
    const res = await fetch('/api/simu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        const record: SimuRecord = {
          ...data.record,
          time: formatDbTime(data.record.time),
        };

        // Lưu session người dùng hiện tại
        localStorage.setItem('current_simu_user', JSON.stringify(record));
        return {
          isReturning: !!data.isReturning,
          record,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[simuDb] Gặp lỗi khi gọi MySQL API /api/simu, sử dụng cơ chế lưu dự phòng:', apiErr);
  }

  // 2. Dự phòng khi MySQL Server chưa bật hoặc không có kết nối backend:
  const allRecords = await getAllSimuRecords();

  const existingRecord = allRecords.find((rec) => {
    const matchName = rec.full_name.trim().toLowerCase() === cleanName.toLowerCase();
    const matchEmail = rec.email.trim().toLowerCase() === cleanEmail.toLowerCase();
    const matchPhone = rec.phone.trim().replace(/\D/g, '') === cleanPhone.replace(/\D/g, '');
    return matchName && matchEmail && matchPhone;
  });

  if (existingRecord && existingRecord.id !== undefined) {
    const updatedRecord: SimuRecord = {
      ...existingRecord,
      time: currentTime,
      count: (existingRecord.count || 1) + 1,
    };

    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const putReq = store.put(updatedRecord);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
    } catch (e) {
      console.warn('Lỗi ghi IndexedDB:', e);
    }

    const updatedList = allRecords.map((r) => (r.id === existingRecord.id ? updatedRecord : r));
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(updatedList));
    localStorage.setItem('current_simu_user', JSON.stringify(updatedRecord));

    return { isReturning: true, record: updatedRecord };
  } else {
    const newRecord: Omit<SimuRecord, 'id'> = {
      time: currentTime,
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      count: 1,
    };

    let insertedRecord: SimuRecord;

    try {
      const db = await openDb();
      const newId = await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const addReq = store.add(newRecord);
        addReq.onsuccess = () => resolve(addReq.result as number);
        addReq.onerror = () => reject(addReq.error);
      });

      insertedRecord = { ...newRecord, id: newId };
    } catch {
      const nextId = allRecords.length > 0 ? Math.max(...allRecords.map((r) => r.id || 0)) + 1 : 1;
      insertedRecord = { ...newRecord, id: nextId };
    }

    allRecords.push(insertedRecord);
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(allRecords));
    localStorage.setItem('current_simu_user', JSON.stringify(insertedRecord));

    return { isReturning: false, record: insertedRecord };
  }
}
