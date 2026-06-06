import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Dashboard() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => { fetchTransactions(); }, []);

  const clearMessages = () => { setMessage(''); setError(''); };

  const fetchTransactions = async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await fetch('/api/employee/transactions', { credentials: 'include' });
      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) { setError('Failed to load transactions.'); return; }
      setTransactions(await res.json());
    } catch {
      setError('Network error. Could not load transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    clearMessages();
    try {
      const res = await fetch(`/api/employee/transactions/${id}/verify`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) { setError('Verification failed. Please try again.'); return; }
      // Update local state without re-fetching
      setTransactions(prev =>
        prev.map(t => t._id === id ? { ...t, status: 'verified' } : t)
      );
      setMessage('Transaction verified successfully.');
    } catch {
      setError('Network error during verification.');
    }
  };

  const handleSubmitSwift = async () => {
    const verifiedCount = transactions.filter(t => t.status === 'verified').length;
    if (verifiedCount === 0) { setError('No verified transactions to submit to SWIFT.'); return; }
    setSubmitting(true);
    clearMessages();
    try {
      const res = await fetch('/api/employee/transactions/submit-swift', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Submission failed.'); return; }
      setMessage(data.message);
      fetchTransactions();
    } catch {
      setError('Network error during SWIFT submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/employee/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  };

  const verifiedCount = transactions.filter(t => t.status === 'verified').length;

  return (
    <>
      <header className="app-header">
        <h1>Global Bank — Payments Portal (Staff)</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.88rem', opacity: 0.9 }}>
            Logged in as: <strong>{user?.username}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ width: 'auto', padding: '0.38rem 0.9rem', marginTop: 0, fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container-wide">
        {error   && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="dashboard-actions">
          <div className="transactions-title">
            Pending Transactions
            {verifiedCount > 0 && (
              <span className="transactions-sub">
                ({verifiedCount} verified — ready for SWIFT)
              </span>
            )}
          </div>
          <div className="dashboard-actions-right">
            <button
              onClick={fetchTransactions}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.5rem 1.1rem', marginTop: 0 }}
            >
              Refresh
            </button>
            <button
              onClick={handleSubmitSwift}
              className="btn btn-primary"
              disabled={verifiedCount === 0 || submitting}
              style={{ width: 'auto', padding: '0.5rem 1.4rem', marginTop: 0 }}
            >
              {submitting ? 'Submitting…' : `Submit to SWIFT (${verifiedCount})`}
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            Loading transactions…
          </p>
        ) : transactions.length === 0 ? (
          <div className="no-transactions">
            No pending or verified transactions at this time.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer Account</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Provider</th>
                  <th>Recipient Account</th>
                  <th>SWIFT Code</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>{tx.customerAccountNumber}</td>
                    <td><strong>{tx.amount.toFixed(2)}</strong></td>
                    <td>{tx.currency}</td>
                    <td>{tx.provider}</td>
                    <td>{tx.recipientAccount}</td>
                    <td><code style={{ fontSize: '0.82rem' }}>{tx.swiftCode}</code></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                    </td>
                    <td>
                      {tx.status === 'pending' ? (
                        <button
                          className="btn-sm btn-verify"
                          onClick={() => handleVerify(tx._id)}
                        >
                          Verify
                        </button>
                      ) : (
                        <span className="verified-mark">✓ Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
