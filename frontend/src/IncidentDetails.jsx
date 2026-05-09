import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIncident, sendIncidentMessage } from './services/api';
import { useAuth } from './AuthContext';

export default function IncidentDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIncident(id);
      setIncident(data);
    } catch (err) {
      setError(err.message || 'Unable to load request details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      await sendIncidentMessage(id, message.trim());
      setMessage('');
      await loadIncident();
    } catch (err) {
      setError(err.message || 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Request Details</h1>
          <p>Track status, review location, and chat with responders.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <main className="card form-card">
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {incident && (
          <>
            <div className="section-header">
              <div>
                <h2>{incident.type}</h2>
                <p>{incident.description || 'No description provided.'}</p>
              </div>
              <span className={`pill status-pill ${incident.status.toLowerCase().replace(' ', '-')}`}>
                {incident.status}
              </span>
            </div>
            <div className="details-grid">
              <div>
                <p><strong>Requested by:</strong> {incident.requester || 'Anonymous'}</p>
                <p><strong>Location:</strong> {incident.location}</p>
                {incident.latitude && incident.longitude && (
                  <p><strong>Coordinates:</strong> {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</p>
                )}
                <p><strong>Priority:</strong> {incident.priority}</p>
                <p><strong>Created:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
              </div>
              <div className="media-panel">
                <h3>Media attachments</h3>
                {incident.media?.length > 0 ? (
                  <div className="media-list">
                    {incident.media.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="media-item">
                        {item.type.startsWith('image/') ? (
                          <img src={item.data} alt={item.name} />
                        ) : (
                          <video controls src={item.data} />
                        )}
                        <p>{item.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No attachments shared.</p>
                )}
              </div>
            </div>

            <div className="chat-panel">
              <h3>Responder chat</h3>
              <div className="chat-messages">
                {incident.chat?.length > 0 ? (
                  incident.chat.map((entry, index) => (
                    <div key={index} className="chat-message">
                      <span className="chat-sender">{entry.sender}</span>
                      <p>{entry.message}</p>
                      <span className="chat-time">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="notice">No messages yet. Use the chat below to connect with responders.</p>
                )}
              </div>
              <form className="chat-form" onSubmit={handleSendMessage}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={user ? 'Type your message to responders...' : 'Log in to send chat messages.'}
                  disabled={!user}
                  required
                />
                <div className="chat-actions">
                  <button type="submit" disabled={!user || !message.trim() || loading}>
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
