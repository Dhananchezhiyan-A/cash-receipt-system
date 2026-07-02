import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ListChecks, LogOut, User, X, Wallet, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/receipts/in', label: 'Total Cash Receipt (IN)', icon: ArrowDownCircle },
  { to: '/receipts/out', label: 'Total Cash Receipt (OUT)', icon: ArrowUpCircle },
  { to: '/net-balance', label: 'Net Balance', icon: Wallet },
  { to: '/transactions', label: 'Transaction History', icon: ListChecks },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
];

export default function Sidebar({ mobile = false, open = false, onClose = () => {} }) {
  const { user, logout } = useAuth();

  const sidebar = (
    <aside
      className={`w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-full no-print ${
        mobile ? '' : 'hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:z-30 lg:overflow-y-auto'
      }`}
    >
      <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <img src={logo} alt="DreamCode Technology" className="h-10 min-w-0 object-contain" />
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const { to, label, icon: Icon, end, roles } = item;
          if (roles && !roles.includes(user?.role)) return null;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 text-sm">
          <div className="w-9 h-9 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize truncate">{user?.role}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full mt-2 min-h-11 flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  if (!mobile) return sidebar;

  return (
    <div className={`fixed inset-0 z-50 lg:hidden no-print ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-slate-900/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`absolute inset-y-0 left-0 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>
    </div>
  );
}