const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const checkAuth = require('./middleware');
const transporter = require('./mailer');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
require('dotenv').config();

const adminRouter = require('./adminRouter');
const contactRoutes = require('./contactRoutes');
const aboutRoutes = require('./aboutRoutes');
const researchRoutes = require('./researchRoutes');
const peopleRoutes = require('./peopleRoutes');
const projectsRoutes = require('./projectRoutes');
const achievementsRoutes = require('./achievementRoutes');
const publicationsRoutes = require('./publicationsRoutes');
const teachingRoutes = require('./teachingRoutes');
const openPositionsRoutes = require('./openPositionRoutes');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

const sendMail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: '"Your Website" <your-email@gmail.com>', // Sender address
      to: to, // List of recipients
      subject: subject, // Subject line
      text: text, // Plain text body
    });

    console.log('Email sent: ', info.messageId);
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

app.use('/api/admin', checkAuth, adminRouter); // Use middleware for adminRouter
app.use('/api/contacts', contactRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/research-verticals', researchRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/teaching', teachingRoutes);
app.use('/api/open-positions', openPositionsRoutes);


// Test route
app.get('/test', (req, res) => {
  res.send('Hello World');
});

// Register/Sign-up route
app.post('/register', async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!name || !mobile || !email || !password) {
    return res.status(400).send('Name, mobile number, email, and password are required');
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).send('Mobile number must be 10 digits');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Invalid email format');
  }

  const findUserQuery = 'SELECT * FROM users WHERE mobile_number = ? OR email = ?';

  db.query(findUserQuery, [mobile, email], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).send('Error registering user');
    }

    if (results.length > 0) {
      return res.status(400).send('User already exists');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

      const insertUserQuery = `
        INSERT INTO users (name, mobile_number, email, password, role)
        VALUES (?, ?, ?, ?, 'user')
      `;

      db.query(insertUserQuery, [name, mobile, email, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).send('Error registering user');
        }

        res.send('User registered successfully');
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      res.status(500).send('Error registering user');
    }
  });
});

// Login route
app.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).send('Email/Mobile number and password are required');
  }

  const findUserQuery = 'SELECT * FROM users WHERE mobile_number = ? OR email = ?';

  db.query(findUserQuery, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).send('Error logging in');
    }

    if (results.length === 0) {
      return res.status(400).send('Invalid email/mobile number or password');
    }

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email/mobile number or password');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    res.send('Login successful');
  });
});

// Logout route
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.send('Logout successful');
});

// Route to delete and create users table
app.get('/reset-table-users', (req, res) => {
  const dropTableQuery = 'DROP TABLE IF EXISTS users';
  const createTableQuery = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      mobile_number VARCHAR(10) NOT NULL UNIQUE CHECK (mobile_number REGEXP '^[0-9]{10}$'),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(60) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user'
    )
  `;

  db.query(dropTableQuery, (err, result) => {
    if (err) {
      console.error('Error dropping table:', err);
      return res.status(500).send('Error dropping table');
    }

    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating table:', err);
        return res.status(500).send('Error creating table');
      }

      res.send('Table users has been reset');
    });
  });
});

// Route to change the name of the user
app.put('/change-name', checkAuth, (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (typeof name !== 'string') {
    return res.status(400).send('Name must be a string');
  }

  const updateQuery = 'UPDATE users SET name = ? WHERE id = ?';

  db.query(updateQuery, [name, userId], (err, result) => {
    if (err) {
      console.error('Error updating name:', err);
      return res.status(500).send('Error updating name');
    }

    res.send('Name updated successfully');
  });
});

// Route to change the mobile number of the user
app.put('/change-mobile', checkAuth, (req, res) => {
  const { mobile } = req.body;
  const userId = req.user.id;

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).send('Mobile number must be 10 digits');
  }

  const updateQuery = 'UPDATE users SET mobile_number = ? WHERE id = ?';

  db.query(updateQuery, [mobile, userId], (err, result) => {
    if (err) {
      console.error('Error updating mobile number:', err);
      return res.status(500).send('Error updating mobile number');
    }

    res.send('Mobile number updated successfully');
  });
});

// Route to change the password of the user
app.put('/change-password', checkAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).send('Old password and new password are required');
  }

  const findUserQuery = 'SELECT * FROM users WHERE id = ?';

  db.query(findUserQuery, [userId], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).send('Error finding user');
    }

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid old password');
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password

      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';

      db.query(updateQuery, [hashedPassword, userId], (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).send('Error updating password');
        }

        res.send('Password updated successfully');
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      res.status(500).send('Error updating password');
    }
  });
});

// Route to handle password reset request
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send('Email is required');
  }

  const findUserQuery = 'SELECT * FROM users WHERE email = ?';

  db.query(findUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).send('Error finding user');
    }

    if (results.length === 0) {
      return res.status(400).send('User with this email does not exist');
    }

    const user = results[0];
    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const text = `Click the following link to reset your password: ${resetLink}`;

    try {
      await sendMail(email, subject, text);
      res.send('Password reset link has been sent to your email');
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    }
  });
});

// Route to handle password reset
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send('Token and new password are required');
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';

    db.query(updateQuery, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).send('Error updating password');
      }

      res.send('Password has been reset successfully');
    });
  } catch (error) {
    console.error('Invalid or expired token:', error);
    res.status(400).send('Invalid or expired token');
  }
});

// ...existing code...
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
