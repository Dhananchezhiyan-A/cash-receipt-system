import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import logo from '../../assets/logo.png';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />

      <header className="lg:hidden sticky top-0 z-40 no-print bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 active:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <img src={logo} alt="DreamCode Technology" className="h-9 min-w-0 object-contain" />
          <div className="h-11 w-11" aria-hidden="true" />
        </div>
      </header>

      <Sidebar mobile open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="w-full min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
