import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validate = (name, value) => {
  if (name === 'username' && !USERNAME_PATTERN.test(value))
    return 'Username must be 3–30 alphanumeric characters or underscores.';
  if (name === 'password' && !PASSWORD_PATTERN.test(value))
    return 'Password must be 8+ characters with uppercase, lowercase, digit and special character.';
  return '';
};

export default function Login() {
  const { setUser } = useContext(AuthContext);
  const navigate    = useNavigate();

  const [form, setForm]         = useState({ username: '', password: '' });
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
      const res = await fetch('/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setSrvErr(data.message || 'Login failed.'); return; }
      setUser({ username: data.username });
      navigate('/dashboard');
    } catch {
      setSrvErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>Global Bank — Payments Portal (Staff)</h1>
      </header>
      <div className="container">
        <div className="card">
          <h2>Staff Login</h2>
          {serverError && <div className="alert alert-error">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username" name="username" type="text"
                value={form.username} onChange={handleChange}
                className={errors.username ? 'error' : ''}
                autoComplete="username"
              />
              {errors.username && <div className="field-error">{errors.username}</div>}
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
          <p className="staff-note">
            Staff accounts are pre-configured. Contact your administrator for access.
          </p>
        </div>
      </div>
    </>
  );
}
