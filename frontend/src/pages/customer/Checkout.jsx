import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiMapPin, FiTruck, FiShoppingBag, FiCreditCard, FiCheck } from 'react-icons/fi';

export default function Checkout() {
  const { API } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [deliveryType, setDeliveryType] = useState('self_pickup');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [cartRes, profileRes] = await Promise.all([
          API.get('/customer/cart'),
          API.get('/customer/profile')
        ]);
        setCart(cartRes.data);
        if (profileRes.data.profile?.address) {
          const p = profileRes.data.profile;
          setAddress([p.address, p.city, p.state, p.pincode].filter(Boolean).join(', '));
        }
      } catch (error) {
        toast.error('Failed to load cart');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)), 0);

  const handlePlaceOrder = async () => {
    if (deliveryType === 'farmer_delivery' && !address) {
      return toast.error('Please enter a delivery address');
    }
    if (deliveryType === 'farmer_delivery' && paymentMethod === 'cod') {
      return toast.error('Cash on Delivery is only available for Self Pickup');
    }

    setPlacing(true);
    try {
      const items = cart.map(item => ({
        productId: item.product?._id,
        quantity: item.quantity
      }));

      const res = await API.post('/customer/orders', {
        items,
        deliveryType,
        paymentMethod,
        deliveryAddress: address
      });

      toast.success('Order placed successfully! 🎉');

      // If UPI payment, open UPI link
      if (paymentMethod === 'upi' && res.data.orders?.[0]?.farmerUpi) {
        const order = res.data.orders[0];
        const upiUrl = `upi://pay?pa=${encodeURIComponent(order.farmerUpi)}&pn=Farm2Home&am=${order.totalAmount}&cu=INR&tn=Farm2Home Order`;
        window.open(upiUrl, '_blank');
      }

      navigate('/customer/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    }
    setPlacing(false);
  };

  if (loading) return <LoadingSpinner />;

  if (cart.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>Cart is empty</h3>
          <p>Add items to your cart before checkout</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/customer/browse')}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📋 Checkout</h1>
        <p>Review and place your order</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div>
          <div className="card mb-3">
            <h3 className="mb-2"><FiTruck style={{ verticalAlign: 'middle', marginRight: 8 }} /> Delivery Method</h3>
            <div className="role-selector">
              <div className={`role-option ${deliveryType === 'self_pickup' ? 'selected' : ''}`} onClick={() => { setDeliveryType('self_pickup'); setPaymentMethod('cod'); }}>
                <span className="role-option-icon">🏪</span>
                <span className="role-option-label">Self Pickup</span>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Pick up from farm</div>
              </div>
              <div className={`role-option ${deliveryType === 'farmer_delivery' ? 'selected' : ''}`} onClick={() => { setDeliveryType('farmer_delivery'); setPaymentMethod('upi'); }}>
                <span className="role-option-icon">🚛</span>
                <span className="role-option-label">Farm Delivery</span>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Deliver to your door</div>
              </div>
            </div>
          </div>

          {deliveryType === 'farmer_delivery' && (
            <div className="card mb-3">
              <h3 className="mb-2"><FiMapPin style={{ verticalAlign: 'middle', marginRight: 8 }} /> Delivery Address</h3>
              <textarea className="form-control" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full delivery address" rows={3} />
            </div>
          )}

          <div className="card mb-3">
            <h3 className="mb-2"><FiCreditCard style={{ verticalAlign: 'middle', marginRight: 8 }} /> Payment Method</h3>
            <div className="role-selector">
              {deliveryType === 'self_pickup' && (
                <div className={`role-option ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                  <span className="role-option-icon">💵</span>
                  <span className="role-option-label">Cash on Delivery</span>
                </div>
              )}
              <div className={`role-option ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMethod('upi')}>
                <span className="role-option-icon">📱</span>
                <span className="role-option-label">UPI Payment</span>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>GPay, PhonePe, etc.</div>
              </div>
            </div>
            {paymentMethod === 'upi' && (
              <div className="mt-1" style={{ padding: '8px 12px', background: 'rgba(22,163,74,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                💡 You'll be redirected to your UPI app after placing the order
              </div>
            )}
          </div>
        </div>

        <div className="cart-summary">
          <h3 className="mb-2">Order Summary</h3>
          {cart.map(item => (
            <div key={item.product?._id} className="cart-summary-row">
              <span className="text-secondary">{item.product?.name} × {item.quantity}</span>
              <span>₹{(item.product?.price || 0) * item.quantity}</span>
            </div>
          ))}
          <div className="cart-summary-row">
            <span className="text-secondary">Delivery</span>
            <span>{deliveryType === 'self_pickup' ? 'Free' : '₹0'}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span className="text-primary">₹{totalAmount}</span>
          </div>
          <button className="btn btn-primary btn-lg w-full mt-2" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : `Place Order · ₹${totalAmount}`} <FiCheck />
          </button>
        </div>
      </div>
    </div>
  );
}
