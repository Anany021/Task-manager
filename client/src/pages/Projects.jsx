import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: pdata }, { data: udata }] = await Promise.all([
      api.get('/projects'),
      api.get('/users'),
    ]);
    setProjects(pdata.projects);
    setUsers(udata.users);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.error || 'Failed to load')
    );
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', {
        name: form.name,
        description: form.description,
        members: form.members,
      });
      setForm({ name: '', description: '', members: [] });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Projects</h1>

      <form onSubmit={onCreate} className="project-form">
        <h2>New project</h2>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </label>
        <label>
          Members (Cmd / Ctrl + click to multi-select)
          <select
            multiple
            value={form.members}
            onChange={(e) =>
              setForm({
                ...form,
                members: Array.from(e.target.selectedOptions).map(
                  (o) => o.value
                ),
              })
            }
            size={Math.min(6, Math.max(3, users.length))}
          >
            {users
              .filter((u) => u._id !== user?._id)
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </select>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn-primary">Create</button>
      </form>

      <h2>Your projects</h2>
      {projects.length === 0 ? (
        <p className="muted">No projects yet.</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p._id} className="project-row">
              <div>
                <Link to={`/projects/${p._id}`}>
                  <strong>{p.name}</strong>
                </Link>
                <div className="muted small">
                  {p.description || 'No description'} · Owner: {p.owner?.name} ·{' '}
                  {p.members?.length || 0} members
                </div>
              </div>
              {(p.owner?._id === user?._id || user?.role === 'admin') && (
                <button
                  className="btn-danger"
                  onClick={() => onDelete(p._id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
