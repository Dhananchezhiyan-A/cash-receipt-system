import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Wallet, Plus, History, X } from 'lucide-react';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function NetBalance() {
  const [balance, setBalance] = useState(null);
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const loadData = async () => {
    try {
      const [totalRes, countRes] = await Promise.all([
        api.get('/net-balance/total'),
        api.get('/net-balance/count')
      ]);
      // Set the balance directly from API - do not override with 0
      if (totalRes.data && totalRes.data.total !== undefined) {
        setBalance(totalRes.data.total);
      }
      setCount(countRes.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await api.get(`/net-balance/logs?page=${logsPage}&limit=20`);
      setLogs(data.items);
      setTotalPages(data.pages);
      setTotalLogs(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('This will recalculate all previous and updated balances. Continue?')) {
      return;
    }
    try {
      const response = await api.post('/net-balance/recalculate');
      toast.success(response.data.message || 'Balances recalculated successfully');
      // Reload data after recalculation
      loadData();
      loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to recalculate balances');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [logsPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/net-balance/add', { amount: Number(amount), note });
      toast.success('Balance added successfully');
      setAmount('');
      setNote('');
      setShowModal(false);
      loadData();
      loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add balance');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTransactionType = (log) => {
    // Determine transaction type from the source (backend provides this)
    // Receipt = Credit (increases balance)
    // Voucher = Debit (decreases balance)
    // Manual = use direction field
    if (log.transactionType === 'receipt') {
      return 'credit';
    }
    if (log.transactionType === 'voucher') {
      return 'debit';
    }
    if (log.transactionType === 'manual') {
      return log.direction === 'debit' ? 'debit' : 'credit';
    }
    // Fallback based on amount sign
    return log.amount < 0 ? 'debit' : 'credit';
  };

  const getFilterCategory = (log) => {
    const note = (log.note || '').trim();

    if (note.startsWith('Receipt')) {
      return 'receipt';
    }
    if (note.startsWith('Voucher')) {
      return 'voucher';
    }
    if (log.transactionType === 'manual' || note.startsWith('Manual Balance')) {
      return 'manual';
    }
    return 'other';
  };

  const filteredLogs = useMemo(() => {
    if (filterType === 'all') return logs;
    return logs.filter((log) => getFilterCategory(log) === filterType);
  }, [logs, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Net Balance</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your net balance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecalculate}
            className="h-10 px-4 py-2 bg-slate-600 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 transition text-sm"
          >
            ⚙️ Recalculate
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add Balance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Wallet size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Balance</div>
              <div className="text-2xl font-bold text-green-600">
                {balance !== null ? money(balance) : '₹-'}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <History size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Times Added</div>
              <div className="text-2xl font-bold text-blue-600">{count}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Balance Logs</h2>
          <span className="text-xs text-slate-500">{totalLogs} entries</span>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Filter:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="receipt">Receipt</option>
            <option value="voucher">Voucher</option>
            <option value="manual">Manual Balance</option>
            <option value="other">Other</option>
          </select>
        </div>

        {logsLoading ? (
          <div className="text-center py-8 text-slate-400">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No logs available yet.</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No balance logs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Previous</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Updated</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Added By</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const type = getTransactionType(log);
                    const absAmount = Math.abs(log.amount);

                    return (
                      <tr key={log._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {type === 'credit' ? '↑ Credit' : '↓ Debit'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{money(absAmount)}</td>
                        <td className="py-3 px-4 text-slate-600">{money(log.previousBalance)}</td>
                        <td className="py-3 px-4 text-slate-600">{money(log.updatedBalance)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(log.date || log.createdAt)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatTime(log.date || log.createdAt)}</td>
                        <td className="py-3 px-4 text-slate-600">{log.addedBy?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-slate-500">{log.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setLogsPage((p) => Math.max(p - 1, 1))}
                  disabled={logsPage === 1}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {logsPage} of {totalPages}</span>
                <button
                  onClick={() => setLogsPage((p) => Math.min(p + 1, totalPages))}
                  disabled={logsPage === totalPages}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Net Balance</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a note"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}