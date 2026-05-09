import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchIncidents, fetchVolunteers, fetchResources, createIncident } from './services/api';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import IncidentManager from './IncidentManager';
import ResourceManager from './ResourceManager';
import VolunteerManager from './VolunteerManager';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import Signup from './Signup';

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    async function load() {
      setIncidents(await fetchIncidents());
      setVolunteers(await fetchVolunteers());
      setResources(await fetchResources());
    }
    load();
  }, []);

  const { user, logout, hasRole } = useAuth();

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="hero-row">
            <div>
              <h1>CrisisConnect</h1>
              <p>Coordinate emergency resources, volunteers, and live help requests.</p>
            </div>
            <div className="user-box">
              {user ? (
                <>
                  <span className="user-pill">{user.username}</span>
                  <span className="role-pill">{user.role}</span>
                  <button className="text-button" onClick={logout}>Logout</button>
                </>
              ) : (
                <>
                  <Link className="button secondary" to="/login">Login</Link>
                  <Link className="button" to="/signup">Signup</Link>
                </>
              )}
            </div>
          </div>
          <div className="header-actions">
            <Link className="button" to="/request">Submit SOS Request</Link>
            {hasRole('staff', 'admin') && <Link className="button secondary" to="/incidents">Manage Incidents</Link>}
            {hasRole('staff', 'admin') && <Link className="button secondary" to="/resources">Manage Resources</Link>}
            {hasRole('staff', 'admin') && <Link className="button secondary" to="/volunteers">Manage Volunteers</Link>}
            {hasRole('admin') && <Link className="button secondary" to="/admin">Admin Users</Link>}
          </div>
        </div>
      </header>

      <section className="dashboard-summary">
        <div className="stats-grid">
          <article className="stat-card primary">
            <p className="stat-label">Live Incidents</p>
            <h3>{incidents.length}</h3>
          </article>
          <article className="stat-card accent">
            <p className="stat-label">Available Resources</p>
            <h3>{resources.length}</h3>
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
          </div>
          {hasRole('staff', 'admin') && (
            <Link className="button small" to="/incidents">Manage Incidents</Link>
          )}
        </div>

        <div className="card-grid">
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
            <article key={volunteer.id} className="data-card resource-card">
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
  const [form, setForm] = useState({ type: '', location: '', description: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('Please log in before submitting an SOS request.');
      return;
    }

    try {
      const response = await createIncident(form);
      setStatus(`SOS sent with priority: ${response.priority}`);
      setForm({ type: '', location: '', description: '' });
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
              <input name="location" value={form.location} onChange={handleChange} placeholder="Sector 12 or Main Road" required />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the emergency" required />
            </label>
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
      </Routes>
    </AuthProvider>
  );
}

export default App;
