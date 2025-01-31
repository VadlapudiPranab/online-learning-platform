const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => res.render('index'));

// Authentication Routes
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)', 
        [username, hashedPassword, email], (err) => {
            if (err) return res.send('Registration failed');
            res.redirect('/login');
        });
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password_hash)) 
            return res.send('Login failed');
        req.session.userId = user.id;
        res.redirect('/dashboard');
    });
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    db.all(`
        SELECT courses.* FROM courses
        JOIN enrollments ON courses.id = enrollments.course_id
        WHERE enrollments.user_id = ?`, [req.session.userId], (err, courses) => {
            res.render('dashboard', { courses });
        });
});

// Start Server
app.listen(3000, () => console.log('Server running on port 3000'));