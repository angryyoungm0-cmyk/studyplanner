import { useApp } from '../context/AppContext';
import { formatDate, todayStr, daysBetween, getFirstExamDate } from '../hooks/useStudyData';

export function Dashboard() {
  const { data } = useApp();
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  else if (hour >= 17) greeting = 'Good Evening';

  const firstExam = getFirstExamDate(data.exams);
  let daysLeft = '--';
  let daysText = 'Add your exam dates to start planning!';
  if (firstExam) {
    const days = daysBetween(todayStr(), firstExam);
    daysLeft = Math.max(0, days);
    if (days > 0) daysText = `${days} days until your first exam. Stay focused!`;
    else if (days === 0) daysText = 'Exam is TODAY! All the best!';
    else daysText = 'Exam date has passed.';
  }

  let totalChapters = 0;
  let doneChapters = 0;
  data.subjects.forEach(s => {
    s.chapters.forEach(c => {
      totalChapters++;
      if (c.done) doneChapters++;
    });
  });

  const todaySchedule = data.schedule[todayStr()] || [];
  const completed = data.completedTasks[todayStr()] || {};

  return (
    <div className="container">
      <div className="welcome-banner">
        <h1>{greeting}!</h1>
        <p>{daysText}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{daysLeft}</div>
          <div className="stat-label">Days Left</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{doneChapters}</div>
          <div className="stat-label">Chapters Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalChapters}</div>
          <div className="stat-label">Total Chapters</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) + '%' : '0%'}</div>
          <div className="stat-label">Progress</div>
        </div>
      </div>

      <div className="card">
        <h2>Today's Schedule</h2>
        {todaySchedule.length === 0 ? (
          <p className="empty-state">No schedule generated yet. Add your subjects and exams first!</p>
        ) : (
          todaySchedule.map((item, i) => {
            if (item.type === 'break' || item.type === 'rest') return null;
            const isDone = completed[i];
            return (
              <div key={i} className="schedule-item" style={{ opacity: isDone ? '0.5' : '1' }}>
                <div className="schedule-time">{item.time}</div>
                <div className="schedule-details">
                  <h3 style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : '' }}>
                    {item.title}
                  </h3>
                  <p>{item.description || ''}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2>Weekly Progress</h2>
        <WeeklyProgress data={data} />
      </div>
    </div>
  );
}

function WeeklyProgress({ data }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  let maxTasks = 1;
  const weekData = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    const schedule = data.schedule[ds] || [];
    const completed = data.completedTasks[ds] || {};
    const total = schedule.filter(s => s.type === 'study' || s.type === 'revision').length;
    const done = Object.values(completed).filter(Boolean).length;
    if (total > maxTasks) maxTasks = total;
    weekData.push({ day: days[i], total, done, isToday: ds === todayStr() });
  }

  return (
    <div className="weekly-bar">
      {weekData.map(w => {
        const heightPct = w.total > 0 ? (w.done / maxTasks) * 100 : 0;
        return (
          <div key={w.day} className="bar-day">
            <div className="bar-value">{w.done}/{w.total}</div>
            <div className={`bar-fill ${w.isToday ? 'today' : ''}`} style={{ height: `${Math.max(heightPct, 3)}%` }} />
            <div className="bar-label">{w.day}</div>
          </div>
        );
      })}
    </div>
  );
}
