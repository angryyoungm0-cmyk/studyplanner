import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useScheduleGenerator } from '../hooks/useScheduleGenerator';
import { formatDate } from '../hooks/useStudyData';

export function GenerateSchedule() {
  const { data, updateData, showToast, navigateTo } = useApp();
  const { generateSchedule } = useScheduleGenerator();
  const s = data.settings;

  const [studyStart, setStudyStart] = useState(s.studyStartTime);
  const [studyEnd, setStudyEnd] = useState(s.studyEndTime);
  const [schoolStart, setSchoolStart] = useState(s.schoolStart);
  const [schoolEnd, setSchoolEnd] = useState(s.schoolEnd);
  const [sessionDur, setSessionDur] = useState(s.sessionDuration);
  const [breakDur, setBreakDur] = useState(s.breakDuration);
  const [hSessionDur, setHSessionDur] = useState(s.holidaySessionDuration || 60);
  const [hBreakDur, setHBreakDur] = useState(s.holidayBreakDuration || 15);
  const [weekendsHoliday, setWeekendsHoliday] = useState(data.holidays.includes('weekends'));
  const [holidayDate, setHolidayDate] = useState('');

  const saveTimings = () => {
    updateData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        studyStartTime: studyStart,
        studyEndTime: studyEnd,
        schoolStart,
        schoolEnd,
        sessionDuration: parseInt(sessionDur),
        breakDuration: parseInt(breakDur),
        holidaySessionDuration: parseInt(hSessionDur) || 60,
        holidayBreakDuration: parseInt(hBreakDur) || 15
      },
      holidays: weekendsHoliday
        ? [...prev.holidays.filter(h => h !== 'weekends'), 'weekends']
        : prev.holidays.filter(h => h !== 'weekends')
    }));
    showToast('Timing settings saved!');
  };

  const addHoliday = () => {
    if (!holidayDate) { showToast('Pick a date first', 'error'); return; }
    if (data.holidays.includes(holidayDate)) { showToast('Already a holiday', 'error'); return; }
    updateData(prev => ({ ...prev, holidays: [...prev.holidays, holidayDate] }));
    setHolidayDate('');
    showToast('Holiday added!');
  };

  const removeHoliday = (date) => {
    updateData(prev => ({ ...prev, holidays: prev.holidays.filter(h => h !== date) }));
  };

  const specificHolidays = data.holidays.filter(h => h !== 'weekends');

  return (
    <div className="container">
      <h1 style={{marginBottom:'1.5rem'}}>Generate Schedule</h1>

      <div className="card">
        <h2>Timing Settings</h2>
        <form onSubmit={e => { e.preventDefault(); saveTimings(); }}>
          <div className="form-group">
            <label>Study Start Time</label>
            <input type="time" value={studyStart} onChange={e => setStudyStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Study End Time</label>
            <input type="time" value={studyEnd} onChange={e => setStudyEnd(e.target.value)} />
          </div>
          <div className="form-group">
            <label>School Start Time</label>
            <input type="time" value={schoolStart} onChange={e => setSchoolStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>School End Time</label>
            <input type="time" value={schoolEnd} onChange={e => setSchoolEnd(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Session Duration (minutes)</label>
            <input type="number" value={sessionDur} onChange={e => setSessionDur(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Break Duration (minutes)</label>
            <input type="number" value={breakDur} onChange={e => setBreakDur(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Holiday Session Duration (minutes)</label>
            <input type="number" value={hSessionDur} onChange={e => setHSessionDur(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Holiday Break Duration (minutes)</label>
            <input type="number" value={hBreakDur} onChange={e => setHBreakDur(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={weekendsHoliday} onChange={e => setWeekendsHoliday(e.target.checked)} />
              {' '}Treat Sundays as holidays (full day study)
            </label>
          </div>
          <button type="submit" className="btn btn-secondary">Save Timings</button>
        </form>
      </div>

      <div className="card">
        <h2>Holidays</h2>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.5rem'}}>
          <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} style={{flex:1}} />
          <button className="btn btn-primary btn-sm" onClick={addHoliday}>Add</button>
        </div>
        {specificHolidays.length === 0 ? (
          <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No specific holidays added yet.</p>
        ) : (
          specificHolidays.sort().map(h => (
            <div key={h} className="holiday-item" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem 0',borderBottom:'1px solid var(--border)'}}>
              <span>{formatDate(h)}</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeHoliday(h)}>&times;</button>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Generate</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.9rem'}}>
          This will create a study schedule from today until your first exam. Make sure you have added subjects and exams first.
        </p>
        <button className="btn btn-primary" onClick={() => { generateSchedule(); navigateTo('dashboard'); }}>
          Generate Schedule
        </button>
      </div>
    </div>
  );
}
