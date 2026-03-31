import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
    if (user.role === 'customer') return <Navigate to="/customer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return (
    <div className="landing-hero">
      <div className="landing-content fade-in">
        <div className="landing-icon">🌾</div>
        <h1 className="landing-title">
          Fresh from <span className="highlight">Farm</span> to Your <span className="highlight">Home</span>
        </h1>
        <p className="landing-subtitle">
          Connect directly with local farmers. Get fresh, organic produce delivered to your doorstep. 
          No middlemen, no markup — just pure farm goodness.
        </p>
        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">
            🚀 Get Started
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon">🧑‍🌾</span>
            <h3>For Farmers</h3>
            <p>List your produce, manage orders, and earn directly without intermediaries.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🛒</span>
            <h3>For Customers</h3>
            <p>Browse fresh products, order easily, and track delivery in real-time.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🔒</span>
            <h3>Secure & Verified</h3>
            <p>OTP authentication, verified farmers, and secure UPI payments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
