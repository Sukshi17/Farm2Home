import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiUsers, FiShoppingBag, FiDollarSign, FiPackage, FiAlertTriangle, FiShield, FiTrendingUp } from 'react-icons/fi';

export default function AdminDashboard() {
  const { API } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, alertsRes] = await Promise.all([
          API.get('/admin/dashboard'),
          API.get('/admin/fraud-alerts')
        ]);
        setData(dashRes.data);
        setAlerts(alertsRes.data);
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
        <h1>🛡️ Admin Dashboard</h1>
        <p>Complete system overview and management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiUsers /></div>
          <div>
            <div className="stat-value">{stats.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiUsers /></div>
          <div>
            <div className="stat-value">{stats.totalFarmers || 0}</div>
            <div className="stat-label">Farmers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div>
            <div className="stat-value">{stats.totalCustomers || 0}</div>
            <div className="stat-label">Customers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FiPackage /></div>
          <div>
            <div className="stat-value">{stats.totalProducts || 0}</div>
            <div className="stat-label">Products</div>
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
          <div className="stat-icon green"><FiDollarSign /></div>
          <div>
            <div className="stat-value">₹{stats.totalRevenue || 0}</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FiShield /></div>
          <div>
            <div className="stat-value">{stats.pendingApprovals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiAlertTriangle /></div>
          <div>
            <div className="stat-value">{stats.blockedUsers || 0}</div>
            <div className="stat-label">Blocked Users</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {alerts.length > 0 && (
          <div className="card">
            <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAlertTriangle color="var(--danger)" /> Fraud Alerts
            </h3>
            {alerts.map((alert, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className={`badge ${alert.severity === 'danger' ? 'badge-danger' : 'badge-warning'}`} style={{ marginBottom: 4 }}>
                  {alert.type?.replace(/_/g, ' ')}
                </span>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h3 className="mb-2"><FiTrendingUp style={{ verticalAlign: 'middle', marginRight: 8 }} /> Order Analytics</h3>
          {data?.ordersByStatus?.map(item => (
            <div key={item._id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ textTransform: 'capitalize' }}>{item._id?.replace(/_/g, ' ')}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {data?.recentOrders?.length > 0 && (
        <div className="card mt-3">
          <h3 className="mb-2">Recent Orders</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Farmer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td><strong>#{order._id.slice(-6).toUpperCase()}</strong></td>
                    <td>{order.customerId?.name || order.customerId?.mobile || '-'}</td>
                    <td>{order.farmerId?.name || order.farmerId?.mobile || '-'}</td>
                    <td className="text-primary" style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                    <td><span className={`badge ${order.status === 'delivered' ? 'badge-success' : order.status === 'placed' ? 'badge-warning' : 'badge-info'}`}>{order.status?.replace(/_/g, ' ')}</span></td>
                    <td className="text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
