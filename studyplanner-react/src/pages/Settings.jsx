import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { todayStr } from '../hooks/useStudyData';
import { animate, stagger } from 'animejs';
import jsPDF from 'jspdf';
import { isConfigured as isSupabaseConfigured, syncToCloud, syncFromCloud } from '../lib/supabase';

export function Settings() {
  const { data, updateData, showToast, resetAllData, navigateTo } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLanguage, t } = useI18n();
  const s = data.settings;
  const containerRef = useRef(null);

  const [enableNotif, setEnableNotif] = useState(s.enableNotifications);
  const [reminderBefore, setReminderBefore] = useState(s.reminderBefore);
  const [groqKey, setGroqKey] = useState(s.groqApiKey || '');
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState(() => {
    try {
      return localStorage.getItem('studyplanner-userid') || '';
    } catch { return ''; }
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.card');
    animate(cards, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 350,
      delay: stagger(80),
      ease: 'outQuad'
    });
  }, []);

  const saveNotifications = () => {
    updateData(prev => ({
      ...prev,
      settings: { ...prev.settings, enableNotifications: enableNotif, reminderBefore: parseInt(reminderBefore) }
    }));
    showToast(t('saveSettings'));
  };

  const saveApiKey = () => {
    updateData(prev => ({
      ...prev,
      settings: { ...prev.settings, groqApiKey: groqKey.trim() }
    }));
    showToast(groqKey.trim() ? t('saveApiKey') + '!' : t('saveApiKey'));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported on this browser', 'error');
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setEnableNotif(true);
      updateData(prev => ({
        ...prev,
        settings: { ...prev.settings, enableNotifications: true }
      }));
      showToast(t('enableNotifications') + '!');
      new Notification('StudyPlanner', { body: 'Notifications are working!' });
    } else if (result === 'denied') {
      showToast('Notifications blocked. Enable them in browser settings.', 'error');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyplanner-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('exportData') + '!');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.subjects && imported.settings) {
          updateData(imported);
          showToast(t('importData') + '!');
        } else {
          showToast('Invalid data file', 'error');
        }
      } catch {
        showToast('Failed to parse file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('This will delete ALL your data - subjects, exams, schedules, everything. Are you sure?')) {
      if (confirm('Really? This cannot be undone!')) {
        resetAllData();
        navigateTo('dashboard');
      }
    }
  };

  const handleCloudSync = useCallback(async () => {
    if (!userId.trim()) {
      showToast('Enter a user ID first', 'error');
      return;
    }
    setSyncing(true);
    try {
      localStorage.setItem('studyplanner-userid', userId.trim());
      const success = await syncToCloud(userId.trim(), data);
      if (success) {
        showToast('Data synced to cloud!');
      } else {
        showToast('Cloud sync failed - check Supabase config', 'error');
      }
    } catch {
      showToast('Cloud sync error', 'error');
    }
    setSyncing(false);
  }, [userId, data, showToast]);

  const handleCloudRestore = useCallback(async () => {
    if (!userId.trim()) {
      showToast('Enter a user ID first', 'error');
      return;
    }
    setSyncing(true);
    try {
      localStorage.setItem('studyplanner-userid', userId.trim());
      const cloudData = await syncFromCloud(userId.trim());
      if (cloudData) {
        updateData(cloudData);
        showToast('Data restored from cloud!');
      } else {
        showToast('No cloud data found', 'error');
      }
    } catch {
      showToast('Cloud restore error', 'error');
    }
    setSyncing(false);
  }, [userId, updateData, showToast]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('StudyPlanner - Weekly Schedule', 14, 22);

    let y = 35;
    const days = Object.keys(data.schedule).sort();
    const recentDays = days.slice(-7);

    recentDays.forEach(date => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(date, 14, y);
      y += 7;

      const daySchedule = data.schedule[date] || [];
      daySchedule.forEach(item => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(item.time || '', 14, y);
        doc.setTextColor(241, 245, 249);
        doc.text(item.title || '', 40, y);
        if (item.description) {
          doc.setTextColor(148, 163, 184);
          doc.text(item.description, 40, y + 5);
        }
        y += item.description ? 12 : 7;
      });
      y += 5;
    });

    doc.save(`studyplanner-schedule-${todayStr()}.pdf`);
    showToast(t('exportPdf') + '!');
  };

  const handleExportIcs = () => {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//StudyPlanner//EN\r\nCALSCALE:GREGORIAN\r\n';

    const days = Object.keys(data.schedule).sort();
    days.forEach(date => {
      const daySchedule = data.schedule[date] || [];
      daySchedule.forEach(item => {
        if (item.type !== 'study' && item.type !== 'revision') return;
        const [h, m] = (item.time || '07:00').split(':');
        const start = date.replace(/-/g, '') + 'T' + h + m + '00';
        const endH = String(parseInt(h) + 1).padStart(2, '0');
        const end = date.replace(/-/g, '') + 'T' + endH + m + '00';

        ics += 'BEGIN:VEVENT\r\n';
        ics += `DTSTART:${start}\r\n`;
        ics += `DTEND:${end}\r\n`;
        ics += `SUMMARY:${item.title || 'Study Session'}\r\n`;
        ics += `DESCRIPTION:${item.description || ''}\r\n`;
        ics += 'END:VEVENT\r\n';
      });
    });

    ics += 'END:VCALENDAR';

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyplanner-${todayStr()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('exportIcs') + '!');
  };

  return (
    <div className="container" ref={containerRef}>
      <h1 style={{marginBottom:'1.5rem'}}>{t('settings')}</h1>

      <div className="card">
        <h2>{t('theme')}</h2>
        <div className="export-import" style={{marginTop:'0.5rem'}}>
          <button
            className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
          >
            {t('darkMode')}
          </button>
          <button
            className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
          >
            {t('lightMode')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t('language')}</h2>
        <div className="export-import" style={{marginTop:'0.5rem'}}>
          <button
            className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLanguage('en')}
          >
            {t('english')}
          </button>
          <button
            className={`btn btn-sm ${lang === 'mr' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLanguage('mr')}
          >
            {t('marathi')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t('notifications')}</h2>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={enableNotif} onChange={e => { setEnableNotif(e.target.checked); }} />
            {' '}{t('enableNotifications')}
          </label>
        </div>
        {enableNotif && (
          <div className="form-group">
            <label>{t('reminderBefore')}</label>
            <input type="number" value={reminderBefore} onChange={e => setReminderBefore(e.target.value)} min="1" max="30" />
          </div>
        )}
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-sm" onClick={requestNotificationPermission}>{t('enableNotifBtn')}</button>
          <button className="btn btn-secondary btn-sm" onClick={saveNotifications}>{t('saveSettings')}</button>
        </div>
      </div>

      <div className="card">
        <h2>Cloud Sync {isSupabaseConfigured ? '' : '(Configure Supabase)'}</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.85rem'}}>
          {isSupabaseConfigured
            ? 'Sync your data across devices using Supabase.'
            : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable.'}
        </p>
        <div className="form-group">
          <label>User ID (your unique identifier)</label>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="e.g. your-name or email"
          />
        </div>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-sm" onClick={handleCloudSync} disabled={syncing || !isSupabaseConfigured}>
            {syncing ? 'Syncing...' : 'Sync to Cloud'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCloudRestore} disabled={syncing || !isSupabaseConfigured}>
            {syncing ? 'Restoring...' : 'Restore from Cloud'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t('studyPlayerAI')}</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.85rem'}}>
          {t('getApiKey')} <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)'}}>console.groq.com</a>
        </p>
        <div className="form-group">
          <label>{t('groqApiKey')}</label>
          <input type="text" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." />
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveApiKey}>{t('saveApiKey')}</button>
      </div>

      <div className="card">
        <h2>{t('calendarExport')}</h2>
        <div className="export-import">
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>{t('exportPdf')}</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportIcs}>{t('exportIcs')}</button>
        </div>
      </div>

      <div className="card">
        <h2>{t('dataManagement')}</h2>
        <div className="export-import">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>{t('exportData')}</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('importFile').click()}>{t('importData')}</button>
          <input type="file" id="importFile" accept=".json" style={{display:'none'}} onChange={handleImport} />
          <button className="btn btn-danger btn-sm" onClick={handleReset}>{t('resetAllData')}</button>
        </div>
      </div>
    </div>
  );
}