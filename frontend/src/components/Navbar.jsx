import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

const navLinks = {
  farmer: [
    { path: '/farmer', label: 'Dashboard' },
    { path: '/farmer/products', label: 'Products' },
    { path: '/farmer/orders', label: 'Orders' },
    { path: '/farmer/delivery', label: 'Delivery' },
    { path: '/farmer/profile', label: 'Profile' },
  ],
  customer: [
    { path: '/customer', label: 'Dashboard' },
    { path: '/customer/browse', label: 'Browse' },
    { path: '/customer/cart', label: 'Cart' },
    { path: '/customer/wishlist', label: 'Wishlist' },
    { path: '/customer/orders', label: 'Orders' },
    { path: '/customer/profile', label: 'Profile' },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/farmers', label: 'Farmers' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/products', label: 'Products' },
  ]
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = user ? (navLinks[user.role] || []) : [];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>🌾</span>
        <span className="brand-text">Farm2Home</span>
      </Link>

      {user && (
        <>
          <button className="navbar-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-user">
            {user.profileImage && (
              <img src={user.profileImage} alt="" className="navbar-avatar" />
            )}
            {!user.profileImage && (
              <div className="navbar-avatar" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem' }}>
                <FiUser />
              </div>
            )}
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </>
      )}

      {!user && (
        <div className="btn-group">
          <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      )}
    </nav>
  );
}
