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

// Mở kết nối IndexedDB "3ahome"
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
        // Tạo bảng simu với cột id tự động tăng
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Định dạng thời gian hiện tại
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

// Đọc danh sách bản ghi từ IndexedDB (kèm fallback LocalStorage)
export async function getAllSimuRecords(): Promise<SimuRecord[]> {
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
        // Fallback đọc từ LocalStorage
        const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
        resolve(backup ? JSON.parse(backup) : []);
      };
    });
  } catch {
    const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
    return backup ? JSON.parse(backup) : [];
  }
}

// Lưu hoặc cập nhật người dùng vào database 3ahome bảng simu
export async function saveOrUpdateSimuUser(
  fullName: string,
  email: string,
  phone: string
): Promise<{ isReturning: boolean; record: SimuRecord }> {
  const cleanName = fullName.trim();
  const cleanEmail = email.trim();
  const cleanPhone = phone.trim();
  const currentTime = getCurrentFormattedTime();

  const allRecords = await getAllSimuRecords();

  // Quét database kiểm tra trùng khớp Họ tên, Email, Số điện thoại
  const existingRecord = allRecords.find((rec) => {
    const matchName = rec.full_name.trim().toLowerCase() === cleanName.toLowerCase();
    const matchEmail = rec.email.trim().toLowerCase() === cleanEmail.toLowerCase();
    const matchPhone = rec.phone.trim().replace(/\D/g, '') === cleanPhone.replace(/\D/g, '');
    return matchName && matchEmail && matchPhone;
  });

  if (existingRecord && existingRecord.id !== undefined) {
    // Đã tồn tại: count tiếp tục tăng lên 1, cập nhật thời gian
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
      console.warn('Lỗi ghi IndexedDB, lưu fallback LocalStorage:', e);
    }

    // Đồng bộ LocalStorage backup
    const updatedList = allRecords.map((r) => (r.id === existingRecord.id ? updatedRecord : r));
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(updatedList));
    localStorage.setItem('current_simu_user', JSON.stringify(updatedRecord));

    return { isReturning: true, record: updatedRecord };
  } else {
    // Người dùng mới: id tự động tăng, time lưu thời điểm bấm, count = 1
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
      // Fallback tính id kế tiếp
      const nextId = allRecords.length > 0 ? Math.max(...allRecords.map((r) => r.id || 0)) + 1 : 1;
      insertedRecord = { ...newRecord, id: nextId };
    }

    allRecords.push(insertedRecord);
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(allRecords));
    localStorage.setItem('current_simu_user', JSON.stringify(insertedRecord));

    return { isReturning: false, record: insertedRecord };
  }
}
