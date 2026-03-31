import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ManageProducts() {
  const { API } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/admin/products');
        setProducts(res.data);
      } catch (error) {
        toast.error('Failed to load products');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>📦 All Products</h1>
        <p>{products.length} products listed on the platform</p>
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No products yet</h3>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Farmer</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>
                  <img src={product.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                </td>
                <td><strong>{product.name}</strong></td>
                <td>{product.farmerId?.name || product.farmerId?.mobile || '-'}</td>
                <td><span className="badge badge-neutral">{product.category}</span></td>
                <td className="text-primary" style={{ fontWeight: 700 }}>₹{product.price}/{product.unit}</td>
                <td>
                  <span className={product.quantity <= 5 ? 'text-danger' : ''} style={{ fontWeight: product.quantity <= 5 ? 700 : 400 }}>
                    {product.quantity}
                  </span>
                </td>
                <td>⭐ {product.rating || 0}</td>
                <td>
                  <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                    {product.isAvailable ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-secondary">{new Date(product.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
