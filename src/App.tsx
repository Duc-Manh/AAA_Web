import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/common/SplashScreen';
import { Collect } from './components/common/Collect';
import { Entertain } from './components/common/Entertain';
import { Top } from './components/common/Top';
import { Home } from './pages/home/Home';
import { Intro } from './pages/intro/Intro';
import { Solution } from './pages/solution/Solution';
import { Product } from './pages/product/Product';
import { Project } from './pages/project/Project';
import { News } from './pages/news/News';
import { About } from './pages/about/About';
import { Login } from './pages/login/Login';
import { Simu } from './pages/simu/Simu';
import { Dash } from './pages/dash/Dash';
import { Employ } from './pages/employ/Employ';
import { DashNews } from './pages/dash-new/DashNews';
import { DashEquip } from './pages/dash-equip/DashEquip';
import { DashCusto } from './pages/dash-custo/DashCusto';
import { DashFinan } from './pages/dash-finan/DashFinan';
import { DashJob } from './pages/dash-job/DashJob';
import { DashProject } from './pages/dash-project/DashProject';

import { trackActivity, getModuleFromHash } from './utils/activityTracker';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      const newHash = window.location.hash || window.location.pathname;
      setCurrentHash(newHash);
      const module = getModuleFromHash(newHash);
      if (module) {
        trackActivity('VISIT_PAGE', module);
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Track trang hiện tại khi vừa mở ứng dụng
    const initialModule = getModuleFromHash(currentHash);
    if (initialModule) {
      trackActivity('VISIT_PAGE', initialModule);
    } else {
      trackActivity('PING', 'overview');
    }

    // Gửi tín hiệu Heartbeat ping mỗi 30 giây để duy trì trạng thái online thời gian thực
    const pingInterval = setInterval(() => {
      trackActivity('PING', 'overview');
    }, 30000);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(pingInterval);
    };
  }, []);

  const renderCurrentPage = () => {
    if (currentHash === '#home' || currentHash === '/home' || currentHash === '#' || currentHash === '') return <Home />;
    if (currentHash === '#intro' || currentHash === '/intro') return <Intro />;
    if (currentHash === '#solution' || currentHash === '/solution') return <Solution />;
    if (currentHash === '#product' || currentHash === '/product') return <Product />;
    if (currentHash === '#project' || currentHash === '/project') return <Project />;
    if (currentHash === '#news' || currentHash === '/news') return <News />;
    if (currentHash === '#about' || currentHash === '/about') return <About />;
    if (currentHash === '#login' || currentHash === '/login' || currentHash === '#hire' || currentHash === '/hire') return <Login />;
    if (currentHash === '#simu' || currentHash === '/simu') return <Simu />;
    if (currentHash === '#dash' || currentHash === '/dash') return <Dash />;
    if (currentHash === '#dash-project' || currentHash === '/dash-project') return <DashProject />;
    if (currentHash === '#dash-new' || currentHash === '/dash-new') return <DashNews />;
    if (currentHash === '#dash-equip' || currentHash === '/dash-equip') return <DashEquip />;
    if (currentHash === '#dash-custo' || currentHash === '/dash-custo') return <DashCusto />;
    if (currentHash === '#dash-finan' || currentHash === '/dash-finan') return <DashFinan />;
    if (currentHash === '#dash-job' || currentHash === '/dash-job') return <DashJob />;
    if (currentHash === '#employ' || currentHash === '/employ') return <Employ />;
    return <Home />;
  };

  const isDashOrEmployPage =
    currentHash.startsWith('#dash') ||
    currentHash.startsWith('/dash') ||
    currentHash.startsWith('#employ') ||
    currentHash.startsWith('/employ');

  return (
    <div className="app-root">
      {isLoading && (
        <SplashScreen duration={2000} onComplete={() => setIsLoading(false)} />
      )}
      {renderCurrentPage()}
      {!isDashOrEmployPage && <Collect />}
      {!isDashOrEmployPage && <Entertain />}
      {!isDashOrEmployPage && <Top />}
    </div>
  );
};

export default App;
