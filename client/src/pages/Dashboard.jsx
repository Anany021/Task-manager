import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const STATUS_LABEL = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      }
    })();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  const { stats, myTasks, overdueTasks, recentTasks } = data;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <section className="stats-grid">
        <Stat label="Projects" value={stats.totalProjects} />
        <Stat label="Total tasks" value={stats.totalTasks} />
        <Stat label="To do" value={stats.todo} />
        <Stat label="In progress" value={stats.inProgress} />
        <Stat label="Done" value={stats.done} />
        <Stat label="Overdue" value={stats.overdue} highlight={stats.overdue > 0} />
      </section>

      <section>
        <h2>My tasks</h2>
        {myTasks.length === 0 ? (
          <p className="muted">No tasks assigned to you. Nice.</p>
        ) : (
          <TaskList tasks={myTasks} />
        )}
      </section>

      <section>
        <h2>Overdue</h2>
        {overdueTasks.length === 0 ? (
          <p className="muted">Nothing overdue.</p>
        ) : (
          <TaskList tasks={overdueTasks} showAssignee />
        )}
      </section>

      <section>
        <h2>Recently updated</h2>
        {recentTasks.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          <TaskList tasks={recentTasks} showAssignee />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`stat ${highlight ? 'stat-warn' : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function TaskList({ tasks, showAssignee = false }) {
  return (
    <ul className="task-list">
      {tasks.map((t) => (
        <li key={t._id} className="task-row">
          <div>
            <strong>{t.title}</strong>
            <div className="muted small">
              {t.project?.name && (
                <Link to={`/projects/${t.project._id || t.project}`}>
                  {t.project.name}
                </Link>
              )}
              {' · '}
              <span className={`badge badge-${t.status}`}>
                {STATUS_LABEL[t.status]}
              </span>
              {t.dueDate && (
                <>
                  {' · '}
                  <span className={t.isOverdue ? 'overdue' : ''}>
                    Due {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </>
              )}
              {showAssignee && t.assignedTo && (
                <> · {t.assignedTo.name}</>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
