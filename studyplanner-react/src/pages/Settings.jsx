import { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useNotifications } from '../hooks/useNotifications';
import { jsPDF } from 'jspdf';
import { animatePageIn } from '../hooks/useAnimations';
import { supabase } from '../lib/supabase';
import { exportData, importData } from '../hooks/useStudyData';

export function Settings() {
  const { data, updateData, showToast } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const { permission, requestPermission } = useNotifications(data);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [syncEnabled, setSyncEnabled] = useState(!!data.supabaseUserId);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(data.lastSyncAt || null);

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Study Planner - Weekly Schedule', 20, 20);

    let y = 35;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const daySchedule = data.schedule[dateStr] || [];

      if (daySchedule.length === 0) continue;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }), 20, y);
      y += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      daySchedule.forEach(item => {
        if (y > 270) { doc.addPage(); y = 20; }
        const text = `${item.time} - ${item.title}${item.description ? ': ' + item.description : ''}`;
        doc.text(text, 25, y);
        y += 6;
      });
      y += 5;
    }

    doc.save('study-schedule.pdf');
    showToast('PDF exported!');
  };

  const exportICS = () => {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//StudyPlanner//EN\r\n';

    Object.entries(data.schedule).forEach(([dateStr, schedule]) => {
      schedule.forEach(item => {
        if (item.type === 'break' || item.type === 'rest') return;
        const [h, m] = item.time.replace(/[AP]M/i, '').trim().split(':').map(Number);
        const isPM = /PM/i.test(item.time);
        const hour24 = isPM && h !== 12 ? h + 12 : h;
        const dtStart = `${dateStr.replace(/-/g, '')}T${String(hour24).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
        const endH = hour24;
        const endM = m + 45;
        const dtEnd = `${dateStr.replace(/-/g, '')}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

        ics += `BEGIN:VEVENT\r\nDTSTART:${dtStart}\r\nDTEND:${dtEnd}\r\nSUMMARY:${item.title}\r\nDESCRIPTION:${item.description || ''}\r\nEND:VEVENT\r\n`;
      });
    });

    ics += 'END:VCALENDAR\r\n';
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Calendar exported!');
  };

  const handleExport = () => {
    exportData(data);
    showToast('Data exported!');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importData(file, (importedData) => {
      updateData(() => importedData);
      showToast('Data imported successfully!');
    });
    e.target.value = '';
  };

  const syncToCloud = async () => {
    if (!syncEnabled) {
      setSyncEnabled(true);
      return;
    }

    if (!data.supabaseUserId) {
      const userId = prompt('Enter a username for cloud sync (will be used as your ID):');
      if (!userId) return;
      updateData(prev => ({ ...prev, supabaseUserId: userId.trim() }));
      await syncToCloud();
      return;
    }

    setSyncing(true);
    try {
      await supabase.upsert(data.supabaseUserId, data);
      const now = new Date().toLocaleString();
      updateData(prev => ({ ...prev, lastSyncAt: now }));
      setLastSync(now);
      showToast('Synced to cloud!');
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'error');
    }
    setSyncing(false);
  };

  const pullFromCloud = async () => {
    if (!data.supabaseUserId) {
      showToast('Set up sync first', 'error');
      return;
    }
    setSyncing(true);
    try {
      const remote = await supabase.fetch(data.supabaseUserId);
      if (remote) {
        updateData(() => remote);
        showToast('Pulled from cloud!');
      } else {
        showToast('No cloud data found', 'error');
      }
    } catch (err) {
      showToast('Pull failed: ' + err.message, 'error');
    }
    setSyncing(false);
  };

  return (
    <div className="container" ref={containerRef}>
      <h1 style={{marginBottom:'1.5rem'}}>{t('settingsTitle')}</h1>

      <div className="card settings-card">
        <h2>{t('appearance')}</h2>
        <div className="settings-row">
          <span>{t('darkMode')}</span>
          <label className="toggle">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="card settings-card">
        <h2>{t('language')}</h2>
        <div className="lang-buttons">
          <button className={`btn btn-sm ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLanguage('en')}>English</button>
          <button className={`btn btn-sm ${language === 'mr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLanguage('mr')}>Marathi</button>
        </div>
      </div>

      <div className="card settings-card">
        <h2>{t('notifications')}</h2>
        <p className="settings-desc">{t('notificationDesc')}</p>
        <div className="settings-row">
          <span>{t('browserNotifications')}</span>
          <button className={`btn btn-sm ${permission === 'granted' ? 'btn-primary' : 'btn-secondary'}`} onClick={requestPermission} disabled={permission === 'granted'}>
            {permission === 'granted' ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <h2>Export & Backup</h2>
        <div className="settings-row">
          <span>PDF Schedule</span>
          <button className="btn btn-sm btn-primary" onClick={exportPDF}>{t('exportPDF')}</button>
        </div>
        <div className="settings-row">
          <span>Calendar (.ics)</span>
          <button className="btn btn-sm btn-primary" onClick={exportICS}>{t('exportCalendar')}</button>
        </div>
      </div>

      <div className="card settings-card">
        <h2>Data Management</h2>
        <div className="settings-row">
          <span>Export all data as JSON</span>
          <button className="btn btn-sm btn-primary" onClick={handleExport}>{t('exportData')}</button>
        </div>
        <div className="settings-row">
          <span>Import data from JSON</span>
          <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()}>{t('importData')}</button>
          <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} style={{display:'none'}} />
        </div>
      </div>

      <div className="card settings-card">
        <h2>Cloud Sync (Supabase)</h2>
        <p className="settings-desc">Sync your data across devices. Configure Supabase in <code>.env</code> first.</p>
        {data.supabaseUserId && (
          <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>
            User ID: <strong>{data.supabaseUserId}</strong>
            {lastSync && <> — Last sync: {lastSync}</>}
          </p>
        )}
        <div className="settings-row">
          <span>Enable cloud sync</span>
          <label className="toggle">
            <input type="checkbox" checked={syncEnabled} onChange={() => { setSyncEnabled(!syncEnabled); if (!syncEnabled) syncToCloud(); }} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {syncEnabled && (
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
            <button className="btn btn-sm btn-primary" onClick={syncToCloud} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Push to Cloud'}
            </button>
            <button className="btn btn-sm btn-secondary" onClick={pullFromCloud} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Pull from Cloud'}
            </button>
          </div>
        )}
      </div>

      <div className="card settings-card">
        <h2>{t('dangerZone')}</h2>
        <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Are you sure you want to delete ALL data? This cannot be undone.')) { updateData(() => ({ schedule: {}, subjects: [], exams: [], completedTasks: {}, holidays: [], settings: { studyStartTime: '19:00', studyEndTime: '22:00', schoolStart: '10:30', schoolEnd: '18:20', sessionDuration: 45, breakDuration: 10, holidaySessionDuration: 60, holidayBreakDuration: 15 } })); showToast('All data deleted'); }}}>
          {t('resetData')}
        </button>
      </div>
    </div>
  );
}