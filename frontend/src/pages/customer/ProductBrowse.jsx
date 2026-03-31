import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiSearch, FiShoppingCart, FiHeart, FiStar, FiFilter } from 'react-icons/fi';

export default function ProductBrowse() {
  const { API } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => { fetchProducts(); }, [category, sort]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (sort) params.append('sort', sort);
      if (search) params.append('search', search);
      const res = await API.get(`/customer/products?${params}`);
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchProducts();
  };

  const addToCart = async (productId) => {
    try {
      await API.post('/customer/cart', { productId, quantity: 1 });
      toast.success('Added to cart! 🛒');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const addToWishlist = async (productId) => {
    try {
      await API.post(`/customer/wishlist/${productId}`);
      toast.success('Added to wishlist! ❤️');
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const viewDetails = async (productId) => {
    try {
      const res = await API.get(`/customer/products/${productId}`);
      setSelectedProduct(res.data);
    } catch (error) {
      toast.error('Failed to load product details');
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🛒 Browse Products</h1>
        <p>Fresh produce from verified local farmers</p>
      </div>

      <div className="card mb-3" style={{ padding: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="vegetables">🥬 Vegetables</option>
            <option value="fruits">🍎 Fruits</option>
            <option value="grains">🌾 Grains</option>
            <option value="dairy">🥛 Dairy</option>
            <option value="spices">🌶️ Spices</option>
            <option value="organic">🌿 Organic</option>
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button type="submit" className="btn btn-primary"><FiFilter /> Filter</button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {products.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          )}

          <div className="product-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-card-image"
                  onClick={() => viewDetails(product._id)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="product-card-body" onClick={() => viewDetails(product._id)} style={{ cursor: 'pointer' }}>
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-price">₹{product.price}/{product.unit}</div>
                  <div className="product-card-meta">
                    <span className="badge badge-neutral">{product.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiStar size={12} color="var(--secondary)" /> {product.rating || 0}
                    </span>
                  </div>
                  {product.farmerId && (
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      by {product.farmerId.name || 'Farmer'}
                    </div>
                  )}
                </div>
                <div className="product-card-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => addToCart(product._id)} style={{ flex: 1 }}>
                    <FiShoppingCart /> Cart
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => addToWishlist(product._id)}>
                    <FiHeart />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProduct.product?.name}</h2>
              <button className="btn-icon" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={selectedProduct.product?.image} alt="" style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
              <div className="flex-between mb-2">
                <span className="product-card-price" style={{ fontSize: '1.5rem' }}>
                  ₹{selectedProduct.product?.price}/{selectedProduct.product?.unit}
                </span>
                <span className="badge badge-neutral">{selectedProduct.product?.category}</span>
              </div>
              {selectedProduct.product?.description && (
                <p className="text-secondary mb-2">{selectedProduct.product.description}</p>
              )}
              <div className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
                <div>Available: {selectedProduct.product?.quantity} {selectedProduct.product?.unit}</div>
                <div>Rating: <FiStar size={12} color="var(--secondary)" style={{ verticalAlign: 'middle' }} /> {selectedProduct.product?.rating || 0} ({selectedProduct.product?.totalReviews || 0} reviews)</div>
              </div>

              {selectedProduct.farmerProfile && (
                <div className="card" style={{ background: 'var(--bg-input)' }}>
                  <strong>🧑‍🌾 Farmer</strong>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {selectedProduct.farmerProfile.farmName && <div>Farm: {selectedProduct.farmerProfile.farmName}</div>}
                    {selectedProduct.farmerProfile.farmAddress && <div>Location: {selectedProduct.farmerProfile.farmAddress}</div>}
                  </div>
                </div>
              )}

              {selectedProduct.reviews?.length > 0 && (
                <div className="mt-2">
                  <h4 className="mb-1">Reviews</h4>
                  {selectedProduct.reviews.map(r => (
                    <div key={r._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="flex-between">
                        <strong style={{ fontSize: '0.85rem' }}>{r.customerId?.name || 'Customer'}</strong>
                        <span>{'⭐'.repeat(r.rating)}</span>
                      </div>
                      {r.comment && <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="btn-group mt-2">
                <button className="btn btn-primary" onClick={() => { addToCart(selectedProduct.product._id); setSelectedProduct(null); }} style={{ flex: 1 }}>
                  <FiShoppingCart /> Add to Cart
                </button>
                <button className="btn btn-secondary" onClick={() => { addToWishlist(selectedProduct.product._id); setSelectedProduct(null); }}>
                  <FiHeart /> Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
