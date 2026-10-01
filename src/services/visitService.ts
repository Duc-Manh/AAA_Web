export interface VisitStats {
  online: number;
  today: number;
  month: number;
  year: number;
  total: number;
}

const SESSION_KEY = 'aaa_visit_session_id';
const CACHE_KEY = 'aaa_cached_visit_stats';
const LOCAL_TRACK_KEY = 'aaa_local_visit_tracker';

// Lấy hoặc tạo sessionId duy nhất cho mỗi phiên duyệt web
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Lấy số liệu cache gần nhất để hiển thị tức thì
export function getCachedVisitStats(): VisitStats {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { online: 1, today: 1, month: 1, year: 1, total: 1 };
}

// Xử lý đếm dự phòng nếu server tạm thời chưa kết nối được
function getLocalFallbackStats(sessionId: string): VisitStats {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearStr = `${now.getFullYear()}`;

  let data = {
    lastDate: todayStr,
    lastMonth: monthStr,
    lastYear: yearStr,
    today: 1,
    month: 1,
    year: 1,
    total: 1,
    recordedSessions: [sessionId] as string[]
  };

  try {
    const raw = localStorage.getItem(LOCAL_TRACK_KEY);
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  if (data.lastYear !== yearStr) {
    data.lastYear = yearStr;
    data.year = 1;
    data.lastMonth = monthStr;
    data.month = 1;
    data.lastDate = todayStr;
    data.today = 1;
    data.recordedSessions = [sessionId];
  } else if (data.lastMonth !== monthStr) {
    data.lastMonth = monthStr;
    data.month = 1;
    data.lastDate = todayStr;
    data.today = 1;
    data.recordedSessions = [sessionId];
  } else if (data.lastDate !== todayStr) {
    data.lastDate = todayStr;
    data.today = 1;
    data.recordedSessions = [sessionId];
  }

  if (!data.recordedSessions.includes(sessionId)) {
    data.recordedSessions.push(sessionId);
    data.today += 1;
    data.month += 1;
    data.year += 1;
    data.total += 1;
  }

  try {
    localStorage.setItem(LOCAL_TRACK_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }

  return {
    online: 1,
    today: data.today,
    month: data.month,
    year: data.year,
    total: data.total
  };
}

// Gửi ghi nhận truy cập và lấy dữ liệu thực tế từ MySQL Database 3ahome
export async function trackVisit(): Promise<VisitStats> {
  const sessionId = getOrCreateSessionId();
  try {
    const res = await fetch('/api/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, path: window.location.pathname }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stats) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.stats));
        return data.stats;
      }
    }
  } catch (err) {
    console.warn('[VisitTracker] Chưa kết nối được MySQL /api/visit, chuyển sang chế độ dự phòng:', err);
  }

  const fallback = getLocalFallbackStats(sessionId);
  localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
  return fallback;
}
