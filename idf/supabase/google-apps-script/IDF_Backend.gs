/**
 * IDF_Backend.gs
 * =============================================================================
 * IN DESIGN — Luxury Fabrics | Google Apps Script Web App Backend
 *
 * CANONICAL DATABASE SPECIFICATION:
 * All store data (Products, Orders, Customers, Reviews, Categories, Settings)
 * is stored canonically across Google Sheets tabs.
 *
 * CONCURRENCY ARCHITECTURE & LOCKSERVICE:
 * Every write operation (Catalog, Orders, Customers, Reviews, Settings) is
 * protected by LockService.getScriptLock() with a 30s timeout to prevent
 * simultaneous execution from creating Google Sheet conflict tabs
 * (e.g. Catalog_conflict1942333489).
 * Automatic reconciliation detects and merges any historical conflict tabs
 * into the canonical sheets and deletes the redundant tabs.
 *
 * SHEET TABS MANAGED:
 *  "Catalog"    — Each product is a structured row (ID, name, category, stock, price, etc.)
 *  "Orders"     — All customer & historical orders with payment & fulfilment status
 *  "Customers"  — Unified CRM (Accounts, Guest Checkouts, Manual Registry)
 *  "Reviews"    — Moderation queue & public approved reviews
 *  "Categories" — Taxonomy configuration
 *  "Settings"   — Shipping rules, wholesale thresholds & sitewide offer
 *  "Wishlist"   — Customer product wishlists
 *  "AdminOtp"   — Admin OTP sessions
 * =============================================================================
 */

// ── CONFIG ───────────────────────────────────────────────────────────────────
var SHARED_TOKEN    = 'idf-secret-2024';
var ADMIN_EMAIL     = 'indesignluxuryfabrics@gmail.com';
var ADMIN_PASSWORD  = 'ADMIN3300';
var ADMIN_OTP_TO    = 'indesignluxuryfabrics@gmail.com';
var OTP_EXPIRY_MIN  = 10;
var SESSION_TTL_DAYS = 30;

var RAZORPAY_KEY_ID     = 'rzp_test_TWJWqNswp8gSw8';
var RAZORPAY_KEY_SECRET = 'g5ByotCXDb0XFMPuWM7eUJGX';

// ── CONCURRENCY LOCK HELPER ──────────────────────────────────────────────────

/**
 * Execute a database mutation within an exclusive script lock.
 * Queues concurrent requests up to 30 seconds so operations serialize
 * instead of colliding and creating duplicate conflict sheets.
 */
function withScriptLock(fn) {
  var lock = LockService.getScriptLock();
  var acquired = false;
  try {
    acquired = lock.tryLock(30000); // 30-second queue timeout
  } catch (err) {
    acquired = false;
  }
  if (!acquired) {
    throw new Error('Database is busy with another concurrent write. Please retry in a few seconds.');
  }
  try {
    return fn();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

// ── CONFLICT TABS RECONCILIATION & AUTO-MERGE ────────────────────────────────

/**
 * Scans the entire spreadsheet for duplicate conflict tabs
 * (e.g. "Catalog_conflict1942333489", "Orders_conflict...")
 * Merges missing data rows back into the canonical tab matching by unique ID,
 * and permanently removes the conflict tabs.
 */
function mergeAndCleanupConflictSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var report = [];

  for (var s = 0; s < sheets.length; s++) {
    var currentSheet = sheets[s];
    var sName = currentSheet.getName();

    // Match any conflict copy tab
    var match = sName.match(/^([a-zA-Z0-9_-]+)_conflict.*$/i);
    if (!match) continue;

    var canonicalName = match[1]; // e.g. "Catalog" or "Orders"
    var canonicalSheet = ss.getSheetByName(canonicalName);

    if (!canonicalSheet) {
      currentSheet.setName(canonicalName);
      report.push({ conflictTab: sName, action: 'renamed_to_canonical', canonical: canonicalName, rowsMerged: 0 });
      continue;
    }

    var confData = currentSheet.getDataRange().getValues();
    var canData = canonicalSheet.getDataRange().getValues();

    if (confData.length < 2) {
      ss.deleteSheet(currentSheet);
      report.push({ conflictTab: sName, action: 'deleted_empty_conflict_tab', rowsMerged: 0 });
      continue;
    }

    // Index all existing IDs in the canonical sheet (Column 0)
    var canonicalIdSet = {};
    for (var c = 1; c < canData.length; c++) {
      var cid = String(canData[c][0] || '').trim();
      if (cid) canonicalIdSet[cid] = true;
    }

    var rowsToAppend = [];
    for (var r = 1; r < confData.length; r++) {
      var row = confData[r];
      var rowId = String(row[0] || '').trim();
      if (!rowId) continue;
      // If product or record is present in conflict tab but not canonical tab, salvage it!
      if (!canonicalIdSet[rowId]) {
        rowsToAppend.push(row);
        canonicalIdSet[rowId] = true;
      }
    }

    if (rowsToAppend.length > 0) {
      var canLastRow = canonicalSheet.getLastRow();
      canonicalSheet.getRange(canLastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    }

    // Delete the conflict tab now that all items are safely merged
    ss.deleteSheet(currentSheet);
    report.push({
      conflictTab: sName,
      action: 'merged_and_deleted',
      canonical: canonicalName,
      rowsMerged: rowsToAppend.length
    });
  }

  return { ok: true, report: report };
}

// ── Entry point ────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.token !== SHARED_TOKEN) return out({ ok: false, error: 'unauthorized' });

    var action = body.action;
    var result;
    switch (action) {
      // Conflict Tab Audit & Reconciliation
      case 'reconcile_conflicts':
        result = withScriptLock(function() { return mergeAndCleanupConflictSheets(); });
        break;

      case 'audit_database':
        result = auditDatabaseBackend();
        break;

      // Auth & Customer Sessions
      case 'customer_signup':
      case 'customer_send_otp':
        result = withScriptLock(function() { return signupSendOtp(body); });
        break;
      case 'customer_verify_otp':
      case 'customer_verify_login_otp':
        result = withScriptLock(function() { return verifyOtp(body); });
        break;
      case 'customer_login':
        result = withScriptLock(function() { return loginSendOtp(body); });
        break;
      case 'customer_session':
        result = checkSession(body);
        break;
      case 'admin_request_otp':
        result = withScriptLock(function() { return adminRequestOtp(body); });
        break;
      case 'admin_verify_otp':
        result = withScriptLock(function() { return adminVerifyOtp(body); });
        break;
      case 'admin_direct_login':
        result = withScriptLock(function() { return adminDirectLogin(body); });
        break;
      case 'get_profile':
        result = getProfile(body);
        break;
      case 'upsert_customer':
        result = withScriptLock(function() { return upsertCustomer(body); });
        break;
      case 'fetch_customers':
        result = fetchCustomersBackend(body);
        break;

      // Payments & Checkout
      case 'create_razorpay_order':
        result = createRazorpayOrderBackend(body);
        break;
      case 'verify_razorpay_payment':
        result = verifyRazorpayPaymentBackend(body);
        break;

      // Orders (Read: full sheet; Write: with script lock)
      case 'save_order':
        result = withScriptLock(function() { return saveOrder(body); });
        break;
      case 'get_my_orders':
        result = getMyOrders(body);
        break;
      case 'fetch_orders':
        result = fetchOrdersBackend(body);
        break;
      case 'set_order_status':
        result = withScriptLock(function() { return setOrderStatusBackend(body); });
        break;

      // Wishlist
      case 'get_wishlist':
        result = getWishlist(body);
        break;
      case 'toggle_wishlist':
        result = withScriptLock(function() { return toggleWishlist(body); });
        break;

      // Catalog & Offer (Read: full sheet with auto conflict resolution; Write: with script lock)
      case 'get_catalog':
        result = getCatalog(body);
        break;
      case 'save_catalog':
        result = withScriptLock(function() { return saveCatalog(body); });
        break;
      case 'get_product':
        result = getProductBackend(body);
        break;
      case 'save_product':
        result = withScriptLock(function() { return saveProductBackend(body); });
        break;

      // Reviews
      case 'fetch_reviews':
        result = fetchAllReviewsBackend(body);
        break;
      case 'get_reviews':
        result = getReviews(body);
        break;
      case 'submit_review':
        result = withScriptLock(function() { return submitReview(body); });
        break;
      case 'set_review_status':
        result = withScriptLock(function() { return setReviewStatusBackend(body); });
        break;
      case 'delete_review':
        result = withScriptLock(function() { return deleteReviewBackend(body); });
        break;

      // Categories & Taxonomy
      case 'get_categories':
        result = getCategoriesBackend(body);
        break;
      case 'save_categories':
        result = withScriptLock(function() { return saveCategoriesBackend(body); });
        break;

      // Settings
      case 'get_settings':
        result = getSettingsBackend(body);
        break;
      case 'save_settings':
        result = withScriptLock(function() { return saveSettingsBackend(body); });
        break;

      default:
        result = { ok: false, error: 'unknown_action: ' + action };
    }
    return out(result);
  } catch(err) {
    return out({ ok: false, error: err.toString() });
  }
}

function doGet() {
  return out({
    ok: true,
    service: 'IDF Backend v2.3 - High Concurrency Single Source of Truth',
    status: 'running',
    timestamp: new Date().toISOString()
  });
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
      Customers: ['id','name','phone','email','password_hash','created_at','otp','otp_expiry','session_token','signup_method','city','address'],
      Orders:    ['id','customer_email','order_code','item_names','subtotal','discount','shipping','total','paid','txn_id','created_at','fulfilment','address','city','pincode','payment_method','notes','razorpay_order_id','razorpay_payment_id','razorpay_signature','order_status','customer_name','customer_phone'],
      Wishlist:  ['customer_email','product_ids'],
      AdminOtp:  ['otp','otp_expiry','session_token'],
      Catalog:   ['id','name','category','category_id','composition','width','price_per_metre','mrp','min_metres','stock','tags','image','gallery','blurb','details','suggested_garment_ids','hidden','created_at'],
      Categories:['id','name','slug','description','active'],
      Reviews:   ['id','name','city','rating','text','product','date','status','user_email','created_at'],
      Settings:  ['key','value']
    };
    if (headers[name]) sh.appendRow(headers[name]);
  }
  return sh;
}

function findByEmail(email) {
  var data = sheet('Customers').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3] || '').toLowerCase() === email.toLowerCase()) {
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
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#180e0c;color:#faf7f2;padding:36px;border-radius:12px;border:1px solid rgba(212,175,55,0.3);">' +
      '<div style="text-align:center;margin-bottom:28px;">' +
        '<div style="color:#d4af37;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;">IN DESIGN &mdash; LUXURY FABRICS</div>' +
        '<h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:normal;">' + subject + '</h1>' +
      '</div>' +
      '<p style="font-size:13px;line-height:1.7;color:rgba(250,247,242,0.8);margin-bottom:24px;">' + intro + '</p>' +
      '<div style="text-align:center;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:20px;margin-bottom:24px;">' +
        '<div style="font-size:32px;letter-spacing:0.35em;color:#d4af37;font-weight:bold;font-family:monospace;">' + otp + '</div>' +
        '<div style="font-size:11px;color:rgba(250,247,242,0.5);margin-top:6px;">Valid for ' + OTP_EXPIRY_MIN + ' minutes</div>' +
      '</div>' +
      '<p style="font-size:11px;color:rgba(250,247,242,0.4);text-align:center;margin:0;">If you did not request this code, please ignore this email.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: to,
    subject: subject + ' — ' + otp,
    htmlBody: html
  });
}

// ── Customer Auth ─────────────────────────────────────────────────────────────

function signupSendOtp(body) {
  var email = String(body.email || '').trim().toLowerCase();
  var name  = String(body.name  || '').trim();
  var phone = String(body.phone || '').trim();
  var pass  = String(body.password || '');

  if (!email || !email.includes('@')) return { ok: false, error: 'Valid email required.' };
  if (!name)                          return { ok: false, error: 'Name required.' };
  if (!phone)                         return { ok: false, error: 'Phone number required.' };
  if (!pass || pass.length < 6)       return { ok: false, error: 'Password must be at least 6 characters.' };

  var otp    = otp6();
  var expiry = new Date(Date.now() + OTP_EXPIRY_MIN * 60000).toISOString();
  var sh     = sheet('Customers');
  var found  = findByEmail(email);

  if (found) {
    var d = found.d;
    if (d[8]) return { ok: false, error: 'Account already exists. Please log in.' };
    sh.getRange(found.row, 2).setValue(name);
    sh.getRange(found.row, 3).setValue(phone);
    sh.getRange(found.row, 5).setValue(sha256(pass));
    sh.getRange(found.row, 7).setValue(otp);
    sh.getRange(found.row, 8).setValue(expiry);
  } else {
    sh.appendRow([uuid(), name, phone, email, sha256(pass), new Date().toISOString(), otp, expiry, '', 'email', 'Bengaluru', '']);
  }

  sendOtp(email, otp, 'Verify Your IN DESIGN Account',
    'Welcome to IN DESIGN — Luxury Fabrics. Enter this verification code to complete your registration.');

  return { ok: true, message: 'OTP sent to ' + email };
}

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

function loginSendOtp(body) {
  var email = String(body.email    || '').trim().toLowerCase();
  var pass  = String(body.password || '');

  if (email === ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, error: 'Please use the admin login.', isAdmin: true };
  }

  var found = findByEmail(email);
  if (!found) return { ok: false, error: 'No account found. Please sign up first.' };

  if (sha256(pass) !== String(found.d[4])) return { ok: false, error: 'Incorrect password.' };

  var tok = token();
  var tokExpiry = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  var sh  = sheet('Customers');
  sh.getRange(found.row, 7).setValue('');
  sh.getRange(found.row, 8).setValue('');
  sh.getRange(found.row, 9).setValue(tok + '|' + tokExpiry);

  return {
    ok: true,
    directLogin: true,
    token: tok,
    user: { id: String(found.d[0]), email: String(found.d[3]), name: String(found.d[1]) }
  };
}

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

// ── Admin Auth ─────────────────────────────────────────────────────────────────

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

  if (stored !== code) return { ok: false, error: 'Incorrect code.' };
  if (!expiry || new Date() > expiry) return { ok: false, error: 'Code expired. Request a new one.' };

  var tok = token();
  var tokExpiry = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  sh.getRange(2,1).setValue(''); sh.getRange(2,2).setValue('');
  sh.getRange(2,3).setValue(tok + '|' + tokExpiry);

  return { ok: true, isAdmin: true, token: tok, user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' } };
}

function adminDirectLogin(body) {
  var email = String(body.email    || '').trim().toLowerCase();
  var pass  = String(body.password || '');

  if (email !== ADMIN_EMAIL.toLowerCase() || pass !== ADMIN_PASSWORD) {
    return { ok: false, error: 'Invalid admin email or password.' };
  }

  var tok = token();
  var tokExpiry = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  var sh = sheet('AdminOtp');
  if (sh.getLastRow() < 2) {
    sh.appendRow(['', '', tok + '|' + tokExpiry]);
  } else {
    sh.getRange(2,1).setValue('');
    sh.getRange(2,2).setValue('');
    sh.getRange(2,3).setValue(tok + '|' + tokExpiry);
  }

  return { ok: true, isAdmin: true, token: tok, user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' } };
}

// ── Profile & Customers ────────────────────────────────────────────────────────

function getProfile(body) {
  var found = findByEmail(String(body.userEmail || ''));
  if (!found) return { ok: false, error: 'not_found' };
  var d = found.d;
  return {
    ok: true,
    data: {
      name: String(d[1]||''),
      phone: String(d[2]||''),
      email: String(d[3]||''),
      city: String(d[10]||''),
      address: String(d[11]||''),
      signup_method: String(d[9]||'email')
    }
  };
}

function upsertCustomer(body) {
  var email = String(body.userEmail || body.email || '').trim().toLowerCase();
  var phone = String(body.phone || '').trim();
  var name  = String(body.name || '').trim();
  var city  = String(body.city || '').trim();
  var address = String(body.address || '').trim();
  var method = String(body.signupMethod || body.signup_method || 'Online Account');

  if (!email && !phone && !name) {
    return { ok: false, error: 'Customer identifier required' };
  }

  var sh = sheet('Customers');
  var data = sh.getDataRange().getValues();
  var foundRow = null;

  for (var i = 1; i < data.length; i++) {
    var rowEmail = String(data[i][3] || '').trim().toLowerCase();
    var rowPhone = String(data[i][2] || '').trim();
    if ((email && rowEmail === email) || (phone && rowPhone === phone)) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow) {
    if (name) sh.getRange(foundRow, 2).setValue(name);
    if (phone) sh.getRange(foundRow, 3).setValue(phone);
    if (city) sh.getRange(foundRow, 11).setValue(city);
    if (address) sh.getRange(foundRow, 12).setValue(address);
    return { ok: true, updated: true };
  } else {
    var id = body.userId || uuid();
    var createdAt = new Date().toISOString();
    sh.appendRow([id, name || 'Customer', phone, email, '', createdAt, '', '', '', method, city || 'Bengaluru', address || '']);
    return { ok: true, created: true, id: id };
  }
}

function fetchCustomersBackend(body) {
  var sh = sheet('Customers');
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return { ok: true, data: [] };
  var data = sh.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[1] && !r[2] && !r[3]) continue;
    list.push({
      id: String(r[0] || ''),
      name: String(r[1] || 'Walk-in'),
      phone: String(r[2] || ''),
      email: String(r[3] || ''),
      created_at: String(r[5] || ''),
      signup_method: String(r[9] || 'Online Account'),
      city: String(r[10] || 'Bengaluru'),
      address: String(r[11] || '')
    });
  }
  return { ok: true, data: list };
}

// ── Razorpay ───────────────────────────────────────────────────────────────────

function createRazorpayOrderBackend(body) {
  var amount = Number(body.amountPaise || 0);
  if (!amount || amount < 100) return { ok: false, error: 'Amount must be at least ₹1' };

  var payload = {
    amount: amount,
    currency: body.currency || 'INR',
    receipt: body.receipt || ('rcpt_' + Date.now()),
    notes: { orderCode: body.orderCode || '', userEmail: body.userEmail || '' }
  };

  var authHeader = 'Basic ' + Utilities.base64Encode(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET);
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': authHeader },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', options);
    var resData = JSON.parse(response.getContentText());
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return { ok: true, order_id: resData.id, amount: resData.amount, currency: resData.currency };
    }
    return { ok: false, error: resData.error ? resData.error.description : 'Razorpay error' };
  } catch(err) {
    return { ok: false, error: err.toString() };
  }
}

function verifyRazorpayPaymentBackend(body) {
  var paymentId = String(body.paymentId || body.razorpay_payment_id || '').trim();
  var orderId   = String(body.orderId   || body.razorpay_order_id   || '').trim();
  var signature = String(body.signature || body.razorpay_signature  || '').trim();

  if (!paymentId || !orderId || !signature) return { ok: false, error: 'Missing verification fields' };

  var textToSign = orderId + '|' + paymentId;
  var signatureBytes = Utilities.computeHmacSha256Signature(textToSign, RAZORPAY_KEY_SECRET);
  var generatedSignature = signatureBytes.map(function(b){ return ('0'+(b & 0xFF).toString(16)).slice(-2); }).join('');

  if (generatedSignature !== signature) return { ok: false, error: 'Signature mismatch.' };
  return { ok: true, verified: true, paymentId: paymentId, orderId: orderId };
}

// ── Orders (Full Historical Read & Synchronized Ledger) ────────────────────────

function saveOrder(body) {
  var email = String(body.userEmail || '').toLowerCase();
  var o     = body.order || {};
  var items = Array.isArray(o.items) ? o.items.map(function(it){ return (it.name || it.item?.name || 'Fabric')+'×'+(it.metres || 1)+'m'; }).join(', ') : '';
  var orderStatus = o.order_status || o.orderStatus || (o.paid ? 'confirmed' : 'pending_whatsapp');
  var custName = o.customerName || (o.customers && o.customers.name) || '';
  var custPhone = o.phone || (o.customers && o.customers.phone) || '';

  sheet('Orders').appendRow([
    uuid(), email, o.orderCode || o.order_code || ('IDF-' + Date.now().toString(36).toUpperCase()), items,
    o.subtotal||0, o.discount||0, o.shipping||0, o.total||0,
    o.paid ? 'YES':'NO', o.paymentReference||o.razorpayPaymentId||'',
    new Date().toISOString(),
    o.fulfilment||'delivery', o.address||'', o.city||'', o.pincode||'', o.paymentMethod||o.payment_method||'UPI', o.notes||o.requirement||'',
    o.razorpayOrderId||'', o.razorpayPaymentId||'', o.razorpaySignature||'',
    orderStatus, custName, custPhone
  ]);

  if (custPhone || email) {
    upsertCustomer({
      name: custName,
      phone: custPhone,
      userEmail: email,
      city: o.city || 'Bengaluru',
      address: o.address || '',
      signupMethod: 'Online Checkout'
    });
  }

  return { ok: true };
}

function fetchOrdersBackend(body) {
  var sh = sheet('Orders');
  var allData = sh.getDataRange().getValues();
  if (allData.length < 2) return { ok: true, data: [], count: 0, rawRowCount: 0 };

  // Dynamic header resolution so differing column orders or historical structures never crash
  var headers = allData[0];
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    colMap[h] = c;
  }

  function getCol(aliases, defaultIdx) {
    for (var a = 0; a < aliases.length; a++) {
      var k = aliases[a].toLowerCase().replace(/[\s_-]+/g, '');
      if (colMap[k] !== undefined) return colMap[k];
    }
    return defaultIdx;
  }

  var cId = getCol(['id', 'orderid', 'order_id'], 0);
  var cEmail = getCol(['customer_email', 'email', 'useremail', 'user_email'], 1);
  var cCode = getCol(['order_code', 'ordercode', 'code'], 2);
  var cItems = getCol(['item_names', 'items', 'items_ordered'], 3);
  var cSubtotal = getCol(['subtotal', 'sub_total'], 4);
  var cDiscount = getCol(['discount'], 5);
  var cShipping = getCol(['shipping', 'shipping_fee'], 6);
  var cTotal = getCol(['total', 'total_amount', 'amount'], 7);
  var cPaid = getCol(['paid', 'is_paid', 'payment_status'], 8);
  var cTxn = getCol(['txn_id', 'txnid', 'payment_reference', 'ref_id', 'reference'], 9);
  var cDate = getCol(['created_at', 'date', 'order_date', 'timestamp'], 10);
  var cFulfilment = getCol(['fulfilment', 'fulfillment', 'delivery_type'], 11);
  var cAddress = getCol(['address', 'shipping_address'], 12);
  var cCity = getCol(['city'], 13);
  var cPincode = getCol(['pincode', 'pin_code', 'postal_code'], 14);
  var cMethod = getCol(['payment_method', 'method', 'payment_type'], 15);
  var cNotes = getCol(['notes', 'requirement', 'instructions'], 16);
  var cRazorpayOrderId = getCol(['razorpay_order_id'], 17);
  var cRazorpayPaymentId = getCol(['razorpay_payment_id'], 18);
  var cRazorpaySig = getCol(['razorpay_signature'], 19);
  var cStatus = getCol(['order_status', 'status'], 20);
  var cName = getCol(['customer_name', 'name', 'client_name'], 21);
  var cPhone = getCol(['customer_phone', 'phone', 'mobile'], 22);

  var orders = [];

  for (var i = 1; i < allData.length; i++) {
    var r = allData[i];

    // Skip only rows that are 100% empty across all columns
    var hasAnyContent = false;
    for (var k = 0; k < r.length; k++) {
      if (String(r[k] || '').trim() !== '') {
        hasAnyContent = true;
        break;
      }
    }
    if (!hasAnyContent) continue;

    var rawId = String(r[cId] || '').trim();
    var rawCode = String(r[cCode] || '').trim();
    var rawTxn = String(r[cTxn] || (cRazorpayPaymentId < r.length ? r[cRazorpayPaymentId] : '') || '').trim();
    var rawEmail = String(r[cEmail] || '').trim();
    var rawDate = String(r[cDate] || '').trim();

    // NEVER drop historical rows when order_code is blank! Synthesize if necessary.
    var orderCode = rawCode || rawId || rawTxn || ('IDF-HIST-' + i);
    var orderId = rawId || rawCode || ('order-' + i + '-' + Date.now().toString(36));

    // Flexible items parsing (supports JSON, comma-separated 'Item×2m', or single name)
    var itemNames = String(r[cItems] || '');
    var itemsParsed = [];
    if (itemNames) {
      if (itemNames.charAt(0) === '[' || itemNames.charAt(0) === '{') {
        try {
          var parsedJson = JSON.parse(itemNames);
          if (Array.isArray(parsedJson)) {
            itemsParsed = parsedJson.map(function(it) {
              return {
                item: { name: it.name || it.item?.name || 'Fabric' },
                metres: Number(it.metres || it.meters || 1),
                lineTotal: Number(it.lineTotal || it.total || 0)
              };
            });
          }
        } catch(e) {}
      }
      if (itemsParsed.length === 0) {
        var parts = itemNames.split(', ');
        for (var j = 0; j < parts.length; j++) {
          var p = parts[j].split('×');
          var name = p[0] || 'Fabric';
          var metres = p[1] ? parseFloat(p[1]) : 1;
          itemsParsed.push({
            item: { name: name.trim() },
            metres: metres || 1,
            lineTotal: 0
          });
        }
      }
    }
    if (itemsParsed.length === 0) {
      itemsParsed.push({ item: { name: 'Fabric Order' }, metres: 1, lineTotal: 0 });
    }

    // Robust Paid evaluation
    var rawPaid = r[cPaid];
    var paidStr = String(rawPaid || '').trim().toUpperCase();
    var isPaid = paidStr === 'YES' || paidStr === 'TRUE' || paidStr === 'PAID' || paidStr === 'SUCCESS' || paidStr === 'Y' || paidStr === '1' || rawPaid === true;

    var rawStatus = String(r[cStatus] || '').trim().toLowerCase();
    var orderStatus = rawStatus || (isPaid ? 'confirmed' : 'pending_whatsapp');

    var totalAmt = Number(r[cTotal]) || 0;
    var subtotalAmt = Number(r[cSubtotal]) || totalAmt;

    // Normalised customer email for reliable CRM join
    var cleanEmail = rawEmail ? rawEmail.toLowerCase() : '';

    orders.push({
      id: orderId,
      order_code: orderCode,
      items: itemsParsed,
      subtotal: subtotalAmt,
      discount: Number(r[cDiscount]) || 0,
      shipping: Number(r[cShipping]) || 0,
      total: totalAmt,
      paid: isPaid,
      payment_reference: rawTxn || '—',
      created_at: rawDate || '2026-08-29T10:00:00.000Z',
      fulfilment: String(r[cFulfilment] || 'delivery').trim(),
      address: String(r[cAddress] || '').trim(),
      city: String(r[cCity] || '').trim(),
      pincode: String(r[cPincode] || '').trim(),
      payment_method: String(r[cMethod] || (rawTxn ? 'UPI / Online' : 'UPI')).trim(),
      requirement: String(r[cNotes] || '').trim(),
      payment_status: isPaid ? 'paid' : (paidStr === 'FAILED' ? 'failed' : 'pending'),
      order_status: orderStatus,
      customers: {
        name: String(r[cName] || 'Walk-in Client').trim(),
        phone: String(r[cPhone] || '').trim(),
        email: cleanEmail
      }
    });
  }

  // Sort chronological: oldest to newest (by created_at)
  orders.sort(function(a, b) {
    var da = new Date(a.created_at).getTime() || 0;
    var db = new Date(b.created_at).getTime() || 0;
    return da - db;
  });

  return {
    ok: true,
    data: orders,
    count: orders.length,
    rawRowCount: allData.length - 1
  };
}

function setOrderStatusBackend(body) {
  var id = String(body.id || '').trim();
  var orderStatus = body.order_status;
  var paymentStatus = body.payment_status;
  if (!id) return { ok: false, error: 'Order ID is required' };

  var sh = sheet('Orders');
  var allData = sh.getDataRange().getValues();
  if (allData.length < 2) return { ok: false, error: 'No orders found' };

  var headers = allData[0];
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    colMap[h] = c;
  }

  var cId = colMap['id'] !== undefined ? colMap['id'] : 0;
  var cCode = colMap['ordercode'] !== undefined ? colMap['ordercode'] : (colMap['order_code'] !== undefined ? colMap['order_code'] : 2);
  var cPaid = colMap['paid'] !== undefined ? colMap['paid'] : 8;
  var cStatus = colMap['orderstatus'] !== undefined ? colMap['orderstatus'] : (colMap['order_status'] !== undefined ? colMap['order_status'] : 20);

  for (var i = 1; i < allData.length; i++) {
    var rowId = String(allData[i][cId] || '');
    var rowCode = String(allData[i][cCode] || '');
    if (rowId === id || rowCode === id) {
      var rowNum = i + 1;
      if (orderStatus) {
        sh.getRange(rowNum, cStatus + 1).setValue(orderStatus);
      }
      if (paymentStatus) {
        var isPaid = paymentStatus === 'paid';
        sh.getRange(rowNum, cPaid + 1).setValue(isPaid ? 'YES' : 'NO');
      }
      return { ok: true, updatedRow: rowNum };
    }
  }

  return { ok: false, error: 'Order not found: ' + id };
}

function getMyOrders(body) {
  var email = String(body.userEmail || '').toLowerCase();
  if (!email) return { ok: false, error: 'email_required' };

  var res = fetchOrdersBackend(body);
  if (!res.ok) return res;

  var myOrders = (res.data || []).filter(function(o) {
    var oEmail = (o.customers && o.customers.email) ? o.customers.email.toLowerCase() : '';
    return oEmail === email;
  });

  return { ok: true, data: myOrders };
}

// ── Wishlist ───────────────────────────────────────────────────────────────────

function getWishlist(body) {
  var email = String(body.userEmail || '').toLowerCase();
  if (!email) return { ok: false, error: 'email_required' };
  var sh    = sheet('Wishlist');
  var data  = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === email) {
      var ids = String(data[i][1]||'') ? String(data[i][1]).split(',') : [];
      return { ok: true, data: ids };
    }
  }
  return { ok: true, data: [] };
}

function toggleWishlist(body) {
  var email = String(body.userEmail || '').toLowerCase();
  var pid   = String(body.productId || '');
  var on    = Boolean(body.wishlist);
  if (!email || !pid) return { ok: false, error: 'email_and_productId_required' };

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

// ── Catalog Storage (Multi-Row Architecture with Concurrency Protection) ───────

function getCatalog(body) {
  // Automatically heal and merge any conflict tabs if present
  mergeAndCleanupConflictSheets();

  var sh = sheet('Catalog');
  var data = sh.getDataRange().getValues();
  var items = [];
  var offer = { active: false, headline: '', detail: '' };

  var offerStr = getSettingInternal('sitewide_offer');
  if (offerStr) {
    try { offer = JSON.parse(offerStr); } catch(e) {}
  }

  if (data.length > 1) {
    var firstCell = String(data[1][0] || '');
    if (firstCell.indexOf('{"items":') === 0 || firstCell.indexOf('{"updatedAt":') === 0) {
      try {
        var parsed = JSON.parse(firstCell);
        if (parsed.items && Array.isArray(parsed.items)) items = parsed.items;
        if (parsed.offer) offer = parsed.offer;
      } catch(e) {}
    } else {
      for (var i = 1; i < data.length; i++) {
        var r = data[i];
        if (!r[0] && !r[1]) continue;
        var tagsStr = String(r[10] || '');
        var galleryStr = String(r[12] || '');
        var suggestedStr = String(r[15] || '');

        items.push({
          id: String(r[0]),
          name: String(r[1]),
          category: String(r[2] || 'Contemporary'),
          categoryId: String(r[3] || ''),
          composition: String(r[4] || ''),
          width: String(r[5] || '44 in'),
          pricePerMetre: Number(r[6]) || 0,
          price_per_metre: Number(r[6]) || 0,
          mrp: r[7] ? Number(r[7]) : undefined,
          minMetres: Number(r[8]) || 0.5,
          min_metres: Number(r[8]) || 0.5,
          stock: String(r[9] || 'in'),
          tags: tagsStr ? tagsStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
          image: String(r[11] || '/images/fabrics/f01.jpg'),
          gallery: galleryStr ? galleryStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
          blurb: String(r[13] || ''),
          details: String(r[14] || ''),
          suggestedGarmentIds: suggestedStr ? suggestedStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
          hidden: String(r[16]).toUpperCase() === 'TRUE'
        });
      }
    }
  }

  return {
    ok: true,
    data: {
      items: items,
      offer: offer,
      count: items.length,
      updatedAt: new Date().toISOString()
    }
  };
}

function saveCatalog(body) {
  var items = body.items || [];
  var offer = body.offer || { active: false, headline: '', detail: '' };

  // Make sure any conflict tabs are cleaned up before mass save
  mergeAndCleanupConflictSheets();

  var sh = sheet('Catalog');
  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), 18);
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var id = String(item.id || ('fabric-' + Date.now() + '-' + i));
    var name = String(item.name || '');
    var category = String(item.category || 'Contemporary');
    var categoryId = String(item.categoryId || item.category_id || '');
    var composition = String(item.composition || '');
    var width = String(item.width || '44 in');
    var pricePerMetre = Number(item.pricePerMetre ?? item.price_per_metre ?? 0);
    var mrp = item.mrp ? Number(item.mrp) : '';
    var minMetres = Number(item.minMetres ?? item.min_metres ?? 0.5);
    var stock = String(item.stock || 'in');
    var tags = Array.isArray(item.tags) ? item.tags.join('|') : String(item.tags || '');
    var image = String(item.image || '');
    var gallery = Array.isArray(item.gallery) ? item.gallery.join('|') : String(item.gallery || '');
    var blurb = String(item.blurb || '');
    var details = String(item.details || '');
    var suggested = Array.isArray(item.suggestedGarmentIds ?? item.suggested_garment_ids)
      ? (item.suggestedGarmentIds ?? item.suggested_garment_ids).join('|')
      : String(item.suggestedGarmentIds ?? item.suggested_garment_ids ?? '');
    var hidden = Boolean(item.hidden) ? 'TRUE' : 'FALSE';
    var createdAt = String(item.createdAt || new Date().toISOString());

    rows.push([
      id, name, category, categoryId, composition, width, pricePerMetre,
      mrp, minMetres, stock, tags, image, gallery, blurb, details,
      suggested, hidden, createdAt
    ]);
  }

  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, 18).setValues(rows);
  }

  saveSettingInternal('sitewide_offer', JSON.stringify(offer));

  return { ok: true, count: items.length };
}

function getProductBackend(body) {
  var id = String(body.id || '');
  if (!id) return { ok: false, error: 'id_required' };
  var sh = sheet('Catalog');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: false, error: 'not_found' };

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[0]) === id) {
      var tagsStr = String(r[10] || '');
      var galleryStr = String(r[12] || '');
      var suggestedStr = String(r[15] || '');
      return {
        ok: true,
        data: {
          item: {
            id: String(r[0]),
            name: String(r[1]),
            category: String(r[2] || 'Contemporary'),
            categoryId: String(r[3] || ''),
            composition: String(r[4] || ''),
            width: String(r[5] || '44 in'),
            pricePerMetre: Number(r[6]) || 0,
            price_per_metre: Number(r[6]) || 0,
            mrp: r[7] ? Number(r[7]) : undefined,
            minMetres: Number(r[8]) || 0.5,
            min_metres: Number(r[8]) || 0.5,
            stock: String(r[9] || 'in'),
            tags: tagsStr ? tagsStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
            image: String(r[11] || '/images/fabrics/f01.jpg'),
            gallery: galleryStr ? galleryStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
            blurb: String(r[13] || ''),
            details: String(r[14] || ''),
            suggestedGarmentIds: suggestedStr ? suggestedStr.split(/[|,]/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
            hidden: String(r[16]).toUpperCase() === 'TRUE',
            createdAt: String(r[17] || '')
          }
        }
      };
    }
  }
  return { ok: false, error: 'not_found' };
}

function saveProductBackend(body) {
  var item = body.item || {};
  var id = String(item.id || '');
  if (!id) return { ok: false, error: 'product_id_required' };

  var name = String(item.name || '');
  var category = String(item.category || 'Contemporary');
  var categoryId = String(item.categoryId || item.category_id || '');
  var composition = String(item.composition || '');
  var width = String(item.width || '44 in');
  var pricePerMetre = Number(item.pricePerMetre ?? item.price_per_metre ?? 0);
  var mrp = item.mrp ? Number(item.mrp) : '';
  var minMetres = Number(item.minMetres ?? item.min_metres ?? 0.5);
  var stock = String(item.stock || 'in');
  var tags = Array.isArray(item.tags) ? item.tags.join('|') : String(item.tags || '');
  var image = String(item.image || '');
  var gallery = Array.isArray(item.gallery) ? item.gallery.join('|') : String(item.gallery || '');
  var blurb = String(item.blurb || '');
  var details = String(item.details || '');
  var suggested = Array.isArray(item.suggestedGarmentIds ?? item.suggested_garment_ids)
    ? (item.suggestedGarmentIds ?? item.suggested_garment_ids).join('|')
    : String(item.suggestedGarmentIds ?? item.suggested_garment_ids ?? '');
  var hidden = Boolean(item.hidden) ? 'TRUE' : 'FALSE';
  var createdAt = String(item.createdAt || new Date().toISOString());

  var rowValues = [
    id, name, category, categoryId, composition, width, pricePerMetre,
    mrp, minMetres, stock, tags, image, gallery, blurb, details,
    suggested, hidden, createdAt
  ];

  var sh = sheet('Catalog');
  var allData = sh.getDataRange().getValues();
  var foundRowIndex = -1;

  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === id) {
      foundRowIndex = i + 1; // 1-indexed row in Google Sheets
      break;
    }
  }

  if (foundRowIndex > 0) {
    // Overwrite the EXACT row matched by unique ID
    sh.getRange(foundRowIndex, 1, 1, 18).setValues([rowValues]);
  } else {
    // Append as a new row
    sh.appendRow(rowValues);
  }

  return {
    ok: true,
    id: id,
    row: foundRowIndex > 0 ? foundRowIndex : sh.getLastRow(),
    action: foundRowIndex > 0 ? 'updated' : 'inserted'
  };
}

// ── Reviews ────────────────────────────────────────────────────────────────────

function getReviews(body) {
  var sh = sheet('Reviews');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, data: [] };
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var status = String(r[7] || 'approved').toLowerCase();
    if (status === 'approved' || status === 'published') {
      list.push({
        id: String(r[0]),
        name: String(r[1]),
        city: String(r[2]),
        rating: Number(r[3]) || 5,
        text: String(r[4]),
        product: String(r[5]),
        date: String(r[6]),
        status: 'published'
      });
    }
  }
  return { ok: true, data: list };
}

function fetchAllReviewsBackend(body) {
  var sh = sheet('Reviews');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, data: [] };
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1] && !r[4]) continue;
    list.push({
      id: String(r[0]),
      name: String(r[1]),
      city: String(r[2] || 'India'),
      rating: Number(r[3]) || 5,
      text: String(r[4] || ''),
      product: String(r[5] || ''),
      date: String(r[6] || ''),
      status: String(r[7] || 'pending').toLowerCase(),
      user_email: String(r[8] || ''),
      created_at: String(r[9] || '')
    });
  }
  return { ok: true, data: list };
}

function submitReview(body) {
  var id = uuid();
  var sh = sheet('Reviews');
  var name = String(body.name || 'Anonymous').trim();
  var text = String(body.text || body.review_text || '').trim();
  if (!text) return { ok: false, error: 'Review text required' };

  var dateStr = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  var rating = Number(body.rating) || 5;
  var city = String(body.city || '').trim();
  var product = String(body.product || '').trim();
  var status = rating >= 4 ? 'pending' : 'private';

  sh.appendRow([id, name, city, rating, text, product, dateStr, status, body.userEmail || '', new Date().toISOString()]);
  return { ok: true, id: id };
}

function setReviewStatusBackend(body) {
  var id = String(body.id || '').trim();
  var status = String(body.status || '').trim().toLowerCase();
  if (!id || !status) return { ok: false, error: 'id and status required' };

  var sh = sheet('Reviews');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: false, error: 'No reviews found' };

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sh.getRange(i + 1, 8).setValue(status);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Review not found: ' + id };
}

function deleteReviewBackend(body) {
  var id = String(body.id || '').trim();
  if (!id) return { ok: false, error: 'id required' };

  var sh = sheet('Reviews');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: false, error: 'No reviews found' };

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Review not found: ' + id };
}

// ── Categories ─────────────────────────────────────────────────────────────────

function getCategoriesBackend(body) {
  var sh = sheet('Categories');
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, data: [] };
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;
    list.push({
      id: String(r[0] || r[2]),
      name: String(r[1]),
      slug: String(r[2]),
      description: String(r[3] || ''),
      active: String(r[4]).toUpperCase() !== 'FALSE'
    });
  }
  return { ok: true, data: list };
}

function saveCategoriesBackend(body) {
  var categories = body.categories || [];
  var sh = sheet('Categories');
  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), 5);
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  var rows = [];
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    rows.push([
      c.id || c.slug,
      c.name,
      c.slug,
      c.description || '',
      c.active === false ? 'FALSE' : 'TRUE'
    ]);
  }
  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return { ok: true, count: rows.length };
}

// ── Settings ───────────────────────────────────────────────────────────────────

function getSettingInternal(key) {
  var sh = sheet('Settings');
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) return String(data[i][1] || '');
  }
  return null;
}

function saveSettingInternal(key, value) {
  var sh = sheet('Settings');
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sh.appendRow([key, value]);
}

function getSettingsBackend(body) {
  var sh = sheet('Settings');
  var data = sh.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]);
    var v = data[i][1];
    if (k) settings[k] = v;
  }
  return { ok: true, data: settings };
}

function saveSettingsBackend(body) {
  var settings = body.settings || {};
  for (var k in settings) {
    saveSettingInternal(k, String(settings[k]));
  }
  return { ok: true };
}

// ── Database Audit & Telemetry ────────────────────────────────────────────────

function auditDatabaseBackend() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();
  var sheetInfo = [];
  var conflictTabs = [];

  for (var i = 0; i < allSheets.length; i++) {
    var s = allSheets[i];
    var sName = s.getName();
    var rowCount = s.getLastRow();
    var colCount = s.getLastColumn();
    sheetInfo.push({ name: sName, rows: rowCount, cols: colCount });

    if (sName.toLowerCase().indexOf('conflict') >= 0) {
      conflictTabs.push({ name: sName, rows: rowCount });
    }
  }

  return {
    ok: true,
    sheets: sheetInfo,
    conflictTabs: conflictTabs,
    conflictCount: conflictTabs.length,
    ordersRawCount: sheet('Orders').getLastRow() - 1,
    catalogRawCount: sheet('Catalog').getLastRow() - 1,
    customersRawCount: sheet('Customers').getLastRow() - 1,
    reviewsRawCount: sheet('Reviews').getLastRow() - 1
  };
}
