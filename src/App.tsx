import React, { useState, useEffect } from 'react';
import { Home } from './pages/home/Home';
import { Intro } from './pages/intro/Intro';

export const App: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentHash(window.location.hash || window.location.pathname);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const isIntroPage = currentHash === '#intro' || currentHash === '/intro';

  return (
    <div className="app-root">
      {isIntroPage ? <Intro /> : <Home />}
    </div>
  );
};

export default App;
