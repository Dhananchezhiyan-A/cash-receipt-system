import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@dreamcode.tech');
  const [password, setPassword] = useState('admin123');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(email, password); toast.success('Welcome back'); nav('/'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="DreamCode Technology" className="h-16 object-contain" />
        </div>
        <h1 className="text-xl font-semibold text-center text-slate-800">Cash Receipt System</h1>
        <p className="text-sm text-center text-slate-500 mt-1">Sign in to continue</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <button disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition">
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-6">
          Demo: admin@dreamcode.tech / admin123
        </p>
      </div>
    </div>
  );
}
