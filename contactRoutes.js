const express = require("express");
const db = require("./db");
const router = express.Router();

// Reset the contacts table
router.get("/reset-table-contacts", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS contacts";
  const createTableQuery = `
    CREATE TABLE contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(255),
      value VARCHAR(255)
    )
  `;

  db.query(dropTableQuery, (err) => {
    if (err) return res.status(500).send("Error dropping table");

    db.query(createTableQuery, (err) => {
      if (err) return res.status(500).send("Error creating table");

      res.send("Contacts table has been reset");
    });
  });
});

// Get all contacts
router.get("/get-all-contacts", (req, res) => {
  db.query("SELECT * FROM contacts", (err, results) => {
    if (err) return res.status(500).send("Error fetching contacts");
    res.send(results);
  });
});

// Get contact by ID
router.get("/get-contact/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM contacts WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).send("Error fetching contact");
    if (results.length === 0) return res.status(404).send("No contact found");
    res.send(results[0]);
  });
});

// Add new contact
router.post("/add-contact", (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) return res.status(400).send("All fields are required");

  db.query("INSERT INTO contacts (type, value) VALUES(?, ?)", [type, value], (err) => {
    if (err) return res.status(500).send("Error adding contact");
    res.send("Contact added successfully");
  });
});

// Update contact
router.put("/edit-contact/:id", (req, res) => {
  const { id } = req.params;
  const { type, value } = req.body;
  if (!type || !value) return res.status(400).send("All fields are required");

  db.query("UPDATE contacts SET type = ?, value = ? WHERE id = ?", [type, value, id], (err) => {
    if (err) return res.status(500).send("Error updating contact");
    res.send("Contact updated successfully");
  });
});

// Delete contact
router.delete("/delete-contact/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM contacts WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Error deleting contact");
    res.send("Contact deleted successfully");
  });
});

module.exports = router;
