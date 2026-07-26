import { useApp } from '../context/AppContext';
import { formatDate, todayStr, parseDate, toLocalDateStr, isHoliday } from '../hooks/useStudyData';

export function Schedule() {
  const { data, updateData, viewingDate, setViewingDate } = useApp();

  const daySchedule = data.schedule[viewingDate] || [];
  const completed = data.completedTasks[viewingDate] || {};
  const holiday = isHoliday(viewingDate, data.holidays);
  const holidayLabel = holiday ? ' [Holiday - Full Day Study]' : '';

  const changeDay = (offset) => {
    const d = parseDate(viewingDate);
    d.setDate(d.getDate() + offset);
    setViewingDate(toLocalDateStr(d));
  };

  const toggleTask = (index) => {
    updateData(prev => {
      const ct = { ...prev.completedTasks };
      if (!ct[viewingDate]) ct[viewingDate] = {};
      ct[viewingDate] = { ...ct[viewingDate], [index]: !ct[viewingDate][index] };
      return { ...prev, completedTasks: ct };
    });
  };

  const saveNotes = (notes) => {
    updateData(prev => ({
      ...prev,
      notes: { ...prev.notes, [viewingDate]: notes }
    }));
  };

  return (
    <div className="container">
      <div className="page-header">
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => changeDay(-1)}>&larr;</button>
          <h1 id="currentDateDisplay">{formatDate(viewingDate)}{holidayLabel && <span dangerouslySetInnerHTML={{__html: holidayLabel}} />}</h1>
          <button className="btn btn-secondary btn-sm" onClick={() => changeDay(1)}>&rarr;</button>
        </div>
      </div>

      {daySchedule.length === 0 ? (
        <p className="empty-state">No schedule for this day. Generate a schedule!</p>
      ) : (
        daySchedule.map((item, i) => {
          const isDone = completed[i];
          const typeClass = item.type === 'study' ? 'type-study' :
            item.type === 'break' ? 'type-break' :
            item.type === 'school' ? 'type-school' :
            item.type === 'revision' ? 'type-revision' : 'type-rest';
          return (
            <div key={i} className="schedule-item" style={{opacity: isDone ? '0.5' : '1'}}>
              <div className="schedule-time">{item.time}</div>
              <div className="schedule-details">
                <h3 style={{textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : ''}}>
                  {item.title}
                </h3>
                <p>{item.description || ''}</p>
                <span className={`schedule-type ${typeClass}`}>{item.type}</span>
              </div>
              <div className="schedule-actions">
                <button
                  className={`done-btn ${isDone ? 'completed' : ''}`}
                  onClick={() => toggleTask(i)}
                  title="Mark done"
                >
                  {isDone ? '\u2713' : ''}
                </button>
              </div>
            </div>
          );
        })
      )}

      <div className="card" style={{marginTop:'1rem'}}>
        <h2>Notes</h2>
        <textarea
          className="notes-area"
          value={data.notes[viewingDate] || ''}
          onChange={e => saveNotes(e.target.value)}
          placeholder="Add notes for this day..."
        />
      </div>
    </div>
  );
}
