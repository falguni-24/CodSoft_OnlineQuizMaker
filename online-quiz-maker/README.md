# QuizSpark — Online Quiz Maker

A beginner-friendly full-stack quiz application built with HTML, CSS, JavaScript, Node.js, Express and MySQL.

## Features

- Registration, login and logout with bcrypt password hashing and JWT authentication.
- Create quizzes with title, description, category, optional time limit, questions, four options and one correct answer.
- Browse quizzes and see creator, question count and time limit.
- One-question-at-a-time quiz player, radio choices, previous/next navigation, progress bar and optional countdown.
- Server-side scoring. Correct answers are not returned by the quiz-taking endpoint; they are only sent after submission.
- Dashboard with created quizzes and past attempts.
- Responsive interface, validation, loading/empty states and submission confirmation.
- Parameterized SQL queries, protected routes and secrets in `.env`.

## Project structure

```text
online-quiz-maker/
├── database/
│   ├── schema.sql
│   └── sample-data.sql
├── public/
│   ├── css/styles.css
│   ├── js/app.js
│   └── index.html
├── src/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   └── quizController.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── quizRoutes.js
│   └── utils/validation.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Windows setup (VS Code)

### 1. Install prerequisites

1. Install Node.js LTS from https://nodejs.org/ (npm is included).
2. Install MySQL Server and MySQL Workbench from https://dev.mysql.com/downloads/.
3. Install VS Code from https://code.visualstudio.com/.
4. Start the MySQL service. In Workbench, connect to your local MySQL server.

### 2. Create the database

1. Open `database/schema.sql` in MySQL Workbench.
2. Run the whole script (lightning bolt). It creates the `online_quiz_maker` database and six tables: `users`, `quizzes`, `questions`, `options`, `quiz_attempts`, and `user_answers`.
3. Recommended: create a dedicated local MySQL user. Run this in Workbench, replacing the example password with your own strong password:

```sql
CREATE USER 'quiz_user'@'localhost' IDENTIFIED BY 'choose_a_strong_local_password';
GRANT ALL PRIVILEGES ON online_quiz_maker.* TO 'quiz_user'@'localhost';
FLUSH PRIVILEGES;
```

If you prefer an existing local MySQL account, use that account's username in `.env` instead. Do not commit credentials.

### 3. Configure the app

1. Open this project folder in VS Code: **File → Open Folder**.
2. Open **Terminal → New Terminal**.
3. Copy the example environment file in PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Edit `.env` and set `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to match your MySQL setup. Keep `DB_NAME=online_quiz_maker`.
5. Replace `JWT_SECRET` with a long random secret (32+ characters). For example, generate one with Node:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `.env`. Do not share or commit `.env`.

### 4. Install and start

In the VS Code terminal, run:

```powershell
npm install
npm start
```

Expected terminal message:

```text
Online Quiz Maker running at http://localhost:3000
```

Open http://localhost:3000 in your browser. Keep the terminal open while using the app.

For development with automatic restart:

```powershell
npm install --save-dev nodemon
npm run dev
```

### 5. Test the main features

1. **Register:** click Get started. Enter a name, email and password of at least 8 characters.
2. **Login:** use the registered email and password. The dashboard opens.
3. **Create quiz:** click Create quiz. Enter title/category/description, choose a timer or No timer, fill a question and four options, choose the correct option, and optionally add an explanation. Add more questions if needed, then Save quiz.
4. **Take quiz:** open Explore quizzes and click Start quiz. Select answers, use Previous/Next, and submit. If a timer was set, it counts down and auto-submits when it reaches zero.
5. **Review score:** the result screen displays score, percentage, selected answers, correct answers and any explanations.
6. **Dashboard:** view your created quizzes and quiz attempts.
7. **Logout:** click Log out in the header.

You can check server/database connectivity at http://localhost:3000/api/health.

## API summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in and receive JWT |
| GET | `/api/quizzes` | No | List published quizzes |
| GET | `/api/quizzes/:id/take` | No | Get quiz questions/options without correct answers |
| POST | `/api/quizzes` | Yes | Create quiz |
| POST | `/api/quizzes/:id/submit` | Yes | Server-side score and save attempt |
| GET | `/api/dashboard` | Yes | Created quizzes and attempts |
| GET | `/api/health` | No | Check server and database |

## Security notes and limitations

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- SQL uses placeholders/parameterized queries for user-supplied values.
- Correct-answer flags are not included in the quiz-taking response.
- The JWT is stored in browser localStorage for this learning project. For a public production service, prefer secure, HttpOnly, SameSite cookies, add CSRF protections where applicable, HTTPS, stronger abuse controls, logging/monitoring, and account recovery.
- This version supports creating and saving quizzes, but does not include editing/deleting already-published quizzes. Those actions can be added with owner-checked update/delete endpoints.
- The sample-data SQL intentionally does not add a fake account with a known password. Register in the app and create a quiz through the UI.
- Google Fonts is optional; the app uses fallback fonts if unavailable.
