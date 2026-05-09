import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRequests } from './services/api';

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Unable to load your requests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>My SOS Requests</h1>
          <p>View the requests you submitted and track their current status.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <main className="card list-card">
        {error && <p className="error">{error}</p>}
        {loading && <p>Loading your requests...</p>}

        <div className="card-grid">
          {requests.map((request) => (
            <article key={request._id} className="data-card incident-card">
              <div className="card-row">
                <span className="pill type-pill">{request.type}</span>
                <span className={`pill status-pill ${request.status.toLowerCase().replace(' ', '-')}`}>
                  {request.status}
                </span>
              </div>
              <h3>{request.location}</h3>
              <p>{request.description || 'No description provided.'}</p>
              <div className="card-row card-row-alt">
                <span className={`priority-chip ${request.priority.toLowerCase()}`}>{request.priority}</span>
                <span className="card-meta">Created {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="incident-actions">
                <Link className="button small secondary" to={`/incidents/${request._id}`}>
                  Track Request
                </Link>
              </div>
            </article>
          ))}
          {!loading && requests.length === 0 && (
            <p className="notice">You have no SOS requests yet. Submit one from the dashboard.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyRequests;
