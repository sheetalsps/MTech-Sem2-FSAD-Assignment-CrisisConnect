import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchIncident,
  sendIncidentMessage,
  updateLiveLocation,
  fetchVolunteers,
  staffAssignIncident,
  patchIncidentAssignment
} from './services/api';
import { useAuth } from './AuthContext';

export default function IncidentDetails() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const [incident, setIncident] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [assignVolunteerId, setAssignVolunteerId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIncident();
  }, [id]);

  useEffect(() => {
    async function loadVol() {
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) return;
      try {
        const list = await fetchVolunteers();
        setVolunteers(Array.isArray(list) ? list : []);
      } catch {
        setVolunteers([]);
      }
    }
    loadVol();
  }, [user]);

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

  const handleLivePush = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateLiveLocation(id, pos.coords.latitude, pos.coords.longitude);
          await loadIncident();
        } catch (err) {
          setError(err.message || 'Unable to update location.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to access location.');
        setLoading(false);
      }
    );
  };

  const handleStaffAssign = async (event) => {
    event.preventDefault();
    if (!assignVolunteerId) return;
    const vol = volunteers.find((v) => (v.id || v._id) === assignVolunteerId);
    setLoading(true);
    setError('');
    try {
      await staffAssignIncident(id, {
        volunteerProfileId: assignVolunteerId,
        volunteerUserId: vol?.userId || '',
        volunteerName: vol?.name || '',
        status: 'pending'
      });
      setAssignVolunteerId('');
      await loadIncident();
    } catch (err) {
      setError(err.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const patchAssignment = async (volunteerProfileId, payload) => {
    setLoading(true);
    setError('');
    try {
      await patchIncidentAssignment(id, volunteerProfileId, payload);
      await loadIncident();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const canPostLocation =
    user &&
    (incident?.requester === user.username || hasRole('staff', 'admin'));

  const mapsHref =
    incident?.latitude != null && incident?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`
      : null;

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Request Details</h1>
          <p>Track status, review location, assignments, and chat with responders.</p>
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
                {incident.latitude != null && incident.longitude != null && (
                  <p><strong>Coordinates:</strong> {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</p>
                )}
                <p><strong>Priority:</strong> {incident.priority}</p>
                <p><strong>Created:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
                {mapsHref && (
                  <p>
                    <a className="button small secondary" href={mapsHref} target="_blank" rel="noreferrer">
                      Open navigation in Maps
                    </a>
                  </p>
                )}
                {canPostLocation && (
                  <div className="live-location-block">
                    <p><strong>Share live location</strong></p>
                    <button type="button" className="button small" onClick={handleLivePush} disabled={loading}>
                      Push current GPS to this request
                    </button>
                    <p className="muted small-print">Updates your coordinates and adds a point to the trail below.</p>
                  </div>
                )}
                {(incident.locationHistory?.length > 0) && (
                  <div className="location-trail">
                    <h4>Location trail</h4>
                    <ul>
                      {incident.locationHistory.slice(-8).map((pt, i) => (
                        <li key={i}>
                          {pt.latitude?.toFixed(4)}, {pt.longitude?.toFixed(4)}
                          {' '}
                          <span className="card-meta">
                            {new Date(pt.recordedAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

            <div className="assignments-panel card nested-card">
              <h3>Responder assignments</h3>
              {hasRole('staff', 'admin') && (
                <form className="staff-assign" onSubmit={handleStaffAssign}>
                  <label>
                    Assign approved volunteer
                    <select
                      value={assignVolunteerId}
                      onChange={(e) => setAssignVolunteerId(e.target.value)}
                    >
                      <option value="">Select volunteer record</option>
                      {volunteers
                        .filter((v) => !v.approvalStatus || v.approvalStatus === 'approved')
                        .map((v) => (
                          <option key={v.id || v._id} value={v.id || v._id}>
                            {v.name} — {v.location}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button type="submit" className="button small" disabled={loading || !assignVolunteerId}>
                    Create assignment
                  </button>
                </form>
              )}
              {(incident.assignments || []).length === 0 && (
                <p className="notice">No responders assigned yet.</p>
              )}
              {(incident.assignments || []).map((a) => (
                <div key={a.volunteerProfileId} className="assignment-row">
                  <p>
                    <strong>{a.volunteerName || 'Responder'}</strong>
                    {' '}
                    <span className="pill">{a.status}</span>
                  </p>
                  {a.progressNote && <p className="muted">{a.progressNote}</p>}
                  {hasRole('staff', 'admin') && (
                    <div className="assignment-actions">
                      <button
                        type="button"
                        className="button small secondary"
                        disabled={loading}
                        onClick={() => patchAssignment(a.volunteerProfileId, { status: 'in_progress' })}
                      >
                        Mark in progress
                      </button>
                      <button
                        type="button"
                        className="button small"
                        disabled={loading}
                        onClick={() => patchAssignment(a.volunteerProfileId, { status: 'completed' })}
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
