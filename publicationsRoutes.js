const express = require("express");
const db = require("./db");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("This is publications router");
});

///////// (TESTED) PUBLICATIONS ROUTES ////////////

// Reset the publications table
router.get("/reset-table-publications", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS publications";
  const createTableQuery = `
    CREATE TABLE publications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type TEXT,
      body TEXT
    )
  `;

  db.query(dropTableQuery, (err) => {
    if (err) {
      console.error("Error dropping table:", err);
      return res.status(500).send("Error dropping table");
    }

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating table:", err);
        return res.status(500).send("Error creating table");
      }
      res.send("Table publications has been reset.");
    });
  });
});

// Get the body of all publications
router.get("/get-publications-body", (req, res) => {
  const selectQuery = "SELECT * FROM publications";

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching body:", err);
      return res.status(500).json({ error: "Error fetching body" });
    }

    res.json(results);
  });
});

// Add a new publication
router.post("/add-publication", (req, res) => {
  const { type, body } = req.body;

  if (!type || !body) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const insertQuery = "INSERT INTO publications (type, body) VALUES (?, ?)";

  db.query(insertQuery, [type, body], (err, result) => {
    if (err) {
      console.error("Error adding publication:", err);
      return res.status(500).json({ error: "Failed to add publication" });
    }

    res
      .status(201)
      .json({ message: "Publication added successfully", id: result.insertId });
  });
});

// Update an existing publication
router.put("/edit-publication/:id", (req, res) => {
  const { id } = req.params;
  const { type, body } = req.body;

  if (!type || !body) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const updateQuery = "UPDATE publications SET type = ?, body = ? WHERE id = ?";

  db.query(updateQuery, [type, body, id], (err, result) => {
    if (err) {
      console.error("Error updating publication:", err);
      return res.status(500).json({ error: "Failed to update publication" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Publication not found" });
    }

    res.json({ message: "Publication updated successfully" });
  });
});

// Delete a publication
router.delete(
  "/delete-publication/:id",
  (req, res) => {
    const { id } = req.params;

    const deleteQuery = "DELETE FROM publications WHERE id = ?";

    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Error deleting publication:", err);
        return res.status(500).json({ error: "Failed to delete publication" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Publication not found" });
      }

      res.json({ message: "Publication deleted successfully" });
    });
  }
);

// Update the body of the first element of the publications table
router.post("/edit-publications-body", (req, res) => {
  const { body, type } = req.body;

  if (typeof body !== "string" || typeof type !== "string") {
    return res.status(400).send("Body and type must be strings");
  }

  const updateQuery =
    "UPDATE publications SET body = ?, type = ? WHERE id = (SELECT MIN(id) FROM publications)";

  db.query(updateQuery, [body, type], (err, result) => {
    if (err) {
      console.error("Error updating body:", err);
      return res.status(500).send("Error updating body");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("No entry found to update");
    }

    res.send("Body updated successfully");
  });
});

module.exports = router;
