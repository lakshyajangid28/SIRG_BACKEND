const express = require("express");
const db = require("./db");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("This is router 2");
});

////////// (TESTED) PROJECTS ROUTES ////////////

// Reset the projects table
router.get("/reset-table-projects", (req, res) => {
  const dropTableQuery = "DROP TABLE IF EXISTS projects";
  const createTableQuery = `
    CREATE TABLE projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_type TEXT,
      project_details TEXT
    )
  `;

  db.query(dropTableQuery, (err) => {
    if (err) {
      console.error("Error dropping projects table:", err);
      return res.status(500).send("Error dropping projects table");
    }

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating projects table:", err);
        return res.status(500).send("Error creating projects table");
      }

      res.send("Table projects has been reset");
    });
  });
});

// Add a new row to the projects table
router.post("/add-project", (req, res) => {
  const { project_type, project_details } = req.body;

  if (typeof project_type !== "string" || typeof project_details !== "string") {
    return res
      .status(400)
      .send("Project type and project details must be strings");
  }

  const insertQuery =
    "INSERT INTO projects (project_type, project_details) VALUES (?, ?)";

  db.query(insertQuery, [project_type, project_details], (err, result) => {
    if (err) {
      console.error("Error inserting row:", err);
      return res.status(500).send("Error inserting row");
    }

    res.send("Row inserted successfully");
  });
});

// Get rows by searching for a specific project_type
router.get("/get-projects", (req, res) => {
  const { project_type } = req.query;

  if (typeof project_type !== "string") {
    return res.status(400).send("Project type must be a string");
  }

  const selectQuery = "SELECT * FROM projects WHERE project_type = ?";

  db.query(selectQuery, [project_type], (err, results) => {
    if (err) {
      console.error("Error fetching rows:", err);
      return res.status(500).send("Error fetching rows");
    }

    res.send(results);
  });
});

// Get all projects information
router.get("/get-all-projects", (req, res) => {
  const selectQuery = "SELECT * FROM projects";

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching rows:", err);
      return res.status(500).send("Error fetching rows");
    }

    res.send(results);
  });
});

// Update a project by its ID
router.put("/update-project/:id", (req, res) => {
  const { id } = req.params;
  const { project_type, project_details } = req.body;

  // Validate input
  if (typeof project_type !== "string" || typeof project_details !== "string") {
    return res
      .status(400)
      .send("Project type and project details must be strings");
  }

  // SQL query to update project
  const updateQuery =
    "UPDATE projects SET project_type = ?, project_details = ? WHERE id = ?";

  db.query(updateQuery, [project_type, project_details, id], (err, result) => {
    if (err) {
      console.error("Error updating row:", err);
      return res.status(500).send("Error updating project");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Project not found");
    }

    res.send("Project updated successfully");
  });
});

// Delete a project by its ID
router.delete("/delete-project/:id", (req, res) => {
  const { id } = req.params;

  // SQL query to delete project
  const deleteQuery = "DELETE FROM projects WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting row:", err);
      return res.status(500).send("Error deleting project");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Project not found");
    }

    res.send("Project deleted successfully");
  });
});

module.exports = router;
