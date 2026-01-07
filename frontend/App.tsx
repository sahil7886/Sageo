import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Developers from './pages/Developers';
import Documentation from './pages/Documentation';
import RegisterAgent from './pages/RegisterAgent';
import AgentProfile from './pages/AgentProfile';
import Discovery from './pages/Discovery';
import UserProfile from './pages/UserProfile';

// Wrapper to conditionally render layout elements
const AppContent = () => {
  const location = useLocation();
  
  // Routes that might have their own specific layout handling or need to hide standard nav
  const isSpecialLayout = location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      {!isSpecialLayout && <Navbar />}
      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/register" element={<RegisterAgent />} />
          <Route path="/agent/:id" element={<AgentProfile />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/discovery" element={<Discovery />} />
        </Routes>
      </main>
      {!isSpecialLayout && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}