import { useState } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'schedule', label: 'Plan' },
  { id: 'studyplayer', label: 'AI Chat' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'exams', label: 'Exams' },
  { id: 'generate', label: 'Generate' },
  { id: 'settings', label: 'Settings' }
];

export function Navbar() {
  const { currentPage, navigateTo } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">StudyPlanner</div>
      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        &#9776;
      </div>
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => { navigateTo(item.id); setMobileMenuOpen(false); }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
