const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter using Gmail and app password.
 */
const createTransporter = (email, appPassword) => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: appPassword
    }
  });
};

/**
 * Sends an email using dynamic sender and recipient.
 */
const sendEmail = async ({ fromEmail, fromPass, toEmail, subject, html }) => {
  const transporter = createTransporter(fromEmail, fromPass);

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail
};
