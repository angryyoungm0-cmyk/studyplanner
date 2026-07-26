import { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { animate } from 'animejs';

const navItemIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  studyplayer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  subjects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  generate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
};

export function BottomNav() {
  const { currentPage, navigateTo } = useApp();
  const { t } = useI18n();
  const indicatorRef = useRef(null);
  const btnsRef = useRef(null);

  const navItems = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'schedule', label: t('schedule') },
    { id: 'studyplayer', label: t('aiChat') },
    { id: 'subjects', label: t('subjects') },
    { id: 'generate', label: t('generate') },
    { id: 'settings', label: t('settings') }
  ];

  useEffect(() => {
    if (!btnsRef.current || !indicatorRef.current) return;
    const activeBtn = btnsRef.current.querySelector('.bottom-nav-btn.active');
    if (activeBtn) {
      const rect = activeBtn.getBoundingClientRect();
      const parentRect = btnsRef.current.getBoundingClientRect();
      animate(indicatorRef.current, {
        left: [indicatorRef.current.offsetLeft, rect.left - parentRect.left + rect.width / 2 - 14],
        duration: 300,
        ease: 'outQuad'
      });
    }
  }, [currentPage]);

  const handleClick = (id, e) => {
    const btn = e.currentTarget;
    animate(btn, {
      scale: [1, 0.85, 1.05, 1],
      duration: 300,
      ease: 'outQuad'
    });
    navigateTo(id);
  };

  return (
    <nav className="bottom-nav" id="bottomNav" ref={btnsRef} role="navigation" aria-label="Mobile navigation">
      <div className="bottom-nav-indicator" ref={indicatorRef} />
      {navItems.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-btn ${currentPage === item.id ? 'active' : ''}`}
          onClick={(e) => handleClick(item.id, e)}
          aria-label={item.label}
          aria-current={currentPage === item.id ? 'page' : undefined}
        >
          {navItemIcons[item.id]}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}