import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setFieldErrors({ ...fieldErrors, [event.target.name]: '' });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fe = {};
    if (!form.username.trim()) fe.username = 'Username is required.';
    if (!form.password) fe.password = 'Password is required.';
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setLoading(true);
    try {
      await login({ username: form.username.trim(), password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <header className="hero small">
        <div>
          <h1>Sign in to CrisisConnect</h1>
          <p>Access incident and resource operations with your role.</p>
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
              aria-describedby={fieldErrors.username ? 'login-err-user' : undefined}
            />
            {fieldErrors.username && (
              <span id="login-err-user" className="field-error" role="alert">{fieldErrors.username}</span>
            )}
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'login-err-pass' : undefined}
            />
            {fieldErrors.password && (
              <span id="login-err-pass" className="field-error" role="alert">{fieldErrors.password}</span>
            )}
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </main>
    </div>
  );
}
