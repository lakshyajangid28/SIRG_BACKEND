const express = require("express");
const multer = require("multer");
const db = require("./db");
const fs = require("fs");
const path = require("path");
const router = express.Router();

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

// Middleware for validating input data
const validatePerson = (req, res, next) => {
  const { name, category } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Name and Category are required" });
  }

  if (typeof name !== "string" || typeof category !== "string") {
    return res.status(400).json({ error: "Name and Category must be strings" });
  }

  next();
};

// Get all people
router.get("/get-people", (req, res) => {
  db.query("SELECT * FROM people", (err, results) => {
    if (err) {
      console.error("Error fetching people:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
});

// Add a new person with local image upload and optional description
router.post(
  "/add-person",
  upload.single("image"),
  validatePerson,
  (req, res) => {
    const { name, category, description } = req.body;
    const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    const sql =
      "INSERT INTO people (name, category, image, description) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, category, image, description || null], (err, result) => {
      if (err) {
        console.error("Error inserting person:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      res
        .status(201)
        .json({ id: result.insertId, name, category, image, description });
    });
  }
);

// Update a person with optional image and description change
router.put(
  "/update-person/:id",
  upload.single("image"),
  validatePerson,
  (req, res) => {
    const { name, category, description } = req.body;
    const { id } = req.params;
    const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

    db.query("SELECT image FROM people WHERE id = ?", [id], (err, results) => {
      if (err) {
        console.error("Error finding person:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Person not found" });
      }

      const oldImage = results[0].image ? path.join(__dirname, 'uploads', path.basename(results[0].image)) : null;;
      let sql = "UPDATE people SET name = ?, category = ?, description = ?";
      const values = [name, category, description || null];

      if (image) {
        sql += ", image = ?";
        values.push(image);
      }

      sql += " WHERE id = ?";
      values.push(id);

      db.query(sql, values, (err) => {
        if (err) {
          console.error("Error updating person:", err);
          return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (image && oldImage) {
          const oldImagePath = path.join(__dirname, "uploads", path.basename(oldImage));
          fs.unlink(oldImagePath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== "ENOENT") console.error("Error deleting old image:", unlinkErr);
          });
        }

        res.json({ id, name, category, image, description });
      });
    });
  }
);

// Delete a person by ID
router.delete("/delete-person/:id", (req, res) => {
  const { id } = req.params;

  // Retrieve image filename before deleting entry
  db.query("SELECT image FROM people WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error finding person:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    const imagePath = results[0].image ? path.join(__dirname, 'uploads', path.basename(results[0].image)) : null;

    // Delete entry from database
    db.query("DELETE FROM people WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error deleting person:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }

      // Delete image file if it exists
      if (imagePath) {
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== "ENOENT") {
            console.error("Error deleting image file:", unlinkErr);
          }
        });
      }

      res.json({ message: "Person and associated image deleted successfully" });
    });
  });
});

module.exports = router;
