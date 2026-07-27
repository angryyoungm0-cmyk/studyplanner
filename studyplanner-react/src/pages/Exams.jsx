import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { generateId, daysBetween, todayStr, formatDate } from '../hooks/useStudyData';

const EXAM_TYPES = [
  { id: 'unit-test', label: 'Unit Test' },
  { id: 'midterm', label: 'Midterm' },
  { id: 'prelims', label: 'Prelims' },
  { id: 'final', label: 'Board Exam' },
];

export function Exams() {
  const { data, updateData, showToast } = useApp();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('unit-test');

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setSubjectId(data.subjects[0]?.id || '');
    setDate('');
    setType('unit-test');
    setShowModal(true);
  };

  const openEditModal = (exam) => {
    setEditId(exam.id);
    setName(exam.name);
    setSubjectId(exam.subjectId || '');
    setDate(exam.date);
    setType(exam.type || 'unit-test');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !date) return;
    const examData = {
      id: editId || generateId(),
      name: name.trim(),
      subjectId,
      date,
      type,
    };

    if (editId) {
      updateData(prev => ({
        ...prev,
        exams: prev.exams.map(e => e.id === editId ? examData : e)
      }));
      showToast('Exam updated!');
    } else {
      updateData(prev => ({ ...prev, exams: [...prev.exams, examData] }));
      showToast('Exam added!');
    }
    setShowModal(false);
  };

  const deleteExam = (id) => {
    if (!confirm('Delete this exam?')) return;
    updateData(prev => ({ ...prev, exams: prev.exams.filter(e => e.id !== id) }));
    showToast('Exam deleted');
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('examsTitle')}</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>+ {t('addExam')}</button>
        </div>
      </div>

      {data.exams.length === 0 && (
        <p className="empty-state">{t('noExams')}</p>
      )}

      {data.exams.map(exam => {
        const days = daysBetween(todayStr(), exam.date);
        const daysText = days > 0 ? `${days} days left` : days === 0 ? 'TODAY' : `${Math.abs(days)} days ago`;
        const subject = data.subjects.find(s => s.id === exam.subjectId);
        const typeInfo = EXAM_TYPES.find(et => et.id === exam.type);
        return (
          <div key={exam.id} className="exam-card">
            <div className="exam-top">
              <span className="exam-badge">{typeInfo?.label || 'Exam'}</span>
              <span className={`exam-countdown ${days <= 3 ? 'urgent' : days <= 7 ? 'soon' : ''}`}>{daysText}</span>
            </div>
            <h3>{exam.name}</h3>
            {subject && <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginTop:'0.25rem'}}>{subject.name}</p>}
            <div className="exam-bottom">
              <span className="exam-date">{formatDate(exam.date)}</span>
              <div className="exam-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(exam)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteExam(exam.id)}>Del</button>
              </div>
            </div>
          </div>
        );
      })}

      {showModal && (
        <div className="modal open" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Exam' : t('addExam')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>Exam Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maths Prelim 1" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
                {EXAM_TYPES.map(et => (
                  <button key={et.id} className={`btn btn-sm ${type === et.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setType(et.id)}>
                    {et.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Subject (optional)</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">No specific subject</option>
                {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editId ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}