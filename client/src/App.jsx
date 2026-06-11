import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ReceiptIn from './pages/ReceiptIn/ReceiptIn';
import ReceiptOut from './pages/ReceiptOut/ReceiptOut';
import ReceiptList from './pages/ReceiptList/ReceiptList';
import UserManagement from './pages/Users/UserManagement';
import NotFound from './pages/NotFound/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="/receipts/in" element={<ReceiptIn />} />
        <Route path="/receipts/out" element={<ReceiptOut />} />
        <Route path="/receipts" element={<ReceiptList />} />
        <Route path="/transactions" element={<ReceiptList />} />
        <Route path="/users" element={<ProtectedRoute roles={['admin', 'manager']}><UserManagement /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
