const { pool } = require('../config/db');
const { cleanString, getOptionText, validateQuiz } = require('../utils/validation');

exports.list = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.id, q.title, q.description, q.category, q.time_limit_minutes, q.created_at,
             u.name AS creator, COUNT(DISTINCT qu.id) AS question_count
      FROM quizzes q JOIN users u ON u.id=q.creator_id
      LEFT JOIN questions qu ON qu.quiz_id=q.id
      WHERE q.is_published=1 GROUP BY q.id ORDER BY q.created_at DESC`);
    res.json({ quizzes: rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load quizzes.' }); }
};

exports.create = async (req, res) => {
  const validation = validateQuiz(req.body);
  if (validation) return res.status(400).json({ message: validation });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const title = cleanString(req.body.title, 120);
    const description = cleanString(req.body.description, 1000);
    const category = cleanString(req.body.category || 'General', 60) || 'General';
    const timeLimit = Number(req.body.timeLimit || 0);
    const [quiz] = await conn.execute(
      'INSERT INTO quizzes (creator_id,title,description,category,time_limit_minutes,is_published) VALUES (?,?,?,?,?,1)',
      [req.user.id, title, description, category, timeLimit]);
    for (const q of req.body.questions) {
      const [question] = await conn.execute(
        'INSERT INTO questions (quiz_id,question_text,explanation,position) VALUES (?,?,?,?)',
        [quiz.insertId, cleanString(q.text, 1000), cleanString(q.explanation || '', 1000), req.body.questions.indexOf(q) + 1]);
      for (let i = 0; i < 4; i++) {
        await conn.execute('INSERT INTO options (question_id,option_text,is_correct,position) VALUES (?,?,?,?)',
          [question.insertId, cleanString(getOptionText(q.options[i]), 500), i === Number(q.correctIndex) ? 1 : 0, i + 1]);
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Quiz created successfully.', quizId: quiz.insertId });
  } catch (err) {
    await conn.rollback(); console.error(err); res.status(500).json({ message: 'Could not save quiz.' });
  } finally { conn.release(); }
};

exports.getForTaking = async (req, res) => {
  try {
    const [quizzes] = await pool.execute('SELECT id,title,description,category,time_limit_minutes FROM quizzes WHERE id=? AND is_published=1', [req.params.id]);
    if (!quizzes.length) return res.status(404).json({ message: 'Quiz not found.' });
    const [questions] = await pool.execute('SELECT id,question_text,position FROM questions WHERE quiz_id=? ORDER BY position,id', [req.params.id]);
    const ids = questions.map(q => q.id);
    let options = [];
    if (ids.length) {
      const marks = ids.map(() => '?').join(',');
      const [rows] = await pool.query(`SELECT id,question_id,option_text,position FROM options WHERE question_id IN (${marks}) ORDER BY position,id`, ids);
      options = rows;
    }
    res.json({ quiz: quizzes[0], questions: questions.map(q => ({
      id: q.id, text: q.question_text,
      options: options.filter(o => o.question_id === q.id).map(o => ({ id: o.id, text: o.option_text }))
    })) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load this quiz.' }); }
};

exports.submit = async (req, res) => {
  const quizId = Number(req.params.id);
  const answers = req.body.answers;
  if (!Number.isInteger(quizId) || !Array.isArray(answers)) return res.status(400).json({ message: 'Invalid submission.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [quizRows] = await conn.execute('SELECT id,title FROM quizzes WHERE id=? AND is_published=1', [quizId]);
    if (!quizRows.length) { await conn.rollback(); return res.status(404).json({ message: 'Quiz not found.' }); }
    const [questions] = await conn.execute('SELECT id,question_text,explanation FROM questions WHERE quiz_id=? ORDER BY position,id', [quizId]);
    if (!questions.length) { await conn.rollback(); return res.status(400).json({ message: 'This quiz has no questions.' }); }
    const answerMap = new Map();
    for (const a of answers) {
      if (a && Number.isInteger(Number(a.questionId)) && Number.isInteger(Number(a.optionId))) answerMap.set(Number(a.questionId), Number(a.optionId));
    }
    const questionIds = questions.map(q => q.id);
    const marks = questionIds.map(() => '?').join(',');
    const [options] = await conn.query(`SELECT id,question_id,option_text,is_correct FROM options WHERE question_id IN (${marks})`, questionIds);
    const optionMap = new Map(options.map(o => [o.id, o]));
    let score = 0;
    const resultDetails = [];
    for (const q of questions) {
      const selectedId = answerMap.get(q.id) || null;
      const selected = selectedId ? optionMap.get(selectedId) : null;
      const validSelected = selected && selected.question_id === q.id ? selected : null;
      const correct = options.find(o => o.question_id === q.id && o.is_correct === 1);
      const isCorrect = Boolean(validSelected && correct && validSelected.id === correct.id);
      if (isCorrect) score++;
      resultDetails.push({
        questionId: q.id, question: q.question_text, selectedOptionId: validSelected ? validSelected.id : null,
        selectedAnswer: validSelected ? validSelected.option_text : null,
        correctOptionId: correct ? correct.id : null, correctAnswer: correct ? correct.option_text : null,
        isCorrect, explanation: q.explanation || ''
      });
    }
    const percentage = Math.round((score / questions.length) * 10000) / 100;
    const [attempt] = await conn.execute('INSERT INTO quiz_attempts (user_id,quiz_id,score,total_questions,percentage) VALUES (?,?,?,?,?)',
      [req.user.id, quizId, score, questions.length, percentage]);
    for (const r of resultDetails) {
      await conn.execute('INSERT INTO user_answers (attempt_id,question_id,selected_option_id,is_correct) VALUES (?,?,?,?)',
        [attempt.insertId, r.questionId, r.selectedOptionId, r.isCorrect ? 1 : 0]);
    }
    await conn.commit();
    res.json({ message: 'Quiz submitted.', attemptId: attempt.insertId, quizTitle: quizRows[0].title, score, total: questions.length, percentage, results: resultDetails });
  } catch (err) { await conn.rollback(); console.error(err); res.status(500).json({ message: 'Could not submit quiz.' }); }
  finally { conn.release(); }
};
