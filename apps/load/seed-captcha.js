import crypto from 'k6/crypto';

const CAPTCHA = 'AB12C';
const CAPTCHA_SECRET = __ENV.CAPTCHA_SECRET || 'secret';

function captchaToken() {
  return crypto.hmac('sha256', CAPTCHA_SECRET, CAPTCHA.toLowerCase(), 'hex');
}

export { captchaToken, CAPTCHA, CAPTCHA_SECRET };
