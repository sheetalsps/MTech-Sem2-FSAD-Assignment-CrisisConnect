import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  patchVolunteerApproval
} from './services/api';

function VolunteerManager() {
  const [volunteers, setVolunteers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    skills: '',
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const data = await fetchVolunteers();
      setVolunteers(data);
    } catch (error) {
      console.error('Error loading volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        available: form.available
      };

      if (editingId) {
        await updateVolunteer(editingId, payload);
        setEditingId(null);
      } else {
        await createVolunteer(payload);
      }
      setForm({ name: '', location: '', skills: '', available: true });
      await loadVolunteers();
    } catch (error) {
      console.error('Error saving volunteer:', error);
    } finally {
      setLoading(false);
    }
  };

  const volunteerKey = (v) => v.id || v._id;

  const handleApproval = async (volunteerId, approvalStatus) => {
    setLoading(true);
    try {
      await patchVolunteerApproval(volunteerId, approvalStatus);
      await loadVolunteers();
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (volunteer) => {
    setEditingId(volunteerKey(volunteer));
    setForm({
      name: volunteer.name,
      location: volunteer.location,
      skills: (volunteer.skills || []).join(', '),
      available: volunteer.available
    });
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this volunteer?')) return;
    setLoading(true);
    try {
      await deleteVolunteer(id);
      await loadVolunteers();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', location: '', skills: '', available: true });
    setErrors({});
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Volunteer Management</h1>
          <p>Track volunteers, update availability, and keep the roster current.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <div className="resource-manager">
        <div className="form-section">
          <div className="card">
            <h2>{editingId ? 'Edit Volunteer' : 'Add New Volunteer'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Name *
                <input name="name" value={form.name} onChange={handleChange} placeholder="Volunteer name" required />
                {errors.name && <span className="error">{errors.name}</span>}
              </label>
              <label>
                Location *
                <input name="location" value={form.location} onChange={handleChange} placeholder="Current base location" required />
                {errors.location && <span className="error">{errors.location}</span>}
              </label>
              <label>
                Skills
                <input name="skills" value={form.skills} onChange={handleChange} placeholder="Comma-separated skills" />
              </label>
              <label className="checkbox-label">
                <input name="available" type="checkbox" checked={form.available} onChange={handleChange} />
                Available for deployment
              </label>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Volunteer' : 'Add Volunteer'}
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
            <h2>Volunteer Roster ({volunteers.length})</h2>
            {loading && <p>Loading volunteers...</p>}
            <div className="resource-grid">
              {volunteers.map((volunteer) => (
                <article key={volunteerKey(volunteer)} className="resource-card">
                  <div className="card-row">
                    <span className="pill type-pill">{volunteer.name}</span>
                    <span className={`pill status-pill approval-${volunteer.approvalStatus || 'approved'}`}>
                      {volunteer.approvalStatus || 'approved'}
                    </span>
                    <span className={`pill status-pill ${volunteer.available ? 'available' : 'depleted'}`}>
                      {volunteer.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="card-meta">{volunteer.username ? `@${volunteer.username}` : 'Manual roster entry'}</p>
                  <h3>{volunteer.location}</h3>
                  <p className="description">{(volunteer.skills || []).join(', ') || 'No skills listed.'}</p>
                  {volunteer.approvalStatus === 'pending' && (
                    <div className="approval-actions">
                      <button
                        type="button"
                        className="button small"
                        onClick={() => handleApproval(volunteerKey(volunteer), 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button small secondary"
                        onClick={() => handleApproval(volunteerKey(volunteer), 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  <div className="resource-actions">
                    <button onClick={() => handleEdit(volunteer)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(volunteerKey(volunteer))} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!loading && volunteers.length === 0 && <p className="notice">No volunteers available yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerManager;
