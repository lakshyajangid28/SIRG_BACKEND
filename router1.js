
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('This is router 1');
});


module.exports = router;