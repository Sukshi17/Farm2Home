import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiTrash2, FiShoppingCart } from 'react-icons/fi';

export default function Wishlist() {
  const { API } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/customer/wishlist');
        setItems(res.data);
      } catch (error) {
        toast.error('Failed to load wishlist');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await API.delete(`/customer/wishlist/${productId}`);
      setItems(items.filter(i => i._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const addToCart = async (productId) => {
    try {
      await API.post('/customer/cart', { productId, quantity: 1 });
      toast.success('Added to cart! 🛒');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>❤️ Wishlist</h1>
        <p>{items.length} items saved</p>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Browse products and save your favorites here</p>
        </div>
      )}

      <div className="product-grid">
        {items.map(product => (
          <div key={product._id} className="product-card">
            <img src={product.image} alt={product.name} className="product-card-image" />
            <div className="product-card-body">
              <div className="product-card-name">{product.name}</div>
              <div className="product-card-price">₹{product.price}/{product.unit}</div>
              <div className="product-card-meta">
                <span className="badge badge-neutral">{product.category}</span>
                <span>{product.quantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>
            <div className="product-card-actions">
              <button className="btn btn-sm btn-primary" onClick={() => addToCart(product._id)} style={{ flex: 1 }} disabled={product.quantity <= 0}>
                <FiShoppingCart /> Add to Cart
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => removeFromWishlist(product._id)}>
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
