import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchResources } from './services/api';
import { log } from './logger';
import { useAuth } from './AuthContext';

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: '', label: 'All statuses' },
  { value: 'In Use', label: 'In use' },
  { value: 'Depleted', label: 'Depleted' },
  { value: 'Reserved', label: 'Reserved' }
];

function resourceTypeLabel(t) {
  if (t === 'hospital_bed') return 'Hospital bed';
  if (t === 'blood_request') return 'Blood bank';
  return 'General';
}

function statusClass(status) {
  return status ? status.toLowerCase().replace(/\s+/g, '-') : '';
}

export default function EquipmentDashboard() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInput, setCategoryInput] = useState('');
  const [debouncedCategory, setDebouncedCategory] = useState('');
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCategory(categoryInput.trim()), 350);
    return () => clearTimeout(t);
  }, [categoryInput]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const query = {};
        if (debouncedCategory) query.category = debouncedCategory;
        if (status) query.status = status;
        const data = await fetchResources(query);
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        log.error('Failed to load equipment', e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedCategory, status]);

  return (
    <div className="page" aria-busy={loading}>
      <header className="hero small">
        <div>
          <h1>Equipment listing</h1>
          <p>
            All catalogued supplies with live availability. Search by category name or narrow results by
            status.
          </p>
          <div className="hero-quick-links">
            <Link className="button secondary" to="/">
              Back to dashboard
            </Link>
            {hasRole('staff', 'admin') && (
              <Link className="button" to="/resources">
                Manage inventory
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="section-panel equipment-toolbar" aria-label="Search and filters">
        <div className="equipment-filters">
          <label className="equipment-filter-field">
            <span className="filter-label">Category</span>
            <input
              type="search"
              placeholder="Filter by category (partial match)"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              autoComplete="off"
              aria-label="Search equipment by category"
            />
          </label>
          <label className="equipment-filter-field">
            <span className="filter-label">Availability</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by availability status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value === '' ? '__all' : o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="equipment-results-meta" role="status">
          {loading ? 'Loading equipment…' : `${items.length} ${items.length === 1 ? 'item' : 'items'} listed`}
        </p>
      </section>

      <section className="section-panel">
        <div className="card-grid">
          {!loading && items.length === 0 && (
            <p className="notice equipment-empty">
              No equipment matches these filters. Clear the category field or set availability to “All
              statuses” to see more.
            </p>
          )}
          {items.map((resource) => (
            <article key={resource._id} className="data-card resource-card">
              <div className="card-row">
                <span className="pill resource-pill">{resource.category}</span>
                <span className="pill type-pill subtle">{resourceTypeLabel(resource.resourceType)}</span>
                <span className={`pill status-pill ${statusClass(resource.status)}`}>
                  {resource.status}
                </span>
              </div>
              <h3>{resource.location}</h3>
              <p>{resource.description || 'No description provided.'}</p>
              <div className="card-row card-row-alt">
                <span className="quantity-chip">Qty: {resource.quantity}</span>
                <span className="card-meta">
                  Updated {new Date(resource.updatedAt || resource.createdAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
