import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiTruck, FiUser } from 'react-icons/fi';

const statusColors = {
  placed: 'badge-warning', accepted: 'badge-info', rejected: 'badge-danger',
  assigned: 'badge-primary', out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger'
};

export default function FarmerOrders() {
  const { API } = useAuth();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, partnersRes] = await Promise.all([
          API.get('/farmer/orders'),
          API.get('/farmer/delivery-partners')
        ]);
        setOrders(ordersRes.data);
        setPartners(partnersRes.data);
      } catch (error) {
        toast.error('Failed to load orders');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await API.put(`/farmer/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o._id === orderId ? res.data.order : o));
      toast.success(`Order ${status}`);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const assignPartner = async (orderId, partnerId) => {
    try {
      const res = await API.put(`/farmer/orders/${orderId}/assign-partner`, { partnerId });
      setOrders(orders.map(o => o._id === orderId ? res.data.order : o));
      toast.success('Delivery partner assigned');
    } catch (error) {
      toast.error('Failed to assign partner');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📋 Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      <div className="flex gap-1 mb-3" style={{ flexWrap: 'wrap' }}>
        {['all', 'placed', 'accepted', 'assigned', 'out_for_delivery', 'delivered', 'rejected'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No {filter === 'all' ? '' : filter} orders</h3>
        </div>
      )}

      {filtered.map(order => (
        <div key={order._id} className="card mb-2">
          <div className="flex-between mb-1">
            <div>
              <strong style={{ fontSize: '1rem' }}>Order #{order._id.slice(-6).toUpperCase()}</strong>
              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <span className={`badge ${statusColors[order.status] || 'badge-neutral'}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1" style={{ alignItems: 'center', marginBottom: 8 }}>
              <FiUser size={14} color="var(--text-muted)" />
              <span className="text-secondary">{order.customerName || 'Customer'} · {order.customerMobile}</span>
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                <span>{item.name} × {item.quantity}</span>
                <span className="text-primary" style={{ marginLeft: 'auto', fontWeight: 700 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="flex-between mt-1">
            <div>
              <span className="text-secondary">Total: </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₹{order.totalAmount}</strong>
              <span className="badge badge-neutral ml-1" style={{ marginLeft: 8 }}>
                {order.deliveryType === 'self_pickup' ? '🏪 Self Pickup' : '🚛 Delivery'}
              </span>
              <span className="badge badge-neutral" style={{ marginLeft: 4 }}>
                {order.paymentMethod === 'cod' ? '💵 COD' : '📱 UPI'}
              </span>
            </div>

            <div className="btn-group">
              {order.status === 'placed' && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order._id, 'accepted')}>
                    <FiCheck /> Accept
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => updateStatus(order._id, 'rejected')}>
                    <FiX /> Reject
                  </button>
                </>
              )}
              {order.status === 'accepted' && order.deliveryType === 'farmer_delivery' && !order.deliveryPartner && (
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                  onChange={(e) => e.target.value && assignPartner(order._id, e.target.value)}
                  defaultValue=""
                >
                  <option value="">Assign Partner</option>
                  {partners.filter(p => p.isAvailable).map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              )}
              {order.status === 'assigned' && (
                <button className="btn btn-sm btn-accent" onClick={() => updateStatus(order._id, 'out_for_delivery')}>
                  <FiTruck /> Out for Delivery
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order._id, 'delivered')}>
                  <FiCheck /> Mark Delivered
                </button>
              )}
            </div>
          </div>

          {order.deliveryPartner && (
            <div className="mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <FiTruck size={14} style={{ verticalAlign: 'middle' }} /> Delivery: {order.deliveryPartner.name} ({order.deliveryPartner.phone})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
