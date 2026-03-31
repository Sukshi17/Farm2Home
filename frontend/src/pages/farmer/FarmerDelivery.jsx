import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX, FiTruck, FiMapPin, FiPhone } from 'react-icons/fi';

export default function FarmerDelivery() {
  const { API } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    try {
      const res = await API.get('/farmer/delivery-partners');
      setPartners(res.data);
    } catch (error) {
      toast.error('Failed to load partners');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      await API.post('/farmer/delivery-partners', {
        name: form.name,
        phone: form.phone,
        location: { address: form.address }
      });
      toast.success('Delivery partner added!');
      setShowModal(false);
      setForm({ name: '', phone: '', address: '' });
      fetchPartners();
    } catch (error) {
      toast.error('Failed to add partner');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this delivery partner?')) return;
    try {
      await API.delete(`/farmer/delivery-partners/${id}`);
      toast.success('Partner removed');
      setPartners(partners.filter(p => p._id !== id));
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="flex-between mb-3">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>🚛 Delivery Partners</h1>
          <p>Manage your delivery team</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Partner
        </button>
      </div>

      {partners.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🚛</div>
          <h3>No delivery partners</h3>
          <p>Add delivery partners to handle your orders</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}><FiPlus /> Add Partner</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {partners.map(partner => (
          <div key={partner._id} className="card">
            <div className="flex-between mb-1">
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <FiTruck size={20} />
                </div>
                <div>
                  <strong>{partner.name}</strong>
                  <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    {partner.totalDeliveries || 0} deliveries
                  </div>
                </div>
              </div>
              <span className={`badge ${partner.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                {partner.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
            <div className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
              <div><FiPhone size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{partner.phone}</div>
              {partner.location?.address && (
                <div><FiMapPin size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{partner.location.address}</div>
              )}
            </div>
            <button className="btn btn-sm btn-danger w-full" onClick={() => handleDelete(partner._id)}>
              <FiTrash2 /> Remove
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Delivery Partner</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Partner name" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>Location / Area</label>
                  <input className="form-control" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Operating area" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
