app.post('/quiz/:id/submit', (req, res) => {
    const userId = req.session.userId;
    const quizId = req.params.id;
    const userAnswers = req.body.answers;

    db.all('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quiz) => {
        let score = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === quiz.questions[index].correctAnswer) score++;
        });
        
        db.run('INSERT INTO submissions (user_id, quiz_id, score) VALUES (?, ?, ?)', 
            [userId, quizId, score], (err) => {
                res.redirect(`/quiz-results?score=${score}`);
            });
    });
});