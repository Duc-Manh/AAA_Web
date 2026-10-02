// Helper theo dõi hoạt động người dùng và ping trạng thái online
export const getLoggedInUserId = (): number | null => {
  try {
    const raw = localStorage.getItem('aaa_admin_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return Number(parsed.id);
    }
  } catch {
    // ignore
  }
  return null;
};

export const trackActivity = async (actionType: 'LOGIN' | 'PING' | 'VISIT_PAGE', moduleName: string = 'overview') => {
  const loginId = getLoggedInUserId();
  if (!loginId) return;

  try {
    await fetch('/api/track-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId,
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
  if (clean === 'dash-project') return 'projects';
  if (clean === 'dash-new') return 'news';
  if (clean === 'dash-equip') return 'supplies';
  if (clean === 'dash-custo') return 'customers';
  if (clean === 'dash-finan') return 'finance';
  if (clean === 'dash-job') return 'tasks';
  return null;
};
