import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">Sageo</h2>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-6">
              <Link 
                to="/discovery" 
                className={`text-sm font-medium transition-colors ${isActive('/discovery') ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
              >
                Discover Agents
              </Link>
              <Link 
                to="/developers" 
                className={`text-sm font-medium transition-colors ${isActive('/developers') ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
              >
                Developers
              </Link>
              <Link 
                to="/docs" 
                className={`text-sm font-medium transition-colors ${isActive('/docs') ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
              >
                Docs
              </Link>
            </nav>
            <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_-3px_rgba(23,161,207,0.4)]">
              <span className="truncate">Connect Wallet</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-background-dark">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link to="/discovery" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-surface-dark rounded-md">Discover</Link>
            <Link to="/developers" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-surface-dark rounded-md">Developers</Link>
            <Link to="/docs" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-surface-dark rounded-md">Docs</Link>
            <div className="mt-4">
               <button className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;