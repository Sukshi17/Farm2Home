import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCheck, FiTruck, FiPackage, FiClock, FiStar } from 'react-icons/fi';

const statusSteps = ['placed', 'accepted', 'assigned', 'out_for_delivery', 'delivered'];
const statusLabels = { placed: 'Placed', accepted: 'Accepted', assigned: 'Assigned', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };
const statusColors = {
  placed: 'badge-warning', accepted: 'badge-info', rejected: 'badge-danger',
  assigned: 'badge-primary', out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger'
};

export default function OrderTracking() {
  const { API } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ orderId: '', productId: '', rating: 5, comment: '' });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/customer/orders');
        setOrders(res.data);
      } catch (error) {
        toast.error('Failed to load orders');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const submitReview = async () => {
    try {
      await API.post('/customer/reviews', reviewForm);
      toast.success('Review submitted! ⭐');
      setShowReview(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📦 My Orders</h1>
        <p>{orders.length} orders</p>
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Browse products and place your first order!</p>
        </div>
      )}

      {orders.map(order => {
        const currentStepIdx = statusSteps.indexOf(order.status);
        const isExpanded = expandedOrder === order._id;

        return (
          <div key={order._id} className="card mb-2" onClick={() => setExpandedOrder(isExpanded ? null : order._id)} style={{ cursor: 'pointer' }}>
            <div className="flex-between mb-1">
              <div>
                <strong>Order #{order._id.slice(-6).toUpperCase()}</strong>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${statusColors[order.status] || 'badge-neutral'}`}>
                  {order.status?.replace(/_/g, ' ')}
                </span>
                <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>₹{order.totalAmount}</div>
              </div>
            </div>

            {/* Status progress bar */}
            {!['rejected', 'cancelled'].includes(order.status) && (
              <div className="order-steps">
                {statusSteps.map((step, i) => (
                  <div key={step} className={`order-step ${i <= currentStepIdx ? (i === currentStepIdx ? 'active' : 'completed') : ''}`}>
                    {i > 0 && <div className="order-step-line" />}
                    <div className="order-step-dot">
                      {i < currentStepIdx ? <FiCheck size={14} /> : 
                       step === 'placed' ? <FiClock size={12} /> :
                       step === 'out_for_delivery' ? <FiTruck size={12} /> :
                       step === 'delivered' ? <FiPackage size={12} /> : (i + 1)}
                    </div>
                    <div className="order-step-label">{statusLabels[step]}</div>
                  </div>
                ))}
              </div>
            )}

            {order.status === 'rejected' && (
              <div className="mt-1" style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--danger)' }}>
                ❌ This order was rejected by the farmer
              </div>
            )}

            {isExpanded && (
              <div className="fade-in" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }} onClick={e => e.stopPropagation()}>
                <h4 className="mb-1">Order Items</h4>
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <img src={item.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div className="text-secondary" style={{ fontSize: '0.8rem' }}>× {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.price * item.quantity}</div>
                    {order.status === 'delivered' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => {
                        setReviewForm({ orderId: order._id, productId: item.product, rating: 5, comment: '' });
                        setShowReview(true);
                      }}>
                        <FiStar /> Review
                      </button>
                    )}
                  </div>
                ))}

                <div className="mt-2" style={{ fontSize: '0.85rem' }}>
                  <div className="flex-between" style={{ padding: '4px 0' }}>
                    <span className="text-secondary">Delivery</span>
                    <span>{order.deliveryType === 'self_pickup' ? '🏪 Self Pickup' : '🚛 Farmer Delivery'}</span>
                  </div>
                  <div className="flex-between" style={{ padding: '4px 0' }}>
                    <span className="text-secondary">Payment</span>
                    <span>{order.paymentMethod === 'cod' ? '💵 COD' : '📱 UPI'}</span>
                  </div>
                  {order.farmerId && (
                    <div className="flex-between" style={{ padding: '4px 0' }}>
                      <span className="text-secondary">Farmer</span>
                      <span>{order.farmerId.name || 'Farmer'} · {order.farmerId.mobile}</span>
                    </div>
                  )}
                  {order.deliveryPartner && (
                    <div className="flex-between" style={{ padding: '4px 0' }}>
                      <span className="text-secondary">Delivery Partner</span>
                      <span>🚛 {order.deliveryPartner.name} · {order.deliveryPartner.phone}</span>
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <div className="flex-between" style={{ padding: '4px 0' }}>
                      <span className="text-secondary">Address</span>
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {order.status === 'delivered' && order.paymentMethod === 'upi' && order.farmerUpi && (
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(order.farmerUpi)}&pn=Farm2Home&am=${order.totalAmount}&cu=INR`}
                    className="btn btn-primary w-full mt-2"
                    target="_blank"
                    rel="noopener"
                  >
                    📱 Pay via UPI · ₹{order.totalAmount}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showReview && (
        <div className="modal-overlay" onClick={() => setShowReview(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Write a Review</h2>
              <button className="btn-icon" onClick={() => setShowReview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rating</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: star <= reviewForm.rating ? 1 : 0.3 }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment (optional)</label>
                <textarea className="form-control" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Share your experience..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReview(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
