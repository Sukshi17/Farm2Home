import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const statusColors = {
  placed: 'badge-warning', accepted: 'badge-info', rejected: 'badge-danger',
  assigned: 'badge-primary', out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger'
};

export default function ManageOrders() {
  const { API } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/admin/orders');
        setOrders(res.data);
      } catch (error) {
        toast.error('Failed to load orders');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📋 All Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No orders yet</h3>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Farmer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Delivery</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td><strong>#{order._id.slice(-6).toUpperCase()}</strong></td>
                <td>{order.customerId?.name || order.customerId?.mobile || '-'}</td>
                <td>{order.farmerId?.name || order.farmerId?.mobile || '-'}</td>
                <td>{order.items?.length || 0}</td>
                <td className="text-primary" style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                <td>{order.deliveryType === 'self_pickup' ? '🏪 Pickup' : '🚛 Delivery'}</td>
                <td>{order.paymentMethod === 'cod' ? '💵 COD' : '📱 UPI'}</td>
                <td>
                  <span className={`badge ${statusColors[order.status] || 'badge-neutral'}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
