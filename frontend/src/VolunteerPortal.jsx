import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNearbyIncidents,
  fetchMyAssignments,
  fetchMyVolunteerProfileOrNull,
  offerIncidentHelp,
  patchIncidentAssignment,
  registerVolunteerProfile
} from './services/api';
import { useAuth } from './AuthContext';

export default function VolunteerPortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined);
  const [profileError, setProfileError] = useState('');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    skills: '',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [nearby, setNearby] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [radiusKm, setRadiusKm] = useState(40);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState(null);

  const loadProfile = async () => {
    try {
      const data = await fetchMyVolunteerProfileOrNull();
      setProfile(data);
      setProfileId(data ? (data.id || data._id) : null);
      setProfileError('');
    } catch (err) {
      setProfileError(err.message || 'Unable to load profile');
      setProfile(null);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await fetchMyAssignments();
      setAssignments(data);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAssignments();
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await registerVolunteerProfile({
        name: registerForm.name,
        skills: registerForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        location: registerForm.location,
        latitude: registerForm.latitude ? parseFloat(registerForm.latitude, 10) : undefined,
        longitude: registerForm.longitude ? parseFloat(registerForm.longitude, 10) : undefined
      });
      setNotice('Registration submitted. An coordinator will review your profile.');
      await loadProfile();
      setRegisterForm({ name: '', skills: '', location: '', latitude: '', longitude: '' });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const locateAndSearch = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const data = await fetchNearbyIncidents(latitude, longitude, radiusKm);
          setNearby(data);
        } catch (err) {
          setError(err.message || 'Unable to load nearby incidents');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location permission denied.');
        setLoading(false);
      }
    );
  };

  const handleOffer = async (incidentId) => {
    setLoading(true);
    setError('');
    try {
      await offerIncidentHelp(incidentId);
      setNotice('Your offer has been recorded.');
      await loadAssignments();
    } catch (err) {
      setError(err.message || 'Unable to offer help');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (incidentId, volunteerProfileId, status, progressNote = '') => {
    setLoading(true);
    setError('');
    try {
      await patchIncidentAssignment(incidentId, volunteerProfileId, { status, progressNote });
      await loadAssignments();
      setNotice('Assignment updated.');
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const approval = profile?.approvalStatus;
  const canRespond = approval === 'approved';

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Volunteer hub</h1>
          <p>Complete registration, discover nearby emergencies, and manage your assignments.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      {profileError && <p className="error">{profileError}</p>}

      <section className="card form-card">
        <h2>Responder profile</h2>
        {profile === undefined && <p>Loading profile…</p>}
        {profile === null && (
          <form onSubmit={handleRegister}>
            <p className="notice">Register to appear in the volunteer pool. Staff must approve before you can respond to incidents.</p>
            <label>
              Full name
              <input
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              Skills (comma-separated)
              <input
                value={registerForm.skills}
                onChange={(e) => setRegisterForm({ ...registerForm, skills: e.target.value })}
                placeholder="First Aid, Navigation"
              />
            </label>
            <label>
              Base location
              <input
                value={registerForm.location}
                onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                required
              />
            </label>
            <div className="form-row">
              <label>
                Latitude (optional)
                <input
                  value={registerForm.latitude}
                  onChange={(e) => setRegisterForm({ ...registerForm, latitude: e.target.value })}
                />
              </label>
              <label>
                Longitude (optional)
                <input
                  value={registerForm.longitude}
                  onChange={(e) => setRegisterForm({ ...registerForm, longitude: e.target.value })}
                />
              </label>
            </div>
            <button type="submit" disabled={loading}>Submit registration</button>
          </form>
        )}
        {profile && (
          <div className="profile-summary">
            <p><strong>{profile.name}</strong> — <span className={`pill status-pill ${approval}`}>{approval}</span></p>
            <p>{profile.location} · {(profile.skills || []).join(', ') || 'No skills listed'}</p>
            {approval === 'pending' && (
              <p className="notice">Awaiting approval from operations staff.</p>
            )}
            {approval === 'rejected' && (
              <p className="error">Your registration was not approved. Contact administrators for details.</p>
            )}
          </div>
        )}
      </section>

      <section className="section-panel">
        <div className="section-header">
          <div>
            <h2>Nearby open incidents</h2>
            <p>Use your current GPS position to list emergencies within range.</p>
          </div>
          <div className="volunteer-toolbar">
            <label>
              Radius (km)
              <input
                type="number"
                min="5"
                max="200"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              />
            </label>
            <button type="button" className="button small" onClick={locateAndSearch} disabled={loading}>
              Find near me
            </button>
          </div>
        </div>
        <div className="card-grid">
          {nearby.map(({ incident, distanceKm }) => (
            <article key={incident._id} className="data-card incident-card">
              <div className="card-row">
                <span className="pill type-pill">{incident.type}</span>
                <span className="priority-chip">{incident.priority}</span>
              </div>
              <h3>{incident.location}</h3>
              <p>{incident.description}</p>
              <p className="card-meta">{distanceKm != null ? `${distanceKm.toFixed(1)} km away` : ''}</p>
              <div className="card-actions">
                <Link className="button small secondary" to={`/incidents/${incident._id}`}>Details</Link>
                <button
                  type="button"
                  className="button small"
                  disabled={!canRespond || loading}
                  onClick={() => handleOffer(incident._id)}
                >
                  Offer help
                </button>
              </div>
            </article>
          ))}
        </div>
        {nearby.length === 0 && <p className="notice">Search your area to see incidents.</p>}
      </section>

      <section className="section-panel">
        <div className="section-header">
          <div>
            <h2>My assignments</h2>
            <p>Accept tasks, share progress, and close out completed responses.</p>
          </div>
        </div>
        <div className="assignments-list">
          {assignments.map((incident) => {
            const mine = (incident.assignments || []).filter(
              (a) =>
                a.volunteerUserId === user?.id ||
                (profileId && a.volunteerProfileId === profileId)
            );
            return (
              <article key={incident._id} className="card">
                <h3>{incident.type} — {incident.location}</h3>
                <p className="card-meta">Status: {incident.status}</p>
                {mine.map((a) => (
                  <div key={a.volunteerProfileId} className="assignment-row">
                    <p><strong>{a.volunteerName || 'You'}</strong> · {a.status}</p>
                    {a.progressNote && <p className="muted">{a.progressNote}</p>}
                    <div className="assignment-actions">
                      {a.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="button small"
                            disabled={loading}
                            onClick={() => updateProgress(incident._id, a.volunteerProfileId, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="button small secondary"
                            disabled={loading}
                            onClick={() => updateProgress(incident._id, a.volunteerProfileId, 'rejected')}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {(a.status === 'accepted' || a.status === 'in_progress') && (
                        <>
                          <button
                            type="button"
                            className="button small"
                            disabled={loading}
                            onClick={() => {
                              const note = window.prompt('Progress update', a.progressNote || '');
                              if (note === null) return;
                              updateProgress(incident._id, a.volunteerProfileId, 'in_progress', note);
                            }}
                          >
                            Update progress
                          </button>
                          <button
                            type="button"
                            className="button small secondary"
                            disabled={loading}
                            onClick={() => updateProgress(incident._id, a.volunteerProfileId, 'completed', a.progressNote)}
                          >
                            Mark complete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <Link className="button small secondary" to={`/incidents/${incident._id}`}>Open thread</Link>
              </article>
            );
          })}
          {assignments.length === 0 && <p className="notice">No assignments yet.</p>}
        </div>
      </section>
    </div>
  );
}
