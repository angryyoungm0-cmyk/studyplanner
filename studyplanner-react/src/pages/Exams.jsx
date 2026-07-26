import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate, todayStr, daysBetween } from '../hooks/useStudyData';
import { animate, stagger } from 'animejs';
import { animateModal } from '../hooks/useAnimations';

export function Exams() {
  const { data, updateData, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examChapters, setExamChapters] = useState('all');
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.exam-card');
    animate(cards, {
      opacity: [0, 1],
      translateX: [-20, 0],
      scale: [0.97, 1],
      duration: 300,
      delay: stagger(50),
      ease: 'outQuad'
    });
  }, [data.exams.length]);

  useEffect(() => {
    if (showModal && modalRef.current) animateModal(modalRef.current);
  }, [showModal]);

  const addExam = () => {
    if (!examName.trim() || !subjectId || !examDate) {
      showToast('Fill in all fields!', 'error');
      return;
    }
    updateData(prev => ({
      ...prev,
      exams: [...prev.exams, {
        id: generateId(),
        name: examName.trim(),
        subjectId,
        date: examDate,
        chapters: examChapters.trim() || 'all'
      }]
    }));
    setShowModal(false);
    setExamName('');
    setSubjectId('');
    setExamDate('');
    setExamChapters('all');
    showToast('Exam added!');
  };

  const deleteExam = (id) => {
    if (!confirm('Delete this exam?')) return;
    updateData(prev => ({
      ...prev,
      exams: prev.exams.filter(e => e.id !== id)
    }));
    showToast('Exam deleted');
  };

  const sorted = [...data.exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="container" ref={containerRef}>
      <div className="page-header">
        <h1>Exams</h1>
        <button className="btn btn-primary" onClick={() => {
          if (data.subjects.length === 0) { showToast('Add subjects first!', 'error'); return; }
          setExamName(''); setSubjectId(data.subjects[0]?.id || ''); setExamDate(''); setExamChapters('all');
          setShowModal(true);
        }}>+ Add Exam</button>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-state">No exams added yet. Click "+ Add Exam" to add your board exam dates!</p>
      ) : (
        sorted.map(exam => {
          const days = daysBetween(todayStr(), exam.date);
          const countdownClass = days > 30 ? 'countdown-safe' : days > 7 ? 'countdown-warning' : 'countdown-danger';
          const countdownText = days > 0 ? `${days}d left` : days === 0 ? 'TODAY!' : 'Passed';
          const subject = data.subjects.find(s => s.id === exam.subjectId);
          return (
            <div key={exam.id} className="exam-card">
              <div className="exam-info">
                <h3>{exam.name}</h3>
                <p>{subject ? subject.name : 'Unknown'} &bull; {formatDate(exam.date)}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span className={`exam-countdown ${countdownClass}`}>{countdownText}</span>
                <button className="btn btn-sm btn-danger" onClick={() => deleteExam(exam.id)}>Del</button>
              </div>
            </div>
          );
        })
      )}

      {showModal && (
        <div className="modal open" onClick={() => setShowModal(false)}>
          <div className="modal-content" ref={modalRef} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Exam</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>Exam Name</label>
              <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Mathematics Board Exam" />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                {data.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Exam Date</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Chapters (comma numbers, or "all")</label>
              <input type="text" value={examChapters} onChange={e => setExamChapters(e.target.value)} placeholder="all" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addExam}>Add Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
