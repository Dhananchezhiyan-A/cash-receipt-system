import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-6xl font-bold text-slate-800">404</div>
        <p className="text-slate-500 mt-2">Page not found</p>
        <Link to="/" className="inline-block mt-4 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Go home</Link>
      </div>
    </div>
  );
}
