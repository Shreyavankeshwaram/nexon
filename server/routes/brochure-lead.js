const express = require('express');
const { validateBrochureLead } = require('../lib/validate');
const { sendBrochureLeadEmail } = require('../lib/email');
const { saveLeadToFile } = require('../lib/save-lead');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', rateLimit, async (req, res) => {
  try {
    const validation = validateBrochureLead(req.body || {});

    if (!validation.ok) {
      if (validation.spam) {
        console.warn('[brochure-lead] Spam submission blocked');
        return res.status(400).json({
          success: false,
          message: 'Unable to process your request. Please try again.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Please correct the errors below.',
        errors: validation.errors,
      });
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'Unknown';

    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    try {
      await sendBrochureLeadEmail(validation.data, { ipAddress, submittedAt });
      console.log('[brochure-lead] Email sent for:', validation.data.email);
    } catch (emailError) {
      if (emailError.code === 'SMTP_NOT_CONFIGURED' || emailError.message === 'SMTP_NOT_CONFIGURED') {
        const filePath = saveLeadToFile(validation.data, { ipAddress, submittedAt });
        console.log('[brochure-lead] SMTP not configured — lead saved to:', filePath);
      } else {
        throw emailError;
      }
    }

    return res.json({
      success: true,
      message: 'Thank you! Your brochure is being downloaded.',
    });
  } catch (error) {
    console.error('[brochure-lead] Failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'We could not send your request right now. Please try again in a moment.',
    });
  }
});

module.exports = router;
