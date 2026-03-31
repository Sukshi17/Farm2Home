import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiSave, FiUpload } from 'react-icons/fi';

export default function CustomerProfile() {
  const { API, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [form, setForm] = useState({ address: '', city: '', state: '', pincode: '' });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/customer/profile');
        setUserName(res.data.user?.name || '');
        setImagePreview(res.data.user?.profileImage || '');
        if (res.data.profile) {
          setForm({
            address: res.data.profile.address || '',
            city: res.data.profile.city || '',
            state: res.data.profile.state || '',
            pincode: res.data.profile.pincode || ''
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/customer/profile', { name: userName, ...form });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/customer/profile/image', formData);
      setImagePreview(res.data.imageUrl);
      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your personal information and delivery address</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="text-center mb-2">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {imagePreview ? (
              <img src={imagePreview} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto' }}>🧑</div>
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FiUpload size={14} color="white" />
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Delivery Address</label>
            <textarea className="form-control" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street, area, landmark" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input className="form-control" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input className="form-control" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" />
            </div>
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input className="form-control" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="6-digit pincode" maxLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
