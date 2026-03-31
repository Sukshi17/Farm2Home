import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPhone, FiLock, FiArrowRight } from 'react-icons/fi';

export default function Login() {
  const { login, API, user } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: mobile, 2: otp, 3: admin password
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');

  if (user) {
    navigate(`/${user.role}`, { replace: true });
    return null;
  }

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length !== 10) {
      return toast.error('Enter a valid 10-digit mobile number');
    }

    // Check if admin
    if (mobile === '9999999999') {
      setIsAdmin(true);
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      // STEP 1: Check if user exists BEFORE sending OTP
      await API.post('/auth/check-mobile', { mobile, action: 'login' });

      // STEP 2: User exists — send OTP
      // Dev mode: simulate OTP flow
      toast.success('OTP sent to +91' + mobile + ' (Dev mode: use any 6 digits)');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('Enter a valid 6-digit OTP');
    }

    setLoading(true);
    try {
      // STEP 3: OTP verified — login user
      const res = await API.post('/auth/login', { mobile });
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate(`/${res.data.user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!password) return toast.error('Enter admin password');

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { mobile, password });
      login(res.data.user, res.data.token);
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
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
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back 👋</h1>
        <p className="auth-subtitle">Log in to your Farm2Home account</p>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
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
                  id={`otp-${i}`}
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
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" className="btn btn-secondary w-full mt-1" onClick={() => { setStep(1); setOtp(''); }}>
              Change Number
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label><FiLock style={{ marginRight: 6 }} /> Admin Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Logging in...' : 'Admin Login'}
            </button>
            <button type="button" className="btn btn-secondary w-full mt-1" onClick={() => { setStep(1); setIsAdmin(false); setPassword(''); }}>
              Back
            </button>
          </form>
        )}

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
