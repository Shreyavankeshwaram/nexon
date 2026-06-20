(function () {
  'use strict';

  var modal = document.getElementById('brochureLeadModal');
  var form = document.getElementById('brochureLeadForm');
  var trigger = document.getElementById('brochureDownloadTrigger');
  var closeBtn = document.getElementById('brochureLeadClose');
  var submitBtn = document.getElementById('brochureLeadSubmit');
  var statusEl = document.getElementById('brochureLeadStatus');
  var errorEl = document.getElementById('brochureLeadError');

  if (!modal || !form || !trigger) return;

  var LIVE_SERVER_PORTS = { '5500': 1, '5501': 1, '5502': 1, '5503': 1, '8080': 1 };
  var API_PORT = '3000';

  function isLiveServer() {
    return !!LIVE_SERVER_PORTS[window.location.port];
  }

  function isFilePreview() {
    return window.location.protocol === 'file:';
  }

  function isLocalPreview() {
    return isLiveServer() || isFilePreview();
  }

  function getApiUrls() {
    var configured = trigger.getAttribute('data-api-url');
    if (configured && configured.indexOf('http') === 0) return [configured];
    if (isLocalPreview()) {
      // Direct API first — Live Server proxy often returns HTML instead of JSON
      return [
        'http://127.0.0.1:' + API_PORT + '/api/brochure-lead',
        'http://localhost:' + API_PORT + '/api/brochure-lead',
        '/api/brochure-lead'
      ];
    }
    return [configured || '/api/brochure-lead'];
  }

  function resolveBrochureUrl() {
    var configured = trigger.getAttribute('data-brochure-url');
    if (isLocalPreview()) {
      return '../assets/brochure/Nexon_Digital_Brochure.pdf';
    }
    return configured || '/assets/brochure/Nexon_Digital_Brochure.pdf';
  }

  var BROCHURE_URL = resolveBrochureUrl();
  var BROCHURE_NAME = trigger.getAttribute('data-brochure-name') || 'Nexon Digital Brochure';

  function openModal() {
    form.reset();
    clearFieldErrors();
    hideMessage();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var first = form.querySelector('#brochureName');
    if (first) setTimeout(function () { first.focus(); }, 120);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function hideMessage() {
    if (statusEl) {
      statusEl.hidden = true;
      statusEl.textContent = '';
      statusEl.className = 'brochure-lead-status';
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  }

  function showSuccess(message) {
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = message;
      statusEl.className = 'brochure-lead-status is-success';
    }
  }

  function showError(message) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  function clearFieldErrors() {
    form.querySelectorAll('.brochure-lead-field-error').forEach(function (el) {
      el.textContent = '';
    });
    form.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
  }

  function showFieldErrors(errors) {
    Object.keys(errors).forEach(function (key) {
      var field = form.querySelector('[name="' + key + '"]');
      var err = form.querySelector('[data-error-for="' + key + '"]');
      if (field) field.classList.add('is-invalid');
      if (err) err.textContent = errors[key];
    });
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Download Brochure';
  }

  function triggerDownload() {
    var link = document.createElement('a');
    link.href = BROCHURE_URL;
    link.download = 'Nexon_Digital_Brochure.pdf';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function postLead(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.text().then(function (text) {
        var contentType = (res.headers.get('content-type') || '').toLowerCase();
        var data = null;

        if (text && (contentType.indexOf('application/json') !== -1 || text.trim().charAt(0) === '{')) {
          try {
            data = JSON.parse(text);
          } catch (parseErr) {
            throw new Error('INVALID_JSON');
          }
        } else {
          throw new Error('NON_JSON_RESPONSE');
        }

        return { ok: res.ok, data: data };
      });
    });
  }

  function tryPostSequentially(urls, payload, index) {
    if (index >= urls.length) {
      return Promise.reject(new Error('ALL_FAILED'));
    }

    return postLead(urls[index], payload).catch(function (err) {
      if (err.message === 'NON_JSON_RESPONSE' || err.message === 'INVALID_JSON' || err.name === 'TypeError') {
        return tryPostSequentially(urls, payload, index + 1);
      }
      throw err;
    });
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideMessage();
    clearFieldErrors();
    setLoading(true);

    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      company: form.company.value.trim(),
      brochure_name: BROCHURE_NAME,
      page_url: window.location.href,
      website: form.website.value.trim()
    };

    tryPostSequentially(getApiUrls(), payload, 0)
      .then(function (result) {
        setLoading(false);

        if (!result.ok || !result.data.success) {
          if (result.data && result.data.errors) {
            showFieldErrors(result.data.errors);
          }
          showError(
            (result.data && result.data.message) ||
              'We could not process your request. Please try again.'
          );
          console.error('[brochure-lead] Submission failed:', result.data);
          return;
        }

        showSuccess(result.data.message || 'Thank you! Your brochure is being downloaded.');
        triggerDownload();

        setTimeout(closeModal, 2200);
      })
      .catch(function (err) {
        setLoading(false);
        triggerDownload();
        var msg = isLocalPreview()
          ? 'Brochure downloaded. To send the enquiry too, run "npm start" in the project folder and submit again.'
          : 'Brochure downloaded. We could not send your enquiry right now, so please try again in a moment.';
        showError(msg);
        console.error('[brochure-lead] Network error:', err);
      });
  });
})();
