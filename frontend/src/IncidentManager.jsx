import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchIncidents, createIncident, updateIncident, deleteIncident } from './services/api';
import { log } from './logger';

function IncidentManager() {
  const [incidents, setIncidents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: '',
    location: '',
    description: '',
    priority: 'Medium',
    status: 'Open'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (error) {
      log.error('Error loading incidents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateIncident(editingId, form);
        setEditingId(null);
      } else {
        await createIncident(form);
      }
      setForm({
        type: '',
        location: '',
        description: '',
        priority: 'Medium',
        status: 'Open'
      });
      loadIncidents();
    } catch (error) {
      log.error('Error saving incident', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (incident) => {
    setEditingId(incident._id);
    setForm({
      type: incident.type,
      location: incident.location,
      description: incident.description,
      priority: incident.priority,
      status: incident.status
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      setLoading(true);
      try {
        await deleteIncident(id);
        loadIncidents();
      } catch (error) {
        log.error('Error deleting incident', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      type: '',
      location: '',
      description: '',
      priority: 'Medium',
      status: 'Open'
    });
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Incident Management</h1>
          <p>View, create, edit, and delete incident reports.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <div className="incident-manager">
        <div className="form-section">
          <div className="card">
            <h2>{editingId ? 'Edit Incident' : 'Create New Incident'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Type
                  <input
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    placeholder="Medical, Shelter, Food"
                    required
                  />
                </label>
                <label>
                  Priority
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>
              </div>
              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Sector 12 or Main Road"
                  required
                />
              </label>
              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the incident"
                  required
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Incident' : 'Create Incident'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="secondary">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="list-section">
          <div className="card">
            <h2>All Incidents ({incidents.length})</h2>
            {loading && <p>Loading...</p>}
            <div className="incident-grid">
              {incidents.map((incident) => (
                <article key={incident._id} className="incident-card">
                  <div className="card-row">
                    <span className="pill type-pill">{incident.type}</span>
                    <span className={`pill status-pill ${incident.status.toLowerCase().replace(' ', '-')}`}>
                      {incident.status}
                    </span>
                  </div>
                  <h3>{incident.location}</h3>
                  <p className="description">{incident.description}</p>
                  <div className="card-row card-row-alt">
                    <span className={`priority-chip ${incident.priority.toLowerCase()}`}>{incident.priority}</span>
                    <span className="card-meta">Updated {new Date(incident.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="incident-actions">
                    <button onClick={() => handleEdit(incident)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(incident._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentManager;