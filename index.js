const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');

app.use(cors());
app.use(express.json());

let db = require('./db.json');

// Save DB to file
function saveDB() {
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
}

// Sample Route
app.get('/', (req, res) => {
  res.send('Blox 2018 API is running.');
});

// Auth
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const newUser = {
    username,
    password,
    robux: 100,
    friends: [],
    messages: [],
    games: [],
    items: [],
  };
  db.users.push(newUser);
  saveDB();
  res.json({ message: 'Account created', user: newUser });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid login' });
  res.json({ message: 'Logged in', user });
});

// Upload Game
app.post('/upload/game', (req, res) => {
  const { username, title, fileUrl } = req.body;
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'User not found' });

  const game = {
    id: Date.now(),
    title,
    creator: username,
    fileUrl,
  };
  db.games.push(game);
  user.games.push(game.id);
  saveDB();
  res.json({ message: 'Game uploaded', game });
});

// Upload Shirt or Pants
app.post('/upload/item', (req, res) => {
  const { username, name, type, fileUrl, price } = req.body;
  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'User not found' });

  const item = {
    id: Date.now(),
    name,
    type,
    price,
    owner: username,
    fileUrl,
  };
  db.items.push(item);
  user.items.push(item.id);
  saveDB();
  res.json({ message: 'Item uploaded', item });
});

// Buy item
app.post('/buy/item', (req, res) => {
  const { username, itemId } = req.body;
  const user = db.users.find(u => u.username === username);
  const item = db.items.find(i => i.id === itemId);
  if (!user || !item) return res.status(400).json({ error: 'Invalid request' });
  if (user.robux < item.price) return res.status(400).json({ error: 'Not Enough Robux' });

  user.robux -= item.price;
  saveDB();
  res.json({ message: 'Purchase successful', robux: user.robux });
});

// Friends
app.post('/friend', (req, res) => {
  const { from, to } = req.body;
  const userA = db.users.find(u => u.username === from);
  const userB = db.users.find(u => u.username === to);
  if (!userA || !userB) return res.status(400).json({ error: 'User not found' });

  if (!userA.friends.includes(to)) {
    userA.friends.push(to);
    userB.friends.push(from);
  }
  saveDB();
  res.json({ message: 'Friend added' });
});

// Messages
app.post('/message', (req, res) => {
  const { from, to, text } = req.body;
  const sender = db.users.find(u => u.username === from);
  const recipient = db.users.find(u => u.username === to);
  if (!sender || !recipient) return res.status(400).json({ error: 'User not found' });

  recipient.messages.push({ from, text, time: Date.now() });
  saveDB();
  res.json({ message: 'Message sent' });
});

app.get('/messages/:username', (req, res) => {
  const user = db.users.find(u => u.username === req.params.username);
  if (!user) return res.status(400).json({ error: 'User not found' });
  res.json(user.messages);
});

// Games / Catalog / Users
app.get('/games', (req, res) => res.json(db.games));
app.get('/catalog', (req, res) => res.json(db.items));
app.get('/users', (req, res) => res.json(db.users.map(u => u.username)));

// Start server
app.listen(3000, () => console.log('Blox 2018 API running on http://localhost:3000'));
