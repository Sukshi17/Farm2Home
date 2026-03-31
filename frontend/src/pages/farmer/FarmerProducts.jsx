import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import VoiceInput from '../../components/VoiceInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiPackage } from 'react-icons/fi';

export default function FarmerProducts() {
  const { API } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', unit: 'kg', quantity: '', category: 'vegetables' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/farmer/products');
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', description: '', price: '', unit: 'kg', quantity: '', category: 'vegetables' });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      unit: product.unit,
      quantity: product.quantity.toString(),
      category: product.category
    });
    setImagePreview(product.image);
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity) return toast.error('Name, price, and quantity are required');
    if (!editId && !imageFile && !imagePreview) return toast.error('Product image is required');

    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('unit', form.unit);
    formData.append('quantity', form.quantity);
    formData.append('category', form.category);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editId) {
        await API.put(`/farmer/products/${editId}`, formData);
        toast.success('Product updated!');
      } else {
        await API.post('/farmer/products', formData);
        toast.success('Product added!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/farmer/products/${id}`);
      toast.success('Product deleted');
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="flex-between mb-3">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📦 My Products</h1>
          <p>{products.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> Add Product
        </button>
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No products yet</h3>
          <p>Start by adding your farm products</p>
          <button className="btn btn-primary mt-2" onClick={openAdd}><FiPlus /> Add Product</button>
        </div>
      )}

      <div className="product-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <img src={product.image} alt={product.name} className="product-card-image" />
            <div className="product-card-body">
              <div className="product-card-name">{product.name}</div>
              <div className="product-card-price">₹{product.price}/{product.unit}</div>
              <div className="product-card-meta">
                <span className="badge badge-neutral">{product.category}</span>
                <span>{product.quantity} {product.unit} left</span>
              </div>
              {product.quantity <= 5 && (
                <span className="badge badge-danger mt-1">Low Stock!</span>
              )}
            </div>
            <div className="product-card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(product)} style={{ flex: 1 }}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product._id)} style={{ flex: 1 }}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name (Voice or Type)</label>
                  <VoiceInput value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Fresh Tomatoes" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your product..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" className="form-control" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 40" min="0" step="0.5" />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select className="form-control" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                      <option value="litre">Litre</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity Available</label>
                    <input type="number" className="form-control" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="e.g. 100" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="grains">Grains</option>
                      <option value="dairy">Dairy</option>
                      <option value="spices">Spices</option>
                      <option value="organic">Organic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Product Image *</label>
                  <div className="file-upload" onClick={() => document.getElementById('prod-img-input').click()}>
                    <input id="prod-img-input" type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="file-preview" />
                    ) : (
                      <>
                        <div className="file-upload-icon"><FiUpload /></div>
                        <div className="file-upload-text">Click to upload product image</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
