import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Download, Eye, Pencil, Printer, Search, Share2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReceiptTemplate from '../../components/receipt/ReceiptTemplate';
import { downloadElementAsPDF } from '../../utils/pdf';
import { numberToWords } from '../../utils/numberToWords';

const MODES = ['', 'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'IMPS', 'Card', 'Other'];
const inputClass = 'min-h-11 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500';
const MAX_AMOUNT = 999999999.99;

export default function ReceiptList() {
  const { user, can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const query = {
    type: params.get('type') || 'all',
    q: params.get('q') || '',
    paymentMode: params.get('paymentMode') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    page: Number(params.get('page')) || 1,
    limit: Number(params.get('limit')) || 10,
    sortOrder: params.get('sortOrder') || 'desc',
  };

  const setQuery = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => value ? next.set(key, String(value)) : next.delete(key));
    if (resetPage && !Object.prototype.hasOwnProperty.call(patch, 'page')) next.set('page', '1');
    setParams(next);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/transactions', { params: query });
      setRows(data.items);
      setMeta({ total: data.total, pages: data.pages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const remove = async (row) => {
    if (!window.confirm(`Delete ${number(row)}?`)) return;
    try {
      await api.delete(`${baseUrl(row)}/${row._id}`);
      toast.success('Transaction deleted');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const share = async (row) => {
    const text = `${row.transactionType === 'receipt' ? 'Receipt' : 'Voucher'} ${number(row)} | ${party(row)} | ${money(row.amount)} | ${new Date(row.date).toLocaleDateString()}`;
    try {
      if (navigator.share) await navigator.share({ title: number(row), text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Transaction details copied');
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Unable to share transaction');
    }
  };

  const canEdit = user.role === 'admin' || user.role === 'user';

  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Transaction History</h1>
        <p className="text-sm text-slate-500">{can('receipt.viewAll') ? 'All cash receipts and payment vouchers' : 'Your cash receipts and payment vouchers'}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="relative md:col-span-2"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={query.q} onChange={(e) => setQuery({ q: e.target.value })} placeholder="Search number, party, purpose" className={`${inputClass} w-full pl-9`} /></div>
        <select value={query.type} onChange={(e) => setQuery({ type: e.target.value })} className={inputClass}><option value="all">All transactions</option><option value="in">Cash receipts</option><option value="out">Payment vouchers</option></select>
        <select value={query.paymentMode} onChange={(e) => setQuery({ paymentMode: e.target.value })} className={inputClass}>{MODES.map((mode) => <option key={mode} value={mode}>{mode || 'All payment modes'}</option>)}</select>
        <input aria-label="From date" type="date" value={query.from} onChange={(e) => setQuery({ from: e.target.value })} className={inputClass} />
        <input aria-label="To date" type="date" value={query.to} onChange={(e) => setQuery({ to: e.target.value })} className={inputClass} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-full">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Number</th><th className="px-4 py-3"><button onClick={() => setQuery({ sortOrder: query.sortOrder === 'asc' ? 'desc' : 'asc' })}>Date {query.sortOrder === 'asc' ? 'Asc' : 'Desc'}</button></th><th className="px-4 py-3">Party</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Created By</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="9" className="p-10 text-center text-slate-400"><span className="inline-block w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mr-2 align-middle" />Loading transactions...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan="9" className="p-10 text-center text-slate-400">No transactions found</td></tr>}
              {!loading && rows.map((row) => <tr key={`${row.transactionType}-${row._id}`} className="hover:bg-slate-50"><td className="px-4 py-3"><TypeBadge type={row.transactionType} /></td><td className="px-4 py-3 font-medium text-slate-800">{number(row)}</td><td className="px-4 py-3 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td><td className="px-4 py-3">{party(row)}</td><td className="px-4 py-3 max-w-48 truncate">{row.purpose}</td><td className="px-4 py-3">{row.paymentMode}</td><td className="px-4 py-3 text-right font-semibold">{money(row.amount)}</td><td className="px-4 py-3 text-slate-500">{row.createdBy?.name || '-'}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Action title="View" onClick={() => setSelected(row)}><Eye size={16} /></Action>{canEdit && <Action title="Edit" onClick={() => setEditing(row)}><Pencil size={16} /></Action>}<Action title="Print" onClick={() => setSelected({ ...row, autoPrint: true })}><Printer size={16} /></Action><Action title="Share" onClick={() => share(row)}><Share2 size={16} /></Action><Action title="Download PDF" onClick={() => setSelected({ ...row, autoPdf: true })}><Download size={16} /></Action>{can('receipt.delete') && <Action title="Delete" danger onClick={() => remove(row)}><Trash2 size={16} /></Action>}</div></td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="px-3 sm:px-4 py-3 border-t flex flex-col sm:flex-row sm:flex-wrap justify-between sm:items-center gap-3 text-sm">
          <span className="text-slate-500">{meta.total} transactions | Page {query.page} of {meta.pages}</span>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={query.limit} onChange={(e) => setQuery({ limit: e.target.value })} className="min-h-10 border rounded px-2 py-1">
              <option value="10">10 per page</option><option value="25">25 per page</option><option value="50">50 per page</option>
            </select>
            <button disabled={query.page <= 1} onClick={() => setQuery({ page: query.page - 1 }, false)} className="min-h-10 min-w-10 p-1.5 border rounded disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button disabled={query.page >= meta.pages} onClick={() => setQuery({ page: query.page + 1 }, false)} className="min-h-10 min-w-10 p-1.5 border rounded disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {selected && <PreviewDialog row={selected} onClose={() => setSelected(null)} />}
      {editing && <EditDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function PreviewDialog({ row, onClose }) {
  const ref = useRef(null);
  const acted = useRef(false);
  const type = row.transactionType === 'receipt' ? 'in' : 'out';
  const data = templateData(row);
  const download = async () => downloadElementAsPDF(ref.current.querySelector('#receipt-print-area'), `${number(row)}.pdf`);
  useEffect(() => {
    if (acted.current) return;
    acted.current = true;
    const timer = setTimeout(() => row.autoPrint ? window.print() : row.autoPdf ? download() : null, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="fixed inset-0 z-50 bg-slate-900/50 p-2 sm:p-4 overflow-auto"><div className="mx-auto w-full max-w-5xl"><div className="no-print bg-white rounded-t-xl p-2 sm:p-3 flex flex-wrap justify-end gap-2"><button onClick={() => window.print()} className={dialogButton}><Printer size={16} /> Print</button><button onClick={download} className={dialogButton}><Download size={16} /> PDF</button><button onClick={onClose} className="min-h-10 min-w-10 p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button></div><div ref={ref} className="receipt-preview"><ReceiptTemplate type={type} data={data} /></div></div></div>;
}

function EditDialog({ row, onClose, onSaved }) {
  const receipt = row.transactionType === 'receipt';
  const [form, setForm] = useState({ number: number(row), date: row.date.slice(0, 10), party: party(row), purpose: row.purpose, paymentMode: row.paymentMode, amount: row.amount, signedBy: receipt ? row.receivedBy : row.approvedBy });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      toast.error(`Enter an amount between 0.01 and ${MAX_AMOUNT}`);
      return;
    }
    const common = { date: form.date, purpose: form.purpose.trim(), paymentMode: form.paymentMode, amount, amountInWords: numberToWords(amount) };
    const payload = receipt ? { ...common, receiptNumber: form.number.trim(), receivedFrom: form.party.trim(), receivedBy: form.signedBy.trim() } : { ...common, voucherNumber: form.number.trim(), paidTo: form.party.trim(), approvedBy: form.signedBy.trim() };
    try { await api.put(`${baseUrl(row)}/${row._id}`, payload); toast.success('Transaction updated'); onSaved(); } catch (error) { toast.error(error.response?.data?.message || 'Update failed'); }
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4"><form onSubmit={submit} className="bg-white rounded-xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-5 space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Edit {receipt ? 'Receipt' : 'Voucher'}</h2><button type="button" onClick={onClose} className="min-h-10 min-w-10 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={18} /></button></div>{[['number', 'Number'], ['date', 'Date'], ['party', receipt ? 'Received From' : 'Paid To'], ['purpose', 'Purpose'], ['amount', 'Amount'], ['signedBy', receipt ? 'Received By' : 'Approved By']].map(([key, label]) => <label key={key} className="block text-sm"><span className="block mb-1 font-medium">{label}</span><input required type={key === 'date' ? 'date' : key === 'amount' ? 'number' : 'text'} min={key === 'amount' ? '0.01' : undefined} step={key === 'amount' ? '0.01' : undefined} value={form[key]} onChange={(e) => update(key, e.target.value)} className={`${inputClass} w-full`} /></label>)}<label className="block text-sm"><span className="block mb-1 font-medium">Payment Mode</span><select value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)} className={`${inputClass} w-full`}>{MODES.slice(1).map((mode) => <option key={mode}>{mode}</option>)}</select></label><div className="grid grid-cols-1 sm:flex sm:justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="min-h-11 px-4 py-2 border rounded-lg text-sm">Cancel</button><button className="min-h-11 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Save Changes</button></div></form></div>;
}

const number = (row) => row.receiptNumber || row.voucherNumber;
const party = (row) => row.receivedFrom || row.paidTo;
const baseUrl = (row) => row.transactionType === 'receipt' ? '/receipts' : '/vouchers';
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const templateData = (row) => ({ number: number(row), date: row.date.slice(0, 10), party: party(row), purpose: row.purpose, paymentMode: row.paymentMode, amount: row.amount, amountInWords: row.amountInWords, signedBy: row.receivedBy || row.approvedBy });
const dialogButton = 'min-h-10 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm';
const Action = ({ title, onClick, danger, children }) => <button title={title} onClick={onClick} className={`min-h-10 min-w-10 p-2 rounded ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>;
const TypeBadge = ({ type }) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${type === 'receipt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{type === 'receipt' ? 'Receipt' : 'Voucher'}</span>;
