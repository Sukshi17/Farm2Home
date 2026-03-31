import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiPackage, FiShoppingBag, FiDollarSign, FiClock, FiAlertTriangle, FiTruck } from 'react-icons/fi';

export default function FarmerDashboard() {
  const { API } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/farmer/dashboard');
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const stats = data?.stats || {};

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🧑‍🌾 Farmer Dashboard</h1>
        <p>Welcome back! Here's your farm overview</p>
      </div>

      {data?.verificationStatus !== 'approved' && (
        <div className="card mb-3" style={{ borderColor: 'var(--secondary)', background: 'rgba(245,158,11,0.08)' }}>
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
            <FiAlertTriangle color="var(--secondary)" size={20} />
            <div>
              <strong style={{ color: 'var(--secondary)' }}>Verification {data?.verificationStatus || 'Pending'}</strong>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                {data?.verificationStatus === 'rejected' 
                  ? 'Your verification was rejected. Please re-upload documents.'
                  : 'Upload your documents in Profile to get verified by admin.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><FiPackage /></div>
          <div>
            <div className="stat-value">{stats.totalProducts || 0}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiShoppingBag /></div>
          <div>
            <div className="stat-value">{stats.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FiClock /></div>
          <div>
            <div className="stat-value">{stats.pendingOrders || 0}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div>
            <div className="stat-value">₹{stats.totalEarnings || 0}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiTruck /></div>
          <div>
            <div className="stat-value">{stats.deliveredOrders || 0}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
      </div>

      {data?.lowStock?.length > 0 && (
        <div className="card mb-3">
          <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertTriangle color="var(--danger)" /> Low Stock Alerts
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.lowStock.map(p => (
              <span key={p._id} className="badge badge-danger">
                {p.name}: {p.quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="mb-2">Recent Orders</h3>
        {data?.recentOrders?.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Orders from customers will appear here</p>
          </div>
        )}
        {data?.recentOrders?.map(order => (
          <div key={order._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{order.customerName || 'Customer'}</strong>
              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                {order.items?.length || 0} items · ₹{order.totalAmount}
              </div>
            </div>
            <span className={`badge ${order.status === 'placed' ? 'badge-warning' : order.status === 'delivered' ? 'badge-success' : 'badge-info'}`}>
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
