import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { formatDate, todayStr, daysBetween, getFirstExamDate } from '../hooks/useStudyData';

function AnimatedStat({ value, label }) {
  const numRef = useRef(null);

  useEffect(() => {
    if (!numRef.current) return;
    const target = typeof value === 'string' ? parseInt(value) || 0 : value;
    let current = 0;
    const duration = 1000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);
      if (numRef.current) {
        numRef.current.textContent = typeof value === 'string' && value.includes('%')
          ? current + '%'
          : current;
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return (
    <div className="stat-card">
      <div className="stat-number" ref={numRef}>0</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Dashboard() {
  const { data } = useApp();
  const { t } = useI18n();

  const hour = new Date().getHours();
  let greeting = t('goodMorning');
  if (hour >= 12 && hour < 17) greeting = t('goodAfternoon');
  else if (hour >= 17) greeting = t('goodEvening');

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

  const progressPct = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
  const progressDisplay = totalChapters > 0 ? progressPct + '%' : '0%';

  const streak = data.streak || { current: 0, best: 0 };
  const daysLeftNum = typeof daysLeft === 'number' ? daysLeft : 0;

  return (
    <div className="container">
      <div className="welcome-banner">
        <h1>{greeting}!</h1>
        <p>{daysText}</p>
      </div>

      <div className="stats-grid">
        <AnimatedStat value={daysLeftNum} label={t('daysLeft')} />
        <AnimatedStat value={doneChapters} label={t('chaptersDone')} />
        <AnimatedStat value={totalChapters} label={t('totalChapters')} />
        <AnimatedStat value={progressDisplay} label={t('progress')} />
      </div>

      <div className="card streak-card">
        <div className="streak-header">
          <span className="streak-icon">&#128293;</span>
          <h2>{t('studyStreak')}</h2>
        </div>
        <div className="streak-stats">
          <div className="streak-stat">
            <span className="streak-stat-number">{streak.current}</span>
            <span className="streak-stat-label">{t('currentStreak')}</span>
          </div>
          <div className="streak-stat">
            <span className="streak-stat-number">{streak.best}</span>
            <span className="streak-stat-label">{t('bestStreak')}</span>
          </div>
        </div>
        <p className="streak-message">
          {streak.current > 0 ? t('streakMessage') : t('streakBroken')}
        </p>
      </div>

      <div className="card">
        <h2>{t('todaySchedule')}</h2>
        {todaySchedule.length === 0 ? (
          <p className="empty-state">{t('noSchedule')}</p>
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
        <h2>{t('weeklyProgress')}</h2>
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
        const finalH = Math.max(heightPct, 3);
        return (
          <div key={w.day} className="bar-day">
            <div className="bar-value">{w.done}/{w.total}</div>
            <div className="bar-fill" style={{ height: `${finalH}%` }} />
            <div className="bar-label">{w.day}</div>
          </div>
        );
      })}
    </div>
  );
}