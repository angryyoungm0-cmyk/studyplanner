import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, todayStr, daysBetween, getFirstExamDate } from '../hooks/useStudyData';
import { animate, stagger } from 'animejs';

function AnimatedStat({ value, label }) {
  const numRef = useRef(null);
  const prevVal = useRef(0);

  useEffect(() => {
    if (!numRef.current) return;
    const target = typeof value === 'string' ? parseInt(value) || 0 : value;
    const obj = { val: prevVal.current };
    animate(obj, {
      val: target,
      duration: 1200,
      ease: 'outExpo',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = typeof value === 'string' && value.includes('%')
            ? Math.round(obj.val) + '%'
            : Math.round(obj.val);
        }
      }
    });
    prevVal.current = target;
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
  const containerRef = useRef(null);
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

  const progressPct = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
  const progressDisplay = totalChapters > 0 ? progressPct + '%' : '0%';

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.card, .welcome-banner, .stats-grid');
    animate(items, {
      opacity: [0, 1],
      translateY: [25, 0],
      duration: 400,
      delay: stagger(80),
      ease: 'outQuad'
    });
    const scheduleItems = containerRef.current.querySelectorAll('.schedule-item');
    if (scheduleItems.length) {
      animate(scheduleItems, {
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 350,
        delay: stagger(50, { start: 400 }),
        ease: 'outQuad'
      });
    }
  }, []);

  const daysLeftNum = typeof daysLeft === 'number' ? daysLeft : 0;

  return (
    <div className="container" ref={containerRef}>
      <div className="welcome-banner">
        <h1>{greeting}!</h1>
        <p>{daysText}</p>
      </div>

      <div className="stats-grid">
        <AnimatedStat value={daysLeftNum} label="Days Left" />
        <AnimatedStat value={doneChapters} label="Chapters Done" />
        <AnimatedStat value={totalChapters} label="Total Chapters" />
        <AnimatedStat value={progressDisplay} label="Progress" />
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
  const barsRef = useRef(null);
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

  useEffect(() => {
    if (!barsRef.current) return;
    const fills = barsRef.current.querySelectorAll('.bar-fill');
    animate(fills, {
      height: ['0%', (el) => el.dataset.height || '3%'],
      duration: 800,
      delay: stagger(100),
      ease: 'outElastic(1, 0.6)'
    });
    const labels = barsRef.current.querySelectorAll('.bar-day');
    animate(labels, {
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 400,
      delay: stagger(80),
      ease: 'outQuad'
    });
  }, []);

  return (
    <div className="weekly-bar" ref={barsRef}>
      {weekData.map(w => {
        const heightPct = w.total > 0 ? (w.done / maxTasks) * 100 : 0;
        const finalH = Math.max(heightPct, 3);
        return (
          <div key={w.day} className="bar-day">
            <div className="bar-value">{w.done}/{w.total}</div>
            <div
              className={`bar-fill ${w.isToday ? 'today' : ''}`}
              style={{ height: '3%' }}
              data-height={`${finalH}%`}
            />
            <div className="bar-label">{w.day}</div>
          </div>
        );
      })}
    </div>
  );
}
