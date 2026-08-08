/**
 * IDF Google Sheets — Primary Data Store
 * =============================================================================
 * This script IS the database for orders, customers, and wishlists.
 * Supabase is used for Auth only. All data writes/reads go through doPost().
 *
 * DEPLOY AS WEB APP:
 *   Extensions → Apps Script → Deploy → New Deployment
 *   Type: Web App
 *   Execute as: Me
 *   Who has access: Anyone
 *   → Copy the Web App URL into VITE_APPS_SCRIPT_URL in .env.local
 *
 * SECURITY:
 *   Requests must include { token: SHARED_TOKEN } in the JSON body.
 *   Also pass { userId, userEmail } — the script trusts these because
 *   only a signed-in user (validated by Supabase Auth on the client)
 *   will know their own Supabase user ID. Keep SHARED_TOKEN secret.
 *   Change SHARED_TOKEN below to any long random string.
 */

const SHARED_TOKEN = 'idf-change-this-to-something-random-and-secret';

// ─── Sheet column layouts ─────────────────────────────────────────────────────

const COLUMNS_CUST = [
  'User ID',         // A — Supabase auth.users id (never changes)
  'Name',            // B
  'Phone',           // C
  'Email',           // D
  'City',            // E
  'Signed Up Via',   // F
  'Wishlist',        // G — comma-separated product IDs
  'Total Orders',    // H
  'Last Order Code', // I
  'Last Order Value (₹)', // J
  'Last Order Items',    // K
  'Last Notes',      // L
  'Last Updated',    // M
];

const COLUMNS_ORDERS = [
  'Order ID',            // A
  'Date/Time',           // B
  'Customer Name',       // C
  'WhatsApp',            // D
  'Fulfilment',          // E  delivery | pickup
  'Address',             // F
  'City',                // G
  'PIN',                 // H
  'Items',               // I
  'Metres Total',        // J
  'Subtotal (₹)',        // K
  'Discount (₹)',        // L
  'Shipping (₹)',        // M
  'Total (₹)',           // N
  'Payment Method',      // O  upi | later
  'Paid',                // P  TRUE / FALSE
  'Payment Ref',         // Q
  'Notes',               // R
  'Order Status',        // S  pending_whatsapp | confirmed | fulfilled
  'User ID',             // T
];

// ─── Router ──────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'bad_token' });
    }

    switch (body.action) {
      case 'upsert_customer': return upsertCustomer(body);
      case 'get_profile':     return getProfile(body);
      case 'save_order':      return saveOrder(body);
      case 'get_my_orders':   return getMyOrders(body);
      case 'toggle_wishlist': return toggleWishlist(body);
      case 'get_wishlist':    return getWishlist(body);
      default:
        return json({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * Upsert a customer row (create on first sign-in, update on profile save).
 * Body: { userId, userEmail, name?, phone?, city?, signupMethod? }
 */
function upsertCustomer(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  if (!userId) return json({ ok: false, error: 'userId required' });

  const rowIdx = findRowByColumn(sheet, 1, userId); // Column A = User ID
  const now = new Date().toISOString();

  if (rowIdx > 0) {
    // Partial update — only overwrite non-empty fields.
    const existing = sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
    const merged = [
      userId,
      body.name  !== undefined ? body.name  : existing[1],
      body.phone !== undefined ? body.phone : existing[2],
      body.userEmail || existing[3],
      body.city  !== undefined ? body.city  : existing[4],
      body.signupMethod || existing[5],
      existing[6], // wishlist — don't touch here
      existing[7], // totalOrders
      existing[8], // lastOrderCode
      existing[9], // lastOrderValue
      existing[10], // lastOrderItems
      existing[11], // lastNotes
      now,
    ];
    sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).setValues([merged]);
  } else {
    sheet.appendRow([
      userId,
      body.name || '',
      body.phone || '',
      body.userEmail || '',
      body.city || '',
      body.signupMethod || '',
      '', // wishlist
      0,  // totalOrders
      '', '', '', '',
      now,
    ]);
  }
  return json({ ok: true });
}

/**
 * Read a single customer profile row.
 * Body: { userId }
 */
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

/**
 * Append a new order row. Also bumps the customer's order count/totals.
 * Body: { userId, userEmail, order: { ...all order fields } }
 */
function saveOrder(body) {
  const o = body.order || {};
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);

  // Check for duplicate order ID
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

  // Update customer summary
  _bumpCustomerAfterOrder(body.userId, body.userEmail, o, itemsStr);

  return json({ ok: true });
}

function _bumpCustomerAfterOrder(userId, userEmail, o, itemsStr) {
  try {
    const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
    const rowIdx = findRowByColumn(sheet, 1, userId);
    if (rowIdx < 0) return; // profile row may not exist yet — that's fine
    const existing = sheet.getRange(rowIdx, 1, 1, COLUMNS_CUST.length).getValues()[0];
    const prevTotal = Number(existing[7]) || 0;
    sheet.getRange(rowIdx, 8, 1, 6).setValues([[
      prevTotal + 1,
      o.orderCode || '',
      o.total || 0,
      itemsStr,
      o.notes || '',
    ]]); // cols H–M (5 cols)
    sheet.getRange(rowIdx, 13).setValue(new Date().toISOString()); // M = Last Updated
  } catch(_) {}
}

/**
 * Return all orders for a given userId.
 * Body: { userId }
 */
function getMyOrders(body) {
  const sheet = getOrCreateSheet('IDF_Orders', COLUMNS_ORDERS);
  const userId = String(body.userId || '').trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return json({ ok: true, data: [] });

  // Column T (index 19) = User ID
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

/**
 * Add or remove a product from the customer's wishlist column (G).
 * Body: { userId, productId, on: boolean }
 */
function toggleWishlist(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  const productId = String(body.productId || '').trim();
  const rowIdx = findRowByColumn(sheet, 1, userId);
  if (rowIdx < 0) return json({ ok: false, error: 'customer_not_found' });

  const cell = sheet.getRange(rowIdx, 7); // Column G = Wishlist
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

/**
 * Return the set of wishlist product IDs for a user.
 * Body: { userId }
 */
function getWishlist(body) {
  const sheet = getOrCreateSheet('IDF_CustDetails', COLUMNS_CUST);
  const userId = String(body.userId || '').trim();
  const rowIdx = findRowByColumn(sheet, 1, userId);
  if (rowIdx < 0) return json({ ok: true, data: [] });

  const raw = String(sheet.getRange(rowIdx, 7).getValue() || '');
  const ids = raw ? raw.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
  return json({ ok: true, data: ids });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(sheetName, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
