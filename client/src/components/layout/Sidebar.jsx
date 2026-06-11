import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ListChecks, LogOut, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/receipts/in', label: 'Cash Receipt (IN)', icon: ArrowDownCircle },
  { to: '/receipts/out', label: 'Cash Receipt (OUT)', icon: ArrowUpCircle },
  { to: '/transactions', label: 'Transaction History', icon: ListChecks },
  { to: '/users', label: 'User Management', icon: Users, permission: 'users.view' },
];

export default function Sidebar() {
  const { user, logout, can } = useAuth();
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 no-print">
      <div className="p-4 border-b border-slate-200">
        <img src={logo} alt="DreamCode Technology" className="h-10 object-contain" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.filter((item) => !item.permission || can(item.permission)).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
