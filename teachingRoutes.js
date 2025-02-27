const express = require("express");
const db = require("./db");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("This is router 2");
});

// Reset the teaching table
router.get("/reset-table-teaching", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS teaching";
  const createTableQuery = `
    CREATE TABLE teaching (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject VARCHAR(255),
      type VARCHAR(255),
      semester VARCHAR(255),
      time VARCHAR(255),
      course_instructor VARCHAR(255),
      credits INT,
      course_code VARCHAR(255)
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

      res.send("Table teaching has been reset");
    });
  });
});

// Get a row by ID from the teaching table
router.get("/get-teaching/:id", (req, res) => {
  const { id } = req.params;
  const selectQuery = "SELECT * FROM teaching WHERE id = ?";

  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error("Error fetching row:", err);
      return res.status(500).send("Error fetching row");
    }

    if (results.length === 0) {
      return res.status(404).send("No entry found");
    }

    res.json(results[0]);
  });
});

// Update a row by ID in the teaching table
router.put("/edit-teaching/:id", (req, res) => {
  const { id } = req.params;
  const {
    subject,
    type,
    semester,
    time,
    course_instructor,
    credits,
    course_code,
  } = req.body;

  // Improved input validation
  if (
    !subject ||
    !type ||
    !semester ||
    !time ||
    !course_instructor ||
    !course_code ||
    typeof credits !== "number"
  ) {
    return res.status(400).send("All fields are required and must be valid");
  }

  const updateQuery =
    "UPDATE teaching SET subject = ?, type = ?, semester = ?, time = ?, course_instructor = ?, credits = ?, course_code = ? WHERE id = ?";

  db.query(
    updateQuery,
    [
      subject,
      type,
      semester,
      time,
      course_instructor,
      credits,
      course_code,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating row:", err);
        return res.status(500).send("Error updating row");
      }

      if (result.affectedRows === 0) {
        return res.status(404).send("No entry found to update");
      }

      res.send("Row updated successfully");
    }
  );
});

// Get all rows from the teaching table
router.get("/get-all-teaching", (req, res) => {
  const selectQuery = "SELECT * FROM teaching";

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching rows:", err);
      return res.status(500).send("Error fetching rows");
    }

    res.json(results);
  });
});

// Add a new row to the teaching table
router.post("/add-teaching", (req, res) => {
  const {
    subject,
    type,
    semester,
    time,
    course_instructor,
    credits,
    course_code,
  } = req.body;

  // Improved input validation
  if (
    !subject ||
    !type ||
    !semester ||
    !time ||
    !course_instructor ||
    !course_code ||
    !credits
  ) {
    return res.status(400).send("All fields are required and must be valid");
  }

  const insertQuery =
    "INSERT INTO teaching (subject, type, semester, time, course_instructor, credits, course_code) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    insertQuery,
    [subject, type, semester, time, course_instructor, credits, course_code],
    (err, result) => {
      if (err) {
        console.error("Error inserting row:", err);
        return res.status(500).send("Error inserting row");
      }

      res.status(201).send("Row inserted successfully");
    }
  );
});

// Delete a row by ID from the teaching table
router.delete("/delete-teaching/:id", (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM teaching WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting row:", err);
      return res.status(500).send("Error deleting row");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("No entry found to delete");
    }

    res.send("Course deleted successfully");
  });
});

module.exports = router;
