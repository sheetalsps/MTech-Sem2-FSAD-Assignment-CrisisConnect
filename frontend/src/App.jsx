import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  fetchIncidents,
  fetchVolunteers,
  fetchResources,
  createIncident,
  fetchBroadcasts
} from './services/api';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import IncidentManager from './IncidentManager';
import IncidentDetails from './IncidentDetails';
import MyRequests from './MyRequests';
import ResourceManager from './ResourceManager';
import VolunteerManager from './VolunteerManager';
import AdminDashboard from './AdminDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import VolunteerPortal from './VolunteerPortal';
import Login from './Login';
import Signup from './Signup';
import AppLayout from './components/AppLayout';

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const vol = await fetchVolunteers();
        setVolunteers(vol);
      } catch {
        setVolunteers([]);
      }

      if (!user) {
        setIncidents([]);
        setResources([]);
        setBroadcasts([]);
        return;
      }

      try {
        const [inc, res, bc] = await Promise.all([
          fetchIncidents(),
          fetchResources(),
          fetchBroadcasts().catch(() => [])
        ]);
        setIncidents(inc);
        setResources(res);
        setBroadcasts(Array.isArray(bc) ? bc.slice(0, 5) : []);
      } catch {
        setIncidents([]);
        setResources([]);
        setBroadcasts([]);
      }
    }
    load();
  }, [user]);

  return (
    <div className="page">
      <header className="hero hero-dashboard">
        <div>
          <h1>Operations dashboard</h1>
          <p>Coordinate emergency resources, volunteers, and live help requests. Use the menu above to move between sections.</p>
          <div className="hero-quick-links">
            <Link className="button" to="/request">Submit SOS</Link>
            {user && (
              <Link className="button secondary" to="/my-requests">My requests</Link>
            )}
          </div>
        </div>
      </header>

      {broadcasts.length > 0 && (
        <section className="broadcast-banner-stack">
          {broadcasts.map((b) => (
            <div key={b._id} className={`broadcast-banner severity-${b.severity}`}>
              <strong>{b.title}</strong>
              <span>{b.message}</span>
            </div>
          ))}
        </section>
      )}

      <section className="dashboard-summary">
        <div className="stats-grid">
          <article className="stat-card primary">
            <p className="stat-label">Live Incidents</p>
            <h3>{user ? incidents.length : '—'}</h3>
          </article>
          <article className="stat-card accent">
            <p className="stat-label">Available Resources</p>
            <h3>{user ? resources.length : '—'}</h3>
          </article>
          <article className="stat-card secondary">
            <p className="stat-label">Volunteers Ready</p>
            <h3>{volunteers.length}</h3>
          </article>
        </div>
      </section>

      <section className="section-panel">
        <div className="section-header">
          <div>
            <h2>Active Incidents</h2>
            <p>Prioritized emergency requests from the field.</p>
            {!user && <p className="notice inline-notice">Sign in to view live incident detail and tracking links.</p>}
          </div>
          {hasRole('staff', 'admin') && (
            <Link className="button small" to="/incidents">Manage Incidents</Link>
          )}
        </div>

        <div className="card-grid">
          {!user && (
            <p className="notice">Incident summaries require an authenticated session.</p>
          )}
          {incidents.map((incident) => (
            <article key={incident._id} className="data-card incident-card">
              <div className="card-row">
                <span className="pill type-pill">{incident.type}</span>
                <span className={`pill status-pill ${incident.status.toLowerCase().replace(' ', '-')}`}>
                  {incident.status}
                </span>
              </div>
              <h3>{incident.location}</h3>
              <p>{incident.description}</p>
              <div className="card-row card-row-alt">
                <span className={`priority-chip ${incident.priority.toLowerCase()}`}>
                  {incident.priority}
                </span>
                <span className="card-meta">Created {new Date(incident.createdAt).toLocaleDateString()}</span>
              </div>
              {user && (
                <Link className="button small secondary" to={`/incidents/${incident._id}`}>
                  Track Request
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-header">
          <div>
            <h2>Resource Inventory</h2>
            <p>Current supply status for urgent operations.</p>
          </div>
          {hasRole('staff', 'admin') && (
            <Link className="button small" to="/resources">Manage Resources</Link>
          )}
        </div>

        <div className="card-grid">
          {!user && <p className="notice">Log in to browse full resource inventory.</p>}
          {resources.map((resource) => (
            <article key={resource._id} className="data-card resource-card">
              <div className="card-row">
                <span className="pill resource-pill">{resource.category}</span>
                <span className={`pill status-pill ${resource.status.toLowerCase().replace(' ', '-')}`}>
                  {resource.status}
                </span>
              </div>
              <h3>{resource.location}</h3>
              <p>{resource.description || 'No description provided.'}</p>
              <div className="card-row card-row-alt">
                <span className="quantity-chip">Qty: {resource.quantity}</span>
                <span className="card-meta">Updated {new Date(resource.updatedAt).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-header">
          <div>
            <h2>Volunteer Roster</h2>
            <p>Active team members available for on-the-ground response.</p>
          </div>
          {hasRole('staff', 'admin') && (
            <Link className="button small" to="/volunteers">Manage Volunteers</Link>
          )}
        </div>

        <div className="card-grid">
          {volunteers.map((volunteer) => (
            <article key={volunteer.id || volunteer._id} className="data-card resource-card">
              <div className="card-row">
                <span className="pill type-pill">{volunteer.name}</span>
                <span className={`pill status-pill ${volunteer.available ? 'available' : 'depleted'}`}>
                  {volunteer.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h3>{volunteer.location}</h3>
              <p>{(volunteer.skills || []).join(', ') || 'No skills listed.'}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RequestForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    media: []
  });
  const [fileNames, setFileNames] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setError('');
  };

  const handleMediaChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const media = await Promise.all(selectedFiles.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    setForm({ ...form, media });
    setFileNames(selectedFiles.map((file) => file.name));
    setError('');
  };

  const shareCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setForm({
        ...form,
        latitude,
        longitude,
        location: `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`
      });
      setStatus('Live location attached to the request.');
    }, () => {
      setError('Unable to access your location. Please allow location permissions.');
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('Please log in before submitting an SOS request.');
      return;
    }

    try {
      const response = await createIncident({ ...form, requester: user.username });
      setStatus(`SOS sent with priority: ${response.priority}`);
      setForm({ type: '', location: '', latitude: '', longitude: '', description: '', media: [] });
      setFileNames([]);
    } catch (err) {
      setError(err.message || 'Unable to submit SOS.');
    }
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Submit SOS Request</h1>
          <p>Share incident details and get a priority score from the AI service.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <main className="card form-card">
        {!user ? (
          <div className="notice-block">
            <p className="notice">You must be logged in before submitting an SOS request.</p>
            <Link className="button" to="/login">Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Incident Type
              <input name="type" value={form.type} onChange={handleChange} placeholder="Medical, Shelter, Food" required />
            </label>
            <label>
              Location
              <div className="location-row">
                <input name="location" value={form.location} onChange={handleChange} placeholder="Sector 12 or Main Road" required />
                <button type="button" className="button secondary small" onClick={shareCurrentLocation}>
                  Use Current Location
                </button>
              </div>
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the emergency" required />
            </label>
            <label>
              Attach images/videos
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaChange}
              />
            </label>
            {fileNames.length > 0 && (
              <div className="file-list">
                <strong>Attached files:</strong>
                <ul>{fileNames.map((name) => <li key={name}>{name}</li>)}</ul>
              </div>
            )}
            <button type="submit">Send SOS</button>
            {error && <p className="error">{error}</p>}
            {status && <p className="notice">{status}</p>}
          </form>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/request" element={<RequestForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute roles={[ 'staff', 'admin' ]}>
                <IncidentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <IncidentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute roles={[ 'staff', 'admin' ]}>
                <ResourceManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteers"
            element={
              <ProtectedRoute roles={[ 'staff', 'admin' ]}>
                <VolunteerManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[ 'admin' ]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={[ 'staff', 'admin' ]}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute roles={[ 'volunteer' ]}>
                <VolunteerPortal />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
