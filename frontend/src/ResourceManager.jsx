import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchResources, createResource, updateResource, deleteResource } from './services/api';

function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    resourceType: 'general',
    category: '',
    quantity: '',
    location: '',
    status: 'Available',
    description: '',
    wardType: '',
    bedUnitLabel: '',
    bloodGroup: '',
    bloodUrgency: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.category.trim()) newErrors.category = 'Category is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be a positive number';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
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
        quantity: parseInt(form.quantity, 10)
      };

      if (editingId) {
        await updateResource(editingId, payload);
        setEditingId(null);
      } else {
        await createResource(payload);
      }
      setForm({
        resourceType: 'general',
        category: '',
        quantity: '',
        location: '',
        status: 'Available',
        description: '',
        wardType: '',
        bedUnitLabel: '',
        bloodGroup: '',
        bloodUrgency: 'medium'
      });
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setEditingId(resource._id);
    setForm({
      resourceType: resource.resourceType || 'general',
      category: resource.category,
      quantity: resource.quantity.toString(),
      location: resource.location,
      status: resource.status,
      description: resource.description || '',
      wardType: resource.wardType || '',
      bedUnitLabel: resource.bedUnitLabel || '',
      bloodGroup: resource.bloodGroup || '',
      bloodUrgency: resource.bloodUrgency || 'medium'
    });
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setLoading(true);
      try {
        await deleteResource(id);
        loadResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      resourceType: 'general',
      category: '',
      quantity: '',
      location: '',
      status: 'Available',
      description: '',
      wardType: '',
      bedUnitLabel: '',
      bloodGroup: '',
      bloodUrgency: 'medium'
    });
    setErrors({});
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Resource Management</h1>
          <p>View, create, edit, and delete resource inventory.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <div className="resource-manager">
        <div className="form-section">
          <div className="card">
            <h2>{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Resource type
                <select
                  name="resourceType"
                  value={form.resourceType}
                  onChange={handleChange}
                >
                  <option value="general">General supplies</option>
                  <option value="hospital_bed">Hospital beds</option>
                  <option value="blood_request">Blood donation need</option>
                </select>
              </label>
              <div className="form-row">
                <label>
                  Category *
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="e.g., Water Bottles, Medical Supplies"
                    required
                  />
                  {errors.category && <span className="error">{errors.category}</span>}
                </label>
                <label>
                  Quantity *
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 100"
                    required
                  />
                  {errors.quantity && <span className="error">{errors.quantity}</span>}
                </label>
              </div>
              <div className="form-row">
                <label>
                  Location *
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Warehouse A, Sector 12"
                    required
                  />
                  {errors.location && <span className="error">{errors.location}</span>}
                </label>
                <label>
                  Status
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Depleted">Depleted</option>
                  </select>
                </label>
              </div>
              {form.resourceType === 'hospital_bed' && (
                <div className="form-row">
                  <label>
                    Ward / unit type
                    <input name="wardType" value={form.wardType} onChange={handleChange} placeholder="ICU, General" />
                  </label>
                  <label>
                    Bed label
                    <input name="bedUnitLabel" value={form.bedUnitLabel} onChange={handleChange} placeholder="Ward A-12" />
                  </label>
                </div>
              )}
              {form.resourceType === 'blood_request' && (
                <div className="form-row">
                  <label>
                    Blood group
                    <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} placeholder="O+, B-" />
                  </label>
                  <label>
                    Urgency
                    <select name="bloodUrgency" value={form.bloodUrgency} onChange={handleChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>
                </div>
              )}
              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Additional details about the resource"
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Resource' : 'Add Resource'}
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
            <h2>All Resources ({resources.length})</h2>
            {loading && <p>Loading...</p>}
            <div className="resource-grid">
              {resources.map((resource) => (
                <article key={resource._id} className="resource-card">
                  <div className="card-row">
                    <span className="pill resource-pill">
                      {(resource.resourceType || 'general').replace('_', ' ')}
                    </span>
                    <span className="pill resource-pill">{resource.category}</span>
                    <span className={`pill status-pill ${resource.status.toLowerCase().replace(' ', '-')}`}>
                      {resource.status}
                    </span>
                  </div>
                  <h3>{resource.location}</h3>
                  <p className="description">{resource.description || 'No extra details.'}</p>
                  <div className="card-row card-row-alt">
                    <span className="quantity-chip">Qty: {resource.quantity}</span>
                    <span className="card-meta">Updated {new Date(resource.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="resource-actions">
                    <button onClick={() => handleEdit(resource)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(resource._id)} className="delete-btn">
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

export default ResourceManager;