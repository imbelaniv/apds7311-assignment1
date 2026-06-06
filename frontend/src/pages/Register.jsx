import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validate, ERROR_MESSAGES } from '../utils/validators';

const FIELDS = [
  { name: 'fullName',       label: 'Full Name',       type: 'text',     placeholder: 'e.g. John Doe' },
  { name: 'idNumber',       label: 'SA ID Number',    type: 'text',     placeholder: '13-digit ID number' },
  { name: 'accountNumber',  label: 'Account Number',  type: 'text',     placeholder: '10–12 digit account number' },
  { name: 'password',       label: 'Password',        type: 'password', placeholder: '' },
  { name: 'confirmPassword',label: 'Confirm Password',type: 'password', placeholder: '' }
];

const INIT = { fullName: '', idNumber: '', accountNumber: '', password: '', confirmPassword: '' };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]         = useState(INIT);
  const [errors, setErrors]     = useState({});
  const [serverError, setSrvErr] = useState('');
  const [loading, setLoading]   = useState(false);

  const getError = (name, value, currentForm) => {
    if (name === 'confirmPassword') {
      return value === (currentForm || form).password ? '' : 'Passwords do not match.';
    }
    return validate(name, value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors(prev => ({ ...prev, [name]: getError(name, value, next) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    for (const { name } of FIELDS) {
      const err = getError(name, form[name], form);
      if (err) newErrors[name] = err;
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setSrvErr('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName:      form.fullName,
          idNumber:      form.idNumber,
          accountNumber: form.accountNumber,
          password:      form.password
        })
      });
      const data = await res.json();
      if (!res.ok) { setSrvErr(data.message || 'Registration failed.'); return; }
      navigate('/login', { state: { success: 'Registration successful. Please log in.' } });
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
          <h2>Create Account</h2>
          {serverError && <div className="alert alert-error">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            {FIELDS.map(({ name, label, type, placeholder }) => (
              <div className="form-group" key={name}>
                <label htmlFor={name}>{label}</label>
                <input
                  id={name} name={name} type={type}
                  value={form[name]} onChange={handleChange}
                  placeholder={placeholder}
                  className={errors[name] ? 'error' : ''}
                  autoComplete={type === 'password' ? 'new-password' : 'off'}
                />
                {errors[name] && <div className="field-error">{errors[name]}</div>}
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>
          <div className="link-text">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
