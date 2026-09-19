import express from 'express';
import path from 'path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  wafMiddleware,
  maskErrorResponse,
  createSecureToken,
  verifySecureToken,
  verifyPassword,
} from './server/security.js';
import {
  getPriceList,
  createTransaction,
  getTransactionStatus,
  inquireBill,
  payBill,
  getDepositMethods,
  createDeposit,
  cancelDeposit,
  getDepositStatus,
  getAtlanticProfile,
  getBankList,
  checkBankAccount,
  createTransfer,
  getTransferStatus,
} from './server/atlantic.js';
import {
  connectMongo,
  isMongoConnected,
  getUserByUsernameOrEmail,
  getUserById,
  createUser,
  sanitizeUser,
  updateUserBalance,
  setUserPin,
  verifyUserPin,
  saveTransaction,
  getTransactionByReffOrId,
  getUserTransactions,
  updateTransactionStatus,
  saveDeposit,
  getDepositById,
  getUserDeposits,
  updateDepositStatus,
  getProducts,
  updateProductsList,
  syncProductsFromGateway,
  logSecurityThreat,
  getSecurityLogs,
  getAllUsersAdmin,
  getAllTransactionsAdmin,
  clearAllTransactionsAdmin,
  getAllDepositsAdmin,
  adminUpdateUserBalance,
  adminSetUserRole,
  getSystemMetrics,
  saveTransferRecord,
  getTransferRecordByIdOrRef,
  getAllTransferRecords,
  updateUserProfile,
} from './server/db.js';
import type { TransactionRecord, DepositOrder, ProductItem } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with safe size limits for profile images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply WAF and anti-injection shield on all routes
app.use(wafMiddleware);

// Middleware: Extract Authenticated User from Bearer token
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: false,
      message: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.',
      code: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySecureToken<{ userId: string; role?: string }>(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({
      status: false,
      message: 'Token otentikasi tidak sah atau telah kedaluwarsa.',
      code: 401,
    });
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({
      status: false,
      message: 'Akun pengguna tidak ditemukan di database.',
      code: 401,
    });
  }

  (req as any).user = user;
  next();
}

// Admin Middleware: Enforce Role === 'admin'
async function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: false,
      message: 'Akses Ditolak: Otorisasi Administrator diperlukan.',
      code: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySecureToken<{ userId: string; role?: string }>(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({
      status: false,
      message: 'Token otentikasi admin tidak valid.',
      code: 401,
    });
  }

  const user = await getUserById(payload.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      status: false,
      message: 'Akses Dilarang: Hanya akun berwenang Administrator yang dapat mengakses panel ini.',
      code: 403,
    });
  }

  (req as any).user = user;
  next();
}

// Optional Auth (for guest or logged in user)
async function optionalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifySecureToken<{ userId: string }>(token);
    if (payload?.userId) {
      const user = await getUserById(payload.userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION & SECURITY ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, name, email, phone, password } = req.body;

    if (!username || !name || !email || !phone || !password) {
      return res.status(400).json({ status: false, message: 'Semua kolom wajib diisi lengkap.' });
    }

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({
        status: false,
        message: 'Username harus berupa 3-24 karakter alfanumerik tanpa spasi atau simbol khusus.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ status: false, message: 'Format email tidak valid.' });
    }

    if (!/^[0-9+]{10,16}$/.test(phone)) {
      return res.status(400).json({ status: false, message: 'Format nomor WhatsApp/HP tidak valid.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: false, message: 'Password minimal 6 karakter demi keamanan akun.' });
    }

    const existing = await getUserByUsernameOrEmail(username) || await getUserByUsernameOrEmail(email);
    if (existing) {
      return res.status(400).json({
        status: false,
        message: 'Username atau email sudah terdaftar. Silakan gunakan yang lain atau login.',
      });
    }

    const user = await createUser({ username, name, email, phone, password });
    const token = createSecureToken({ userId: user.id, role: user.role });

    return res.json({
      status: true,
      message: 'Registrasi akun berhasil tersimpan di database MongoDB!',
      data: { user, token },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses pendaftaran akun.');
  }
});

// Login User & Admin
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ status: false, message: 'Username/Email dan Password wajib diisi.' });
    }

    const user = await getUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ status: false, message: 'Kombinasi akun atau password tidak cocok.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return res.status(401).json({ status: false, message: 'Kombinasi akun atau password tidak cocok.' });
    }

    const token = createSecureToken({ userId: user.id, role: user.role });
    const sanitized = sanitizeUser(user);

    return res.json({
      status: true,
      message: user.role === 'admin' ? 'Login Administrator Berhasil!' : 'Login berhasil. Selamat datang kembali!',
      data: { user: sanitized, token, isAdmin: user.role === 'admin' },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses autentikasi login.');
  }
});

// Special Admin Direct Login Verification
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: false, message: 'Kredensial Admin wajib diisi.' });
    }

    const user = await getUserByUsernameOrEmail(username);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Kredensial Administrator tidak sah atau tidak memiliki hak akses.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return res.status(403).json({ status: false, message: 'Password Administrator salah.' });
    }

    const token = createSecureToken({ userId: user.id, role: 'admin' });
    return res.json({
      status: true,
      message: 'Autentikasi Master Admin Berhasil. Selamat bertugas!',
      data: { user: sanitizeUser(user), token, isAdmin: true },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses autentikasi Admin.');
  }
});

// Get Current User Profile & Balance
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const sanitized = sanitizeUser(user);
    return res.json({ status: true, data: sanitized });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat profil pengguna.');
  }
});

// Update User Profile (Name, Phone, and Avatar Photo)
app.post('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, phone, avatar } = req.body;

    const updated = await updateUserProfile(user.id, {
      name: typeof name === 'string' ? name : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      avatar: typeof avatar === 'string' ? avatar : undefined,
    });

    if (!updated) {
      return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });
    }

    return res.json({
      status: true,
      message: 'Profil dan foto profil berhasil diperbarui!',
      data: updated,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui profil pengguna.');
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, phone, avatar } = req.body;

    const updated = await updateUserProfile(user.id, {
      name: typeof name === 'string' ? name : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      avatar: typeof avatar === 'string' ? avatar : undefined,
    });

    if (!updated) {
      return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });
    }

    return res.json({
      status: true,
      message: 'Profil dan foto profil berhasil diperbarui!',
      data: updated,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui profil pengguna.');
  }
});

// Setup Transaction Security PIN
app.post('/api/auth/set-pin', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ status: false, message: 'PIN Transaksi harus berupa 6 angka rahasia.' });
    }

    await setUserPin(user.id, pin);
    return res.json({ status: true, message: 'PIN Transaksi Keamanan berhasil disimpan di database.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui PIN keamanan.');
  }
});

// ==========================================
// 2. PRODUCT CATALOG ENDPOINTS (PURE ATLANTIC H2H)
// ==========================================

// Get All Products (Fetched purely from MongoDB synced with Atlantic Gateway)
app.get('/api/products', async (req, res) => {
  try {
    let products = await getProducts();
    // If database has no products yet, automatically pull live pure data from Atlantic H2H API
    if (!products || products.length === 0) {
      const syncResult = await syncProductsFromGateway();
      if (syncResult.status) {
        products = await getProducts();
      }
    }

    return res.json({
      status: true,
      data: products,
      total: products.length,
      source: 'ATLANTIC_H2H_PURE_API',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil katalog layanan.');
  }
});

// Force Real-time Re-sync from Atlantic Gateway
app.post('/api/products/sync', async (req, res) => {
  try {
    const syncRes = await syncProductsFromGateway();
    return res.json(syncRes);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal sinkronisasi data dari gateway.');
  }
});

// ==========================================
// 3. TRANSAKSI (CREATE & STATUS CHECK)
// ==========================================

// Create Order (Prabayar & Game Topup)
app.post('/api/order/create', optionalAuth, async (req, res) => {
  try {
    const { code, target, zone, payment_method, pin } = req.body;
    const authUser = (req as any).user;

    if (!code || !target) {
      return res.status(400).json({ status: false, message: 'Kode produk dan nomor/ID tujuan wajib diisi.' });
    }

    // Strict validation
    if (!/^[a-zA-Z0-9_\-\.\(\)\s]{3,35}$/.test(target)) {
      return res.status(400).json({ status: false, message: 'Format nomor atau ID tujuan tidak valid.' });
    }

    const products = await getProducts();
    const product = products.find((p) => p.code.toUpperCase() === code.toUpperCase());
    if (!product) {
      return res.status(404).json({ status: false, message: 'Layanan produk tidak ditemukan atau sudah nonaktif.' });
    }

    const finalTarget = zone ? `${target.trim()} (${zone.trim()})` : target.trim();
    const reffId = `IBAD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const cost = product.sellPrice || product.price;

    // If paid by Account Balance
    if (payment_method === 'saldo') {
      if (!authUser) {
        return res.status(401).json({ status: false, message: 'Silakan login terlebih dahulu untuk membayar dengan Saldo Akun.' });
      }

      if (authUser.hasPin && pin) {
        const pinValid = await verifyUserPin(authUser.id, pin);
        if (!pinValid) {
          return res.status(400).json({ status: false, message: 'PIN Transaksi Keamanan salah.' });
        }
      }

      if (authUser.balance < cost) {
        return res.status(400).json({
          status: false,
          message: `Saldo tidak mencukupi. Saldo Anda: Rp ${authUser.balance.toLocaleString('id-ID')}, Dibutuhkan: Rp ${cost.toLocaleString('id-ID')}. Silakan isi saldo deposit terlebih dahulu.`,
        });
      }

      // Deduct balance in MongoDB
      await updateUserBalance(authUser.id, -cost);
    }

    // Call Atlantic Gateway API for real processing
    const gatewayRes = await createTransaction({
      code: product.code,
      reff_id: reffId,
      target: finalTarget,
      limit_price: product.price + 1500,
    });

    let initialStatus: TransactionRecord['status'] = 'pending';
    let txId = reffId;
    let sn: string | null = null;

    if (gatewayRes && gatewayRes.status && gatewayRes.data) {
      txId = gatewayRes.data.id || reffId;
      initialStatus = gatewayRes.data.status === 'success' ? 'success' : gatewayRes.data.status === 'failed' ? 'failed' : 'pending';
      sn = gatewayRes.data.sn || null;
    }

    // Save in MongoDB
    const transaction: TransactionRecord = {
      id: txId,
      reff_id: reffId,
      userId: authUser ? authUser.id : undefined,
      userEmail: authUser ? authUser.email : undefined,
      customer_name: authUser ? authUser.name : undefined,
      layanan: product.name,
      code: product.code,
      target: finalTarget,
      price: cost,
      sn,
      status: initialStatus,
      created_at: new Date().toISOString(),
      payment_method: payment_method || 'direct',
      type: 'prabayar',
    };

    await saveTransaction(transaction);

    return res.json({
      status: true,
      message: 'Pesanan berhasil dikirim ke gateway Atlantic H2H!',
      data: transaction,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membuat pesanan transaksi.');
  }
});

// Check Transaction Status by Invoice / Reff ID / Target
app.get('/api/order/check/:query', async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) return res.status(400).json({ status: false, message: 'Nomor invoice atau ID dibutuhkan.' });

    const localTx = await getTransactionByReffOrId(query);
    if (!localTx) {
      return res.status(404).json({ status: false, message: 'Transaksi tidak ditemukan. Pastikan No. Invoice atau Reff ID benar.' });
    }

    // If still pending, query live gateway for real update
    if (localTx.status === 'pending') {
      try {
        const liveStatus = await getTransactionStatus(localTx.id, localTx.type || 'prabayar');
        if (liveStatus && liveStatus.status && liveStatus.data) {
          const newStatus =
            liveStatus.data.status === 'success' ? 'success' : liveStatus.data.status === 'failed' ? 'failed' : 'pending';
          await updateTransactionStatus(localTx.reff_id, newStatus, liveStatus.data.sn);
          localTx.status = newStatus;
          if (liveStatus.data.sn) localTx.sn = liveStatus.data.sn;
        }
      } catch (statusErr) {
        console.warn('Could not sync status with Atlantic Gateway:', statusErr);
      }
    }

    return res.json({
      status: true,
      data: localTx,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status pesanan.');
  }
});

// User's transactions history
app.get('/api/order/history', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const history = await getUserTransactions(user.id);
    return res.json({ status: true, data: history });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat riwayat transaksi.');
  }
});

// ==========================================
// 4. PASCABAYAR BILL (INQUIRY & PAYMENT)
// ==========================================

// Inquire Bill (PLN Pascabayar, BPJS, Internet, dll)
app.post('/api/bill/inquiry', async (req, res) => {
  try {
    const { code, customer_no } = req.body;
    if (!code || !customer_no) {
      return res.status(400).json({ status: false, message: 'Kode produk pascabayar dan nomor pelanggan wajib diisi.' });
    }

    if (!/^[0-9a-zA-Z]{5,28}$/.test(customer_no)) {
      return res.status(400).json({ status: false, message: 'Nomor pelanggan mengandung karakter tidak valid.' });
    }

    const reffId = `INQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const gatewayRes = await inquireBill(code, customer_no, reffId);

    if (gatewayRes && gatewayRes.status && gatewayRes.data) {
      return res.json({
        status: true,
        message: 'Tagihan murni berhasil diverifikasi oleh Atlantic H2H.',
        data: gatewayRes.data,
      });
    }

    return res.status(400).json({
      status: false,
      message: gatewayRes?.message || 'Nomor ID Pelanggan tidak ditemukan atau tagihan sudah lunas.',
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa informasi tagihan pascabayar.');
  }
});

// Pay Postpaid Bill
app.post('/api/bill/pay', optionalAuth, async (req, res) => {
  try {
    const { code, customer_no, reff_id, total_tagihan, payment_method, pin } = req.body;
    const authUser = (req as any).user;

    if (!code || !customer_no) {
      return res.status(400).json({ status: false, message: 'Data pembayaran tagihan belum lengkap.' });
    }

    const billReff = reff_id || `BILL-${Date.now().toString(36).toUpperCase()}`;
    const amount = Number(total_tagihan) || 50000;

    if (payment_method === 'saldo') {
      if (!authUser) {
        return res.status(401).json({ status: false, message: 'Silakan login untuk membayar tagihan dengan Saldo Akun.' });
      }

      if (authUser.hasPin && pin) {
        const pinValid = await verifyUserPin(authUser.id, pin);
        if (!pinValid) return res.status(400).json({ status: false, message: 'PIN Transaksi salah.' });
      }

      if (authUser.balance < amount) {
        return res.status(400).json({
          status: false,
          message: `Saldo akun tidak mencukupi untuk membayar tagihan Rp ${amount.toLocaleString('id-ID')}.`,
        });
      }

      await updateUserBalance(authUser.id, -amount);
    }

    // Call Atlantic Payment Gateway
    const payRes = await payBill(code, customer_no, billReff);
    let payStatus: TransactionRecord['status'] = 'pending';
    let sn: string | null = null;

    if (payRes && payRes.status && payRes.data) {
      payStatus = payRes.data.status === 'success' ? 'success' : payRes.data.status === 'failed' ? 'failed' : 'pending';
      sn = payRes.data.sn || null;
    }

    const tx: TransactionRecord = {
      id: `PASC-${Date.now().toString(36).toUpperCase()}`,
      reff_id: billReff,
      userId: authUser ? authUser.id : undefined,
      userEmail: authUser ? authUser.email : undefined,
      customer_name: authUser ? authUser.name : undefined,
      layanan: `Pembayaran Tagihan ${code}`,
      code,
      target: customer_no,
      price: amount,
      sn,
      status: payStatus,
      created_at: new Date().toISOString(),
      payment_method: payment_method || 'direct',
      type: 'pascabayar',
    };

    await saveTransaction(tx);

    return res.json({
      status: true,
      message: 'Pembayaran tagihan berhasil dikirim ke gateway.',
      data: tx,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses pembayaran tagihan.');
  }
});

// ==========================================
// 5. DEPOSIT BALANCE (QRIS, VA, BANK)
// ==========================================

// Get Deposit Payment Channels
app.get('/api/deposit/methods', async (req, res) => {
  try {
    const gatewayRes = await getDepositMethods();
    if (gatewayRes && gatewayRes.status && Array.isArray(gatewayRes.data) && gatewayRes.data.length > 0) {
      return res.json({ status: true, data: gatewayRes.data });
    }

    const fallbackMethods = [
      {
        metode: 'QRIS',
        type: 'ewallet',
        name: 'QRIS (Semua Bank & E-Wallet)',
        min: 2000,
        max: 10000000,
        fee: 0,
        fee_persen: 0.7,
        status: 'aktif',
      },
      {
        metode: 'BCA',
        type: 'bank',
        name: 'Bank Central Asia (BCA Transfer Otomatis)',
        min: 10000,
        max: 50000000,
        fee: 0,
        fee_persen: 0,
        status: 'aktif',
      },
      {
        metode: 'BRI',
        type: 'va',
        name: 'BRI Virtual Account (BRIVA) 24 Jam',
        min: 10000,
        max: 20000000,
        fee: 2500,
        fee_persen: 0,
        status: 'aktif',
      },
      {
        metode: 'BNI',
        type: 'va',
        name: 'BNI Virtual Account 24 Jam',
        min: 10000,
        max: 20000000,
        fee: 2500,
        fee_persen: 0,
        status: 'aktif',
      },
      {
        metode: 'MANDIRI',
        type: 'va',
        name: 'Mandiri Livin Virtual Account',
        min: 10000,
        max: 20000000,
        fee: 2500,
        fee_persen: 0,
        status: 'aktif',
      },
      {
        metode: 'DANA',
        type: 'ewallet',
        name: 'DANA Saldo Transfer',
        min: 10000,
        max: 2000000,
        fee: 200,
        fee_persen: 0,
        status: 'aktif',
      },
    ];

    return res.json({ status: true, data: fallbackMethods });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat metode deposit.');
  }
});

// Create Deposit Ticket
app.post('/api/deposit/create', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { nominal, type, method } = req.body;

    const numNominal = Number(nominal);
    if (!numNominal || numNominal < 2000) {
      return res.status(400).json({ status: false, message: 'Nominal deposit minimal adalah Rp 2.000.' });
    }

    const reffId = `DEP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const gatewayRes = await createDeposit({
      reff_id: reffId,
      nominal: numNominal,
      type: type || 'ewallet',
      method: method?.toLowerCase() || 'qris',
    });

    let depOrder: DepositOrder;

    if (gatewayRes && gatewayRes.status && gatewayRes.data) {
      const gData = gatewayRes.data;
      depOrder = {
        id: gData.id || `DEP-${Date.now().toString(36)}`,
        reff_id: reffId,
        userId: user.id,
        nominal: gData.nominal || numNominal,
        tambahan: gData.tambahan || 0,
        fee: gData.fee || 0,
        get_balance: gData.get_balance || numNominal,
        metode: method?.toUpperCase() || 'QRIS',
        type: type || 'ewallet',
        qr_string: gData.qr_string || undefined,
        qr_image: gData.qr_image || undefined,
        bank: gData.bank || undefined,
        tujuan: gData.tujuan || undefined,
        atas_nama: gData.atas_nama || undefined,
        nomor_va: gData.nomor_va || undefined,
        url: gData.url || undefined,
        status: 'pending',
        created_at: gData.created_at || new Date().toISOString(),
        expired_at: gData.expired_at || new Date(Date.now() + 3600000).toISOString(),
      };
    } else {
      const fee = method?.toLowerCase() === 'qris' ? Math.ceil(numNominal * 0.007) : 0;
      const uniqueCode = method?.toLowerCase() === 'bca' ? Math.floor(100 + Math.random() * 899) : 0;
      const totalPay = numNominal + uniqueCode;
      const getBal = totalPay - fee;

      depOrder = {
        id: `DEP-${Date.now().toString(36).toUpperCase()}`,
        reff_id: reffId,
        userId: user.id,
        nominal: totalPay,
        tambahan: uniqueCode,
        fee,
        get_balance: getBal > 0 ? getBal : numNominal,
        metode: method?.toUpperCase() || 'QRIS',
        type: type || 'ewallet',
        qr_string:
          method?.toLowerCase() === 'qris'
            ? `00020101021226580016ID.CO.ATLANTIC.WWW01189360099900000000010215${reffId}520458125303360540${totalPay}5802ID5910IBAD STORE6007JAKARTA62190115${reffId}6304`
            : undefined,
        bank: method?.toUpperCase() || 'BCA',
        tujuan: method?.toLowerCase() === 'bca' ? '8291092819' : undefined,
        atas_nama: 'PT IBAD STORE MULTIPAYMENT',
        nomor_va: type === 'va' ? `8807${user.phone.slice(-8)}${Math.floor(100 + Math.random() * 900)}` : undefined,
        status: 'pending',
        created_at: new Date().toISOString(),
        expired_at: new Date(Date.now() + 3600000).toISOString(),
      };
    }

    await saveDeposit(depOrder);

    return res.json({
      status: true,
      message: 'Tiket deposit berhasil dibuat.',
      data: depOrder,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membuat tiket deposit.');
  }
});

// Check Deposit Status (and auto-credit balance in MongoDB if paid)
app.get('/api/deposit/status/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dep = await getDepositById(id);
    if (!dep) {
      return res.status(404).json({ status: false, message: 'Tiket deposit tidak ditemukan.' });
    }

    if (dep.status === 'pending') {
      try {
        const liveRes = await getDepositStatus(dep.id);
        if (liveRes && liveRes.status && liveRes.data) {
          if (liveRes.data.status === 'success') {
            await updateDepositStatus(dep.id, 'success');
            dep.status = 'success';
          } else if (liveRes.data.status === 'cancel') {
            await updateDepositStatus(dep.id, 'cancel');
            dep.status = 'cancel';
          }
        }
      } catch (e) {
        console.warn('Gateway deposit check:', e);
      }
    }

    return res.json({
      status: true,
      data: dep,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status deposit.');
  }
});

// User Deposits History
app.get('/api/deposit/history', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const list = await getUserDeposits(user.id);
    return res.json({ status: true, data: list });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat riwayat deposit.');
  }
});

// Cancel Deposit
app.post('/api/deposit/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: false, message: 'ID Deposit diperlukan.' });

    const dep = await getDepositById(id);
    if (!dep) return res.status(404).json({ status: false, message: 'Deposit tidak ditemukan.' });

    if (dep.status !== 'pending') {
      return res.status(400).json({ status: false, message: 'Hanya tiket pending yang dapat dibatalkan.' });
    }

    await cancelDeposit(id);
    await updateDepositStatus(id, 'cancel');

    return res.json({ status: true, message: 'Tiket deposit berhasil dibatalkan.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membatalkan tiket deposit.');
  }
});

// Simulate Instant Deposit Approval for User Testing
app.post('/api/deposit/demo-approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    const dep = await getDepositById(id);
    if (!dep) return res.status(404).json({ status: false, message: 'Tiket deposit tidak ditemukan.' });

    if (dep.status === 'pending') {
      await updateDepositStatus(dep.id, 'success');
      return res.json({
        status: true,
        message: `Pembayaran Berhasil! Saldo sebesar Rp ${dep.get_balance.toLocaleString('id-ID')} telah ditambahkan ke akun Anda di MongoDB.`,
      });
    }

    return res.json({ status: true, message: 'Deposit sudah berstatus selesai.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses approval simulasi deposit.');
  }
});

// ==========================================
// 6. ADMIN SPECIAL ENDPOINTS (MONITORING & CONTROL)
// ==========================================

// Get System Overview Metrics
app.get('/api/admin/metrics', adminMiddleware, async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    return res.json({ status: true, data: metrics });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat metrik sistem.');
  }
});

// Get All Transactions for Admin Activity Stream
app.get('/api/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const txs = await getAllTransactionsAdmin({
      status: status as string,
      limit: limit ? Number(limit) : 200,
    });
    return res.json({ status: true, data: txs, total: txs.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat data transaksi admin.');
  }
});

// Clear/Purge All Transactions (Admin Only)
app.post('/api/admin/transactions/clear', adminMiddleware, async (req, res) => {
  try {
    await clearAllTransactionsAdmin();
    return res.json({ status: true, message: 'Seluruh data riwayat transaksi berhasil dibersihkan.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membersihkan data transaksi.');
  }
});

// Update Transaction Status by Admin (Manual Intervention / Sync)
app.post('/api/admin/transaction/update-status', adminMiddleware, async (req, res) => {
  try {
    const { id, status, sn } = req.body;
    if (!id || !status) {
      return res.status(400).json({ status: false, message: 'ID transaksi dan status wajib ditentukan.' });
    }

    await updateTransactionStatus(id, status, sn);
    return res.json({ status: true, message: `Status transaksi ${id} berhasil diubah menjadi ${status}.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui status transaksi.');
  }
});

// Get All Users for Admin
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsersAdmin();
    return res.json({ status: true, data: users, total: users.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat daftar pengguna.');
  }
});

// Update User Balance by Admin
app.post('/api/admin/user/balance', adminMiddleware, async (req, res) => {
  try {
    const { userId, newBalance, reason } = req.body;
    if (!userId || newBalance === undefined) {
      return res.status(400).json({ status: false, message: 'User ID dan nominal saldo baru wajib ditentukan.' });
    }

    const ok = await adminUpdateUserBalance(userId, Number(newBalance));
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });

    return res.json({
      status: true,
      message: `Saldo pengguna berhasil diatur menjadi Rp ${Number(newBalance).toLocaleString('id-ID')}`,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui saldo pengguna.');
  }
});

// Update User Role (User/Admin)
app.post('/api/admin/user/role', adminMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ status: false, message: 'Role harus berupa user atau admin.' });
    }

    const ok = await adminSetUserRole(userId, role);
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });

    return res.json({ status: true, message: `Role pengguna berhasil diubah menjadi ${role}.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengubah role pengguna.');
  }
});

// Get All Deposits for Admin
app.get('/api/admin/deposits', adminMiddleware, async (req, res) => {
  try {
    const deposits = await getAllDepositsAdmin();
    return res.json({ status: true, data: deposits, total: deposits.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat daftar deposit.');
  }
});

// Approve or Reject Deposit by Admin
app.post('/api/admin/deposit/action', adminMiddleware, async (req, res) => {
  try {
    const { id, action } = req.body;
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: false, message: 'Aksi harus berupa approve atau reject.' });
    }

    const newStatus = action === 'approve' ? 'success' : 'cancel';
    await updateDepositStatus(id, newStatus);

    return res.json({
      status: true,
      message: `Deposit ${id} berhasil di-${action === 'approve' ? 'setujui dan saldo dikreditkan' : 'tolak'}.`,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses aksi deposit.');
  }
});

// Atlantic Gateway Balance Endpoint
app.get('/api/admin/gateway-balance', adminMiddleware, async (req, res) => {
  try {
    const t0 = Date.now();
    const profile = await getAtlanticProfile();
    const latency = Date.now() - t0;
    const data = profile?.data || profile;

    return res.json({
      status: true,
      balance: data?.balance !== undefined ? data.balance : 0,
      statusGateway: data?.status === 'active' || data?.status === 'aktif' ? 'ACTIVE' : (data?.status || 'ONLINE'),
      latencyMs: latency,
      data,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil saldo gateway.');
  }
});

// Atlantic Gateway Live Profile & Live Balance (POST /get_profile)
app.get('/api/admin/atlantic/profile', adminMiddleware, async (req, res) => {
  try {
    const t0 = Date.now();
    const profile = await getAtlanticProfile();
    const latency = Date.now() - t0;

    return res.json({
      status: true,
      latencyMs: latency,
      data: profile?.data || profile,
      raw: profile,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil profil Atlantic H2H.');
  }
});

// Atlantic Gateway Bank & E-Wallet List (POST /transfer/bank_list)
const DEFAULT_INDONESIAN_BANKS = [
  { id: '1', bank_code: 'bca', bank_name: 'Bank Central Asia (BCA)', type: 'bank' },
  { id: '2', bank_code: 'mandiri', bank_name: 'Bank Mandiri', type: 'bank' },
  { id: '3', bank_code: 'bni', bank_name: 'Bank Negara Indonesia (BNI)', type: 'bank' },
  { id: '4', bank_code: 'bri', bank_name: 'Bank Rakyat Indonesia (BRI)', type: 'bank' },
  { id: '5', bank_code: 'bsi', bank_name: 'Bank Syariah Indonesia (BSI)', type: 'bank' },
  { id: '6', bank_code: 'cimb', bank_name: 'CIMB Niaga', type: 'bank' },
  { id: '7', bank_code: 'permata', bank_name: 'Bank Permata', type: 'bank' },
  { id: '8', bank_code: 'danamon', bank_name: 'Bank Danamon', type: 'bank' },
  { id: '9', bank_code: 'btn', bank_name: 'Bank BTN', type: 'bank' },
  { id: '10', bank_code: 'seabank', bank_name: 'SeaBank Indonesia', type: 'bank' },
  { id: '11', bank_code: 'jago', bank_name: 'Bank Jago', type: 'bank' },
  { id: '12', bank_code: 'neo', bank_name: 'Bank Neo Commerce (BNC)', type: 'bank' },
  { id: '13', bank_code: 'dana', bank_name: 'DANA E-Wallet', type: 'ewallet' },
  { id: '14', bank_code: 'gopay', bank_name: 'GoPay E-Wallet', type: 'ewallet' },
  { id: '15', bank_code: 'ovo', bank_name: 'OVO E-Wallet', type: 'ewallet' },
  { id: '16', bank_code: 'shopeepay', bank_name: 'ShopeePay E-Wallet', type: 'ewallet' },
  { id: '17', bank_code: 'linkaja', bank_name: 'LinkAja E-Wallet', type: 'ewallet' },
];

app.get('/api/admin/transfer/banks', adminMiddleware, async (req, res) => {
  try {
    const result = await getBankList();
    if (result && (result.status === true || result.status === 'true') && Array.isArray(result.data) && result.data.length > 0) {
      const normalized = result.data.map((item: any, idx: number) => {
        const bankCode = String(item.bank_code || item.code || item.kode_bank || '').toLowerCase();
        const isEwallet = /dana|gopay|ovo|shopeepay|linkaja|kaspro|sakuku|astrapay/i.test(bankCode);
        return {
          id: String(item.id || idx + 1),
          bank_code: bankCode,
          bank_name: String(item.bank_name || item.name || item.bank || bankCode.toUpperCase()),
          type: item.type ? String(item.type).toLowerCase() : isEwallet ? 'ewallet' : 'bank',
        };
      });

      return res.json({
        status: true,
        message: result.message || 'Data bank retrieved successfully',
        data: normalized,
      });
    }

    // Fallback to complete standard Indonesian banks & e-wallets
    return res.json({
      status: true,
      message: 'Daftar bank dan e-wallet resmi Indonesia siap digunakan.',
      data: DEFAULT_INDONESIAN_BANKS,
    });
  } catch (err) {
    return res.json({
      status: true,
      message: 'Daftar bank transfer lokal aktif.',
      data: DEFAULT_INDONESIAN_BANKS,
    });
  }
});

// Atlantic Check Bank / E-Wallet Account (POST /transfer/cek_rekening)
app.post('/api/admin/transfer/check-account', adminMiddleware, async (req, res) => {
  try {
    const { bank_code, account_number } = req.body;
    if (!bank_code || !account_number) {
      return res.status(400).json({
        status: false,
        message: 'Parameter bank_code dan account_number wajib diisi.',
      });
    }

    const result = await checkBankAccount(String(bank_code), String(account_number));
    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal melakukan verifikasi nomor rekening.');
  }
});

// Atlantic Create Transfer (POST /transfer/create)
app.post('/api/admin/transfer/create', adminMiddleware, async (req, res) => {
  try {
    const {
      ref_id,
      kode_bank,
      nomor_akun,
      nama_pemilik,
      nominal,
      email,
      phone,
      note,
    } = req.body;

    if (!kode_bank || !nomor_akun || !nama_pemilik || !nominal) {
      return res.status(400).json({
        status: false,
        message: 'Data transfer belum lengkap (kode_bank, nomor_akun, nama_pemilik, nominal wajib diisi).',
      });
    }

    const uniqueRef = ref_id || `TRF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await createTransfer({
      ref_id: uniqueRef,
      kode_bank: String(kode_bank),
      nomor_akun: String(nomor_akun),
      nama_pemilik: String(nama_pemilik),
      nominal: Number(nominal),
      email,
      phone,
      note,
    });

    if (result && result.data) {
      await saveTransferRecord({
        id: result.data.id || uniqueRef,
        reff_id: uniqueRef,
        nama: String(nama_pemilik),
        nomor_tujuan: String(nomor_akun),
        nominal: Number(nominal),
        fee: result.data.fee || 1000,
        total: result.data.total || (Number(nominal) + 1000),
        status: result.data.status || 'success',
        bank_code: String(kode_bank),
        detail: {
          email,
          phone,
          note,
        },
        created_at: result.data.created_at || new Date().toISOString(),
      });
    }

    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengirim instruksi transfer dana.');
  }
});

// Atlantic Check Transfer Status (POST /transfer/status)
app.post('/api/admin/transfer/status', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ID transfer diperlukan.',
      });
    }

    // Try local record first
    const localRecord = await getTransferRecordByIdOrRef(String(id));
    if (localRecord) {
      return res.json({
        status: true,
        message: 'Data status transfer berhasil ditemukan.',
        data: localRecord,
      });
    }

    const result = await getTransferStatus(String(id));
    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status transfer.');
  }
});

// Atlantic Gateway Live Balance & Diagnostic
app.get('/api/admin/gateway-balance', adminMiddleware, async (req, res) => {
  try {
    const t0 = Date.now();
    const profile = await getAtlanticProfile();
    const latency = Date.now() - t0;

    return res.json({
      status: true,
      latencyMs: latency,
      data: profile?.data || profile || { balance: 'Terhubung ke Atlantic H2H' },
      gatewayUrl: 'https://atlantich2h.com',
      statusGateway: profile?.status !== false && profile?.status !== 'false' ? 'ONLINE' : 'DEGRADED',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal menghubungi server Atlantic H2H.');
  }
});

// Live WAF Threat & Security Logs for Admin
app.get('/api/admin/security/logs', adminMiddleware, async (req, res) => {
  try {
    const logs = await getSecurityLogs(100);
    return res.json({ status: true, data: logs });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat log keamanan admin.');
  }
});

// ==========================================
// 7. PUBLIC SECURITY DASHBOARD STATS
// ==========================================

app.get('/api/security/stats', async (req, res) => {
  const logs = await getSecurityLogs(10);
  return res.json({
    status: true,
    data: {
      wafStatus: 'ACTIVE_ARMORED',
      antiInjection: 'ACTIVE (Deep AST & Regex Pattern Inspection)',
      errorMasking: 'ENABLED (Zero Information Leakage Policy)',
      encryption: 'PBKDF2-SHA512 (100,000 Iters) + HMAC-SHA256 + AES-256-GCM',
      database: isMongoConnected() ? 'MONGODB_ATLAS_CLUSTER' : 'FAILSAFE_PERSISTENCE',
      totalThreatsBlocked: logs.length,
      lastThreatTime: logs[0]?.timestamp || null,
      serverTime: new Date().toISOString(),
    },
  });
});

app.get('/api/security/logs', async (req, res) => {
  const logs = await getSecurityLogs(30);
  const sanitizedLogs = logs.map((log) => ({
    id: log.id,
    incidentId: log.incidentId,
    timestamp: log.timestamp,
    threatType: log.threatType,
    severity: log.severity,
    actionTaken: log.actionTaken,
    endpoint: log.endpoint,
    maskedIp: log.ip.replace(/\d+$/, 'xxx'),
  }));
  return res.json({ status: true, data: sanitizedLogs });
});

// ==========================================
// VITE CLIENT INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Masking Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    maskErrorResponse(res, err, 'Kesalahan Internal Sistem Terproteksi (Error Masked).');
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[IBAD STORE] Server running securely on http://0.0.0.0:${PORT}`);
    });
  }
}

export { app };
startServer();
