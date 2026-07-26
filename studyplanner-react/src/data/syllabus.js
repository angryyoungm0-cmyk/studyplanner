export const SYLLABUS = {
  mathematics: {
    name: 'Mathematics',
    icon: '📐',
    chapters: [
      { id: 'linear-equations', name: 'Linear Equations in Two Variables' },
      { id: 'quadratic', name: 'Quadratic Equations' },
      { id: 'arithmetic-progression', name: 'Arithmetic Progression' },
      { id: 'financial-planning', name: 'Financial Planning' },
      { id: 'probability', name: 'Probability' },
      { id: 'statistics', name: 'Statistics' },
      { id: 'coordinate-geometry', name: 'Coordinate Geometry' },
      { id: 'triangles', name: 'Similarity' },
      { id: 'circle', name: 'Circles' },
      { id: 'geometric-construction', name: 'Geometric Construction' },
      { id: 'trigonometry', name: 'Trigonometry' },
      { id: 'mensuration', name: 'Mensuration' }
    ]
  },
  science: {
    name: 'Science',
    icon: '🔬',
    chapters: [
      { id: 'gravitation', name: 'Gravitation' },
      { id: 'work-energy', name: 'Work and Energy' },
      { id: 'sound', name: 'Sound' },
      { id: 'effect-of-heat', name: 'Effect of Heat' },
      { id: 'refraction', name: 'Refraction of Light' },
      { id: 'electrostatics', name: 'Electrostatics' },
      { id: 'current-electricity', name: 'Current Electricity' },
      { id: 'elements-compounds', name: 'Elements and Compounds' },
      { id: 'chemical-reactions', name: 'Chemical Reactions and Equations' },
      { id: 'acid-base-salt', name: 'Acids, Bases and Salts' },
      { id: 'metallurgy', name: 'Metallurgy' },
      { id: 'carbon-compounds', name: 'Carbon Compounds' },
      { id: 'cell', name: 'The Cell and Cell Division' },
      { id: 'heredity', name: 'Heredity and Evolution' },
      { id: 'life-processes', name: 'Life Processes' },
      { id: 'control-coordination', name: 'Control and Coordination' },
      { id: 'organisation-tissues', name: 'Organisation in Living Organisms' },
      { id: 'environmental-changes', name: 'Environmental Changes' },
      { id: 'man-made-materials', name: 'Man-made Materials' },
      { id: 'micro-organisms', name: 'Micro-organisms' }
    ]
  },
  english: {
    name: 'English',
    icon: '📖',
    chapters: [
      { id: 'prose-1', name: 'Prose - Unit 1' },
      { id: 'prose-2', name: 'Prose - Unit 2' },
      { id: 'prose-3', name: 'Prose - Unit 3' },
      { id: 'prose-4', name: 'Prose - Unit 4' },
      { id: 'prose-5', name: 'Prose - Unit 5' },
      { id: 'poetry-1', name: 'Poetry - Unit 1' },
      { id: 'poetry-2', name: 'Poetry - Unit 2' },
      { id: 'poetry-3', name: 'Poetry - Unit 3' },
      { id: 'poetry-4', name: 'Poetry - Unit 4' },
      { id: 'poetry-5', name: 'Poetry - Unit 5' },
      { id: 'writing-skills', name: 'Writing Skills' },
      { id: 'grammar', name: 'Grammar' }
    ]
  },
  socialscience: {
    name: 'Social Science',
    icon: '🌍',
    chapters: [
      { id: 'history-1', name: 'History - The Rise of Nationalism in Europe' },
      { id: 'history-2', name: 'History - Nationalism in India' },
      { id: 'history-3', name: 'History - The Making of a Global World' },
      { id: 'history-4', name: 'History - The Age of Industrialisation' },
      { id: 'history-5', name: 'History - Print Culture and the Modern World' },
      { id: 'geography-1', name: 'Geography - Resources and Development' },
      { id: 'geography-2', name: 'Geography - Forest and Wildlife Resources' },
      { id: 'geography-3', name: 'Geography - Water Resources' },
      { id: 'geography-4', name: 'Geography - Agriculture' },
      { id: 'geography-5', name: 'Geography - Minerals and Energy Resources' },
      { id: 'geography-6', name: 'Geography - Manufacturing Industries' },
      { id: 'pol-sci-1', name: 'Political Science - Power Sharing' },
      { id: 'pol-sci-2', name: 'Political Science - Federalism' },
      { id: 'pol-sci-3', name: 'Political Science - Democracy and Diversity' },
      { id: 'pol-sci-4', name: 'Political Science - Gender, Religion and Caste' },
      { id: 'economics-1', name: 'Economics - Development' },
      { id: 'economics-2', name: 'Economics - Sectors of the Indian Economy' },
      { id: 'economics-3', name: 'Economics - Money and Credit' }
    ]
  },
  marathi: {
    name: 'Marathi',
    icon: '📝',
    chapters: [
      { id: 'marathi-prose', name: 'Gadya (Prose)' },
      { id: 'marathi-poetry', name: 'Padya (Poetry)' },
      { id: 'marathi-vyakaran', name: 'Vyakaran (Grammar)' },
      { id: 'marathi-lekhan', name: 'Lekhan (Writing)' }
    ]
  },
  hindi: {
    name: 'Hindi',
    icon: '📝',
    chapters: [
      { id: 'hindi-gadya', name: 'Gadya (Prose)' },
      { id: 'hindi-padya', name: 'Padya (Poetry)' },
      { id: 'hindi-vyakaran', name: 'Vyakaran (Grammar)' },
      { id: 'hindi-lekhan', name: 'Lekhan (Writing)' }
    ]
  }
};

export function getSubjectList() {
  return Object.entries(SYLLABUS).map(([key, sub]) => ({
    id: key,
    name: sub.name,
    icon: sub.icon,
    chapters: sub.chapters
  }));
}

export function getSubjectById(id) {
  return SYLLABUS[id];
}

export function getAllChapters() {
  const chapters = [];
  Object.entries(SYLLABUS).forEach(([subId, sub]) => {
    sub.chapters.forEach(ch => {
      chapters.push({ subjectId: subId, subjectName: sub.name, ...ch });
    });
  });
  return chapters;
}