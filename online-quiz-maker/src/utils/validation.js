function cleanString(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function validateQuiz(body) {
  const title = cleanString(body.title, 120);
  const description = cleanString(body.description, 1000);
  const category = cleanString(body.category, 60);
  const timeLimit = Number(body.timeLimit || 0);
  if (!title) return 'Quiz title is required.';
  if (!Array.isArray(body.questions) || body.questions.length < 1) return 'Add at least one question.';
  if (!Number.isInteger(timeLimit) || timeLimit < 0 || timeLimit > 180) return 'Time limit must be 0 (no timer) or between 1 and 180 minutes.';
  for (let i = 0; i < body.questions.length; i++) {
    const q = body.questions[i];
    if (!cleanString(q.text, 1000)) return `Question ${i + 1} needs question text.`;
    if (!Array.isArray(q.options) || q.options.length !== 4) return `Question ${i + 1} must have exactly four options.`;
    if (q.options.some(o => !cleanString(o.text, 500))) return `Fill in all four options for question ${i + 1}.`;
    if (!Number.isInteger(Number(q.correctIndex)) || Number(q.correctIndex) < 0 || Number(q.correctIndex) > 3) return `Choose a correct answer for question ${i + 1}.`;
    if (q.explanation && typeof q.explanation !== 'string') return `Invalid explanation for question ${i + 1}.`;
  }
  return null;
}
module.exports = { cleanString, validateQuiz };
