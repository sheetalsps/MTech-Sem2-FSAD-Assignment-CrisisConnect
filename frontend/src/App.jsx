import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchIncidents, fetchVolunteers, fetchResources, createIncident } from './services/api';
import IncidentManager from './IncidentManager';
import ResourceManager from './ResourceManager';

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

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>CrisisConnect</h1>
          <p>Coordinate emergency resources, volunteers, and live help requests.</p>
          <div className="header-actions">
            <Link className="button" to="/request">Submit SOS Request</Link>
            <Link className="button secondary" to="/incidents">Manage Incidents</Link>
            <Link className="button secondary" to="/resources">Manage Resources</Link>
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
          <Link className="button small" to="/incidents">Manage Incidents</Link>
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
          <Link className="button small secondary" to="/resources">Manage Resources</Link>
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
    </div>
  );
}

function RequestForm() {
  const [form, setForm] = useState({ type: '', location: '', description: '' });
  const [status, setStatus] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await createIncident(form);
    setStatus(`SOS sent with priority: ${response.priority}`);
    setForm({ type: '', location: '', description: '' });
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
        </form>
        {status && <p className="notice">{status}</p>}
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/incidents" element={<IncidentManager />} />
      <Route path="/resources" element={<ResourceManager />} />
    </Routes>
  );
}

export default App;
