import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import Attendance from './pages/Attendance';
import WastageCalculator from './pages/WastageCalculator';
import DynamicPricing from './pages/DynamicPricing';
import Reports from './pages/Reports';
import GSTReport from './pages/GSTReport';
import TileGallery from './pages/TileGallery';
import RoomVisualizer from './pages/RoomVisualizer';
import ProjectEstimator from './pages/ProjectEstimator';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerInvoices from './pages/CustomerInvoices';
import CustomerProfile from './pages/CustomerProfile';

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Layout><AccessDenied /></Layout>;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Staff/Admin routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute roles={['admin','manager','employee']}><Customers /></PrivateRoute>} />
        <Route path="/invoices" element={<PrivateRoute roles={['admin','manager','employee']}><Invoices /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute roles={['admin','manager']}><Employees /></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute roles={['admin','manager']}><Suppliers /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute roles={['admin','manager','employee','driver']}><Attendance /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute roles={['admin','manager']}><Reports /></PrivateRoute>} />
        <Route path="/gst-report" element={<PrivateRoute roles={['admin','manager']}><GSTReport /></PrivateRoute>} />
        <Route path="/wastage-calculator" element={<PrivateRoute><WastageCalculator /></PrivateRoute>} />
        <Route path="/dynamic-pricing" element={<PrivateRoute><DynamicPricing /></PrivateRoute>} />
        <Route path="/tile-gallery" element={<PrivateRoute><TileGallery /></PrivateRoute>} />
        <Route path="/room-visualizer" element={<PrivateRoute><RoomVisualizer /></PrivateRoute>} />
        <Route path="/project-estimator" element={<PrivateRoute><ProjectEstimator /></PrivateRoute>} />

        {/* Customer Portal routes */}
        <Route path="/customer/dashboard" element={<PrivateRoute roles={['customer']}><CustomerDashboard /></PrivateRoute>} />
        <Route path="/customer/invoices" element={<PrivateRoute roles={['customer']}><CustomerInvoices /></PrivateRoute>} />
        <Route path="/customer/profile" element={<PrivateRoute roles={['customer']}><CustomerProfile /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
