const express = require("express");
const router = express.Router();
const db = require("./db");

// Route to get the body of the first element of the abouts table
router.get("/get-about-body", (req, res) => {
  const selectQuery = "SELECT body FROM abouts WHERE id = 1";
  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching body:", err);
      return res.status(500).json({ error: "Error fetching body" });
    }

    if (results.length === 0) {
      return res.json({ body: "" });
    }

    res.json({ body: results[0].body });
  });
});

// Route to delete and create abouts table with a constraint of having only one row
router.get("/reset-table-abouts", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS abouts";
  const createTableQuery = `
    CREATE TABLE abouts (
      id INT PRIMARY KEY CHECK (id = 1),
      body TEXT
    );
  `;
  const insertRowQuery = `
    INSERT INTO abouts (id, body) VALUES (1, '');
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

      db.query(insertRowQuery, (err) => {
        if (err) {
          console.error("Error inserting row:", err);
          return res.status(500).send("Error inserting row");
        }

        res.send("Table abouts has been reset and first row inserted");
      });
    });
  });
});

// Route to update the body of the first element of the abouts table
router.post("/edit-about-body", (req, res) => {
  const { body } = req.body;
  
  if (typeof body !== "string") {
    return res.status(400).send("Body must be a string");
  }

  const updateQuery = "UPDATE abouts SET body = ? WHERE id = 1";
  db.query(updateQuery, [body], (err) => {
    if (err) {
      console.error("Error updating body:", err);
      return res.status(500).send("Error updating body");
    }

    res.send("Body updated successfully");
  });
});

module.exports = router;
