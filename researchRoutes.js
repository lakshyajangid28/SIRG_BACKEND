const express = require("express");
const db = require("./db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

///////////// RESEARCH VERTICALS CRUD /////////////

// Create research vertical
router.post("/research-verticals", (req, res) => {
  const { name, overview, key_objectives } = req.body;
  if (!name || !overview || !key_objectives)
    return res.status(400).json({ error: "All fields are required" });

  db.query(
    "INSERT INTO research_verticals (name, overview, key_objectives) VALUES (?, ?, ?)",
    [name, overview, key_objectives],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error inserting research vertical", details: err });
      res.json({ message: "Research vertical added successfully", id: result.insertId });
    }
  );
});

// Get all research verticals
router.get("/research-verticals", (req, res) => {
  db.query("SELECT * FROM research_verticals", (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching research verticals", details: err });
    res.json(results);
  });
});

// Update research vertical
router.put("/research-verticals/:id", (req, res) => {
  const { id } = req.params;
  const { name, overview, key_objectives } = req.body;

  if (!name && !overview && !key_objectives)
    return res.status(400).json({ error: "At least one field is required for update" });

  db.query(
    "UPDATE research_verticals SET name = ?, overview = ?, key_objectives = ? WHERE id = ?",
    [name, overview, key_objectives, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error updating research vertical", details: err });
      res.json({ message: "Research vertical updated successfully" });
    }
  );
});

// Delete research vertical
router.delete("/research-verticals/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM research_verticals WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error deleting research vertical", details: err });
    res.json({ message: "Research vertical deleted successfully" });
  });
});

///////////// RESEARCH PEOPLE CRUD WITH IMAGE UPLOAD /////////////

// Create research person with image upload
router.post("/research-people/:id", upload.single("image"), (req, res) => {
  const { name, category, description } = req.body;
  const research_vertical_id = req.params.id;
  const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  if (!research_vertical_id || !name)
    return res.status(400).json({ error: "Research vertical ID and name are required" });

  db.query(
    "INSERT INTO research_people (research_vertical_id, name, category, image, description) VALUES (?, ?, ?, ?, ?)",
    [research_vertical_id, name, category, image, description || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error inserting research person", details: err });
      res.json({ message: "Research person added successfully", id: result.insertId });
    }
  );
});

// Get all research people by vertical ID
router.get("/research-people/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM research_people WHERE research_vertical_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching research people", details: err });
    res.json(results);
  });
});

// Update research person (with optional image update)
router.put("/research-people/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, category, description } = req.body;
  const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  db.query("SELECT image FROM research_people WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error finding research person", details: err });
    if (results.length === 0) return res.status(404).json({ error: "Research person not found" });

    const oldImage =  results[0].image ? path.join(__dirname, 'uploads', path.basename(results[0].image)) : null;

    db.query("UPDATE research_people SET name = ?, category = ?, description = ?, image = ? WHERE id = ?", [name, category, description, image, id], (err) => {
      if (err) return res.status(500).json({ error: "Error updating research person", details: err });

      if (image && oldImage) {
        const oldImagePath = path.join(__dirname, "uploads", path.basename(oldImage));
        fs.unlink(oldImagePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== "ENOENT") console.error("Error deleting old image:", unlinkErr);
        });
      }
      res.json({ message: "Research person updated successfully" });
    });
  });
});

// Delete research person and remove image
router.delete("/research-people/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT image FROM research_people WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error finding research person", details: err });
    if (results.length === 0) return res.status(404).json({ error: "Research person not found" });

    const imagePath = results[0].image ? path.join(__dirname, "uploads", path.basename(results[0].image)) : null;

    db.query("DELETE FROM research_people WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Error deleting research person", details: err });

      if (imagePath) {
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== "ENOENT") console.error("Error deleting image file:", unlinkErr);
        });
      }
      res.json({ message: "Research person deleted successfully" });
    });
  });
});

module.exports = router;
