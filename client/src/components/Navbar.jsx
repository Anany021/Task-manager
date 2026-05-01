import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        TaskManager
      </Link>
      {user && (
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
      )}
      <div className="nav-user">
        {user ? (
          <>
            <span className="user-pill">
              {user.name} <small>({user.role})</small>
            </span>
            <button className="btn-ghost" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/signup">Signup</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
