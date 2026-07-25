(function () {
    'use strict';

    const DB_KEY = 'studyPlanner';

    function loadData() {
        try {
            return JSON.parse(localStorage.getItem(DB_KEY)) || getDefaultData();
        } catch {
            return getDefaultData();
        }
    }

    function saveData(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    function getDefaultData() {
        return {
            subjects: [],
            exams: [],
            holidays: [],
            schedule: {},
            completedTasks: {},
            notes: {},
            settings: {
                studyStartTime: '07:00',
                studyEndTime: '22:00',
                schoolStart: '10:30',
                schoolEnd: '18:20',
                sessionDuration: 45,
                breakDuration: 10,
                enableNotifications: true,
                reminderBefore: 5,
                holidaySessionDuration: 60,
                holidayBreakDuration: 15
            }
        };
    }

    let appData = loadData();
    let currentPage = 'dashboard';
    let viewingDate = todayStr();
    let notificationTimers = [];

    function toLocalDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function parseDate(str) {
        const parts = str.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function todayStr() {
        return toLocalDateStr(new Date());
    }

    function formatDate(dateStr) {
        const d = parseDate(dateStr);
        return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function daysBetween(date1, date2) {
        const d1 = parseDate(date1);
        const d2 = parseDate(date2);
        return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function minutesToTime(mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.className = 'toast', 3000);
    }

    // --- NAVIGATION ---
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.page);
        });
    });

    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.toggle('open');
    });

    function navigateTo(page) {
        currentPage = page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
        document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
        document.getElementById('mobileMenu').classList.remove('open');
        renderPage(page);
    }

    function renderPage(page) {
        switch (page) {
            case 'dashboard': renderDashboard(); break;
            case 'schedule': renderSchedulePage(); break;
            case 'subjects': renderSubjects(); break;
            case 'exams': renderExams(); break;
            case 'generate': loadGenerateForm(); break;
            case 'settings': loadSettingsForm(); break;
        }
    }

    // --- DASHBOARD ---
    function renderDashboard() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17) greeting = 'Good Evening';
        document.getElementById('greeting').textContent = `${greeting}!`;

        const firstExam = getFirstExamDate();
        if (firstExam) {
            const days = daysBetween(todayStr(), firstExam);
            document.getElementById('daysRemaining').textContent =
                days > 0 ? `${days} days until your first exam. Stay focused!` :
                    days === 0 ? 'Exam is TODAY! All the best!' : 'Exam date has passed.';
            document.getElementById('stat-days-left').textContent = Math.max(0, days);
        } else {
            document.getElementById('daysRemaining').textContent = 'Add your exam dates to start planning!';
            document.getElementById('stat-days-left').textContent = '--';
        }

        let totalChapters = 0;
        let doneChapters = 0;
        appData.subjects.forEach(s => {
            s.chapters.forEach(c => {
                totalChapters++;
                if (c.done) doneChapters++;
            });
        });
        document.getElementById('stat-chapters-total').textContent = totalChapters;
        document.getElementById('stat-chapters-done').textContent = doneChapters;
        document.getElementById('stat-progress').textContent =
            totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) + '%' : '0%';

        renderDashboardToday();
        renderWeeklyProgress();
    }

    function renderDashboardToday() {
        const container = document.getElementById('dashboard-today-schedule');
        const todaySchedule = appData.schedule[todayStr()];
        if (!todaySchedule || todaySchedule.length === 0) {
            container.innerHTML = '<p class="empty-state">No schedule for today. Go to Settings and generate a schedule!</p>';
            return;
        }
        const completed = appData.completedTasks[todayStr()] || {};
        let html = '';
        todaySchedule.forEach((item, i) => {
            if (item.type === 'break' || item.type === 'rest') return;
            const isDone = completed[i];
            html += `<div class="schedule-item" style="opacity:${isDone ? '0.5' : '1'}">
                <div class="schedule-time">${item.time}</div>
                <div class="schedule-details">
                    <h3 style="${isDone ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${item.title}</h3>
                    <p>${item.description || ''}</p>
                </div>
            </div>`;
        });
        container.innerHTML = html || '<p class="empty-state">Nothing scheduled today.</p>';
    }

    function renderWeeklyProgress() {
        const container = document.getElementById('weekly-progress');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        let maxTasks = 1;
        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const ds = toLocalDateStr(d);
            const schedule = appData.schedule[ds] || [];
            const completed = appData.completedTasks[ds] || {};
            const total = schedule.filter(s => s.type === 'study' || s.type === 'revision').length;
            const done = Object.values(completed).filter(Boolean).length;
            if (total > maxTasks) maxTasks = total;
            weekData.push({ day: days[i], total, done, isToday: ds === todayStr() });
        }

        let html = '<div class="weekly-bar">';
        weekData.forEach(w => {
            const heightPct = w.total > 0 ? (w.done / maxTasks) * 100 : 0;
            html += `<div class="bar-day">
                <div class="bar-value">${w.done}/${w.total}</div>
                <div class="bar-fill ${w.isToday ? 'today' : ''}" style="height:${Math.max(heightPct, 3)}%"></div>
                <div class="bar-label">${w.day}</div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function getFirstExamDate() {
        if (appData.exams.length === 0) return null;
        return appData.exams.reduce((min, e) => e.date < min ? e.date : min, appData.exams[0].date);
    }

    // --- SCHEDULE PAGE ---
    function renderSchedulePage() {
        const holiday = isHoliday(viewingDate);
        const holidayLabel = holiday ? ' <span style="color:#ec4899;font-size:0.8rem;">[Holiday - Full Day Study]</span>' : '';
        document.getElementById('currentDateDisplay').innerHTML = formatDate(viewingDate) + holidayLabel;
        const container = document.getElementById('dailySchedule');
        const daySchedule = appData.schedule[viewingDate];
        const completed = appData.completedTasks[viewingDate] || {};

        if (!daySchedule || daySchedule.length === 0) {
            container.innerHTML = '<p class="empty-state">No schedule for this day. Generate a schedule from Settings!</p>';
            return;
        }

        let html = '';
        daySchedule.forEach((item, i) => {
            const isDone = completed[i];
            const typeClass = item.type === 'study' ? 'type-study' :
                item.type === 'break' ? 'type-break' :
                    item.type === 'school' ? 'type-school' :
                        item.type === 'revision' ? 'type-revision' : 'type-rest';
            html += `<div class="schedule-item" style="${isDone ? 'opacity:0.5' : ''}">
                <div class="schedule-time">${item.time}</div>
                <div class="schedule-details">
                    <h3 style="${isDone ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${item.title}</h3>
                    <p>${item.description || ''}</p>
                    <span class="schedule-type ${typeClass}">${item.type}</span>
                </div>
                <div class="schedule-actions">
                    <button class="done-btn ${isDone ? 'completed' : ''}" data-index="${i}" title="Mark done">
                        ${isDone ? '&#10003;' : ''}
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.done-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                toggleTaskDone(viewingDate, idx);
                renderSchedulePage();
            });
        });

        const notesArea = document.getElementById('dailyNotes');
        notesArea.value = appData.notes[viewingDate] || '';
    }

    document.getElementById('prevDayBtn').addEventListener('click', () => {
        const d = parseDate(viewingDate);
        d.setDate(d.getDate() - 1);
        viewingDate = toLocalDateStr(d);
        renderSchedulePage();
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
        const d = parseDate(viewingDate);
        d.setDate(d.getDate() + 1);
        viewingDate = toLocalDateStr(d);
        renderSchedulePage();
    });

    document.getElementById('saveNotesBtn').addEventListener('click', () => {
        appData.notes[viewingDate] = document.getElementById('dailyNotes').value;
        saveData(appData);
        showToast('Notes saved!');
    });

    function toggleTaskDone(date, index) {
        if (!appData.completedTasks[date]) appData.completedTasks[date] = {};
        appData.completedTasks[date][index] = !appData.completedTasks[date][index];
        saveData(appData);
    }

    // --- SUBJECTS ---
    function renderSubjects() {
        const container = document.getElementById('subjectsList');
        if (appData.subjects.length === 0) {
            container.innerHTML = '<p class="empty-state">No subjects added yet. Click "+ Add Subject" to begin!</p>';
            return;
        }
        let html = '';
        appData.subjects.forEach(subject => {
            const total = subject.chapters.length;
            const done = subject.chapters.filter(c => c.done).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            html += `<div class="subject-card">
                <div class="subject-header" data-id="${subject.id}">
                    <div class="subject-title">
                        <div class="subject-color" style="background:${subject.color}"></div>
                        <span>${subject.name}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.8rem;">
                        <span class="subject-progress">${done}/${total} (${pct}%)</span>
                        <div class="subject-actions">
                            <button class="btn btn-sm btn-secondary edit-subject" data-id="${subject.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-subject" data-id="${subject.id}">Del</button>
                        </div>
                    </div>
                </div>
                <div class="subject-chapters" id="chapters-${subject.id}">
                    ${subject.chapters.map((ch, ci) => `
                        <div class="chapter-item">
                            <div class="chapter-left">
                                <input type="checkbox" class="chapter-checkbox" data-subject="${subject.id}" data-chapter="${ci}" ${ch.done ? 'checked' : ''}>
                                <span class="chapter-name ${ch.done ? 'done' : ''}">Ch ${ci + 1}: ${ch.name}</span>
                            </div>
                            <button class="btn btn-sm btn-danger delete-chapter" data-subject="${subject.id}" data-chapter="${ci}">&times;</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.subject-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.subject-actions')) return;
                const id = header.dataset.id;
                document.getElementById(`chapters-${id}`).classList.toggle('open');
            });
        });

        container.querySelectorAll('.chapter-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const sub = appData.subjects.find(s => s.id === cb.dataset.subject);
                if (sub) {
                    sub.chapters[parseInt(cb.dataset.chapter)].done = cb.checked;
                    saveData(appData);
                    renderSubjects();
                }
            });
        });

        container.querySelectorAll('.delete-chapter').forEach(btn => {
            btn.addEventListener('click', () => {
                const sub = appData.subjects.find(s => s.id === btn.dataset.subject);
                if (sub) {
                    sub.chapters.splice(parseInt(btn.dataset.chapter), 1);
                    saveData(appData);
                    renderSubjects();
                }
            });
        });

        container.querySelectorAll('.edit-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubjectModal(btn.dataset.id);
            });
        });

        container.querySelectorAll('.delete-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this subject and all its chapters?')) {
                    appData.subjects = appData.subjects.filter(s => s.id !== btn.dataset.subject);
                    saveData(appData);
                    renderSubjects();
                    showToast('Subject deleted');
                }
            });
        });
    }

    // --- SUBJECT MODAL ---
    let chapterInputs = [];

    function openSubjectModal(editId) {
        const modal = document.getElementById('subjectModal');
        const form = document.getElementById('subjectForm');
        const title = document.getElementById('subjectModalTitle');
        const container = document.getElementById('chaptersList');

        form.reset();
        document.getElementById('editSubjectId').value = '';
        document.getElementById('subjectColor').value = '#4CAF50';
        chapterInputs = [];

        if (editId) {
            const subject = appData.subjects.find(s => s.id === editId);
            if (subject) {
                title.textContent = 'Edit Subject';
                document.getElementById('editSubjectId').value = subject.id;
                document.getElementById('subjectName').value = subject.name;
                document.getElementById('subjectColor').value = subject.color;
                subject.chapters.forEach(ch => addChapterInput(ch.name, ch.done));
            }
        } else {
            title.textContent = 'Add Subject';
            addChapterInput('');
            addChapterInput('');
            addChapterInput('');
        }

        modal.classList.add('open');
    }

    function addChapterInput(value = '', done = false) {
        const container = document.getElementById('chaptersList');
        const div = document.createElement('div');
        div.className = 'form-group';
        div.style.display = 'flex';
        div.style.gap = '0.5rem';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <input type="text" class="chapter-input" value="${value}" placeholder="Chapter name" style="flex:1">
            <button type="button" class="btn btn-sm btn-danger remove-chapter-input">&times;</button>
        `;
        container.appendChild(div);
        chapterInputs.push(div);

        div.querySelector('.remove-chapter-input').addEventListener('click', () => {
            div.remove();
            chapterInputs = chapterInputs.filter(c => c !== div);
        });
    }

    document.getElementById('addChapterBtn').addEventListener('click', () => addChapterInput(''));

    document.getElementById('addSubjectBtn').addEventListener('click', () => openSubjectModal(null));

    document.getElementById('closeSubjectModal').addEventListener('click', () => {
        document.getElementById('subjectModal').classList.remove('open');
    });

    document.getElementById('cancelSubjectBtn').addEventListener('click', () => {
        document.getElementById('subjectModal').classList.remove('open');
    });

    document.getElementById('subjectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editSubjectId').value;
        const name = document.getElementById('subjectName').value.trim();
        const color = document.getElementById('subjectColor').value;
        const chapterEls = document.querySelectorAll('.chapter-input');
        const chapters = [];
        chapterEls.forEach(input => {
            const val = input.value.trim();
            if (val) chapters.push({ name: val, done: false });
        });

        if (!name) return;

        if (editId) {
            const subject = appData.subjects.find(s => s.id === editId);
            if (subject) {
                subject.name = name;
                subject.color = color;
                chapters.forEach((ch, i) => {
                    if (subject.chapters[i]) {
                        ch.done = subject.chapters[i].done;
                    }
                });
                subject.chapters = chapters;
            }
        } else {
            appData.subjects.push({ id: generateId(), name, color, chapters });
        }

        saveData(appData);
        document.getElementById('subjectModal').classList.remove('open');
        renderSubjects();
        showToast(editId ? 'Subject updated!' : 'Subject added!');
    });

    // --- EXAMS ---
    function renderExams() {
        const container = document.getElementById('examsList');
        if (appData.exams.length === 0) {
            container.innerHTML = '<p class="empty-state">No exams added yet. Click "+ Add Exam" to add your board exam dates!</p>';
            return;
        }

        const sorted = [...appData.exams].sort((a, b) => a.date.localeCompare(b.date));
        let html = '';
        sorted.forEach(exam => {
            const days = daysBetween(todayStr(), exam.date);
            const countdownClass = days > 30 ? 'countdown-safe' : days > 7 ? 'countdown-warning' : 'countdown-danger';
            const countdownText = days > 0 ? `${days}d left` : days === 0 ? 'TODAY!' : 'Passed';
            const subject = appData.subjects.find(s => s.id === exam.subjectId);
            html += `<div class="exam-card">
                <div class="exam-info">
                    <h3>${exam.name}</h3>
                    <p>${subject ? subject.name : 'Unknown'} &bull; ${formatDate(exam.date)}</p>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span class="exam-countdown ${countdownClass}">${countdownText}</span>
                    <button class="btn btn-sm btn-danger delete-exam" data-id="${exam.id}">Del</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.delete-exam').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this exam?')) {
                    appData.exams = appData.exams.filter(e => e.id !== btn.dataset.id);
                    saveData(appData);
                    renderExams();
                    showToast('Exam deleted');
                }
            });
        });
    }

    document.getElementById('addExamBtn').addEventListener('click', () => {
        const modal = document.getElementById('examModal');
        const select = document.getElementById('examSubject');
        select.innerHTML = '';
        appData.subjects.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        if (appData.subjects.length === 0) {
            showToast('Add subjects first!', 'error');
            return;
        }
        document.getElementById('examForm').reset();
        document.getElementById('examChapters').value = 'all';
        modal.classList.add('open');
    });

    document.getElementById('closeExamModal').addEventListener('click', () => {
        document.getElementById('examModal').classList.remove('open');
    });

    document.getElementById('cancelExamBtn').addEventListener('click', () => {
        document.getElementById('examModal').classList.remove('open');
    });

    document.getElementById('examForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('examName').value.trim();
        const subjectId = document.getElementById('examSubject').value;
        const date = document.getElementById('examDate').value;
        const chapters = document.getElementById('examChapters').value.trim();

        if (!name || !subjectId || !date) return;

        appData.exams.push({ id: generateId(), name, subjectId, date, chapters });
        saveData(appData);
        document.getElementById('examModal').classList.remove('open');
        renderExams();
        showToast('Exam added!');
    });

    // --- SCHEDULE GENERATOR ---
    document.getElementById('generateScheduleBtn').addEventListener('click', () => {
        if (appData.subjects.length === 0) {
            showToast('Add subjects first!', 'error');
            return;
        }
        if (appData.exams.length === 0) {
            showToast('Add exam dates first!', 'error');
            return;
        }

        const firstExam = getFirstExamDate();
        const today = todayStr();
        if (firstExam <= today) {
            showToast('First exam is today or in the past!', 'error');
            return;
        }

        appData.schedule = {};
        appData.completedTasks = {};

        const s = appData.settings;
        const studyStart = timeToMinutes(s.studyStartTime);
        const studyEnd = timeToMinutes(s.studyEndTime);
        const schoolStart = timeToMinutes(s.schoolStart);
        const schoolEnd = timeToMinutes(s.schoolEnd);
        const sessionLen = s.sessionDuration;
        const breakLen = s.breakDuration;

        // Collect all chapters that need to be studied
        let allTasks = [];
        appData.exams.forEach(exam => {
            const subject = appData.subjects.find(sub => sub.id === exam.subjectId);
            if (!subject) return;

            let chaptersToStudy;
            if (exam.chapters === 'all') {
                chaptersToStudy = subject.chapters.map((ch, i) => i);
            } else {
                chaptersToStudy = exam.chapters.split(',').map(n => parseInt(n.trim()) - 1).filter(n => n >= 0);
            }

            chaptersToStudy.forEach(ci => {
                if (subject.chapters[ci] && !subject.chapters[ci].done) {
                    allTasks.push({
                        subjectId: subject.id,
                        subjectName: subject.name,
                        subjectColor: subject.color,
                        chapterIndex: ci,
                        chapterName: subject.chapters[ci].name,
                        examDate: exam.date,
                        examName: exam.name
                    });
                }
            });
        });

        if (allTasks.length === 0) {
            showToast('All chapters are already marked as done!', 'success');
            renderDashboard();
            return;
        }

        // Sort tasks by exam date (earliest first)
        allTasks.sort((a, b) => a.examDate.localeCompare(b.examDate));

        // Generate daily schedules
        const startDate = parseDate(today);
        const endDate = parseDate(firstExam);
        let taskIndex = 0;

        for (let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()); d < endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = toLocalDateStr(d);
            const daySchedule = [];
            let currentMinute = studyStart;
            const holiday = isHoliday(dateStr);
            const hSessionLen = holiday ? (s.holidaySessionDuration || 60) : sessionLen;
            const hBreakLen = holiday ? (s.holidayBreakDuration || 15) : breakLen;

            if (holiday) {
                // Holiday: study full day, no school
                daySchedule.push({
                    time: minutesToTime(studyStart),
                    title: 'Holiday - Full Day Study',
                    description: 'No school today - extra study time!',
                    type: 'type-rest'
                });
                currentMinute = studyStart;

                while (currentMinute < studyEnd && taskIndex < allTasks.length) {
                    const sessionEnd = currentMinute + hSessionLen;
                    if (sessionEnd > studyEnd) break;

                    const task = allTasks[taskIndex];
                    daySchedule.push({
                        time: minutesToTime(currentMinute),
                        title: `${task.subjectName} - Ch ${task.chapterIndex + 1}`,
                        description: task.chapterName,
                        type: 'study',
                        taskId: taskIndex,
                        subjectColor: task.subjectColor
                    });
                    currentMinute += hSessionLen;
                    if (currentMinute < studyEnd) {
                        daySchedule.push({
                            time: minutesToTime(currentMinute),
                            title: 'Break',
                            description: 'Rest, stretch, hydrate',
                            type: 'break'
                        });
                        currentMinute += hBreakLen;
                    }
                    taskIndex++;
                }
            } else {
                // Regular day: morning session before school
                while (currentMinute < schoolStart && taskIndex < allTasks.length) {
                    const sessionEnd = currentMinute + sessionLen;
                    if (sessionEnd > schoolStart) break;

                    const task = allTasks[taskIndex];
                    daySchedule.push({
                        time: minutesToTime(currentMinute),
                        title: `${task.subjectName} - Ch ${task.chapterIndex + 1}`,
                        description: task.chapterName,
                        type: 'study',
                        taskId: taskIndex,
                        subjectColor: task.subjectColor
                    });
                    currentMinute += sessionLen + breakLen;
                    if (currentMinute < schoolStart && taskIndex < allTasks.length) {
                        daySchedule.push({
                            time: minutesToTime(currentMinute - breakLen),
                            title: 'Break',
                            description: 'Take a short break',
                            type: 'break'
                        });
                    }
                    taskIndex++;
                }

                // School time
                daySchedule.push({
                    time: minutesToTime(Math.max(currentMinute, schoolStart)),
                    title: 'School',
                    description: 'Focus in school - pay attention to what you study later',
                    type: 'school'
                });

                // Evening session after school
                currentMinute = Math.max(schoolEnd, currentMinute);
                while (currentMinute < studyEnd && taskIndex < allTasks.length) {
                    const sessionEnd = currentMinute + sessionLen;
                    if (sessionEnd > studyEnd) break;

                    const task = allTasks[taskIndex];
                    daySchedule.push({
                        time: minutesToTime(currentMinute),
                        title: `${task.subjectName} - Ch ${task.chapterIndex + 1}`,
                        description: task.chapterName,
                        type: 'study',
                        taskId: taskIndex,
                        subjectColor: task.subjectColor
                    });
                    currentMinute += sessionLen;
                    if (currentMinute < studyEnd) {
                        daySchedule.push({
                            time: minutesToTime(currentMinute),
                            title: 'Break',
                            description: 'Rest, stretch, hydrate',
                            type: 'break'
                        });
                        currentMinute += breakLen;
                    }
                    taskIndex++;
                }
            }

            // End of day wind down
            if (daySchedule.length > 0) {
                daySchedule.push({
                    time: minutesToTime(Math.min(currentMinute, studyEnd - 30)),
                    title: 'Wind Down',
                    description: 'Relax, light revision of what you studied today',
                    type: 'rest'
                });
            }

            if (daySchedule.length > 0) {
                appData.schedule[dateStr] = daySchedule;
            }

            if (taskIndex >= allTasks.length) break;
        }

        saveData(appData);
        const totalScheduled = taskIndex;
        const remaining = allTasks.length - totalScheduled;
        let msg = `Schedule generated! ${totalScheduled} sessions planned.`;
        if (remaining > 0) msg += ` ${remaining} chapters couldn't fit - consider adding more study hours.`;
        showToast(msg, 'success');
        renderDashboard();
    });

    // --- GENERATE SCHEDULE PAGE ---
    function loadGenerateForm() {
        const s = appData.settings;
        document.getElementById('studyStartTime').value = s.studyStartTime;
        document.getElementById('studyEndTime').value = s.studyEndTime;
        document.getElementById('schoolStart').value = s.schoolStart;
        document.getElementById('schoolEnd').value = s.schoolEnd;
        document.getElementById('sessionDuration').value = s.sessionDuration;
        document.getElementById('breakDuration').value = s.breakDuration;
        document.getElementById('holidaySessionDuration').value = s.holidaySessionDuration || 60;
        document.getElementById('holidayBreakDuration').value = s.holidayBreakDuration || 15;
        document.getElementById('weekendsAsHolidays').checked = appData.holidays.includes('weekends');
        renderHolidays();
    }

    document.getElementById('timingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        appData.settings.studyStartTime = document.getElementById('studyStartTime').value;
        appData.settings.studyEndTime = document.getElementById('studyEndTime').value;
        appData.settings.schoolStart = document.getElementById('schoolStart').value;
        appData.settings.schoolEnd = document.getElementById('schoolEnd').value;
        appData.settings.sessionDuration = parseInt(document.getElementById('sessionDuration').value);
        appData.settings.breakDuration = parseInt(document.getElementById('breakDuration').value);
        appData.settings.holidaySessionDuration = parseInt(document.getElementById('holidaySessionDuration').value) || 60;
        appData.settings.holidayBreakDuration = parseInt(document.getElementById('holidayBreakDuration').value) || 15;

        if (document.getElementById('weekendsAsHolidays').checked) {
            if (!appData.holidays.includes('weekends')) appData.holidays.push('weekends');
        } else {
            appData.holidays = appData.holidays.filter(h => h !== 'weekends');
        }

        saveData(appData);
        showToast('Timing settings saved!');
    });

    // --- SETTINGS PAGE ---
    function loadSettingsForm() {
        document.getElementById('enableNotifications').checked = appData.settings.enableNotifications;
        document.getElementById('reminderBefore').value = appData.settings.reminderBefore;
        updateNotifStatus();
    }

    document.getElementById('enableNotifBtn').addEventListener('click', async () => {
        if (!('Notification' in window)) {
            showToast('Notifications not supported on this browser', 'error');
            return;
        }
        const result = await Notification.requestPermission();
        updateNotifStatus();
        if (result === 'granted') {
            appData.settings.enableNotifications = true;
            document.getElementById('enableNotifications').checked = true;
            saveData(appData);
            showToast('Notifications enabled!');
            setupNotifications();
            new Notification('StudyPlanner', { body: 'Notifications are working! You will be reminded before each session.' });
        } else if (result === 'denied') {
            showToast('Notifications blocked. Enable them in browser settings.', 'error');
        }
    });

    document.getElementById('enableNotifications').addEventListener('change', (e) => {
        appData.settings.enableNotifications = e.target.checked;
        saveData(appData);
    });

    document.getElementById('reminderBefore').addEventListener('change', (e) => {
        appData.settings.reminderBefore = parseInt(e.target.value);
        saveData(appData);
    });

    // --- HOLIDAYS ---
    function isHoliday(dateStr) {
        if (appData.holidays.includes(dateStr)) return true;
        if (appData.holidays.includes('weekends')) {
            const d = parseDate(dateStr);
            if (d.getDay() === 0) return true;
        }
        return false;
    }

    function renderHolidays() {
        const container = document.getElementById('holidaysList');
        if (!container) return;
        const specific = appData.holidays.filter(h => h !== 'weekends');
        if (specific.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;">No specific holidays added yet.</p>';
            return;
        }
        let html = '<div style="margin-top:0.5rem;">';
        specific.sort().forEach(h => {
            html += `<div class="holiday-item">
                <span>${formatDate(h)}</span>
                <button class="btn btn-sm btn-danger remove-holiday" data-date="${h}">&times;</button>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.remove-holiday').forEach(btn => {
            btn.addEventListener('click', () => {
                appData.holidays = appData.holidays.filter(h => h !== btn.dataset.date);
                saveData(appData);
                renderHolidays();
            });
        });
    }

    const addHolidayBtn = document.getElementById('addHolidayBtn');
    if (addHolidayBtn) {
        addHolidayBtn.addEventListener('click', () => {
            const input = document.getElementById('holidayDateInput');
            const date = input.value;
            if (!date) { showToast('Pick a date first', 'error'); return; }
            if (appData.holidays.includes(date)) { showToast('Already a holiday', 'error'); return; }
            appData.holidays.push(date);
            saveData(appData);
            input.value = '';
            renderHolidays();
            showToast('Holiday added!');
        });
    }

    document.getElementById('resetAllBtn').addEventListener('click', () => {
        if (confirm('This will delete ALL your data - subjects, exams, schedules, everything. Are you sure?')) {
            if (confirm('Really? This cannot be undone!')) {
                appData = getDefaultData();
                saveData(appData);
                navigateTo('dashboard');
                showToast('All data reset');
            }
        }
    });

    // --- EXPORT / IMPORT ---
    document.getElementById('exportBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studyplanner-backup-${todayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!');
    });

    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (imported.subjects && imported.settings) {
                    appData = imported;
                    saveData(appData);
                    navigateTo('dashboard');
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
    });

    // --- NOTIFICATIONS ---
    let hasAskedPermission = false;

    function setupNotifications() {
        notificationTimers.forEach(t => clearTimeout(t));
        notificationTimers = [];

        if (!appData.settings.enableNotifications) return;

        if ('Notification' in window && !hasAskedPermission && Notification.permission === 'default') {
            hasAskedPermission = true;
            Notification.requestPermission();
        }

        const now = new Date();
        const todaySchedule = appData.schedule[todayStr()];
        if (!todaySchedule) return;

        const completed = appData.completedTasks[todayStr()] || {};

        todaySchedule.forEach((item, i) => {
            if (completed[i] || item.type === 'break' || item.type === 'rest' || item.type === 'school') return;

            const [h, m] = item.time.split(':').map(Number);
            const itemTime = new Date(now);
            itemTime.setHours(h, m, 0, 0);

            const reminderTime = new Date(itemTime.getTime() - appData.settings.reminderBefore * 60000);
            const delay = reminderTime.getTime() - now.getTime();

            if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
                const timer = setTimeout(() => {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('StudyPlanner Reminder', {
                            body: `Time to study: ${item.title}\n${item.description}`,
                            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📚</text></svg>'
                        });
                    }
                }, delay);
                notificationTimers.push(timer);
            }
        });
    }

    // --- PWA INSTALL ---
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBanner').style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        document.getElementById('installBanner').style.display = 'none';
    });

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                showToast('Use your browser menu > "Add to Home Screen"', 'error');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            document.getElementById('installBanner').style.display = 'none';
            if (outcome === 'accepted') {
                showToast('App installed! Open it from your home screen.');
            }
        });
    }

    const dismissBtn = document.getElementById('dismissInstall');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            document.getElementById('installBanner').style.display = 'none';
        });
    }

    // --- NOTIFICATION STATUS ---
    function updateNotifStatus() {
        const statusEl = document.getElementById('notifStatus');
        const btn = document.getElementById('enableNotifBtn');
        if (!statusEl || !btn) return;

        if (!('Notification' in window)) {
            statusEl.textContent = 'Not supported on this browser';
            statusEl.style.color = 'var(--danger)';
            btn.style.display = 'none';
            return;
        }

        if (Notification.permission === 'granted') {
            statusEl.textContent = 'Enabled';
            statusEl.style.color = 'var(--success)';
            btn.textContent = 'Notifications On';
            btn.disabled = true;
            btn.style.opacity = '0.6';
        } else if (Notification.permission === 'denied') {
            statusEl.textContent = 'Blocked - enable in browser settings';
            statusEl.style.color = 'var(--danger)';
            btn.style.display = 'none';
        } else {
            statusEl.textContent = '';
            btn.textContent = 'Enable Notifications';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }

    // --- INIT ---
    renderDashboard();
    updateNotifStatus();
    setupNotifications();

    setInterval(setupNotifications, 60000);

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    });

})();
