import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { validate } from '../utils/validators';

export default function Login() {
  const { setUser } = useContext(AuthContext);
  const navigate    = useNavigate();
  const location    = useLocation();
  const successMsg  = location.state?.success || '';

  const [form, setForm]         = useState({ accountNumber: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [serverError, setSrvErr] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    for (const [name, value] of Object.entries(form)) {
      const err = validate(name, value);
      if (err) newErrors[name] = err;
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setSrvErr('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setSrvErr(data.message || 'Login failed.'); return; }
      setUser({ fullName: data.fullName, accountNumber: data.accountNumber });
      navigate('/payment');
    } catch {
      setSrvErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>Global Bank - International Payments</h1>
      </header>
      <div className="container">
        <div className="card">
          <h2>Customer Login</h2>
          {successMsg  && <div className="alert alert-success">{successMsg}</div>}
          {serverError && <div className="alert alert-error">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="accountNumber">Account Number</label>
              <input
                id="accountNumber" name="accountNumber" type="text"
                value={form.accountNumber} onChange={handleChange}
                placeholder="10–12 digit account number"
                className={errors.accountNumber ? 'error' : ''}
                autoComplete="username"
              />
              {errors.accountNumber && <div className="field-error">{errors.accountNumber}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                value={form.password} onChange={handleChange}
                className={errors.password ? 'error' : ''}
                autoComplete="current-password"
              />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
          <div className="link-text">
            New customer? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
