import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers, updateUserRole, deleteUser } from './services/api';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    try {
      await updateUserRole(userId, { role: newRole });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to update role.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user account?')) return;
    setLoading(true);
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to delete user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero small">
        <div>
          <h1>Admin User Management</h1>
          <p>Manage account roles and remove users from the system.</p>
          <Link className="button secondary" to="/">Back to Dashboard</Link>
        </div>
      </header>

      <main className="card list-card admin-card">
        <div className="section-header">
          <div>
            <h2>System Users</h2>
            <p>Only admins can access this page.</p>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading users...</p>}

        <div className="admin-grid">
          {users.map((user) => (
            <article key={user._id} className="data-card admin-user-card">
              <div className="card-row">
                <div>
                  <h3>{user.username}</h3>
                  <p className="card-meta">Created {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`pill role-pill ${user.role}`}>{user.role}</span>
              </div>
              <div className="form-row admin-role-row">
                <label>
                  Role
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user._id, event.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>
              <div className="card-actions">
                <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>
                  Delete User
                </button>
              </div>
            </article>
          ))}
          {!loading && users.length === 0 && <p className="notice">No users found yet.</p>}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
