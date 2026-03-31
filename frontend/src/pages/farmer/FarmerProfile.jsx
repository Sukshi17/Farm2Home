import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiUpload, FiSave, FiCheck, FiX, FiClock } from 'react-icons/fi';

export default function FarmerProfile() {
  const { API, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ farmName: '', farmAddress: '', farmSize: '', cropTypes: '', upiId: '' });
  const [userName, setUserName] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/farmer/profile');
        setUserName(res.data.user?.name || '');
        setImagePreview(res.data.user?.profileImage || '');
        setProfileData(res.data.profile);
        if (res.data.profile) {
          setProfile({
            farmName: res.data.profile.farmName || '',
            farmAddress: res.data.profile.farmAddress || '',
            farmSize: res.data.profile.farmSize || '',
            cropTypes: res.data.profile.cropTypes?.join(', ') || '',
            upiId: res.data.profile.upiId || ''
          });
        }
      } catch (error) {
        toast.error('Failed to load profile');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/farmer/profile', {
        name: userName,
        farmName: profile.farmName,
        farmAddress: profile.farmAddress,
        farmSize: profile.farmSize,
        cropTypes: profile.cropTypes.split(',').map(s => s.trim()).filter(Boolean),
        upiId: profile.upiId
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/farmer/profile/image', formData);
      setImagePreview(res.data.imageUrl);
      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleDocUpload = async () => {
    if (!docFile) return toast.error('Select a document to upload');
    const formData = new FormData();
    formData.append('document', docFile);
    formData.append('type', docType);
    try {
      await API.post('/farmer/documents', formData);
      toast.success('Document uploaded successfully!');
      setDocFile(null);
      // Refresh profile
      const res = await API.get('/farmer/profile');
      setProfileData(res.data.profile);
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  if (loading) return <LoadingSpinner />;

  const verStatus = profileData?.verificationStatus || 'pending';

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your farm profile and verification documents</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 className="mb-2">Profile Information</h3>
          <div className="text-center mb-2">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto' }}>🧑‍🌾</div>
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
              <label>Farm Name</label>
              <input className="form-control" value={profile.farmName} onChange={e => setProfile({...profile, farmName: e.target.value})} placeholder="e.g. Green Valley Farm" />
            </div>
            <div className="form-group">
              <label>Farm Address</label>
              <textarea className="form-control" value={profile.farmAddress} onChange={e => setProfile({...profile, farmAddress: e.target.value})} placeholder="Full address" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Farm Size</label>
                <input className="form-control" value={profile.farmSize} onChange={e => setProfile({...profile, farmSize: e.target.value})} placeholder="e.g. 5 acres" />
              </div>
              <div className="form-group">
                <label>UPI ID</label>
                <input className="form-control" value={profile.upiId} onChange={e => setProfile({...profile, upiId: e.target.value})} placeholder="e.g. farmer@upi" />
              </div>
            </div>
            <div className="form-group">
              <label>Crop Types (comma separated)</label>
              <input className="form-control" value={profile.cropTypes} onChange={e => setProfile({...profile, cropTypes: e.target.value})} placeholder="e.g. Rice, Wheat, Tomatoes" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div>
          <div className="card mb-3">
            <h3 className="mb-2">Verification Status</h3>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              {verStatus === 'approved' && <><FiCheck color="var(--success)" size={20} /><span className="badge badge-success">Verified</span></>}
              {verStatus === 'pending' && <><FiClock color="var(--secondary)" size={20} /><span className="badge badge-warning">Pending Review</span></>}
              {verStatus === 'rejected' && <><FiX color="var(--danger)" size={20} /><span className="badge badge-danger">Rejected</span></>}
            </div>
            {profileData?.verificationNote && (
              <p className="text-secondary mt-1" style={{ fontSize: '0.85rem' }}>
                Note: {profileData.verificationNote}
              </p>
            )}
          </div>

          <div className="card mb-3">
            <h3 className="mb-2">Upload Documents</h3>
            <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
              Upload Aadhaar, land records, or farm license for verification.
            </p>
            <div className="form-group">
              <label>Document Type</label>
              <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="land_record">Land Record</option>
                <option value="farm_license">Farm License</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="file-upload" onClick={() => document.getElementById('doc-input').click()}>
              <input id="doc-input" type="file" accept="image/*,.pdf" onChange={e => setDocFile(e.target.files[0])} />
              <div className="file-upload-icon"><FiUpload /></div>
              <div className="file-upload-text">
                {docFile ? docFile.name : 'Click to upload document'}
              </div>
            </div>
            {docFile && (
              <button className="btn btn-primary mt-1 w-full" onClick={handleDocUpload}>
                <FiUpload /> Upload Document
              </button>
            )}
          </div>

          {profileData?.documents?.length > 0 && (
            <div className="card">
              <h3 className="mb-2">Uploaded Documents</h3>
              {profileData.documents.map((doc, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < profileData.documents.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ textTransform: 'capitalize' }}>{doc.type?.replace('_', ' ')}</strong>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener" className="btn btn-sm btn-secondary">View</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
