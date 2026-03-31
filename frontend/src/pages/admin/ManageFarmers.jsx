import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiFileText, FiEye, FiRefreshCw } from 'react-icons/fi';

export default function ManageFarmers() {
  const { API } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Track which farmer action is loading
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [note, setNote] = useState('');

  const fetchFarmers = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await API.get(`/admin/farmers${params}`);
      setFarmers(res.data);
    } catch (error) {
      console.error('[ManageFarmers] fetchFarmers error:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  }, [API, statusFilter]);

  useEffect(() => { fetchFarmers(); }, [fetchFarmers]);

  const handleVerify = async (farmerId, status) => {
    if (!farmerId) {
      console.error('[ManageFarmers] handleVerify: No farmerId provided');
      toast.error('Error: No farmer ID');
      return;
    }

    setActionLoading(farmerId);
    try {
      console.log(`[ManageFarmers] Approving farmer | id=${farmerId} | status=${status}`);
      
      const res = await API.put(`/admin/farmers/${farmerId}/verify`, { status, note });
      
      console.log('[ManageFarmers] Verify response:', res.data);
      toast.success(`Farmer ${status} successfully!`);
      setSelectedFarmer(null);
      setNote('');
      
      // Refresh farmer list after approval
      await fetchFarmers();
    } catch (error) {
      console.error('[ManageFarmers] handleVerify error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.error || 'Failed to update farmer status';
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePatchStatus = async (farmerId, status) => {
    if (!farmerId) {
      console.error('[ManageFarmers] handlePatchStatus: No farmerId provided');
      toast.error('Error: No farmer ID');
      return;
    }

    setActionLoading(farmerId);
    try {
      console.log(`[ManageFarmers] Patching farmer status | id=${farmerId} | status=${status}`);
      
      const res = await API.patch(`/admin/farmers/${farmerId}/status`, { status });
      
      console.log('[ManageFarmers] Patch response:', res.data);
      toast.success(`Farmer status updated to ${status}!`);
      setSelectedFarmer(null);
      
      // Refresh farmer list after status change
      await fetchFarmers();
    } catch (error) {
      console.error('[ManageFarmers] handlePatchStatus error:', error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.error || 'Failed to update farmer status';
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>🧑‍🌾 Manage Farmers</h1>
        <p>Review and approve farmer verification</p>
      </div>

      <div className="flex gap-1 mb-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
        <button className="btn btn-sm btn-secondary" onClick={fetchFarmers} style={{ marginLeft: 'auto' }}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {farmers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🧑‍🌾</div>
          <h3>No farmers found</h3>
        </div>
      )}

      {farmers.map(farmer => (
        <div key={farmer._id} className="card mb-2">
          <div className="flex-between">
            <div>
              <strong style={{ fontSize: '1rem' }}>{farmer.name || 'Unnamed Farmer'}</strong>
              <div className="text-secondary" style={{ fontSize: '0.85rem' }}>📱 {farmer.mobile}</div>
              {farmer.profile?.farmName && (
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>🏡 {farmer.profile.farmName}</div>
              )}
              {farmer.profile?.upiId && (
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>💳 UPI: {farmer.profile.upiId}</div>
              )}
              {farmer.status && (
                <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  User Status: <strong>{farmer.status}</strong>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${farmer.profile?.verificationStatus === 'approved' ? 'badge-success' : farmer.profile?.verificationStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                {farmer.profile?.verificationStatus || 'No Profile'}
              </span>
              <div className="btn-group mt-1">
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedFarmer(farmer)}>
                  <FiEye /> Details
                </button>
                {(farmer.profile?.verificationStatus === 'pending' || !farmer.profile?.verificationStatus) && (
                  <>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleVerify(farmer._id, 'approved')}
                      disabled={actionLoading === farmer._id}
                    >
                      {actionLoading === farmer._id ? '...' : <><FiCheck /> Approve</>}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => { setSelectedFarmer(farmer); }}
                      disabled={actionLoading === farmer._id}
                    >
                      <FiX /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {selectedFarmer && (
        <div className="modal-overlay" onClick={() => setSelectedFarmer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedFarmer.name || 'Farmer'} Details</h2>
              <button className="btn-icon" onClick={() => setSelectedFarmer(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="mb-2">
                <strong>Mobile:</strong> {selectedFarmer.mobile}<br />
                <strong>User Status:</strong> {selectedFarmer.status || 'N/A'}<br />
                <strong>Profile Complete:</strong> {selectedFarmer.isProfileComplete ? 'Yes' : 'No'}<br />
                <strong>Farm:</strong> {selectedFarmer.profile?.farmName || '-'}<br />
                <strong>Address:</strong> {selectedFarmer.profile?.farmAddress || '-'}<br />
                <strong>Size:</strong> {selectedFarmer.profile?.farmSize || '-'}<br />
                <strong>Crops:</strong> {selectedFarmer.profile?.cropTypes?.join(', ') || '-'}<br />
                <strong>UPI:</strong> {selectedFarmer.profile?.upiId || '-'}
              </div>

              {selectedFarmer.profile?.documents?.length > 0 && (
                <div className="mb-2">
                  <h4 className="mb-1"><FiFileText style={{ verticalAlign: 'middle' }} /> Documents</h4>
                  {selectedFarmer.profile.documents.map((doc, i) => (
                    <div key={i} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ textTransform: 'capitalize' }}>{doc.type?.replace('_', ' ')}</span>
                      <a href={doc.url} target="_blank" rel="noopener" className="btn btn-sm btn-secondary">
                        <FiEye /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {selectedFarmer.profile?.verificationStatus !== 'approved' && (
                <div>
                  <div className="form-group">
                    <label>Admin Note</label>
                    <textarea className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleVerify(selectedFarmer._id, 'approved')}
                      disabled={actionLoading === selectedFarmer._id}
                      style={{ flex: 1 }}
                    >
                      {actionLoading === selectedFarmer._id ? 'Updating...' : <><FiCheck /> Approve</>}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleVerify(selectedFarmer._id, 'rejected')}
                      disabled={actionLoading === selectedFarmer._id}
                      style={{ flex: 1 }}
                    >
                      {actionLoading === selectedFarmer._id ? 'Updating...' : <><FiX /> Reject</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
