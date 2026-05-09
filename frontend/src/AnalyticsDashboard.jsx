import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAnalyticsSummary,
  fetchBroadcasts,
  createBroadcast
} from './services/api';
import { useAuth } from './AuthContext';

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', severity: 'warning' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, b] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchBroadcasts()
      ]);
      setSummary(s);
      setBroadcasts(b);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBroadcast = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setLoading(true);
    try {
      await createBroadcast(form);
      setForm({ title: '', message: '', severity: 'warning' });
      await load();
    } catch (err) {
      setError(err.message || 'Broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  const barPct = (value, max) => {
    if (!max) return 0;
    return Math.min(100, Math.round((value / max) * 100));
  };

  const maxStatus = summary
    ? Math.max(...Object.values(summary.byStatus || {}), 1)
    : 1;
  const maxPriority = summary
    ? Math.max(...Object.values(summary.byPriority || {}), 1)
    : 1;

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Operations analytics</h1>
          <p>Incident volume, assignment load, and emergency broadcasts.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && !summary && <p>Loading…</p>}

      {summary && (
        <section className="dashboard-summary">
          <div className="stats-grid">
            <article className="stat-card primary">
              <p className="stat-label">Total incidents</p>
              <h3>{summary.totalIncidents}</h3>
            </article>
            <article className="stat-card accent">
              <p className="stat-label">New (7 days)</p>
              <h3>{summary.createdLast7Days}</h3>
            </article>
            <article className="stat-card secondary">
              <p className="stat-label">Active assignment rows</p>
              <h3>{summary.activeAssignments}</h3>
            </article>
          </div>

          <div className="analytics-bars card">
            <h3>By status</h3>
            {(Object.entries(summary.byStatus || {})).map(([label, value]) => (
              <div key={label} className="bar-row">
                <span>{label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill status"
                    style={{ width: `${barPct(value, maxStatus)}%` }}
                  />
                </div>
                <span className="bar-value">{value}</span>
              </div>
            ))}
          </div>

          <div className="analytics-bars card">
            <h3>By priority</h3>
            {(Object.entries(summary.byPriority || {})).map(([label, value]) => (
              <div key={label} className="bar-row">
                <span>{label}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill priority ${label.toLowerCase()}`}
                    style={{ width: `${barPct(value, maxPriority)}%` }}
                  />
                </div>
                <span className="bar-value">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {user?.role === 'admin' && (
        <section className="card form-card broadcast-admin">
          <h2>Broadcast emergency alert</h2>
          <p className="muted">Visible to all signed-in responders and citizens on the dashboard.</p>
          <form onSubmit={handleBroadcast}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Message
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={4}
              />
            </label>
            <label>
              Severity
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <button type="submit" disabled={loading}>Send broadcast</button>
          </form>
        </section>
      )}

      <section className="section-panel">
        <h2>Recent broadcasts</h2>
        <div className="broadcast-list">
          {broadcasts.map((b) => (
            <article key={b._id} className={`broadcast-item severity-${b.severity}`}>
              <div className="card-row">
                <strong>{b.title}</strong>
                <span className="pill">{b.severity}</span>
              </div>
              <p>{b.message}</p>
              <p className="card-meta">
                {b.createdBy} · {new Date(b.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
          {!broadcasts.length && <p className="notice">No broadcasts yet.</p>}
        </div>
      </section>
    </div>
  );
}
