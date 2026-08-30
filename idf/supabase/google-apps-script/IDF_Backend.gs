/**
 * IDF_Backend.gs
 * =============================================================================
 * IN DESIGN — Luxury Fabrics | Google Apps Script Web App Backend
 *
 * DEPLOY STEPS:
 *  1. Open your Google Sheet (logged in as indesignluxuryfabrics@gmail.com)
 *  2. Extensions → Apps Script → delete all default code → paste this entire file
 *  3. Change SHARED_TOKEN to match your VITE_APPS_SCRIPT_TOKEN in .env.local
 *  4. Click Deploy → New Deployment
 *       Type: Web App
 *       Execute as: Me (indesignluxuryfabrics@gmail.com)
 *       Who has access: Anyone
 *  5. Copy the Web App URL → VITE_APPS_SCRIPT_URL in .env.local
 *
 * SHEET TABS REQUIRED:
 *  "Customers" — auto-created with headers on first run
 *  "Orders"    — auto-created with headers on first run
 *  "Wishlist"  — auto-created on first run
 *  "AdminOtp"  — auto-created on first run
 * =============================================================================
 */

// ── CONFIG — Change SHARED_TOKEN before deploying ──────────────────────────────
var SHARED_TOKEN    = 'idf-secret-2024';
var ADMIN_EMAIL     = 'virtuosodhanush@gmail.com';
var ADMIN_PASSWORD  = 'ADMIN3300';
var ADMIN_OTP_TO    = 'virtuosodhanush@gmail.com';
var OTP_EXPIRY_MIN  = 10;
var SESSION_TTL_DAYS = 30;

// ── Entry point ────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    if (body.token !== SHARED_TOKEN) return out({ ok: false, error: 'unauthorized' });

    var action = body.action;
    var result;
    switch (action) {
      case 'customer_signup':
      case 'customer_send_otp':    result = signupSendOtp(body);       break;
      case 'customer_verify_otp':  result = verifyOtp(body);           break;
      case 'customer_login':       result = loginSendOtp(body);        break;
      case 'customer_verify_login_otp': result = verifyOtp(body);      break;
      case 'customer_session':     result = checkSession(body);        break;
      case 'admin_request_otp':    result = adminRequestOtp(body);     break;
      case 'admin_verify_otp':     result = adminVerifyOtp(body);      break;
      case 'get_profile':          result = getProfile(body);          break;
      case 'upsert_customer':      result = upsertCustomer(body);      break;
      case 'save_order':           result = saveOrder(body);           break;
      case 'get_my_orders':        result = getMyOrders(body);         break;
      case 'get_wishlist':         result = getWishlist(body);         break;
      case 'toggle_wishlist':      result = toggleWishlist(body);      break;
      case 'get_catalog':          result = getCatalog(body);          break;
      case 'save_catalog':         result = saveCatalog(body);         break;
      case 'get_reviews':          result = getReviews(body);          break;
      case 'submit_review':       result = submitReview(body);       break;
      default: result = { ok: false, error: 'unknown_action: ' + action };
    }
    return out(result);
  } catch(err) {
    return out({ ok: false, error: err.toString() });
  }
}

function doGet() {
  return out({ ok: true, service: 'IDF Backend v2', status: 'running' });
}

function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet helpers ──────────────────────────────────────────────────────────────

function sheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var headers = {
      Customers: ['id','name','phone','email','password_hash','created_at','otp','otp_expiry','session_token','signup_method'],
      Orders:    ['id','customer_email','order_code','item_names','subtotal','discount','shipping','total','paid','txn_id','created_at','fulfilment','address','city','pincode','payment_method','notes'],
      Wishlist:  ['customer_email','product_ids'],
      AdminOtp:  ['otp','otp_expiry','session_token'],
    };
    if (headers[name]) sh.appendRow(headers[name]);
  }
  return sh;
}

function findByEmail(email) {
  var data = sheet('Customers').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3]).toLowerCase() === email.toLowerCase()) {
      return { row: i + 1, d: data[i] };
    }
  }
  return null;
}

function otp6()       { return String(Math.floor(100000 + Math.random() * 900000)); }
function uuid()       { return Utilities.getUuid(); }
function token()      { return Utilities.getUuid() + '-' + Date.now(); }
function sha256(str)  {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return b.map(function(x){ return ('0'+(x&0xff).toString(16)).slice(-2); }).join('');
}

function sendOtp(to, otp, subject, intro) {
  var html =
    '<div style="font-family:Georgia,serif;max-width:480px;margin:auto;border:1px solid #1F0505;padding:32px">' +
    '<h2 style="text-align:center;letter-spacing:.12em;color:#1F0505;margin:0 0 4px">IN DESIGN</h2>' +
    '<p style="text-align:center;font-size:10px;letter-spacing:.3em;color:#999;text-transform:uppercase;margin:0 0 24px">Luxury Fabrics · Bengaluru</p>' +
    '<hr style="border:none;border-top:1px solid #1F0505;margin:0 0 24px"/>' +
    '<p style="color:#1F0505;font-size:14px;line-height:1.7">' + intro + '</p>' +
    '<div style="text-align:center;margin:32px 0">' +
    '<div style="display:inline-block;border:2px solid #1F0505;padding:16px 40px">' +
    '<p style="font-size:36px;font-weight:700;letter-spacing:.35em;color:#1F0505;margin:0">' + otp + '</p>' +
    '</div></div>' +
    '<p style="color:#888;font-size:12px;text-align:center">Expires in ' + OTP_EXPIRY_MIN + ' minutes. Do not share this code.</p>' +
    '</div>';

  MailApp.sendEmail({ to: to, subject: subject, body: intro + '\n\nYour code: ' + otp, htmlBody: html, name: 'IN DESIGN Luxury Fabrics' });
}

// ── Customer Signup / Send OTP ─────────────────────────────────────────────────

function signupSendOtp(body) {
  var name  = String(body.name  || '').trim();
  var phone = String(body.phone || '').trim();
  var email = String(body.email || '').trim().toLowerCase();
  var pass  = String(body.password || '');

  if (!name || !phone || !email || !pass) return { ok: false, error: 'All fields are required.' };
  if (pass.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  var otp     = otp6();
  var expiry  = new Date(Date.now() + OTP_EXPIRY_MIN * 60000).toISOString();
  var hash    = sha256(pass);
  var sh      = sheet('Customers');
  var found   = findByEmail(email);

  if (found) {
    sh.getRange(found.row, 2).setValue(name);
    sh.getRange(found.row, 3).setValue(phone);
    sh.getRange(found.row, 5).setValue(hash);
    sh.getRange(found.row, 7).setValue(otp);
    sh.getRange(found.row, 8).setValue(expiry);
  } else {
    sh.appendRow([uuid(), name, phone, email, hash, new Date().toISOString(), otp, expiry, '', 'email']);
  }

  sendOtp(email, otp, 'Verify your IN DESIGN account',
    'Welcome to IN DESIGN, ' + name + '! Please verify your email address to activate your account.');

  return { ok: true, message: 'OTP sent to ' + email };
}

// ── Verify OTP (signup + login share same logic) ───────────────────────────────

function verifyOtp(body) {
  var email = String(body.email || '').trim().toLowerCase();
  var code  = String(body.code  || '').trim();
  if (!email || !code) return { ok: false, error: 'Email and code required.' };

  var found = findByEmail(email);
  if (!found) return { ok: false, error: 'No account found.' };

  var d = found.d;
  if (String(d[6]) !== code) return { ok: false, error: 'Incorrect verification code.' };
  var expiry = d[7] ? new Date(d[7]) : null;
  if (!expiry || new Date() > expiry) return { ok: false, error: 'Code has expired. Please request a new one.' };

  var tok = token();
  var tokExpiry = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  var sh  = sheet('Customers');
  sh.getRange(found.row, 7).setValue('');
  sh.getRange(found.row, 8).setValue('');
  sh.getRange(found.row, 9).setValue(tok + '|' + tokExpiry);

  return { ok: true, token: tok, user: { id: String(d[0]), email: String(d[3]), name: String(d[1]) } };
}

// ── Customer Login / Send OTP ──────────────────────────────────────────────────

function loginSendOtp(body) {
  var email = String(body.email    || '').trim().toLowerCase();
  var pass  = String(body.password || '');

  if (email === ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, error: 'Please use the admin login.', isAdmin: true };
  }

  var found = findByEmail(email);
  if (!found) return { ok: false, error: 'No account found. Please sign up first.' };

  if (sha256(pass) !== String(found.d[4])) return { ok: false, error: 'Incorrect password.' };

  var otp    = otp6();
  var expiry = new Date(Date.now() + OTP_EXPIRY_MIN * 60000).toISOString();
  var sh     = sheet('Customers');
  sh.getRange(found.row, 7).setValue(otp);
  sh.getRange(found.row, 8).setValue(expiry);

  sendOtp(email, otp, 'Your IN DESIGN login code',
    'Someone (hopefully you) is signing into IN DESIGN. Use this code to complete your login.');

  return { ok: true, otpSent: true, message: 'Verification code sent to ' + email };
}

// ── Session check ──────────────────────────────────────────────────────────────

function checkSession(body) {
  var tok = String(body.customerToken || '');
  if (!tok) return { ok: false, error: 'no_token' };

  var data = sheet('Customers').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var raw = String(data[i][8] || '');
    if (!raw) continue;
    var parts = raw.split('|');
    if (parts[0] === tok) {
      if (parts[1] && new Date() > new Date(parts[1])) return { ok: false, error: 'session_expired' };
      return { ok: true, user: { id: String(data[i][0]), email: String(data[i][3]), name: String(data[i][1]) } };
    }
  }
  return { ok: false, error: 'invalid_token' };
}

// ── Admin OTP ──────────────────────────────────────────────────────────────────

function adminRequestOtp(body) {
  var email = String(body.email    || '').trim().toLowerCase();
  var pass  = String(body.password || '');

  if (email !== ADMIN_EMAIL.toLowerCase()) return { ok: false, error: 'Not an admin account.' };
  if (pass  !== ADMIN_PASSWORD)            return { ok: false, error: 'Incorrect admin password.' };

  var otp    = otp6();
  var expiry = new Date(Date.now() + OTP_EXPIRY_MIN * 60000).toISOString();
  var sh     = sheet('AdminOtp');
  if (sh.getLastRow() < 2) sh.appendRow([otp, expiry, '']);
  else { sh.getRange(2,1).setValue(otp); sh.getRange(2,2).setValue(expiry); sh.getRange(2,3).setValue(''); }

  sendOtp(ADMIN_OTP_TO, otp, 'IN DESIGN Admin Login Code',
    'An admin login was requested for IN DESIGN. Use this code to complete sign-in.');

  return { ok: true, message: 'Admin OTP sent to ' + ADMIN_OTP_TO };
}

function adminVerifyOtp(body) {
  var code = String(body.code || '').trim();
  if (!code) return { ok: false, error: 'Code required.' };

  var sh = sheet('AdminOtp');
  if (sh.getLastRow() < 2) return { ok: false, error: 'No pending admin OTP.' };

  var row    = sh.getRange(2, 1, 1, 3).getValues()[0];
  var stored = String(row[0] || '');
  var expiry = row[1] ? new Date(row[1]) : null;

  if (stored !== code)            return { ok: false, error: 'Incorrect code.' };
  if (!expiry || new Date() > expiry) return { ok: false, error: 'Code expired. Request a new one.' };

  var tok = token();
  var tokExpiry = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  sh.getRange(2,1).setValue(''); sh.getRange(2,2).setValue('');
  sh.getRange(2,3).setValue(tok + '|' + tokExpiry);

  return { ok: true, isAdmin: true, token: tok, user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' } };
}

// ── Profile ────────────────────────────────────────────────────────────────────

function getProfile(body) {
  var found = findByEmail(String(body.userEmail || ''));
  if (!found) return { ok: false, error: 'not_found' };
  var d = found.d;
  return { ok: true, data: { name: String(d[1]||''), phone: String(d[2]||''), email: String(d[3]||''), city: String(d[10]||''), address: String(d[11]||''), signup_method: String(d[9]||'email') } };
}

function upsertCustomer(body) {
  var found = findByEmail(String(body.userEmail || ''));
  if (!found) return { ok: false, error: 'not_found' };
  var sh = sheet('Customers');
  if (body.name    !== undefined) sh.getRange(found.row, 2).setValue(body.name);
  if (body.phone   !== undefined) sh.getRange(found.row, 3).setValue(body.phone);
  if (body.city    !== undefined) sh.getRange(found.row, 11).setValue(body.city);
  if (body.address !== undefined) sh.getRange(found.row, 12).setValue(body.address);
  return { ok: true };
}

// ── Orders ─────────────────────────────────────────────────────────────────────

function saveOrder(body) {
  var email = String(body.userEmail || '').toLowerCase();
  var o     = body.order || {};
  var items = Array.isArray(o.items) ? o.items.map(function(it){ return it.name+'×'+it.metres+'m'; }).join(', ') : '';
  sheet('Orders').appendRow([
    uuid(), email, o.orderCode||'', items,
    o.subtotal||0, o.discount||0, o.shipping||0, o.total||0,
    o.paid ? 'YES':'NO', o.paymentReference||'',
    new Date().toISOString(),
    o.fulfilment||'', o.address||'', o.city||'', o.pincode||'', o.paymentMethod||'', o.notes||''
  ]);
  return { ok: true };
}

function getMyOrders(body) {
  var email = String(body.userEmail || '').toLowerCase();
  var data  = sheet('Orders').getDataRange().getValues();
  var rows  = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() !== email) continue;
    rows.push({
      orderCode: String(data[i][2]||''),
      itemNames: String(data[i][3]||''),
      subtotal:  Number(data[i][4]||0),
      discount:  Number(data[i][5]||0),
      shipping:  Number(data[i][6]||0),
      total:     Number(data[i][7]||0),
      paid:      String(data[i][8])==='YES',
      txnId:     String(data[i][9]||''),
      createdAt: String(data[i][10]||''),
      status:    String(data[i][8])==='YES' ? 'Paid' : 'Pending',
    });
  }
  rows.sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });
  return { ok: true, data: rows };
}

// ── Wishlist ───────────────────────────────────────────────────────────────────

function getWishlist(body) {
  var email = String(body.userEmail||'').toLowerCase();
  var data  = sheet('Wishlist').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === email) {
      var ids = String(data[i][1]||'');
      return { ok: true, data: ids ? ids.split(',') : [] };
    }
  }
  return { ok: true, data: [] };
}

function toggleWishlist(body) {
  var email = String(body.userEmail||'').toLowerCase();
  var pid   = String(body.productId||'');
  var on    = Boolean(body.on);
  var sh    = sheet('Wishlist');
  var data  = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === email) {
      var ids = String(data[i][1]||'') ? String(data[i][1]).split(',') : [];
      if (on) { if (ids.indexOf(pid)<0) ids.push(pid); }
      else    { ids = ids.filter(function(x){ return x!==pid; }); }
      sh.getRange(i+1,2).setValue(ids.join(','));
      return { ok: true };
    }
  }
  if (on) sh.appendRow([email, pid]);
  return { ok: true };
}

// ── Catalog Storage ────────────────────────────────────────────────────────────

function getCatalog(body) {
  var sh = sheet('Catalog');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, data: { items: [], offer: { active: false, headline: '', detail: '' } } };

  var row = data[1];
  var rawJson = String(row[0] || '');
  if (!rawJson) return { ok: true, data: { items: [], offer: { active: false, headline: '', detail: '' } } };

  try {
    var parsed = JSON.parse(rawJson);
    return { ok: true, data: parsed };
  } catch(e) {
    return { ok: true, data: { items: [], offer: { active: false, headline: '', detail: '' } } };
  }
}

function saveCatalog(body) {
  var items = body.items || [];
  var offer = body.offer || { active: false, headline: '', detail: '' };
  var payload = JSON.stringify({ items: items, offer: offer, updatedAt: new Date().toISOString() });

  var sh = sheet('Catalog');
  if (sh.getLastRow() < 2) {
    sh.appendRow([payload]);
  } else {
    sh.getRange(2, 1).setValue(payload);
  }
  return { ok: true };
}

function getReviews(body) {
  var sh = sheet('Reviews');
  if (sh.getLastRow() < 1) return { ok: true, data: [] };
  var data = sh.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var status = String(r[7] || 'approved').toLowerCase();
    if (status !== 'hidden') {
      list.push({
        id: String(r[0]),
        name: String(r[1]),
        city: String(r[2]),
        rating: Number(r[3]) || 5,
        text: String(r[4]),
        product: String(r[5]),
        date: String(r[6]),
        status: status
      });
    }
  }
  return { ok: true, data: list };
}

function submitReview(body) {
  var name = String(body.name || '').trim();
  var text = String(body.text || body.review_text || '').trim();
  if (!name || !text) return { ok: false, error: 'Name and review text are required' };

  var sh = sheet('Reviews');
  var id = 'rev_' + Date.now();
  var dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  var rating = Number(body.rating) || 5;
  var city = String(body.city || '').trim();
  var product = String(body.product || '').trim();
  var status = 'approved';

  sh.appendRow([id, name, city, rating, text, product, dateStr, status]);
  return { ok: true, id: id };
}
