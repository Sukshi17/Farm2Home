import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiShoppingBag, FiHeart, FiShoppingCart, FiPackage } from 'react-icons/fi';

export default function CustomerDashboard() {
  const { API, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/customer/dashboard');
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;
  const stats = data?.stats || {};

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>👋 Welcome, {user?.name || 'Customer'}</h1>
        <p>Discover fresh produce from local farmers</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiShoppingBag /></div>
          <div>
            <div className="stat-value">{stats.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiPackage /></div>
          <div>
            <div className="stat-value">{stats.activeOrders || 0}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiHeart /></div>
          <div>
            <div className="stat-value">{stats.wishlistCount || 0}</div>
            <div className="stat-label">Wishlist Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FiShoppingCart /></div>
          <div>
            <div className="stat-value">{stats.cartCount || 0}</div>
            <div className="stat-label">Cart Items</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <Link to="/customer/browse" className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛒</div>
          <h3>Browse Products</h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Find fresh produce from local farms</p>
        </Link>
        <Link to="/customer/orders" className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📦</div>
          <h3>My Orders</h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Track your active and past orders</p>
        </Link>
      </div>

      {data?.recentOrders?.length > 0 && (
        <div className="card mt-3">
          <h3 className="mb-2">Recent Orders</h3>
          {data.recentOrders.map(order => (
            <div key={order._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {order.items?.length || 0} items · ₹{order.totalAmount} · {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${order.status === 'delivered' ? 'badge-success' : order.status === 'placed' ? 'badge-warning' : 'badge-info'}`}>
                {order.status?.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
