const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

function stripHtml(value) {
  return String(value || '')
    .replace(/[<>'"`;]/g, '')
    .trim();
}

function validateBrochureLead(body) {
  const errors = {};

  const name = stripHtml(body.name);
  const email = stripHtml(body.email).toLowerCase();
  const phone = stripHtml(body.phone);
  const company = stripHtml(body.company);
  const brochureName = stripHtml(body.brochure_name) || 'Nexon Digital Brochure';
  const pageUrl = stripHtml(body.page_url);
  const honeypot = stripHtml(body.website);

  if (honeypot) {
    return { ok: false, spam: true, errors: { form: 'Invalid submission.' } };
  }

  if (!name || name.length < 2 || name.length > 120) {
    errors.name = 'Please enter your full name (2–120 characters).';
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!phone || !PHONE_RE.test(phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (company && company.length > 150) {
    errors.company = 'Company name is too long.';
  }

  if (pageUrl && pageUrl.length > 2048) {
    errors.page_url = 'Invalid page URL.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      company: company || '—',
      brochure_name: brochureName,
      page_url: pageUrl || '—',
    },
  };
}

module.exports = { validateBrochureLead, stripHtml };
