import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { validate } from '../utils/validators';

const CURRENCIES = ['USD', 'ZAR', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY'];

const INIT = { amount: '', currency: 'USD', provider: 'SWIFT', recipientAccount: '', swiftCode: '' };
const VALIDATE_FIELDS = ['amount', 'currency', 'recipientAccount', 'swiftCode'];

export default function Payment() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm]         = useState(INIT);
  const [errors, setErrors]     = useState({});
  const [serverError, setSrvErr] = useState('');
  const [successMsg, setSuccess] = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/payments', { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch { /* silently ignore — non-critical */ }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase SWIFT code as user types
    const finalValue = name === 'swiftCode' ? value.toUpperCase() : value;
    setForm(f => ({ ...f, [name]: finalValue }));
    setErrors(prev => ({ ...prev, [name]: validate(name, finalValue) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    for (const name of VALIDATE_FIELDS) {
      const err = validate(name, form[name]);
      if (err) newErrors[name] = err;
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setSrvErr('');
    setSuccess('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setSrvErr(data.message || 'Payment failed.'); return; }
      setSuccess('Payment submitted successfully. It is pending bank review.');
      setForm(INIT);
      fetchHistory();
    } catch {
      setSrvErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      <header className="app-header">
        <h1>Global Bank - International Payments</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.88rem', opacity: 0.9 }}>Welcome, {user?.fullName}</span>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ width: 'auto', padding: '0.38rem 0.9rem', marginTop: 0, fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container" style={{ maxWidth: '560px' }}>
        <div className="card">
          <h2>International Payment</h2>
          {serverError && <div className="alert alert-error">{serverError}</div>}
          {successMsg  && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount" name="amount" type="text"
                  value={form.amount} onChange={handleChange}
                  placeholder="0.00"
                  className={errors.amount ? 'error' : ''}
                />
                {errors.amount && <div className="field-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select id="currency" name="currency" value={form.currency} onChange={handleChange}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="provider">Provider</label>
              <input
                id="provider" name="provider" type="text"
                value="SWIFT" readOnly
                title="Only SWIFT is supported for international transfers"
              />
            </div>

            <div className="form-group">
              <label htmlFor="recipientAccount">Recipient Account Number</label>
              <input
                id="recipientAccount" name="recipientAccount" type="text"
                value={form.recipientAccount} onChange={handleChange}
                placeholder="10–12 digit account number"
                className={errors.recipientAccount ? 'error' : ''}
              />
              {errors.recipientAccount && <div className="field-error">{errors.recipientAccount}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="swiftCode">SWIFT Code</label>
              <input
                id="swiftCode" name="swiftCode" type="text"
                value={form.swiftCode} onChange={handleChange}
                placeholder="e.g. ABCDEF12 or ABCDEF12XXX"
                className={errors.swiftCode ? 'error' : ''}
                maxLength={11}
              />
              {errors.swiftCode && <div className="field-error">{errors.swiftCode}</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Pay Now'}
            </button>
          </form>
        </div>

        {history.length > 0 && (
          <div className="payment-history">
            <h3>Your Recent Payments</h3>
            {history.map(tx => (
              <div key={tx._id} className="payment-item">
                <div>
                  <div className="amount">{tx.amount.toFixed(2)} {tx.currency}</div>
                  <div className="details">
                    To: {tx.recipientAccount} &middot; SWIFT: {tx.swiftCode} &middot;{' '}
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge badge-${tx.status}`}>{tx.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
