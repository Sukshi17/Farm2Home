import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProfile from './pages/farmer/FarmerProfile';
import FarmerProducts from './pages/farmer/FarmerProducts';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerDelivery from './pages/farmer/FarmerDelivery';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import ProductBrowse from './pages/customer/ProductBrowse';
import Wishlist from './pages/customer/Wishlist';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderTracking from './pages/customer/OrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageFarmers from './pages/admin/ManageFarmers';
import ManageOrders from './pages/admin/ManageOrders';
import ManageProducts from './pages/admin/ManageProducts';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-overlay"><div className="spinner"></div></div>;
  if (!user) return <Landing />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  if (user.role === 'customer') return <Navigate to="/customer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Farmer Routes */}
            <Route path="/farmer" element={<ProtectedRoute roles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/farmer/profile" element={<ProtectedRoute roles={['farmer']}><FarmerProfile /></ProtectedRoute>} />
            <Route path="/farmer/products" element={<ProtectedRoute roles={['farmer']}><FarmerProducts /></ProtectedRoute>} />
            <Route path="/farmer/orders" element={<ProtectedRoute roles={['farmer']}><FarmerOrders /></ProtectedRoute>} />
            <Route path="/farmer/delivery" element={<ProtectedRoute roles={['farmer']}><FarmerDelivery /></ProtectedRoute>} />

            {/* Customer Routes */}
            <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/profile" element={<ProtectedRoute roles={['customer']}><CustomerProfile /></ProtectedRoute>} />
            <Route path="/customer/browse" element={<ProtectedRoute roles={['customer']}><ProductBrowse /></ProtectedRoute>} />
            <Route path="/customer/wishlist" element={<ProtectedRoute roles={['customer']}><Wishlist /></ProtectedRoute>} />
            <Route path="/customer/cart" element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />
            <Route path="/customer/checkout" element={<ProtectedRoute roles={['customer']}><Checkout /></ProtectedRoute>} />
            <Route path="/customer/orders" element={<ProtectedRoute roles={['customer']}><OrderTracking /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/farmers" element={<ProtectedRoute roles={['admin']}><ManageFarmers /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><ManageOrders /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><ManageProducts /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
