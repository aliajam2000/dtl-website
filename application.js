'use strict';
(() => {
  const config = window.DTL_CONFIG;
  const form = document.querySelector('#partner-form');
  if (!form || !config?.applicationsEnabled || !config.turnstileSiteKey) return;
  const expectedEndpoint = 'https://fmlcpdlxbuhaymzvjxwu.supabase.co/functions/v1/partner-apply';
  if (config.applicationEndpoint !== expectedEndpoint) return;
  const fields = document.querySelector('#application-fields');
  const button = document.querySelector('#submit-application');
  const status = document.querySelector('#form-status');
  const availability = document.querySelector('#availability');
  let token = '', widgetId, sending = false;
  // Reuse on uncertain network outcomes. Never keep personal information in storage.
  const requestId = crypto.randomUUID();
  const say = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('error', error);
  };
  const resetChallenge = () => {
    token = '';
    button.disabled = true;
    if (widgetId !== undefined) window.turnstile?.reset(widgetId);
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || fields.disabled) return;
    if (!form.reportValidity()) return;
    if (!token) { say('Please complete the security check before submitting.', true); return; }
    const data = Object.fromEntries(new FormData(form));
    data.privacy_acknowledged = form.elements.privacy_acknowledged.checked;
    delete data['cf-turnstile-response'];
    data.turnstile_token = token;
    data.request_id = requestId;
    sending = true;
    fields.disabled = true;
    button.textContent = 'Submitting…';
    say('Sending your application securely. Please keep this page open.');
    try {
      const response = await fetch(expectedEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), credentials: 'omit', signal: AbortSignal.timeout(20000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.accepted !== true) {
        if (response.status === 429) throw new Error('Too many attempts. Please wait 24 hours before trying again.');
        if (response.status === 400) throw new Error('Please check all fields and complete a new security check.');
        throw new Error('We could not confirm receipt. Your entries are still here; please try again later.');
      }
      form.reset();
      availability.textContent = 'Thank you. Your enquiry has been received for review. Repeat applications are combined where possible. Submission does not establish a partnership.';
      say('Received for review. No further action is needed now.');
      button.textContent = 'Application received';
      status.focus();
      // Stay disabled after success, preventing accidental repeated submissions.
      token = '';
    } catch (error) {
      fields.disabled = false;
      say(error.name === 'TimeoutError' ? 'The connection timed out; receipt is unconfirmed. Please try again. Your entries are still here.' : error.message, true);
      button.textContent = 'Submit application ↗';
      resetChallenge();
      status.focus();
    } finally { sending = false; }
  });
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.onload = () => {
    if (!window.turnstile) return;
    fields.disabled = false;
    availability.textContent = 'Applications are open. All fields are required unless marked optional.';
    button.textContent = 'Submit application ↗';
    widgetId = window.turnstile.render('#spam-check', {
      sitekey: config.turnstileSiteKey, action: 'partner_application', theme: 'light',
      callback(value) { token = value; if (!sending) button.disabled = false; },
      'expired-callback'() { token = ''; button.disabled = true; },
      'error-callback'() { token = ''; button.disabled = true; say('The security check is unavailable. Please try again later.', true); }
    });
  };
  script.onerror = () => { availability.textContent = 'Applications are temporarily unavailable because the security check could not load. Please try again later.'; };
  document.head.append(script);
})();
