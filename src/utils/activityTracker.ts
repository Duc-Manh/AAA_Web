// Helper theo dõi hoạt động người dùng và ping trạng thái online

export interface LoggedInUser {
  id?: number;
  gmail?: string;
  full_name?: string;
  authen?: number;
  room?: string;
  position?: string;
}

export const getLoggedInUser = (): LoggedInUser | null => {
  try {
    const raw = localStorage.getItem('aaa_admin_auth') || sessionStorage.getItem('aaa_admin_auth');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
};

export const getLoggedInUserId = (): number | null => {
  const user = getLoggedInUser();
  if (user && user.id) return Number(user.id);
  return null;
};

export const trackActivity = async (
  actionType: 'LOGIN' | 'PING' | 'VISIT_PAGE',
  moduleName: string = 'overview'
) => {
  const user = getLoggedInUser();
  if (!user || (!user.id && !user.gmail)) return;

  try {
    await fetch('/api/track-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: user.id || null,
        gmail: user.gmail || null,
        actionType,
        module: moduleName
      })
    });
  } catch {
    // ignore
  }
};

export const getModuleFromHash = (hash: string): string | null => {
  const clean = (hash || '').replace(/^\/?#?\/?/, '').toLowerCase();
  if (clean === 'dash' || clean === 'employ') return 'overview';
  if (clean === 'dash-project' || clean === 'employ-proj') return 'projects';
  if (clean === 'dash-new' || clean === 'employ-news') return 'news';
  if (clean === 'dash-equip' || clean === 'employ-equip') return 'supplies';
  if (clean === 'dash-custo' || clean === 'employ-custo') return 'customers';
  if (clean === 'dash-finan' || clean === 'employ-finan') return 'finance';
  if (clean === 'dash-job' || clean === 'employ-job') return 'tasks';
  return null;
};
