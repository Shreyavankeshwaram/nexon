const nodemailer = require('nodemailer');

function buildEmailBody(lead, meta) {
  return `A new brochure download lead has been received.

Lead Details:

Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Company: ${lead.company}
Brochure: ${lead.brochure_name}
Page URL: ${lead.page_url}
IP Address: ${meta.ipAddress}
Submitted At: ${meta.submittedAt}
`;
}

async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    const err = new Error('SMTP_NOT_CONFIGURED');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendBrochureLeadEmail(lead, meta) {
  const to = process.env.CLIENT_EMAIL || 'Sales@nexonbuilders.com';
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: `"Nexon Builders" <${from}>`,
    to,
    replyTo: lead.email,
    subject: 'New Brochure Download Lead',
    text: buildEmailBody(lead, meta),
  });

  return info;
}

module.exports = { sendBrochureLeadEmail };
