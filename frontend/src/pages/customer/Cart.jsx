import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi';

export default function Cart() {
  const { API } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await API.get('/customer/cart');
      setItems(res.data);
    } catch (error) {
      toast.error('Failed to load cart');
    }
    setLoading(false);
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await API.put(`/customer/cart/${productId}`, { quantity });
      setItems(res.data.cart);
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const removeItem = async (productId) => {
    try {
      await API.delete(`/customer/cart/${productId}`);
      setItems(items.filter(i => i.product?._id !== productId));
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const totalAmount = items.reduce((sum, item) => {
    return sum + ((item.product?.price || 0) * (item.quantity || 0));
  }, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🛒 Shopping Cart</h1>
        <p>{items.length} items in cart</p>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse products and add items to your cart</p>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            {items.map(item => (
              <div key={item.product?._id} className="cart-item">
                <img src={item.product?.image} alt="" className="cart-item-image" />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product?.name}</div>
                  <div className="cart-item-price">₹{item.product?.price}/{item.product?.unit}</div>
                </div>
                <div className="cart-quantity">
                  <button onClick={() => updateQuantity(item.product?._id, item.quantity - 1)} disabled={item.quantity <= 1}><FiMinus /></button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product?._id, item.quantity + 1)}><FiPlus /></button>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 60, textAlign: 'right' }}>
                  ₹{(item.product?.price || 0) * item.quantity}
                </div>
                <button className="btn-icon" onClick={() => removeItem(item.product?._id)}>
                  <FiTrash2 size={16} color="var(--danger)" />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3 className="mb-2">Order Summary</h3>
            {items.map(item => (
              <div key={item.product?._id} className="cart-summary-row">
                <span className="text-secondary">{item.product?.name} × {item.quantity}</span>
                <span>₹{(item.product?.price || 0) * item.quantity}</span>
              </div>
            ))}
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span className="text-primary">₹{totalAmount}</span>
            </div>
            <button className="btn btn-primary btn-lg w-full mt-2" onClick={() => navigate('/customer/checkout')}>
              Proceed to Checkout <FiArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
