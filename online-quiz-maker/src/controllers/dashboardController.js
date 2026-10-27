const { pool } = require('../config/db');
exports.getDashboard = async (req, res) => {
  try {
    const [created] = await pool.execute(`
      SELECT q.id,q.title,q.category,q.created_at,COUNT(DISTINCT qu.id) question_count
      FROM quizzes q LEFT JOIN questions qu ON qu.quiz_id=q.id
      WHERE q.creator_id=? GROUP BY q.id ORDER BY q.created_at DESC`, [req.user.id]);
    const [attempts] = await pool.execute(`
      SELECT a.id,a.score,a.total_questions,a.percentage,a.completed_at,q.title AS quiz_title
      FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id
      WHERE a.user_id=? ORDER BY a.completed_at DESC LIMIT 50`, [req.user.id]);
    res.json({ createdQuizzes: created, attempts });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not load dashboard.' }); }
};
