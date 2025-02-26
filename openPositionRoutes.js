const express = require("express");
const db = require("./db");
const router = express.Router();

//////   OPEN POSITIONS ///////////

// (TESTED) Route to delete if the table exists and create table open_positions
router.get("/reset-table-open-positions", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS open_positions";
  const createTableQuery = `
      CREATE TABLE open_positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vacancy_name VARCHAR(255),
        title VARCHAR(255),
        contact_person VARCHAR(255)
      )
    `;

  db.query(dropTableQuery, (err, result) => {
    if (err) {
      console.error("Error dropping table:", err);
      return res
        .status(500)
        .json({ error: "Error dropping table", details: err.message });
    }

    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating table:", err);
        return res
          .status(500)
          .json({ error: "Error creating table", details: err.message });
      }

      res.send("Table open_positions has been reset");
    });
  });
});

// (TESTED) Route to get a row by ID from the open_positions table
router.get("/get-open-position/:id", (req, res) => {
  const { id } = req.params;
  const selectQuery = "SELECT * FROM open_positions WHERE id = ?";

  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error("Error fetching row:", err);
      return res
        .status(500)
        .json({ error: "Error fetching row", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No entry found" });
    }

    res.json(results[0]);
  });
});

// Route to update a row by ID in the open_positions table
router.put("/edit-open-position/:id", (req, res) => {
  const { id } = req.params;
  const { vacancy_name, title, contact_person } = req.body;

  const updateQuery =
    "UPDATE open_positions SET vacancy_name = ?, title = ?, contact_person = ? WHERE id = ?";

  db.query(
    updateQuery,
    [vacancy_name, title, contact_person, id],
    (err, result) => {
      if (err) {
        console.error("Error updating row:", err);
        return res
          .status(500)
          .json({ error: "Error updating row", details: err.message });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "No entry found with the given ID" });
      }

      res.json({ message: "Row updated successfully" });
    }
  );
});

// (TESTED) Route to add a new row to the open_positions table
router.post("/add-open-position", (req, res) => {
  const { vacancy_name, title, contact_person } = req.body;

  const insertQuery =
    "INSERT INTO open_positions (vacancy_name, title, contact_person) VALUES (?, ?, ?)";

  db.query(
    insertQuery,
    [vacancy_name, title, contact_person],
    (err, result) => {
      if (err) {
        console.error("Error inserting row:", err);
        return res
          .status(500)
          .json({ error: "Error inserting row", details: err.message });
      }

      res
        .status(201)
        .json({ message: "Row inserted successfully", id: result.insertId });
    }
  );
});

// Route to get all rows from the open_positions table with Pagination
router.get("/get-all-open-positions", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const selectQuery = "SELECT * FROM open_positions LIMIT ? OFFSET ?";

  db.query(selectQuery, [limit, offset], (err, results) => {
    if (err) {
      console.error("Error fetching rows:", err);
      return res
        .status(500)
        .json({ error: "Error fetching rows", details: err.message });
    }
    res.json(results);
  });
});

// Route to delete a row by ID from the open_positions table
router.delete("/delete-open-position/:id", (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM open_positions WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting row:", err);
      return res
        .status(500)
        .json({ error: "Error deleting row", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "No entry found with the given ID" });
    }

    res.json({ message: "Row deleted successfully" });
  });
});

module.exports = router;
