import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr } from '../hooks/useStudyData';
import { animate, stagger } from 'animejs';

export function Settings() {
  const { data, updateData, showToast, resetAllData, navigateTo } = useApp();
  const s = data.settings;
  const containerRef = useRef(null);

  const [enableNotif, setEnableNotif] = useState(s.enableNotifications);
  const [reminderBefore, setReminderBefore] = useState(s.reminderBefore);
  const [groqKey, setGroqKey] = useState(s.groqApiKey || '');

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
    showToast('Notification settings saved!');
  };

  const saveApiKey = () => {
    updateData(prev => ({
      ...prev,
      settings: { ...prev.settings, groqApiKey: groqKey.trim() }
    }));
    showToast(groqKey.trim() ? 'API key saved!' : 'API key cleared');
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
      showToast('Notifications enabled!');
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
    showToast('Data exported!');
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
          showToast('Data imported successfully!');
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

  return (
    <div className="container" ref={containerRef}>
      <h1 style={{marginBottom:'1.5rem'}}>Settings</h1>

      <div className="card">
        <h2>Notifications</h2>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={enableNotif} onChange={e => { setEnableNotif(e.target.checked); }} />
            {' '}Enable Notifications
          </label>
        </div>
        {enableNotif && (
          <div className="form-group">
            <label>Remind me before each session (minutes)</label>
            <input type="number" value={reminderBefore} onChange={e => setReminderBefore(e.target.value)} min="1" max="30" />
          </div>
        )}
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-sm" onClick={requestNotificationPermission}>Enable Notifications</button>
          <button className="btn btn-secondary btn-sm" onClick={saveNotifications}>Save Settings</button>
        </div>
      </div>

      <div className="card">
        <h2>StudyPlayer AI (Groq API)</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.85rem'}}>
          Get a free API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)'}}>console.groq.com</a>
        </p>
        <div className="form-group">
          <label>Groq API Key</label>
          <input type="text" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." />
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveApiKey}>Save API Key</button>
      </div>

      <div className="card">
        <h2>Data Management</h2>
        <div className="export-import">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export Data</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('importFile').click()}>Import Data</button>
          <input type="file" id="importFile" accept=".json" style={{display:'none'}} onChange={handleImport} />
          <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset All Data</button>
        </div>
      </div>
    </div>
  );
}
