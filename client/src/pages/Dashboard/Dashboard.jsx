import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownCircle, ArrowUpCircle, FileInput, FileOutput, RefreshCw, Wallet, History } from 'lucide-react';
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
  return (
    <Link
      to={to}
      className="min-h-[100px] bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
    >
      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${tones[tone]} group-hover:scale-110 transition-transform`}>
        <Icon size={22} className="stroke-[1.5]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-tight">{title}</div>
        <div className="text-xl font-bold text-slate-900 mt-1.5 truncate">{value}</div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      console.log('Fetching dashboard stats from:', `${api.defaults.baseURL}/dashboard/stats`);
      const { data } = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', data);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Dashboard stats error:', err.message, err.response?.data);
      if (!silent) {
        setError(err.response?.data?.message || 'Unable to load dashboard');
        toast.error(err.response?.data?.message || 'Unable to load dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStats().then(() => { if (cancelled) return; });
    const interval = setInterval(() => { if (!cancelled) fetchStats(true); }, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchStats]);

  const [netBalance, setNetBalance] = useState(0);
  const [netCount, setNetCount] = useState(0);

  const handleRefresh = async () => {
    setRefreshing(true);
    fetchStats(true);
    try {
      console.log('Fetching net balance from:', `${api.defaults.baseURL}/net-balance/total`);
      const [totalRes, countRes] = await Promise.all([
        api.get('/net-balance/total'),
        api.get('/net-balance/count')
      ]);
      console.log('Net balance total:', totalRes.data);
      console.log('Net balance count:', countRes.data);
      setNetBalance(totalRes.data.total);
      setNetCount(countRes.data.count);
    } catch (err) {
      console.error('Net balance error:', err.message, err.response?.data);
    }
  };

  useEffect(() => {
    console.log('Dashboard API baseURL:', api.defaults.baseURL);
    handleRefresh();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-red-200 p-8 text-center">
        <p className="text-red-600 font-semibold text-lg mb-2">Dashboard data is unavailable</p>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-blue-600 hover:text-blue-700 font-medium underline">Retry</button>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Cash flow and system activity overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-10 px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total Cash Receipts" value={stats.totalReceipts} icon={FileInput} tone="green" to="/receipts?type=in" />
        <Card title="Total Amount Received" value={money(stats.totalIn)} icon={ArrowDownCircle} tone="green" to="/receipts?type=in" />
        <Card title="This Month Received" value={money(stats.monthIn)} icon={ArrowDownCircle} tone="green" to={`/receipts?type=in&from=${monthStart}`} />
        <Card title="Today In / Out" value={`${money(stats.todayIn)} / ${money(stats.todayOut)}`} icon={Wallet} tone="slate" to={`/transactions?from=${today}&to=${today}`} />
        <Card title="Total Payment Vouchers" value={stats.totalVouchers} icon={FileOutput} tone="red" to="/receipts?type=out" />
        <Card title="Total Amount Paid" value={money(stats.totalOut)} icon={ArrowUpCircle} tone="red" to="/receipts?type=out" />
        <Card title="This Month Paid" value={money(stats.monthOut)} icon={ArrowUpCircle} tone="red" to={`/receipts?type=out&from=${monthStart}`} />
        <Card title="Net Balance" value={money(netBalance || stats.netBalance)} icon={Wallet} tone="blue" to="/net-balance" />
        <Card title="Total Times Added" value={netCount} icon={History} tone="purple" to="/net-balance" />
      </div>

      {/* Monthly Chart */}
      <MonthlyChart data={stats.monthlyData || []} />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RecentReceipts items={stats.recentReceipts || []} />
        <RecentVouchers items={stats.recentVouchers || []} />
      </div>
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(...data.flatMap((item) => [item.received, item.paid]), 1);
  const barMax = max * 1.15;
  const CHART_H = 200;

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-800">Monthly Receipts and Payments</h2>
        <p className="text-sm text-slate-400 mt-2">No monthly data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-slate-800">Monthly Receipts and Payments</h2>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs font-medium">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Received
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Paid
          </span>
        </div>
      </div>
      <div>
        <div className="flex mb-2">
          <div className="w-12 sm:w-14 text-[10px] text-slate-400 font-medium">{money(barMax)}</div>
          <div className="flex-1" />
        </div>
        <div className="border-t border-slate-100">
          <div className="flex gap-1 sm:gap-2" style={{ height: `${CHART_H}px` }}>
            {data.map((item) => {
              const receivedH = item.received ? Math.round((item.received / barMax) * CHART_H) : 0;
              const paidH = item.paid ? Math.round((item.paid / barMax) * CHART_H) : 0;
              const colW = 100 / data.length;
              return (
                <div key={`${item.year}-${item.label}`} className="flex-1 flex items-end" style={{ width: `${colW}%`, height: `${CHART_H}px` }}>
                  {item.received > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-[9px] sm:text-[10px] font-bold text-green-700 text-center whitespace-nowrap mb-0.5 leading-tight">{money(item.received)}</div>
                      <div className="w-full" style={{ height: `${receivedH}px`, backgroundColor: '#16A34A', minHeight: '4px' }} />
                    </div>
                  )}
                  {item.paid > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-[9px] sm:text-[10px] font-bold text-red-600 text-center whitespace-nowrap mb-0.5 leading-tight">{money(item.paid)}</div>
                      <div className="w-full" style={{ height: `${paidH}px`, backgroundColor: '#EF4444', minHeight: '4px' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex mt-2 border-t border-slate-100 pt-2">
          <div className="w-12 sm:w-14 text-[10px] text-slate-400 font-medium">₹0</div>
          <div className="flex-1 flex justify-between">
            {data.map((item) => (
              <div key={item.label} className="text-[10px] sm:text-xs text-center text-slate-500 font-medium truncate" style={{ width: `${100 / data.length}%` }}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentReceipts({ items }) {
  return (
    <Panel title="Recent Receipts" to="/receipts?type=in">
      {items.length === 0 ? <Empty message="No receipts yet" /> : items.map((item) => (
        <Link
          to={`/receipts?type=in&q=${encodeURIComponent(item.receiptNumber || '')}`}
          key={item._id}
          className="px-4 sm:px-5 py-3.5 flex items-start sm:items-center justify-between gap-3 text-sm hover:bg-slate-50 transition"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 truncate">{item.receiptNumber || 'N/A'} | {item.receivedFrom}</div>
            <div className="text-slate-500 truncate mt-0.5">{new Date(item.date).toLocaleDateString()} | {item.createdBy?.name || 'Unknown'}</div>
          </div>
          <div className="font-bold whitespace-nowrap text-right text-green-600">+{money(item.amount)}</div>
        </Link>
      ))}
    </Panel>
  );
}

function RecentVouchers({ items }) {
  return (
    <Panel title="Recent Vouchers" to="/receipts?type=out">
      {items.length === 0 ? <Empty message="No vouchers yet" /> : items.map((item) => (
        <Link
          to={`/receipts?type=out&q=${encodeURIComponent(item.voucherNumber || '')}`}
          key={item._id}
          className="px-4 sm:px-5 py-3.5 flex items-start sm:items-center justify-between gap-3 text-sm hover:bg-slate-50 transition"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 truncate">{item.voucherNumber || 'N/A'} | {item.paidTo}</div>
            <div className="text-slate-500 truncate mt-0.5">{new Date(item.date).toLocaleDateString()} | {item.createdBy?.name || 'Unknown'}</div>
          </div>
          <div className="font-bold whitespace-nowrap text-right text-red-600">-{money(item.amount)}</div>
        </Link>
      ))}
    </Panel>
  );
}

const Panel = ({ title, to, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
    <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 font-semibold text-slate-700">
      {to ? <Link to={to} className="hover:text-blue-700 transition">{title} - View All</Link> : title}
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

const Empty = ({ message }) => <div className="p-5 text-sm text-slate-400">{message}</div>;