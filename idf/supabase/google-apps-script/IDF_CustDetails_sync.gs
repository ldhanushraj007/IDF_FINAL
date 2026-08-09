/**
 * IDF Google Sheets — Full Database & Auth Backend
 * =============================================================================
 * This script is the single database and backend for the entire application.
 * It manages:
 *  - Customers & Wishlist
 *  - Orders & Order Statuses
 *  - Reviews & Curation
 *  - Catalog (Fabrics) & Offer settings
 *  - Secure Admin Authentication (SHA-256 password verification & Session Tokens)
 *  - Secure Customer Email/Password Sign-in & Email OTP Sign-up (via GmailApp)
 *
 * HOW TO INSTALL/UPGRADE:
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Delete all existing code and paste this entire file.
 *   3. Change SHARED_TOKEN to a long random secret (must match VITE_APPS_SCRIPT_TOKEN).
 *   4. Deploy → New Deployment → Type: Web App → Execute as: Me → Access: Anyone.
 *   5. Copy the Web App URL into VITE_APPS_SCRIPT_URL in your .env.local / hosting env.
 *   6. Create a default admin account by running the "seedDefaultAdmin" function
 *      directly inside the Apps Script editor (select function → click Run).
 */

const SHARED_TOKEN = 'idf-change-this-to-something-random-and-secret';

// ─── Sheet Column Definitions ─────────────────────────────────────────────────

const COLUMNS_CUST = [
  'User ID',              // A — Google OAuth sub ID or email key (cust_email)
  'Name',                 // B
  'Phone',                // C
  'Email',                // D
  'City',                 // E
  'Signed Up Via',        // F  google | email
  'Wishlist',             // G — comma-separated product IDs
  'Total Orders',         // H
  'Last Order Code',      // I
  'Last Order Value (₹)', // J
  'Last Order Items',     // K
  'Last Notes',           // L
  'Last Updated',         // M
  'Password Hash',        // N
  'Salt',                 // O
  'Verified',             // P  TRUE / FALSE
];

const COLUMNS_ORDERS = [
  'Order ID',             // A
  'Date/Time',            // B
  'Customer Name',        // C
  'WhatsApp',             // D
  'Fulfilment',           // E  delivery | pickup
  'Address',              // F
  'City',                 // G
  'PIN',                  // H
  'Items',                // I
  'Metres Total',         // J
  'Subtotal (₹)',         // K
  'Discount (₹)',         // L
  'Shipping (₹)',         // M
  'Total (₹)',            // N
  'Payment Method',       // O  upi | later
  'Paid',                 // P  TRUE / FALSE
  'Payment Ref',          // Q
  'Notes',                // R
  'Order Status',         // S  pending_whatsapp | confirmed | fulfilled
  'User ID',              // T
];

const COLUMNS_CATALOG = [
  'ID',                   // A
  'Name',                 // B
  'Category',             // C  Bridal | Heritage | Contemporary
  'Composition',          // D
  'Width',                // E
  'Price Per Metre',      // F
  'MRP',                  // G
  'Min Metres',           // H
  'Stock',                // I  in | low | out
  'Tags',                 // J  pipe-separated
  'Image',                // K
  'Gallery',              // L  pipe-separated
  'Blurb',                // M
  'Details',              // N
  'Updated At',           // O
];

const COLUMNS_SETTINGS = [
  'Key',                  // A
  'Value',                // B
];

const COLUMNS_REVIEWS = [
  'Review ID',            // A
  'User ID',              // B
  'User Email',           // C
  'Name',                 // D
  'City',                 // E
  'Rating',               // F
  'Text',                 // G
  'Status',               // H  pending | published | private
  'Created At',           // I
];

const COLUMNS_ADMINS = [
  'Username',             // A
  'Password Hash',        // B
  'Salt',                 // C
];

const COLUMNS_SESSIONS = [
  'Token',                // A
  'Username',             // B  or email
  'Expires At',           // C
  'Role',                 // D  admin | customer
];

const COLUMNS_OTPS = [
  'Email',                // A
  'OTP Code',             // B
  'Name',                 // C
  'Phone',                // D
  'Password Hash',        // E
  'Salt',                 // F
  'Expires At',           // G
];

// ─── Entry Point (POST Router) ────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Validate the shared webhook secret token
    if (body.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'bad_token' });
    }

    // Public Actions
    switch (body.action) {
      case 'get_catalog':           return getCatalog();
      case 'upsert_customer':       return upsertCustomer(body);
      case 'get_profile':           return getProfile(body);
      case 'save_order':            return saveOrder(body);
      case 'get_my_orders':         return getMyOrders(body);
      case 'toggle_wishlist':       return toggleWishlist(body);
      case 'get_wishlist':          return getWishlist(body);
      case 'admin_login':           return adminLogin(body);
      case 'submit_review':         return submitReview(body);
      case 'get_reviews':           return getReviews();
      
      // Customer custom auth actions
      case 'customer_login':        return customerLogin(body);
      case 'customer_send_otp':     return customerSendOtp(body);
      case 'customer_verify_otp':   return customerVerifyOtp(body);
      case 'customer_session':      return customerSession(body);
    }

    // Protected Admin Actions (Require active session token)
    const adminUser = validateAdminSession(body.adminToken);
    if (!adminUser) {
      return json({ ok: false, error: 'unauthorized_admin' });
    }

    switch (body.action) {
      case 'save_catalog':     return saveCatalog(body);
      case 'fetch_orders':     return fetchOrders();
      case 'set_order_status': return setOrderStatus(body);
      case 'fetch_reviews':    return fetchReviews();
      case 'set_review_status':return setReviewStatus(body);
      case 'delete_review':    return deleteReview(body);
      default:
        return json({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ─── Customer Authentication Logic ───────────────────────────────────────────

function customerSendOtp(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '');

  if (!email || !name || !phone || !password) {
    return json({ ok: false, error: 'All fields are required.' });
  }

  // Check if user already exists
  const custSheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const rowIdx = findRowByColumn(custSheet, 4, email); // Check Email column
  if (rowIdx > 0) {
    const row = custSheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
    if (row[15] === 'TRUE' || row[15] === true) {
      return json({ ok: false, error: 'Account with this email already exists.' });
    }
  }

  // Generate 6-digit OTP
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const salt = String(Math.floor(Math.random() * 1000000));
  const passHash = hashPassword(password, salt);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

  const otpSheet = getOrCreateSheet('IDF_CustOTPs', COLUMNS_OTPS);
  
  // Clean old OTPs for this email
  const existingOtpIdx = findRowByColumn(otpSheet, 1, email);
  if (existingOtpIdx > 0) {
    otpSheet.deleteRow(existingOtpIdx);
  }

  otpSheet.appendRow([email, otpCode, name, phone, passHash, salt, expiresAt]);

  // Send Email with OTP
  try {
    const subject = `Verify your Email — In Design Luxury Fabrics`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px border #f0f0f0; border-radius: 4px;">
        <h2 style="color: #1c0505; font-family: serif; text-align: center;">In Design Luxury Fabrics</h2>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>Hello ${name},</p>
        <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #fcf8f5; border: 1px dashed #dec3b4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1c0505; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="color: #666; font-size: 12px;">This code will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 11px;">Bengaluru, Commercial Street</p>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Failed to send OTP email: ' + String(err) });
  }
}

function customerVerifyOtp(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();

  if (!email || !code) {
    return json({ ok: false, error: 'Email and verification code are required.' });
  }

  const otpSheet = getOrCreateSheet('IDF_CustOTPs', COLUMNS_OTPS);
  const rowIdx = findRowByColumn(otpSheet, 1, email);
  if (rowIdx < 0) {
    return json({ ok: false, error: 'No signup session found. Please sign up again.' });
  }

  const otpRow = otpSheet.getRange(rowIdx, 1, 1, COLUMNS_OTPS.length).getValues()[0];
  const storedCode = String(otpRow[1]).trim();
  const expiresAt = new Date(otpRow[6]);

  if (expiresAt.getTime() < Date.now()) {
    otpSheet.deleteRow(rowIdx);
    return json({ ok: false, error: 'Verification code has expired. Please sign up again.' });
  }

  if (code !== storedCode) {
    return json({ ok: false, error: 'Incorrect verification code. Please try again.' });
  }

  // OTP matches! Create customer account
  const name = otpRow[2];
  const phone = otpRow[3];
  const passHash = otpRow[4];
  const salt = otpRow[5];

  // Remove OTP row
  otpSheet.deleteRow(rowIdx);

  const custSheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const existingCustRow = findRowByColumn(custSheet, 4, email);
  
  const userId = 'cust_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  if (existingCustRow > 0) {
    // Update existing unverified account
    custSheet.getRange(existingCustRow, 1, 1, COLUMNS_CUST.length).setValues([[
      userId, name, phone, email, '', 'email', '', 0, '', '', '', '', now, passHash, salt, 'TRUE'
    ]]);
  } else {
    // Append new customer
    custSheet.appendRow([
      userId, name, phone, email, '', 'email', '', 0, '', '', '', '', now, passHash, salt, 'TRUE'
    ]);
  }

  // Create session
  const token = 'token_cust_' + Utilities.getUuid().replace(/-/g, '');
  const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const sessionSheet = getOrCreateSheet('IDF_Sessions', COLUMNS_SESSIONS);
  sessionSheet.appendRow([token, email, sessionExpires, 'customer']);

  return json({
    ok: true,
    token: token,
    user: { id: userId, email: email, name: name }
  });
}

function customerLogin(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return json({ ok: false, error: 'Email and password are required.' });
  }

  const custSheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const rowIdx = findRowByColumn(custSheet, 4, email);
  if (rowIdx < 0) {
    return json({ ok: false, error: 'Incorrect email or password.' });
  }

  const row = custSheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
  if (row[15] !== 'TRUE' && row[15] !== true) {
    return json({ ok: false, error: 'Account is not verified. Please register again.' });
  }

  const storedHash = row[13];
  const salt = row[14];
  const inputHash = hashPassword(password, salt);

  if (inputHash !== storedHash) {
    return json({ ok: false, error: 'Incorrect email or password.' });
  }

  // Successful Login — Create Session
  const token = 'token_cust_' + Utilities.getUuid().replace(/-/g, '');
  const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const sessionSheet = getOrCreateSheet('IDF_Sessions', COLUMNS_SESSIONS);
  sessionSheet.appendRow([token, email, sessionExpires, 'customer']);

  return json({
    ok: true,
    token: token,
    user: { id: row[0], email: row[3], name: row[1] }
  });
}

function customerSession(body) {
  const token = String(body.customerToken || '');
  if (!token) return json({ ok: false, error: 'Token required' });

  const sessionSheet = getOrCreateSheet('IDF_Sessions', COLUMNS_SESSIONS);
  const sRowIdx = findRowByColumn(sessionSheet, 1, token);
  if (sRowIdx < 0) return json({ ok: false, error: 'Invalid session' });

  const session = sessionSheet.getRange(sRowIdx, 1, 1, COLUMNS_SESSIONS.length).getValues()[0];
  const expiresAt = new Date(session[2]);
  if (expiresAt.getTime() < Date.now()) {
    sessionSheet.deleteRow(sRowIdx);
    return json({ ok: false, error: 'Session expired' });
  }

  const email = session[1];
  const custSheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const cRowIdx = findRowByColumn(custSheet, 4, email);
  if (cRowIdx < 0) return json({ ok: false, error: 'User not found' });

  const cust = custSheet.getRange(cRowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];

  return json({
    ok: true,
    user: {
      id: cust[0],
      email: cust[3],
      name: cust[1],
    }
  });
}

// ─── Admin Authentication & Sessions ──────────────────────────────────────────

/**
 * Seeds a default admin account in the Google Sheet.
 * Select this function in the Google Apps Script toolbar and click "Run".
 * Default: admin / admin123
 */
function seedDefaultAdmin() {
  const sheet = getOrCreateSheet('IDF_Admins', COLUMNS_ADMINS);
  const username = 'admin@gmail.com';
  const password = 'admin123';
  
  const salt = String(Math.floor(Math.random() * 1000000));
  const hash = hashPassword(password, salt);
  
  // Clear and rewrite default row
  const rowIdx = findRowByColumn(sheet, 1, username);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, 3).setValues([[username, hash, salt]]);
  } else {
    sheet.appendRow([username, hash, salt]);
  }
  Logger.log('Admin account seeded successfully: ' + username);
}

function hashPassword(password, salt) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  let hashStr = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteString = byteVal.toString(16);
    if (byteString.length == 1) byteString = '0' + byteString;
    hashStr += byteString;
  }
  return hashStr;
}

function adminLogin(body) {
  const sheet = getOrCreateSheet('IDF_Admins', COLUMNS_ADMINS);
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  const rowIdx = findRowByColumn(sheet, 1, username);
  if (rowIdx < 0) return json({ ok: false, error: 'Invalid username or password.' });

  const adminRow = sheet.getRange(rowIdx, 1, 1, 3).getValues()[0];
  const storedHash = adminRow[1];
  const salt = adminRow[2];

  const inputHash = hashPassword(password, salt);
  if (inputHash !== storedHash) {
    return json({ ok: false, error: 'Invalid username or password.' });
  }

  // Create active session
  const token = 'token_' + Utilities.getUuid().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours
  const sessionSheet = getOrCreateSheet('IDF_Sessions', COLUMNS_SESSIONS);
  sessionSheet.appendRow([token, username, expiresAt, 'admin']);

  return json({ ok: true, token: token });
}

function validateAdminSession(token) {
  if (!token) return null;
  const sheet = getOrCreateSheet('IDF_Sessions', COLUMNS_SESSIONS);
  const rowIdx = findRowByColumn(sheet, 1, token);
  if (rowIdx < 0) return null;

  const sessionRow = sheet.getRange(rowIdx, 1, 1, 4).getValues()[0];
  const expiresAt = new Date(sessionRow[2]);
  if (expiresAt.getTime() < Date.now()) {
    // Expired — delete session row
    sheet.deleteRow(rowIdx);
    return null;
  }
  if (sessionRow[3] !== 'admin') return null;
  return sessionRow[1]; // Return admin username
}

// ─── Catalog Read/Write Actions ───────────────────────────────────────────────

function getCatalog() {
  const catSheet = getOrCreateSheet('IDF_Catalog', COLUMNS_CATALOG);
  const setSheet = getOrCreateSheet('IDF_Settings', COLUMNS_SETTINGS);

  // Load items
  const lastRow = catSheet.getLastRow();
  const items = [];
  if (lastRow > 1) {
    const rawItems = catSheet.getRange(2, 1, lastRow - 1, COLUMNS_CATALOG.length).getValues();
    rawItems.forEach(function(row) {
      items.push({
        id:            String(row[0]),
        name:          String(row[1]),
        category:      String(row[2]),
        composition:   String(row[3]),
        width:         String(row[4]),
        pricePerMetre: Number(row[5]),
        mrp:           row[6] ? Number(row[6]) : undefined,
        minMetres:     Number(row[7]) || 1,
        stock:         String(row[8]),
        tags:          String(row[9]).split('|').filter(Boolean),
        image:         String(row[10]),
        gallery:       row[11] ? String(row[11]).split('|').filter(Boolean) : undefined,
        blurb:         String(row[12]),
        details:       row[13] ? String(row[13]) : undefined,
      });
    });
  }

  // Load offer settings
  const settings = {};
  const setLastRow = setSheet.getLastRow();
  if (setLastRow > 1) {
    const rawSettings = setSheet.getRange(2, 1, setLastRow - 1, 2).getValues();
    rawSettings.forEach(function(r) {
      settings[r[0]] = r[1];
    });
  }

  const offer = {
    active:   settings['offer_active'] === 'true' || settings['offer_active'] === true,
    headline: settings['offer_headline'] || '',
    detail:   settings['offer_detail'] || '',
  };

  return json({
    ok: true,
    data: {
      items: items,
      offer: offer,
      updatedAt: settings['updated_at'] || new Date().toISOString(),
    }
  });
}

function saveCatalog(body) {
  const catSheet = getOrCreateSheet('IDF_Catalog', COLUMNS_CATALOG);
  const setSheet = getOrCreateSheet('IDF_Settings', COLUMNS_SETTINGS);

  // 1. Overwrite catalog items
  // Clear existing items (keep header)
  const lastRow = catSheet.getLastRow();
  if (lastRow > 1) {
    catSheet.deleteRows(2, lastRow - 1);
  }

  const items = body.items || [];
  const now = new Date().toISOString();
  items.forEach(function(i) {
    catSheet.appendRow([
      i.id,
      i.name,
      i.category,
      i.composition || '',
      i.width || '44 in',
      i.price_per_metre || i.pricePerMetre,
      i.mrp || '',
      i.min_metres || i.minMetres || 1,
      i.stock || 'in',
      Array.isArray(i.tags) ? i.tags.join('|') : String(i.tags || ''),
      i.image || '',
      Array.isArray(i.gallery) ? i.gallery.join('|') : String(i.gallery || ''),
      i.blurb || '',
      i.details || '',
      now,
    ]);
  });

  // 2. Save settings
  const offer = body.offer || {};
  const settings = {
    'offer_active':   offer.active ? 'true' : 'false',
    'offer_headline': offer.headline || '',
    'offer_detail':   offer.detail || '',
    'updated_at':     now,
  };

  Object.keys(settings).forEach(function(key) {
    const rowIdx = findRowByColumn(setSheet, 1, key);
    if (rowIdx > 0) {
      setSheet.getRange(rowIdx, 2).setValue(settings[key]);
    } else {
      setSheet.appendRow([key, settings[key]]);
    }
  });

  return json({ ok: true });
}

// ─── Reviews & Curation Actions ───────────────────────────────────────────────

function getReviews() {
  const sheet = getOrCreateSheet('IDF_Reviews', COLUMNS_REVIEWS);
  const lastRow = sheet.getLastRow();
  const reviews = [];
  if (lastRow > 1) {
    const raw = sheet.getRange(2, 1, lastRow - 1, COLUMNS_REVIEWS.length).getValues();
    raw.forEach(function(row) {
      if (row[7] === 'published') {
        reviews.push({
          name:   String(row[3]),
          city:   String(row[4]),
          rating: Number(row[5]),
          text:   String(row[6]),
          date:   new Date(row[8]).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        });
      }
    });
  }
  return json({ ok: true, data: reviews });
}

function submitReview(body) {
  const sheet = getOrCreateSheet('IDF_Reviews', COLUMNS_REVIEWS);
  const reviewId = 'rev_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
  const isPositive = Number(body.rating) >= 4;
  sheet.appendRow([
    reviewId,
    body.userId || '',
    body.userEmail || '',
    body.name || 'Anonymous',
    body.city || '',
    Number(body.rating) || 5,
    body.text || '',
    isPositive ? 'pending' : 'private',
    new Date().toISOString(),
  ]);
  return json({ ok: true, status: isPositive ? 'pending' : 'private' });
}

function fetchReviews() {
  const sheet = getOrCreateSheet('IDF_Reviews', COLUMNS_REVIEWS);
  const lastRow = sheet.getLastRow();
  const reviews = [];
  if (lastRow > 1) {
    const raw = sheet.getRange(2, 1, lastRow - 1, COLUMNS_REVIEWS.length).getValues();
    raw.forEach(function(row) {
      reviews.push({
        id:        String(row[0]),
        user_id:   String(row[1]),
        user_email:String(row[2]),
        name:      String(row[3]),
        city:      String(row[4]),
        rating:    Number(row[5]),
        review_text: String(row[6]),
        status:    String(row[7]),
        created_at:String(row[8]),
      });
    });
  }
  return json({ ok: true, data: reviews });
}

function setReviewStatus(body) {
  const sheet = getOrCreateSheet('IDF_Reviews', COLUMNS_REVIEWS);
  const rowIdx = findRowByColumn(sheet, 1, body.id);
  if (rowIdx < 0) return json({ ok: false, error: 'review_not_found' });

  sheet.getRange(rowIdx, 8).setValue(body.status); // Column H = Status
  return json({ ok: true });
}

function deleteReview(body) {
  const sheet = getOrCreateSheet('IDF_Reviews', COLUMNS_REVIEWS);
  const rowIdx = findRowByColumn(sheet, 1, body.id);
  if (rowIdx < 0) return json({ ok: false, error: 'review_not_found' });

  sheet.deleteRow(rowIdx);
  return json({ ok: true });
}

// ─── Customer Profile Actions ─────────────────────────────────────────────────

function upsertCustomer(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  if (!userId) return json({ ok: false, error: 'userId required' });

  const rowIdx = findRowByColumn(sheet, 1, userId);
  const now = new Date().toISOString();

  if (rowIdx > 0) {
    const existing = sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
    const merged = [
      userId,
      body.name  !== undefined ? body.name  : existing[1],
      body.phone !== undefined ? body.phone : existing[2],
      body.userEmail || existing[3],
      body.city  !== undefined ? body.city  : existing[4],
      body.signupMethod || existing[5],
      existing[6],
      existing[7],
      existing[8],
      existing[9],
      existing[10],
      existing[11],
      now,
      existing[13] || '',
      existing[14] || '',
      existing[15] !== undefined ? existing[15] : 'TRUE',
    ];
    sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).setValues([merged]);
  } else {
    sheet.appendRow([
      userId,
      body.name || '',
      body.phone || '',
      body.userEmail || '',
      body.city || '',
      body.signupMethod || 'google',
      '',
      0,
      '', '', '', '',
      now,
      '', '', 'TRUE'
    ]);
  }
  return json({ ok: true });
}

function getProfile(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  const rowIdx = findRowByColumn(sheet, 1, userId);
  if (rowIdx < 0) return json({ ok: true, data: null });

  const row = sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
  return json({
    ok: true,
    data: {
      name:         String(row[1]),
      phone:        String(row[2]),
      email:        String(row[3]),
      city:         String(row[4]),
      signup_method: String(row[5]),
    },
  });
}

// ─── Orders Actions ───────────────────────────────────────────────────────────

function saveOrder(body) {
  const o = body.order || {};
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);

  if (o.orderCode && findRowByColumn(sheet, 1, o.orderCode) > 0) {
    return json({ ok: true, note: 'duplicate_order_skipped' });
  }

  const itemsStr = Array.isArray(o.items)
    ? o.items.map(function(i) { return i.name + ' ×' + i.metres + 'm'; }).join(', ')
    : String(o.items || '');

  const totalMetres = Array.isArray(o.items)
    ? o.items.reduce(function(s, i) { return s + (Number(i.metres) || 0); }, 0)
    : 0;

  sheet.appendRow([
    o.orderCode || '',
    new Date().toISOString(),
    o.customerName || '',
    o.phone || '',
    o.fulfilment || 'delivery',
    o.address || '',
    o.city || '',
    o.pincode || '',
    itemsStr,
    totalMetres,
    o.subtotal || 0,
    o.discount || 0,
    o.shipping || 0,
    o.total || 0,
    o.paymentMethod || 'later',
    o.paid ? 'TRUE' : 'FALSE',
    o.paymentReference || '',
    o.notes || '',
    'pending_whatsapp',
    body.userId || '',
  ]);

  _bumpCustomerAfterOrder(body.userId, body.userEmail, o, itemsStr);
  return json({ ok: true });
}

function _bumpCustomerAfterOrder(userId, userEmail, o, itemsStr) {
  try {
    const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
    const rowIdx = findRowByColumn(sheet, 1, userId);
    if (rowIdx < 0) return;
    const existing = sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
    const prevTotal = Number(existing[7]) || 0;
    sheet.getRange(rowIdx, 8, 1, 5).setValues([[
      prevTotal + 1,
      o.orderCode || '',
      o.total || 0,
      itemsStr,
      o.notes || '',
    ]]);
    sheet.getRange(rowIdx, 13).setValue(new Date().toISOString());
  } catch(_) {}
}

function getMyOrders(body) {
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);
  const userId = String(body.userId || '').trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return json({ ok: true, data: [] });

  const all = sheet.getRange(2, 1, lastRow - 1, COLUMNS_ORDERS.length).getValues();
  const rows = all
    .filter(function(r) { return String(r[19]).trim() === userId; })
    .map(function(r) {
      return {
        orderCode:   String(r[0]),
        createdAt:   String(r[1]),
        itemNames:   String(r[8]),
        total:       Number(r[13]),
        paid:        r[15] === 'TRUE' || r[15] === true,
        status:      String(r[18]),
      };
    });

  return json({ ok: true, data: rows });
}

function fetchOrders() {
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);
  const lastRow = sheet.getLastRow();
  const orders = [];
  if (lastRow > 1) {
    const raw = sheet.getRange(2, 1, lastRow - 1, COLUMNS_ORDERS.length).getValues();
    raw.forEach(function(row) {
      const itemsList = String(row[8]).split(',').map(function(txt) {
        return { item: { name: txt.split(' ×')[0].trim() }, metres: Number(txt.split(' ×')[1]?.replace('m','') || 0) };
      });
      orders.push({
        id:                String(row[0]),
        order_code:        String(row[0]),
        items:             itemsList,
        subtotal:          Number(row[10]),
        discount:          Number(row[11]),
        shipping:          Number(row[12]),
        total:             Number(row[13]),
        requirement:       String(row[17]),
        fulfilment:        String(row[4]),
        address:           String(row[5]),
        city:              String(row[6]),
        pincode:           String(row[7]),
        payment_method:    String(row[14]),
        paid:              row[15] === 'TRUE' || row[15] === true,
        payment_reference: String(row[16]),
        payment_status:    (row[15] === 'TRUE' || row[15] === true) ? 'paid' : 'pending',
        order_status:      String(row[18]),
        created_at:        String(row[1]),
        customers:         { name: String(row[2]), phone: String(row[3]), email: '' },
      });
    });
  }
  return json({ ok: true, data: orders });
}

function setOrderStatus(body) {
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);
  const rowIdx = findRowByColumn(sheet, 1, body.id);
  if (rowIdx < 0) return json({ ok: false, error: 'order_not_found' });

  if (body.order_status) {
    sheet.getRange(rowIdx, 19).setValue(body.order_status); // Column S = Order Status
  }
  if (body.payment_status) {
    sheet.getRange(rowIdx, 16).setValue(body.payment_status === 'paid' ? 'TRUE' : 'FALSE'); // Column P = Paid
  }
  return json({ ok: true });
}

// ─── Wishlist Actions ─────────────────────────────────────────────────────────

function toggleWishlist(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  const productId = String(body.productId || '').trim();
  const rowIdx = findRowByColumn(sheet, 1, userId);
  if (rowIdx < 0) return json({ ok: false, error: 'customer_not_found' });

  const cell = sheet.getRange(rowIdx, 7);
  const raw = String(cell.getValue() || '');
  const ids = raw ? raw.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];

  const idx = ids.indexOf(productId);
  if (body.on && idx === -1) {
    ids.push(productId);
  } else if (!body.on && idx !== -1) {
    ids.splice(idx, 1);
  }
  cell.setValue(ids.join(','));
  return json({ ok: true });
}

function getWishlist(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  const rowIdx = findRowByColumn(sheet, 1, userId);
  if (rowIdx < 0) return json({ ok: true, data: [] });

  const raw = String(sheet.getRange(rowIdx, 7).getValue() || '');
  const ids = raw ? raw.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
  return json({ ok: true, data: ids });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// If your script is standalone, paste your Google Sheet URL's ID here:
// e.g. https://docs.google.com/spreadsheets/d/12345abcde/edit -> ID is '12345abcde'
const SCRIPT_SPREADSHEET_ID = '1ZZBE4ZpElNaU1f3XkRUV4o6I6xBR73euom5GHJqixHc'; 

function getOrCreateSheet(sheetName, columns) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss && SCRIPT_SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SCRIPT_SPREADSHEET_ID);
  }
  if (!ss) {
    throw new Error("Spreadsheet not found. Please paste your Google Sheet's ID into the SCRIPT_SPREADSHEET_ID variable at the bottom of the script.");
  }
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  const firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell !== columns[0]) {
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight('bold')
      .setBackground('#1c0505')
      .setFontColor('#dec3b4');
    sheet.setFrozenRows(1);
    for (let c = 1; c <= columns.length; c++) sheet.autoResizeColumn(c);
  }
  return sheet;
}

function findRowByColumn(sheet, colIndex, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(value).trim()) return i + 2;
  }
  return -1;
}
