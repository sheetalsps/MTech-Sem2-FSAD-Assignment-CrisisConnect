import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchIncidents, fetchVolunteers, fetchResources, createIncident } from './services/api';
import IncidentManager from './IncidentManager';

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
          </div>
        </div>
      </header>

      <section>
        <h2>Active Incidents</h2>
        <div className="card-grid">
          {incidents.map((incident) => (
            <article key={incident._id} className="card">
              <h3>{incident.type}</h3>
              <p>{incident.description}</p>
              <p><strong>Location:</strong> {incident.location}</p>
              <p><strong>Priority:</strong> {incident.priority}</p>
              <p><strong>Status:</strong> {incident.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="list-panel">
          <div className="card">
            <h2>Volunteers</h2>
            <ul>
              {volunteers.map((volunteer) => (
                <li key={volunteer.id}>
                  {volunteer.name} — {volunteer.skills.join(', ')}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2>Resources</h2>
            <ul>
              {resources.map((resource) => (
                <li key={resource.id}>
                  {resource.category} ({resource.quantity}) — {resource.status}
                </li>
              ))}
            </ul>
          </div>
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
    </Routes>
  );
}

export default App;
