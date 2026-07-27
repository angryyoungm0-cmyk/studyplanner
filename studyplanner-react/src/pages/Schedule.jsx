import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { todayStr, formatDate } from '../hooks/useStudyData';

export function Schedule() {
  const { data, updateData, showToast } = useApp();
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const schedule = data.schedule[selectedDate] || [];
  const completed = data.completedTasks[selectedDate] || {};
  const totalStudy = schedule.filter(s => s.type === 'study' || s.type === 'revision').length;
  const completedCount = Object.values(completed).filter(Boolean).length;

  const toggleTask = (index) => {
    updateData(prev => {
      const completedTasks = { ...prev.completedTasks };
      const dayTasks = { ...completedTasks[selectedDate] };
      dayTasks[index] = !dayTasks[index];
      completedTasks[selectedDate] = dayTasks;
      return { ...prev, completedTasks };
    });
  };

  const clearSchedule = () => {
    if (!confirm('Clear schedule for this day?')) return;
    updateData(prev => {
      const schedule = { ...prev.schedule };
      delete schedule[selectedDate];
      const completedTasks = { ...prev.completedTasks };
      delete completedTasks[selectedDate];
      return { ...prev, schedule, completedTasks };
    });
    showToast('Schedule cleared');
  };

  const isToday = selectedDate === todayStr();

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="container">
      <h1 style={{marginBottom:'1rem'}}>{t('scheduleTitle')}</h1>

      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem',flexWrap:'wrap',gap:'0.5rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <button className="btn btn-sm btn-secondary" onClick={() => changeDate(-1)}>&lt;</button>
            <strong>{formatDate(selectedDate)}</strong>
            <button className="btn btn-sm btn-secondary" onClick={() => changeDate(1)}>&gt;</button>
            {!isToday && (
              <button className="btn btn-sm btn-primary" onClick={() => setSelectedDate(todayStr())}>{t('today')}</button>
            )}
          </div>
          {schedule.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={clearSchedule}>{t('clearSchedule')}</button>
          )}
        </div>
        {totalStudy > 0 && (
          <p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>
            {t('completed')}: {completedCount}/{totalStudy} tasks
          </p>
        )}
      </div>

      {schedule.length === 0 && (
        <div className="card">
          <p className="empty-state">{t('noSchedule')}</p>
        </div>
      )}

      {schedule.map((item, i) => {
        const isBreak = item.type === 'break' || item.type === 'rest';
        const isDone = completed[i];
        return (
          <div key={i} className={`schedule-item ${isBreak ? 'break' : ''}`} style={{ opacity: isDone ? '0.5' : '1' }}>
            <div className="schedule-time">{item.time}</div>
            <div className="schedule-details" style={{ flex: 1 }}>
              <h3 style={{
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? 'var(--text-muted)' : ''
              }}>
                {item.title}
              </h3>
              <p>{item.description || ''}</p>
            </div>
            {!isBreak && (
              <button className="btn btn-sm btn-secondary" onClick={() => toggleTask(i)}>
                {isDone ? t('undo') : t('done')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}