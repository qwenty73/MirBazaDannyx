const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Простая симуляция базы данных (пока что)
let database = [];

app.get('/api/data', (req, res) => {
    res.json(database);
});

app.post('/api/data', (req, res) => {
    const { name, value } = req.body;
    if (name && value) {
        database.push({ name, value });
        res.status(201).send('Data added');
    } else {
        res.status(400).send('Invalid input');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
