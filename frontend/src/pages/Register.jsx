import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPhone, FiUser, FiArrowRight } from 'react-icons/fi';

export default function Register() {
  const { login, API, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: role+mobile, 2: otp, 3: name
  const [role, setRole] = useState('');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(`/${user.role}`, { replace: true });
    return null;
  }

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!role) return toast.error('Please select a role');
    if (!mobile || mobile.length !== 10) return toast.error('Enter a valid 10-digit mobile number');

    setLoading(true);
    try {
      // STEP 1: Check if mobile is already registered BEFORE sending OTP
      await API.post('/auth/check-mobile', { mobile, action: 'register' });

      // STEP 2: Mobile is available — send OTP
      // Dev mode: simulate OTP
      toast.success('OTP sent to +91' + mobile + ' (Dev mode: use any 6 digits)');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');

    setLoading(true);
    try {
      // OTP verified — create minimal user in backend (mobile + role only)
      await API.post('/auth/verify-otp', { mobile, role });
      toast.success('OTP verified! Please enter your name.');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'OTP verification failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');

    setLoading(true);
    try {
      // STEP 3: UPDATE existing user with name — NOT a new insert
      const res = await API.post('/auth/complete-profile', { mobile, name });
      login(res.data.user, res.data.token);
      toast.success('Registration successful! Welcome to Farm2Home 🎉');
      navigate(`/${role}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = otp.split('');
    while (newOtp.length < 6) newOtp.push('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));
    if (value && index < 5) {
      const next = document.getElementById(`reg-otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`reg-otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account 🌱</h1>
        <p className="auth-subtitle">Join Farm2Home today</p>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              I am a...
            </label>
            <div className="role-selector">
              <div
                className={`role-option ${role === 'farmer' ? 'selected' : ''}`}
                onClick={() => setRole('farmer')}
              >
                <span className="role-option-icon">🧑‍🌾</span>
                <span className="role-option-label">Farmer</span>
              </div>
              <div
                className={`role-option ${role === 'customer' ? 'selected' : ''}`}
                onClick={() => setRole('customer')}
              >
                <span className="role-option-icon">🛒</span>
                <span className="role-option-label">Customer</span>
              </div>
            </div>

            <div className="form-group">
              <label><FiPhone style={{ marginRight: 6 }} /> Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Checking...' : 'Send OTP'} <FiArrowRight />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <p className="text-center text-secondary mb-2">
              Enter the 6-digit OTP sent to +91{mobile}
            </p>
            <div className="otp-input-group">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  id={`reg-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" className="btn btn-secondary w-full mt-1" onClick={() => { setStep(1); setOtp(''); }}>
              Change Number
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label><FiUser style={{ marginRight: 6 }} /> Your Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Complete Registration'} 🎉
            </button>
          </form>
        )}

        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
