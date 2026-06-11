import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownCircle, ArrowUpCircle, FileInput, FileOutput, ShieldCheck, UserCheck, UserRound, Users, UserX, Wallet } from 'lucide-react';
import api from '../../services/api';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const tones = {
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
};

function Card({ title, value, icon: Icon, tone = 'blue', to }) {
  return <Link to={to} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500"><div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon size={21} /></div><div className="min-w-0"><div className="text-xs uppercase text-slate-500 font-medium tracking-wide">{title}</div><div className="text-xl font-semibold text-slate-800 mt-1 truncate">{value}</div></div></Link>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((error) => toast.error(error.response?.data?.message || 'Unable to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-600">Dashboard data is unavailable.</div>;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1><p className="text-sm text-slate-500">Cash flow and system activity overview</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total Cash Receipts" value={stats.totalReceipts} icon={FileInput} tone="green" to="/receipts?type=in" />
        <Card title="Total Payment Vouchers" value={stats.totalVouchers} icon={FileOutput} tone="red" to="/receipts?type=out" />
        <Card title="Total Amount Received" value={money(stats.totalIn)} icon={ArrowDownCircle} tone="green" to="/receipts?type=in" />
        <Card title="Total Amount Paid" value={money(stats.totalOut)} icon={ArrowUpCircle} tone="red" to="/receipts?type=out" />
        <Card title="Net Balance" value={money(stats.netBalance)} icon={Wallet} tone="blue" to="/transactions" />
        <Card title="This Month Received" value={money(stats.monthIn)} icon={ArrowDownCircle} tone="green" to={`/receipts?type=in&from=${monthStart}`} />
        <Card title="This Month Paid" value={money(stats.monthOut)} icon={ArrowUpCircle} tone="red" to={`/receipts?type=out&from=${monthStart}`} />
        <Card title="Today In / Out" value={`${money(stats.todayIn)} / ${money(stats.todayOut)}`} icon={Wallet} tone="slate" to={`/transactions?from=${today}&to=${today}`} />
      </div>

      {stats.users && <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card title="Total Users" value={stats.users.totalUsers} icon={Users} to="/users" />
        <Card title="Active Users" value={stats.users.activeUsers} icon={UserCheck} tone="green" to="/users?status=active" />
        <Card title="Inactive Users" value={stats.users.inactiveUsers} icon={UserX} tone="red" to="/users?status=inactive" />
        <Card title="Admins" value={stats.users.admins} icon={ShieldCheck} tone="purple" to="/users?role=admin" />
        <Card title="Managers" value={stats.users.managers} icon={UserRound} tone="blue" to="/users?role=manager" />
        <Card title="Normal Users" value={stats.users.normalUsers} icon={Users} tone="slate" to="/users?role=user" />
      </div>}

      <MonthlyChart data={stats.monthlyData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RecentTransactions items={stats.recentTransactions} />
        {stats.recentUsers ? <RecentUsers items={stats.recentUsers} /> : <RecentList title="Recent Receipts" items={stats.recentReceipts} />}
      </div>
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(...data.flatMap((item) => [item.received, item.paid]), 1);
  return <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex flex-wrap items-center justify-between gap-2 mb-5"><h2 className="font-medium text-slate-800">Monthly Receipts and Payments</h2><div className="flex gap-4 text-xs"><span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-green-500" /> Received</span><span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-red-400" /> Paid</span></div></div><div className="h-64 flex items-end gap-2 border-b border-slate-200">{data.map((item) => <div key={`${item.year}-${item.label}`} className="flex-1 min-w-0 h-full flex flex-col justify-end"><div className="flex-1 flex items-end justify-center gap-1"><div title={`Received ${money(item.received)}`} className="w-2/5 max-w-7 bg-green-500 rounded-t" style={{ height: `${Math.max((item.received / max) * 100, item.received ? 2 : 0)}%` }} /><div title={`Paid ${money(item.paid)}`} className="w-2/5 max-w-7 bg-red-400 rounded-t" style={{ height: `${Math.max((item.paid / max) * 100, item.paid ? 2 : 0)}%` }} /></div><div className="py-2 text-[10px] sm:text-xs text-center text-slate-500 truncate">{item.label}</div></div>)}</div></div>;
}

function RecentTransactions({ items }) {
  return <Panel title="Recent Transactions" to="/transactions">{items.length === 0 ? <Empty /> : items.map((item) => { const receipt = item.transactionType === 'receipt'; return <Link to={`/transactions?type=${receipt ? 'in' : 'out'}&q=${encodeURIComponent(item.receiptNumber || item.voucherNumber)}`} key={`${item.transactionType}-${item._id}`} className="px-5 py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-50"><div className="min-w-0"><div className="font-medium text-slate-800 truncate">{item.receiptNumber || item.voucherNumber} · {item.receivedFrom || item.paidTo}</div><div className="text-slate-500">{new Date(item.date).toLocaleDateString()} · {item.createdBy?.name || 'Unknown user'}</div></div><div className={`font-semibold whitespace-nowrap ${receipt ? 'text-green-600' : 'text-red-600'}`}>{receipt ? '+' : '-'}{money(item.amount)}</div></Link>; })}</Panel>;
}

function RecentUsers({ items }) {
  return <Panel title="Recent Users" to="/users">{items.length === 0 ? <Empty /> : items.map((user) => <Link to={`/users?q=${encodeURIComponent(user.email)}`} key={user._id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-slate-50"><div><div className="font-medium text-slate-800">{user.name}</div><div className="text-slate-500">{user.email}</div></div><div className="text-right"><div className="capitalize font-medium text-slate-600">{user.role}</div><div className={user.active ? 'text-green-600' : 'text-red-600'}>{user.active ? 'Active' : 'Inactive'}</div></div></Link>)}</Panel>;
}

function RecentList({ title, items }) {
  return <Panel title={title}>{items.length === 0 ? <Empty /> : items.map((item) => <div key={item._id} className="px-5 py-3 flex justify-between text-sm"><span>{item.receiptNumber} · {item.receivedFrom}</span><strong>{money(item.amount)}</strong></div>)}</Panel>;
}

const Panel = ({ title, to, children }) => <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="px-5 py-3 border-b border-slate-200 font-medium text-slate-700">{to ? <Link to={to} className="hover:text-brand-700">{title} - View all</Link> : title}</div><div className="divide-y divide-slate-100">{children}</div></div>;
const Empty = () => <div className="p-5 text-sm text-slate-400">No records yet</div>;
