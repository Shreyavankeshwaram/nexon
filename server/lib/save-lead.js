'use strict';

const fs = require('fs');
const path = require('path');

const LEADS_DIR = path.join(__dirname, '..', 'leads');

/**
 * Saves a lead to a local JSON file.
 * Falls back gracefully when the leads directory cannot be created.
 * @param {Object} lead - Validated lead data
 * @param {Object} meta - { ipAddress, submittedAt }
 * @returns {string} Path to the saved file
 */
function saveLeadToFile(lead, meta) {
  try {
    // Ensure leads directory exists
    if (!fs.existsSync(LEADS_DIR)) {
      fs.mkdirSync(LEADS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `lead-${timestamp}.json`;
    const filePath = path.join(LEADS_DIR, fileName);

    const record = {
      savedAt: new Date().toISOString(),
      submittedAt: meta.submittedAt,
      ipAddress: meta.ipAddress,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      brochure: lead.brochure_name,
      pageUrl: lead.page_url,
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    return filePath;
  } catch (err) {
    console.error('[save-lead] Could not save lead to file:', err.message);
    // Don't re-throw — lead saving is a best-effort fallback
    return null;
  }
}

module.exports = { saveLeadToFile };
