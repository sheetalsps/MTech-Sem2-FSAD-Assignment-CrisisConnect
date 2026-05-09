import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchResources, createResource, updateResource, deleteResource } from './services/api';

function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    category: '',
    quantity: '',
    location: '',
    status: 'Available',
    description: ''
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
        category: '',
        quantity: '',
        location: '',
        status: 'Available',
        description: ''
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
      category: resource.category,
      quantity: resource.quantity.toString(),
      location: resource.location,
      status: resource.status,
      description: resource.description || ''
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
      category: '',
      quantity: '',
      location: '',
      status: 'Available',
      description: ''
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
            <div className="resource-list">
              {resources.map((resource) => (
                <div key={resource._id} className="resource-item">
                  <div className="resource-header">
                    <h3>{resource.category}</h3>
                    <div className="resource-meta">
                      <span className={`quantity ${resource.quantity < 10 ? 'low' : resource.quantity < 50 ? 'medium' : 'high'}`}>
                        Qty: {resource.quantity}
                      </span>
                      <span className={`status ${resource.status.toLowerCase().replace(' ', '-')}`}>
                        {resource.status}
                      </span>
                    </div>
                  </div>
                  <p className="location">📍 {resource.location}</p>
                  {resource.description && <p className="description">{resource.description}</p>}
                  <div className="resource-actions">
                    <button onClick={() => handleEdit(resource)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(resource._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceManager;