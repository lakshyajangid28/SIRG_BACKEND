const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  res.send('This is router 2');
});

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

////////// ACHIEVEMENTS   //////////////////
// Route to delete if the table exists and create table achievements
router.get('/reset-table-achievements', (req, res) => {
  const dropTableQuery = 'DROP TABLE IF EXISTS achievements';
  const createTableQuery = `
      CREATE TABLE achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        body TEXT,
        image VARCHAR(500) NOT NULL
      )
    `;

  db.query(dropTableQuery, (err) => {
    if (err) {
      console.error('Error dropping table:', err);
      return res.status(500).send('Error dropping table');
    }

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating table:', err);
        return res.status(500).send('Error creating table');
      }
      res.send('Table achievements has been reset');
    });
  });
});

// Route to get all achievements
router.get('/get-achievements', (req, res) => {
  const selectQuery = 'SELECT * FROM achievements';

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error fetching achievements:', err);
      return res.status(500).json({ error: 'Error fetching achievements' });
    }
    res.json(results);
  });
});

// Route to add a new achievement
router.post('/add-achievement', upload.single("image"), (req, res) => {
  const { body } = req.body;
  const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  if (!body || !image) {
    return res.status(400).send('Body and image are required');
  }

  const insertQuery = 'INSERT INTO achievements (body, image) VALUES (?, ?)';

  db.query(insertQuery, [body, image], (err) => {
    if (err) {
      console.error('Error inserting achievement:', err);
      return res.status(500).send('Error inserting achievement');
    }
    res.send('Achievement added successfully');
  });
});

// Route to update an existing achievement by ID and delete the old image
router.put('/edit-achievement/:id', upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const newImage = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  // Fetch the existing image path before updating
  const getOldImageQuery = 'SELECT image FROM achievements WHERE id = ?';
  db.query(getOldImageQuery, [id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching old image:', err);
      return res.status(500).send('Error fetching achievement');
    }

    const oldImagePath = results[0].image ? path.join(__dirname, 'uploads', path.basename(results[0].image)) : null;

    let updateQuery = 'UPDATE achievements SET body = ?';
    let queryParams = [body];

    if (newImage) {
      updateQuery += ', image = ?';
      queryParams.push(newImage);
    }
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    db.query(updateQuery, queryParams, (err) => {
      if (err) {
        console.error('Error updating achievement:', err);
        return res.status(500).send('Error updating achievement');
      }

      // Delete the old image if a new one was uploaded
      if (newImage && oldImagePath) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }

      res.send('Achievement updated successfully');
    });
  });
});

// Route to delete an achievement by ID and remove the image
router.delete('/delete-achievement/:id', (req, res) => {
  const { id } = req.params;

  // Fetch the existing image path before deleting the entry
  const getOldImageQuery = 'SELECT image FROM achievements WHERE id = ?';
  db.query(getOldImageQuery, [id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching achievement:', err);
      return res.status(500).send('Error fetching achievement');
    }

    const imagePath = results[0].image ? path.join(__dirname, 'uploads', path.basename(results[0].image)) : null;

    const deleteQuery = 'DELETE FROM achievements WHERE id = ?';
    db.query(deleteQuery, [id], (err) => {
      if (err) {
        console.error('Error deleting achievement:', err);
        return res.status(500).send('Error deleting achievement');
      }

      // Delete the associated image file
      if (imagePath) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting image:', err);
        });
      }

      res.send('Achievement deleted successfully');
    });
  });
});

module.exports = router;
