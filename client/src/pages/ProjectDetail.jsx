import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const load = async () => {
    const [{ data: pdata }, { data: tdata }, { data: udata }] =
      await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { project: id } }),
        api.get('/users'),
      ]);
    setProject(pdata.project);
    setTasks(tdata.tasks);
    setUsers(udata.users);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.error || 'Failed to load project')
    );
  }, [id]);

  const onCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', {
        ...form,
        project: id,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      });
      setForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const onChangeStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const onDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  if (!project) return <div className="loading">Loading…</div>;

  const isOwner = project.owner?._id === user?._id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  // Members eligible for assignment = project owner + members
  const assignableUsers = [
    project.owner,
    ...(project.members || []).filter((m) => m._id !== project.owner?._id),
  ].filter(Boolean);

  return (
    <div>
      <p>
        <Link to="/projects">← All projects</Link>
      </p>
      <h1>{project.name}</h1>
      <p className="muted">{project.description || 'No description'}</p>
      <p className="muted small">
        Owner: {project.owner?.name} · Members:{' '}
        {project.members?.map((m) => m.name).join(', ') || '—'}
      </p>

      <h2>New task</h2>
      <form onSubmit={onCreateTask} className="task-form">
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
        <div className="row">
          <label>
            Assign to
            <select
              value={form.assignedTo}
              onChange={(e) =>
                setForm({ ...form, assignedTo: e.target.value })
              }
            >
              <option value="">— Unassigned —</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn-primary">Add task</button>
      </form>

      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p className="muted">No tasks yet.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => {
            const canEditTask =
              canManage ||
              (t.assignedTo && t.assignedTo._id === user?._id);
            return (
              <li key={t._id} className="task-row">
                <div>
                  <strong>{t.title}</strong>
                  <div className="muted small">
                    {t.assignedTo
                      ? `Assigned to ${t.assignedTo.name}`
                      : 'Unassigned'}
                    {' · '}
                    Priority: {t.priority}
                    {t.dueDate && (
                      <>
                        {' · '}
                        <span className={t.isOverdue ? 'overdue' : ''}>
                          Due {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                  {t.description && (
                    <p className="task-desc">{t.description}</p>
                  )}
                </div>
                <div className="task-actions">
                  <select
                    value={t.status}
                    disabled={!canEditTask}
                    onChange={(e) => onChangeStatus(t._id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {canManage && (
                    <button
                      className="btn-danger"
                      onClick={() => onDeleteTask(t._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
