import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import logo from '../assets/logo.png';

const navItemIds = ['dashboard', 'schedule', 'studyplayer', 'subjects', 'exams', 'generate', 'settings'];

export function Navbar() {
  const { currentPage, navigateTo } = useApp();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = navItemIds.map(id => ({ id, label: t(id === 'studyplayer' ? 'aiChat' : id) }));

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-brand">
        <img src={logo} alt="StudyPlanner" className="nav-logo" />
        <span>StudyPlanner</span>
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="nav-hamburger"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        role="button"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileMenuOpen(!mobileMenuOpen); }}
      >
        &#9776;
      </div>
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="menu">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => { navigateTo(item.id); setMobileMenuOpen(false); }}
            role="menuitem"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}