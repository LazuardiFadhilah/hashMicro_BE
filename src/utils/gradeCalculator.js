/**
 * Grade Calculator Utility
 * Business logic for grade calculations, pass rate, averages, and student reports.
 */

/**
 * Calculate grade letter and final score with optional attendance bonus.
 *
 * @param {number} score - Raw score (0-100)
 * @param {number} attendance - Attendance percentage (0-100)
 * @returns {{ gradeLetter: string, finalScore: number }}
 */
function calculateGradeLetter(score, attendance) {
  // Apply attendance bonus: +5 points if attendance >= 80, capped at 100
  const bonus = attendance >= 80 ? 5 : 0;
  const finalScore = Math.min(score + bonus, 100);

  // Convert numeric score to letter grade
  let gradeLetter;
  if (finalScore >= 90) {
    gradeLetter = 'A';
  } else if (finalScore >= 75) {
    gradeLetter = 'B';
  } else if (finalScore >= 60) {
    gradeLetter = 'C';
  } else if (finalScore >= 50) {
    gradeLetter = 'D';
  } else {
    gradeLetter = 'E';
  }

  return { gradeLetter, finalScore };
}

/**
 * Calculate the pass rate from an array of grade objects.
 *
 * @param {Array<{ score: number }>} grades - Array of grade objects with a score field
 * @returns {number} Pass rate percentage rounded to 2 decimal places
 */
function calculatePassRate(grades) {
  if (!grades || grades.length === 0) return 0;

  const passCount = grades.filter((g) => g.score >= 60).length;
  const rate = (passCount / grades.length) * 100;

  return Math.round(rate * 100) / 100;
}

/**
 * Calculate the average of an array of numeric scores.
 *
 * @param {number[]} scores - Array of numeric scores
 * @returns {number} Average score rounded to 2 decimal places
 */
function calculateAverage(scores) {
  if (!scores || scores.length === 0) return 0;

  const sum = scores.reduce((acc, s) => acc + s, 0);
  const avg = sum / scores.length;

  return Math.round(avg * 100) / 100;
}

/**
 * Generate a comprehensive report for a single student.
 *
 * @param {object} student - Student document (must have _id, name, studentId, class)
 * @param {Array<object>} grades - Array of grade records populated with subject info
 *   Each grade should have: score, attendance, subjectId.name, subjectId.code
 * @returns {object} Student report object
 */
function generateStudentReport(student, grades) {
  // Build per-subject details with calculated grade letters and final scores
  const subjects = grades.map((grade) => {
    const { gradeLetter, finalScore } = calculateGradeLetter(
      grade.score,
      grade.attendance
    );

    return {
      subjectName: grade.subjectId ? grade.subjectId.name : null,
      subjectCode: grade.subjectId ? grade.subjectId.code : null,
      score: grade.score,
      attendance: grade.attendance,
      finalScore,
      gradeLetter,
    };
  });

  // Compute aggregate metrics from final scores
  const finalScores = subjects.map((s) => s.finalScore);
  const averageScore = calculateAverage(finalScores);

  // Pass rate is based on original scores (score >= 60)
  const passRate = calculatePassRate(grades);

  // Determine overall status
  const status = averageScore >= 60 ? 'pass' : 'fail';

  return {
    studentId: student.studentId,
    studentName: student.name,
    class: student.class,
    subjects,
    averageScore,
    passRate,
    status,
  };
}

module.exports = {
  calculateGradeLetter,
  calculatePassRate,
  calculateAverage,
  generateStudentReport,
};
