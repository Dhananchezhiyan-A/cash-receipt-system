import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Eye, KeyRound, Pencil, Plus, Search, Trash2, UserCheck, UserX, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'user', active: true };
const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500';

export default function UserManagement() {
  const { user: currentUser, can } = useAuth();
  const editable = can('users.manage');
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState(() => ({
    q: searchParams.get('q') || '',
    role: searchParams.get('role') || '',
    status: searchParams.get('status') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  }));
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: query });
      setItems(data.items);
      setMeta({ total: data.total, pages: data.pages });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const next = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value && !(key === 'page' && value === 1)) next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateQuery = (patch) => setQuery((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => { setForm(emptyForm); setSelected(null); setDialog('create'); };
  const openView = (user) => { setSelected(user); setDialog('view'); };
  const openEdit = (user) => {
    setSelected(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, active: user.active });
    setDialog('edit');
  };
  const closeDialog = () => { setDialog(null); setSelected(null); setForm(emptyForm); };

  const saveUser = async (event) => {
    event.preventDefault();
    try {
      if (dialog === 'create') await api.post('/users', form);
      else await api.put(`/users/${selected._id}`, form);
      toast.success(dialog === 'create' ? 'User created successfully' : 'User updated successfully');
      closeDialog();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save user');
    }
  };

  const toggleStatus = async (user) => {
    const action = user.active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      await api.patch(`/users/${user._id}/status`, { active: !user.active });
      toast.success(`User ${action}d`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to ${action} user`);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}? Their receipts and vouchers will be preserved.`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      toast.success('User deleted successfully');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete user');
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/users/${selected._id}/reset-password`, { password: form.password });
      toast.success('Password reset successfully');
      closeDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset password');
    }
  };

  const sort = (field) => updateQuery({
    sortBy: field,
    sortOrder: query.sortBy === field && query.sortOrder === 'asc' ? 'desc' : 'asc',
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500">{editable ? 'Create and manage system access' : 'Read-only user directory'}</p>
        </div>
        {editable && <button onClick={openCreate} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Create User</button>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={query.q} onChange={(e) => updateQuery({ q: e.target.value })} placeholder="Search by name or email" className={`${inputClass} pl-9`} />
        </div>
        <select value={query.role} onChange={(e) => updateQuery({ role: e.target.value })} className={inputClass}>
          <option value="">All roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="user">User</option>
        </select>
        <select value={query.status} onChange={(e) => updateQuery({ status: e.target.value })} className={inputClass}>
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <Sortable label="Name" field="name" query={query} onClick={sort} />
                <Sortable label="Email" field="email" query={query} onClick={sort} />
                <Sortable label="Role" field="role" query={query} onClick={sort} />
                <Sortable label="Status" field="active" query={query} onClick={sort} />
                <Sortable label="Created" field="createdAt" query={query} onClick={sort} />
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading users...</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">No users found</td></tr>}
              {!loading && items.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3"><StatusBadge active={user.active} /></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Action title="View" onClick={() => openView(user)}><Eye size={16} /></Action>
                      {editable && <>
                        <Action title="Edit" onClick={() => openEdit(user)}><Pencil size={16} /></Action>
                        <Action title="Reset password" onClick={() => { setSelected(user); setForm(emptyForm); setDialog('password'); }}><KeyRound size={16} /></Action>
                        <Action title={user.active ? 'Deactivate' : 'Activate'} disabled={user._id === currentUser.id} onClick={() => toggleStatus(user)}>{user.active ? <UserX size={16} /> : <UserCheck size={16} />}</Action>
                        <Action title="Delete" danger disabled={user._id === currentUser.id} onClick={() => remove(user)}><Trash2 size={16} /></Action>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">{meta.total} users | Page {query.page} of {meta.pages}</span>
          <div className="flex items-center gap-2">
            <select value={query.limit} onChange={(e) => updateQuery({ limit: Number(e.target.value) })} className="border border-slate-300 rounded px-2 py-1">
              <option value="10">10 per page</option><option value="25">25 per page</option><option value="50">50 per page</option>
            </select>
            <button disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))} className="p-1.5 border rounded disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button disabled={query.page >= meta.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))} className="p-1.5 border rounded disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {(dialog === 'create' || dialog === 'edit') && <UserFormDialog title={dialog === 'create' ? 'Create User' : 'Edit User'} form={form} setForm={setForm} onSubmit={saveUser} onClose={closeDialog} creating={dialog === 'create'} />}
      {dialog === 'view' && <ViewDialog user={selected} onClose={closeDialog} />}
      {dialog === 'password' && <PasswordDialog user={selected} form={form} setForm={setForm} onSubmit={resetPassword} onClose={closeDialog} />}
    </div>
  );
}

function Sortable({ label, field, query, onClick }) {
  return <th className="px-4 py-3"><button onClick={() => onClick(field)} className="font-medium hover:text-slate-900">{label}{query.sortBy === field ? (query.sortOrder === 'asc' ? ' Asc' : ' Desc') : ''}</button></th>;
}

function RoleBadge({ role }) {
  const tone = role === 'admin' ? 'bg-purple-100 text-purple-700' : role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${tone}`}>{role}</span>;
}

function StatusBadge({ active }) {
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function Action({ title, onClick, danger, disabled, children }) {
  return <button title={title} disabled={disabled} onClick={onClick} className={`p-2 rounded disabled:opacity-30 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>;
}

function Dialog({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg"><div className="px-5 py-4 border-b flex items-center justify-between"><h2 className="font-semibold text-slate-800">{title}</h2><button onClick={onClose} className="text-slate-500"><X size={18} /></button></div>{children}</div></div>;
}

function UserFormDialog({ title, form, setForm, onSubmit, onClose, creating }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <Dialog title={title} onClose={onClose}><form onSubmit={onSubmit} className="p-5 space-y-4"><Field label="Name"><input required maxLength="100" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} /></Field><Field label="Email"><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} /></Field>{creating && <Field label="Password"><input required minLength="8" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} /></Field>}<Field label="Role"><select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputClass}><option value="admin">Admin</option><option value="manager">Manager</option><option value="user">User</option></select></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} /> Active account</label><DialogActions onClose={onClose} submit="Save User" /></form></Dialog>;
}

function PasswordDialog({ user, form, setForm, onSubmit, onClose }) {
  return <Dialog title={`Reset Password: ${user.name}`} onClose={onClose}><form onSubmit={onSubmit} className="p-5 space-y-4"><Field label="New Password"><input autoFocus required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} /><span className="block mt-1 text-xs text-slate-500">Minimum 8 characters</span></Field><DialogActions onClose={onClose} submit="Reset Password" /></form></Dialog>;
}

function ViewDialog({ user, onClose }) {
  return <Dialog title="User Details" onClose={onClose}><div className="p-5 grid grid-cols-2 gap-4 text-sm"><Detail label="Name" value={user.name} /><Detail label="Email" value={user.email} /><Detail label="Role" value={<RoleBadge role={user.role} />} /><Detail label="Status" value={<StatusBadge active={user.active} />} /><Detail label="Created" value={new Date(user.createdAt).toLocaleString()} /><Detail label="Updated" value={new Date(user.updatedAt).toLocaleString()} /></div></Dialog>;
}

const Field = ({ label, children }) => <label className="block"><span className="block mb-1 text-sm font-medium text-slate-700">{label}</span>{children}</label>;
const Detail = ({ label, value }) => <div><div className="text-xs uppercase text-slate-400">{label}</div><div className="mt-1 text-slate-800">{value}</div></div>;
const DialogActions = ({ onClose, submit }) => <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancel</button><button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">{submit}</button></div>;
