import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/common/SplashScreen';
import { Collect } from './components/common/Collect';
import { Home } from './pages/home/Home';
import { Intro } from './pages/intro/Intro';
import { Solution } from './pages/solution/Solution';
import { Product } from './pages/product/Product';
import { Project } from './pages/project/Project';
import { News } from './pages/news/News';
import { About } from './pages/about/About';
import { Hire } from './pages/hire/Hire';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
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

  const renderCurrentPage = () => {
    if (currentHash === '#intro' || currentHash === '/intro') return <Intro />;
    if (currentHash === '#solution' || currentHash === '/solution') return <Solution />;
    if (currentHash === '#product' || currentHash === '/product') return <Product />;
    if (currentHash === '#project' || currentHash === '/project') return <Project />;
    if (currentHash === '#news' || currentHash === '/news') return <News />;
    if (currentHash === '#about' || currentHash === '/about') return <About />;
    if (currentHash === '#hire' || currentHash === '/hire') return <Hire />;
    return <Home />;
  };

  return (
    <div className="app-root">
      {isLoading && (
        <SplashScreen duration={2000} onComplete={() => setIsLoading(false)} />
      )}
      {renderCurrentPage()}
      <Collect />
    </div>
  );
};

export default App;
