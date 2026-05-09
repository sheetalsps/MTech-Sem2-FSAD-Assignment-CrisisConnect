import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

function validateSignup(form) {
  const fieldErrors = {};
  const u = form.username.trim();
  const p = form.password;
  if (u.length < 3 || u.length > 48) {
    fieldErrors.username = 'Use 3–48 characters.';
  } else if (!/^[\w.-]+$/.test(u)) {
    fieldErrors.username = 'Letters, numbers, underscore, dot, and hyphen only.';
  }
  if (p.length < 8) fieldErrors.password = 'Password must be at least 8 characters.';
  if (p.length > 128) fieldErrors.password = 'Password must be at most 128 characters.';
  return fieldErrors;
}

export default function Signup() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setFieldErrors({ ...fieldErrors, [event.target.name]: '' });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fe = validateSignup(form);
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setLoading(true);
    try {
      await signup({
        ...form,
        username: form.username.trim()
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <header className="hero small">
        <div>
          <h1>Create a CrisisConnect account</h1>
          <p>Choose your role and start managing emergency responses.</p>
        </div>
      </header>

      <main className="card auth-card">
        <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
              aria-invalid={!!fieldErrors.username}
              aria-describedby={fieldErrors.username ? 'err-username' : undefined}
            />
            {fieldErrors.username && (
              <span id="err-username" className="field-error" role="alert">{fieldErrors.username}</span>
            )}
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'err-password' : undefined}
            />
            {fieldErrors.password && (
              <span id="err-password" className="field-error" role="alert">{fieldErrors.password}</span>
            )}
          </label>
          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">Citizen</option>
              <option value="volunteer">Volunteer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign up'}</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </main>
    </div>
  );
}
