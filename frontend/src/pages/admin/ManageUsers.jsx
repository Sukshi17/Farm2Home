import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiShield, FiSlash, FiUsers } from 'react-icons/fi';

export default function ManageUsers() {
  const { API } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const res = await API.get(`/admin/users${params}`);
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const toggleBlock = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/block`);
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1><FiUsers style={{ verticalAlign: 'middle' }} /> Manage Users</h1>
        <p>{users.length} users</p>
      </div>

      <div className="flex gap-1 mb-3">
        {['', 'farmer', 'customer'].map(role => (
          <button key={role} className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter(role)}>
            {role ? role.charAt(0).toUpperCase() + role.slice(1) + 's' : 'All Users'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td><strong>{user.name || '-'}</strong></td>
                <td>{user.mobile}</td>
                <td>
                  <span className={`badge ${user.role === 'farmer' ? 'badge-primary' : 'badge-info'}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.isVerified ? '✅' : '⏳'}</td>
                <td>
                  <span className={`badge ${user.isBlocked ? 'badge-danger' : 'badge-success'}`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className={`btn btn-sm ${user.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                    onClick={() => toggleBlock(user._id)}
                  >
                    {user.isBlocked ? <><FiShield /> Unblock</> : <><FiSlash /> Block</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
