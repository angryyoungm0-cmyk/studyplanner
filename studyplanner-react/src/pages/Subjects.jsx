import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { generateId } from '../hooks/useStudyData';
import { getSubjectList } from '../data/syllabus';

export function Subjects() {
  const { data, updateData, showToast } = useApp();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [chapters, setChapters] = useState(['']);
  const [openSubject, setOpenSubject] = useState(null);

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setColor('#4CAF50');
    setChapters(['', '', '']);
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditId(subject.id);
    setName(subject.name);
    setColor(subject.color);
    setChapters(subject.chapters.map(c => c.name));
    setShowModal(true);
  };

  const addFromSyllabus = (subId) => {
    const sub = getSubjectList().find(s => s.id === subId);
    if (!sub) return;
    if (data.subjects.find(s => s.id === subId)) {
      showToast(t('subjectsTitle') + ' already added!', 'error');
      return;
    }
    const chapters = sub.chapters.map(ch => ({ name: ch.name, done: false }));
    updateData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { id: subId, name: sub.name, color: '#3b82f6', chapters }]
    }));
    showToast(`${sub.name} added from syllabus!`);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const chapterList = chapters.filter(c => c.trim()).map(c => ({ name: c.trim(), done: false }));

    if (editId) {
      updateData(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => {
          if (s.id !== editId) return s;
          const newChapters = chapterList.map((ch, i) => ({
            ...ch,
            done: s.chapters[i] ? s.chapters[i].done : false
          }));
          return { ...s, name: name.trim(), color, chapters: newChapters };
        })
      }));
      showToast(t('subjectsTitle') + ' updated!');
    } else {
      updateData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { id: generateId(), name: name.trim(), color, chapters: chapterList }]
      }));
      showToast(t('subjectsTitle') + ' added!');
    }
    setShowModal(false);
  };

  const deleteSubject = (id) => {
    if (!confirm('Delete this subject and all its chapters?')) return;
    updateData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== id) }));
    showToast(t('subjectsTitle') + ' deleted');
  };

  const toggleChapter = (subjectId, chapterIndex) => {
    updateData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => {
        if (s.id !== subjectId) return s;
        const chapters = [...s.chapters];
        chapters[chapterIndex] = { ...chapters[chapterIndex], done: !chapters[chapterIndex].done };
        return { ...s, chapters };
      })
    }));
  };

  const deleteChapter = (subjectId, chapterIndex) => {
    updateData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => {
        if (s.id !== subjectId) return s;
        const chapters = s.chapters.filter((_, i) => i !== chapterIndex);
        return { ...s, chapters };
      })
    }));
  };

  const addChapterInput = () => setChapters([...chapters, '']);
  const removeChapterInput = (i) => setChapters(chapters.filter((_, idx) => idx !== i));
  const updateChapterInput = (i, val) => {
    const updated = [...chapters];
    updated[i] = val;
    setChapters(updated);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('subjectsTitle')}</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>+ {t('addSubject')}</button>
        </div>
      </div>

      {data.subjects.length === 0 && (
        <div className="card">
          <h2>Add from Maharashtra Board Syllabus</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem'}}>
            Quick-add subjects with all chapters pre-loaded:
          </p>
          <div className="sp-grid">
            {getSubjectList().map(sub => (
              <div key={sub.id} className="sp-card" onClick={() => addFromSyllabus(sub.id)}>
                <div className="sp-card-icon">{sub.icon}</div>
                <div className="sp-card-name">{sub.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.subjects.length === 0 && (
        <p className="empty-state">No subjects added yet. Use the quick-add above or click "+ {t('addSubject')}"!</p>
      )}

      {data.subjects.map(subject => {
        const total = subject.chapters.length;
        const done = subject.chapters.filter(c => c.done).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const isOpen = openSubject === subject.id;

        return (
          <div key={subject.id} className="subject-card" data-subject-id={subject.id}>
            <div className="subject-header" onClick={() => setOpenSubject(isOpen ? null : subject.id)}>
              <div className="subject-title">
                <div className="subject-color" style={{background: subject.color}} />
                <span>{subject.name}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                <span className="subject-progress">{done}/{total} ({pct}%)</span>
                <div className="subject-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(subject)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteSubject(subject.id)}>Del</button>
                </div>
              </div>
            </div>
            {isOpen && (
              <div className="subject-chapters open">
                {subject.chapters.map((ch, ci) => (
                  <div key={ci} className="chapter-item">
                    <div className="chapter-left">
                      <input
                        type="checkbox"
                        className="chapter-checkbox"
                        checked={ch.done}
                        onChange={() => toggleChapter(subject.id, ci)}
                      />
                      <span className={`chapter-name ${ch.done ? 'done' : ''}`}>Ch {ci + 1}: {ch.name}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteChapter(subject.id, ci)}>&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {showModal && (
        <div className="modal open" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Subject' : t('addSubject')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>Subject Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Chapters</label>
              {chapters.map((ch, i) => (
                <div key={i} style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.5rem'}}>
                  <input type="text" value={ch} onChange={e => updateChapterInput(i, e.target.value)} placeholder={`Chapter ${i + 1}`} style={{flex:1}} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeChapterInput(i)}>&times;</button>
                </div>
              ))}
              <button className="btn btn-sm btn-secondary" onClick={addChapterInput}>+ Add Chapter</button>
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