import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  todayStr, parseDate, toLocalDateStr, timeToMinutes, minutesToTime, 
  isHoliday, getFirstExamDate
} from './useStudyData';

export function useScheduleGenerator() {
  const { data, updateData, showToast } = useApp();

  const generateSchedule = useCallback(() => {
    if (data.subjects.length === 0) {
      showToast('Add subjects first!', 'error');
      return;
    }
    if (data.exams.length === 0) {
      showToast('Add exam dates first!', 'error');
      return;
    }

    const today = todayStr();
    const firstExam = getFirstExamDate(data.exams);
    if (!firstExam || firstExam <= today) {
      showToast('First exam is today or in the past!', 'error');
      return;
    }

    let allTasks = [];
    data.exams.forEach(exam => {
      const subject = data.subjects.find(s => s.id === exam.subjectId);
      if (!subject) return;

      let chaptersToStudy;
      if (exam.chapters === 'all') {
        chaptersToStudy = subject.chapters.map((ch, i) => i);
      } else {
        chaptersToStudy = exam.chapters.split(',')
          .map(n => parseInt(n.trim()) - 1)
          .filter(n => n >= 0);
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
      return;
    }

    allTasks.sort((a, b) => a.examDate.localeCompare(b.examDate));

    const s = data.settings;
    const studyStart = timeToMinutes(s.studyStartTime);
    const studyEnd = timeToMinutes(s.studyEndTime);
    const schoolStart = timeToMinutes(s.schoolStart);
    const schoolEnd = timeToMinutes(s.schoolEnd);
    const sessionLen = s.sessionDuration;
    const breakLen = s.breakDuration;
    const hSessionLen = s.holidaySessionDuration || 60;
    const hBreakLen = s.holidayBreakDuration || 15;

    const newSchedule = {};
    const newCompleted = {};
    let taskIndex = 0;

    const startDate = parseDate(today);
    const endDate = parseDate(firstExam);

    for (let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()); 
         d < endDate; 
         d.setDate(d.getDate() + 1)) {
      const dateStr = toLocalDateStr(d);
      const daySchedule = [];
      let currentMinute = studyStart;
      const holiday = isHoliday(dateStr, data.holidays);

      if (holiday) {
        daySchedule.push({
          time: minutesToTime(studyStart),
          title: 'Holiday - Full Day Study',
          description: 'No school today - extra study time!',
          type: 'holiday'
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

        daySchedule.push({
          time: minutesToTime(Math.max(currentMinute, schoolStart)),
          title: 'School',
          description: 'Focus in school - pay attention to what you study later',
          type: 'school'
        });

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

      if (daySchedule.length > 0) {
        daySchedule.push({
          time: minutesToTime(Math.min(currentMinute, studyEnd - 30)),
          title: 'Wind Down',
          description: 'Relax, light revision of what you studied today',
          type: 'rest'
        });
        newSchedule[dateStr] = daySchedule;
      }

      if (taskIndex >= allTasks.length) break;
    }

    updateData(prev => ({
      ...prev,
      schedule: newSchedule,
      completedTasks: newCompleted
    }));

    const totalScheduled = taskIndex;
    const remaining = allTasks.length - totalScheduled;
    let msg = `Schedule generated! ${totalScheduled} sessions planned.`;
    if (remaining > 0) msg += ` ${remaining} chapters couldn't fit - consider adding more study hours.`;
    showToast(msg, 'success');
  }, [data, updateData, showToast]);

  return { generateSchedule };
}
