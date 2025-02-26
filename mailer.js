const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER    , // Your email address
    pass: process.env.EMAIL_PASS // Your email password or app password
  }
});

module.exports = transporter;
