const {
  calculateGradeLetter,
  calculatePassRate,
  calculateAverage,
  generateStudentReport,
} = require('../gradeCalculator');

// ─── calculateGradeLetter ────────────────────────────────────────────────────

describe('calculateGradeLetter', () => {
  describe('grade letter thresholds (no attendance bonus)', () => {
    const cases = [
      { score: 100, expected: 'A' },
      { score: 90,  expected: 'A' },
      { score: 89,  expected: 'B' },
      { score: 75,  expected: 'B' },
      { score: 74,  expected: 'C' },
      { score: 60,  expected: 'C' },
      { score: 59,  expected: 'D' },
      { score: 50,  expected: 'D' },
      { score: 49,  expected: 'E' },
      { score: 0,   expected: 'E' },
    ];

    cases.forEach(({ score, expected }) => {
      it(`score ${score} with attendance < 80 → grade ${expected}`, () => {
        const { gradeLetter, finalScore } = calculateGradeLetter(score, 0);
        expect(gradeLetter).toBe(expected);
        expect(finalScore).toBe(score);
      });
    });
  });

  describe('attendance bonus (+5 when attendance >= 80)', () => {
    it('adds 5 points when attendance is exactly 80', () => {
      const { finalScore } = calculateGradeLetter(70, 80);
      expect(finalScore).toBe(75);
    });

    it('adds 5 points when attendance is 100', () => {
      const { finalScore } = calculateGradeLetter(70, 100);
      expect(finalScore).toBe(75);
    });

    it('does NOT add bonus when attendance is 79', () => {
      const { finalScore } = calculateGradeLetter(70, 79);
      expect(finalScore).toBe(70);
    });

    it('caps finalScore at 100 when score + bonus would exceed 100', () => {
      const { finalScore } = calculateGradeLetter(98, 80);
      expect(finalScore).toBe(100);
    });

    it('caps finalScore at 100 when score is already 100', () => {
      const { finalScore } = calculateGradeLetter(100, 80);
      expect(finalScore).toBe(100);
    });

    it('bonus can push grade from B to A (74 + 5 = 79 → still B, 85 + 5 = 90 → A)', () => {
      const { gradeLetter } = calculateGradeLetter(85, 80);
      expect(gradeLetter).toBe('A');
    });

    it('bonus can push grade from E to D (46 + 5 = 51 → D)', () => {
      const { gradeLetter } = calculateGradeLetter(46, 80);
      expect(gradeLetter).toBe('D');
    });
  });

  describe('return shape', () => {
    it('returns an object with gradeLetter and finalScore', () => {
      const result = calculateGradeLetter(70, 50);
      expect(result).toHaveProperty('gradeLetter');
      expect(result).toHaveProperty('finalScore');
    });
  });
});

// ─── calculatePassRate ───────────────────────────────────────────────────────

describe('calculatePassRate', () => {
  it('returns 100 when all scores are >= 60', () => {
    const grades = [{ score: 60 }, { score: 75 }, { score: 90 }];
    expect(calculatePassRate(grades)).toBe(100);
  });

  it('returns 0 when all scores are < 60', () => {
    const grades = [{ score: 30 }, { score: 45 }, { score: 59 }];
    expect(calculatePassRate(grades)).toBe(0);
  });

  it('calculates correct pass rate for mixed scores', () => {
    // 2 out of 4 pass → 50%
    const grades = [{ score: 80 }, { score: 40 }, { score: 65 }, { score: 55 }];
    expect(calculatePassRate(grades)).toBe(50);
  });

  it('rounds to 2 decimal places', () => {
    // 1 out of 3 → 33.333... → 33.33
    const grades = [{ score: 70 }, { score: 40 }, { score: 50 }];
    expect(calculatePassRate(grades)).toBe(33.33);
  });

  it('returns 0 for empty array', () => {
    expect(calculatePassRate([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(calculatePassRate(null)).toBe(0);
    expect(calculatePassRate(undefined)).toBe(0);
  });

  it('treats score exactly 60 as passing', () => {
    const grades = [{ score: 60 }];
    expect(calculatePassRate(grades)).toBe(100);
  });

  it('treats score 59 as failing', () => {
    const grades = [{ score: 59 }];
    expect(calculatePassRate(grades)).toBe(0);
  });
});

// ─── calculateAverage ───────────────────────────────────────────────────────

describe('calculateAverage', () => {
  it('calculates average of equal scores', () => {
    expect(calculateAverage([50, 50, 50])).toBe(50);
  });

  it('calculates average of varied scores', () => {
    expect(calculateAverage([60, 80, 100])).toBe(80);
  });

  it('rounds to 2 decimal places', () => {
    // (10 + 20 + 30) / 3 = 20
    expect(calculateAverage([10, 20, 30])).toBe(20);
    // 1/3 ≈ 0.33
    expect(calculateAverage([0, 0, 1])).toBe(0.33);
  });

  it('returns the single value for a one-element array', () => {
    expect(calculateAverage([75])).toBe(75);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAverage([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(calculateAverage(null)).toBe(0);
    expect(calculateAverage(undefined)).toBe(0);
  });
});

// ─── generateStudentReport ──────────────────────────────────────────────────

describe('generateStudentReport', () => {
  const student = {
    studentId: 'STU001',
    name: 'Alice',
    class: '10A',
  };

  const grades = [
    {
      score: 80,
      attendance: 90,
      subjectId: { name: 'Math', code: 'MTH101' },
    },
    {
      score: 55,
      attendance: 70,
      subjectId: { name: 'Science', code: 'SCI101' },
    },
  ];

  let report;

  beforeEach(() => {
    report = generateStudentReport(student, grades);
  });

  it('returns correct studentId, studentName, and class', () => {
    expect(report.studentId).toBe('STU001');
    expect(report.studentName).toBe('Alice');
    expect(report.class).toBe('10A');
  });

  it('includes a subjects array with one entry per grade', () => {
    expect(report.subjects).toHaveLength(2);
  });

  it('populates subject name and code from subjectId', () => {
    expect(report.subjects[0].subjectName).toBe('Math');
    expect(report.subjects[0].subjectCode).toBe('MTH101');
  });

  it('applies attendance bonus correctly in subjects', () => {
    // Math: score 80, attendance 90 → finalScore 85, grade B
    expect(report.subjects[0].finalScore).toBe(85);
    expect(report.subjects[0].gradeLetter).toBe('B');

    // Science: score 55, attendance 70 → no bonus, finalScore 55, grade D
    expect(report.subjects[1].finalScore).toBe(55);
    expect(report.subjects[1].gradeLetter).toBe('D');
  });

  it('calculates averageScore from finalScores', () => {
    // finalScores: [85, 55] → avg = 70
    expect(report.averageScore).toBe(70);
  });

  it('calculates passRate from original scores', () => {
    // scores: [80, 55] → 1 pass out of 2 → 50%
    expect(report.passRate).toBe(50);
  });

  it('sets status to "pass" when averageScore >= 60', () => {
    expect(report.status).toBe('pass');
  });

  it('sets status to "fail" when averageScore < 60', () => {
    const lowGrades = [
      { score: 30, attendance: 50, subjectId: { name: 'Math', code: 'MTH101' } },
      { score: 40, attendance: 60, subjectId: { name: 'Science', code: 'SCI101' } },
    ];
    const failReport = generateStudentReport(student, lowGrades);
    expect(failReport.status).toBe('fail');
  });

  it('handles empty grades array gracefully', () => {
    const emptyReport = generateStudentReport(student, []);
    expect(emptyReport.subjects).toHaveLength(0);
    expect(emptyReport.averageScore).toBe(0);
    expect(emptyReport.passRate).toBe(0);
    expect(emptyReport.status).toBe('fail');
  });

  it('handles null subjectId gracefully', () => {
    const gradesNoSubject = [{ score: 70, attendance: 85, subjectId: null }];
    const r = generateStudentReport(student, gradesNoSubject);
    expect(r.subjects[0].subjectName).toBeNull();
    expect(r.subjects[0].subjectCode).toBeNull();
  });
});
