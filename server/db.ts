import { MongoClient, Db, Collection } from 'mongodb';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './security.js';
import type { User, ProductItem, TransactionRecord, DepositOrder, SecurityAuditLog } from '../src/types.js';
import { getAllPriceLists } from './atlantic.js';

import { INITIAL_PRODUCTS } from './initialProducts.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://botelectro14_db_user:FcqDsIzQkP3ntFV3@cluster0.rcijz3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'ibad_store';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  pinHash?: string;
  pinSalt?: string;
  balance: number;
  role: 'user' | 'admin';
  status?: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface StoredSetting {
  key: string;
  value: any;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// In-memory cache fallback pre-seeded with instant catalog
const { hash: initialAdminHash, salt: initialAdminSalt } = hashPassword('Nuribad1805');
const initialIbadAdmin: StoredUser = {
  id: 'usr_admin_ibad18',
  username: 'ibad18',
  name: 'Ibad Store Admin',
  email: 'admin@ibadstore.id',
  phone: '085712345678',
  passwordHash: initialAdminHash,
  passwordSalt: initialAdminSalt,
  balance: 10000000,
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
};

let memUsers: StoredUser[] = [initialIbadAdmin];
let memTransactions: TransactionRecord[] = [];
let memDeposits: DepositOrder[] = [];
let memProducts: ProductItem[] = [...INITIAL_PRODUCTS];
let memLogs: SecurityAuditLog[] = [];
let memSettings: Record<string, any> = {
  profitMarginPercent: 3.0,
  minDeposit: 2000,
  maintenanceMode: false,
};

export async function connectMongo(): Promise<Db | null> {
  if (db && isConnected) return db;
  try {
    console.log('[MongoDB] Connecting to cluster...');
    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

    // Create indexes safely
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true }).catch(() => {});
      await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
      await db.collection('transactions').createIndex({ reff_id: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ id: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ userId: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ created_at: -1 }).catch(() => {});
      await db.collection('deposits').createIndex({ reff_id: 1 }).catch(() => {});
      await db.collection('deposits').createIndex({ id: 1 }).catch(() => {});
      await db.collection('deposits').createIndex({ userId: 1 }).catch(() => {});
      await db.collection('products').createIndex({ code: 1 }).catch(() => {});
      await db.collection('products').createIndex({ category: 1 }).catch(() => {});
      await db.collection('security_logs').createIndex({ timestamp: -1 }).catch(() => {});
    } catch (idxErr) {
      // index exists, ignore
    }

    // Seed default Admin accounts
    await seedDefaultAdmins();

    // Initial pure sync from Atlantic H2H if empty
    syncProductsFromGateway().catch((e) => console.warn('[Sync Products Notice]', e.message));

    return db;
  } catch (err: any) {
    console.error('[MongoDB Error] Could not connect to MongoDB cluster:', err.message);
    isConnected = false;
    return null;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

// Seed single Admin account in MongoDB
async function seedDefaultAdmins() {
  if (!db) return;
  try {
    const usersCol = db.collection<StoredUser>('users');

    // Purge any legacy demo or placeholder admin/member accounts
    await usersCol.deleteMany({
      username: { $in: ['admin', 'ibadadmin', 'member', 'demo_member', 'demo_admin', 'superadmin'] },
    });

    // Seed/Update ibad18 as the ONLY administrator
    const { hash: ibad18Hash, salt: ibad18Salt } = hashPassword('Nuribad1805');
    const { hash: pinH, salt: pinS } = hashPassword('180500');
    const ibad18Check = await usersCol.findOne({ username: 'ibad18' });

    if (!ibad18Check) {
      const ibad18User: StoredUser = {
        id: 'usr_admin_ibad18',
        username: 'ibad18',
        name: 'Ibad Store Admin',
        email: 'admin@ibadstore.id',
        phone: '085712345678',
        passwordHash: ibad18Hash,
        passwordSalt: ibad18Salt,
        pinHash: pinH,
        pinSalt: pinS,
        balance: 10000000,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await usersCol.insertOne(ibad18User);
      console.log('[MongoDB] Created Administrator account: ibad18');
    } else {
      // Ensure role is admin and credentials are fully up-to-date
      await usersCol.updateOne(
        { username: 'ibad18' },
        {
          $set: {
            role: 'admin',
            passwordHash: ibad18Hash,
            passwordSalt: ibad18Salt,
            status: 'active',
          },
        }
      );
    }
  } catch (e: any) {
    console.error('[MongoDB Seed Error]', e.message);
  }
}

// Pure Sync Products from Atlantic H2H API
export async function syncProductsFromGateway(): Promise<{ count: number; status: boolean; message: string }> {
  try {
    const { prabayar, pascabayar } = await getAllPriceLists();
    const allRawItems: any[] = [];

    if (prabayar && prabayar.status && Array.isArray(prabayar.data)) {
      prabayar.data.forEach((item: any) => {
        allRawItems.push({ ...item, isPostpaid: false });
      });
    }

    if (pascabayar && pascabayar.status && Array.isArray(pascabayar.data)) {
      pascabayar.data.forEach((item: any) => {
        allRawItems.push({ ...item, isPostpaid: true });
      });
    }

    if (allRawItems.length > 0) {
      const margin = memSettings.profitMarginPercent || 3.0;

      const liveList: ProductItem[] = allRawItems.map((item: any) => {
        const basePrice = Number(item.price || item.harga || item.admin || 0);
        const markup = basePrice > 0 ? Math.ceil((basePrice * (1 + margin / 100)) / 100) * 100 : 0;
        const sellPrice = markup > basePrice ? markup : basePrice + 500;
        const cat = String(item.category || item.kategori || (item.isPostpaid ? 'Pascabayar' : 'Games'));
        const prov = String(item.provider || item.operator || item.brand || item.type || cat);

        return {
          code: String(item.code || ''),
          name: String(item.name || item.layanan || item.code),
          category: cat,
          type: String(item.type || 'Umum'),
          provider: prov,
          price: basePrice,
          sellPrice,
          note: item.note || item.catatan || '',
          status: item.status === 'available' || item.status === 'aktif' ? 'available' : 'gangguan',
          img_url: item.img_url || undefined,
          admin: item.admin ? Number(item.admin) : undefined,
          komisi: item.komisi ? Number(item.komisi) : undefined,
          isPostpaid: !!item.isPostpaid || cat.toLowerCase().includes('pasca'),
        };
      });

      memProducts = liveList;

      if (db) {
        try {
          const prodCol = db.collection<ProductItem>('products');
          await prodCol.deleteMany({});
          // Insert in chunks if large
          const chunkSize = 1000;
          for (let i = 0; i < liveList.length; i += chunkSize) {
            await prodCol.insertMany(liveList.slice(i, i + chunkSize));
          }
        } catch (dbErr: any) {
          console.warn('[MongoDB Products Write Notice]', dbErr.message);
        }
      }

      console.log(`[Atlantic H2H] Pure API Synced: ${liveList.length} services loaded directly.`);
      return { status: true, count: liveList.length, message: `Berhasil sinkron ${liveList.length} data layanan murni dari Atlantic H2H API.` };
    }

    // If API returned without data, keep what exists in MongoDB
    if (db) {
      const existing = await db.collection<ProductItem>('products').find({}).toArray();
      if (existing.length > 0) {
        memProducts = existing;
        return { status: true, count: existing.length, message: `Menggunakan ${existing.length} layanan dari database MongoDB.` };
      }
    }

    return { status: false, count: 0, message: 'Gateway Atlantic API tidak mengembalikan data layanan.' };
  } catch (err: any) {
    console.error('[Sync Error]', err.message);
    return { status: false, count: 0, message: err.message };
  }
}

// -------------------------------------------------------------
// USER CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function getUserByUsernameOrEmail(identifier: string): Promise<StoredUser | null> {
  const clean = identifier.toLowerCase().trim();
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({
      $or: [{ username: clean }, { email: clean }],
    });
    if (user) return user;
  }
  return memUsers.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) || null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({ id });
    if (user) return user;
  }
  return memUsers.find((u) => u.id === id) || null;
}

export function sanitizeUser(u: StoredUser): User {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    phone: u.phone,
    balance: u.balance || 0,
    role: u.role || 'user',
    hasPin: !!u.pinHash,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

export async function createUser(userData: {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'user' | 'admin';
}): Promise<User> {
  const { hash, salt } = hashPassword(userData.password);
  const newUser: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    username: userData.username.toLowerCase().trim(),
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    phone: userData.phone.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    balance: 0,
    role: userData.role || 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await db.collection<StoredUser>('users').insertOne(newUser);
  }
  memUsers.push(newUser);
  return sanitizeUser(newUser);
}

export async function updateUserBalance(userId: string, deltaAmount: number): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').findOneAndUpdate(
      { id: userId },
      { $inc: { balance: deltaAmount }, $set: { updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return !!res;
  }
  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    memU.balance = (memU.balance || 0) + deltaAmount;
    return true;
  }
  return false;
}

export async function setUserPin(userId: string, pin: string): Promise<boolean> {
  const { hash, salt } = hashPassword(pin);
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { pinHash: hash, pinSalt: salt, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    memU.pinHash = hash;
    memU.pinSalt = salt;
    return true;
  }
  return false;
}

export async function verifyUserPin(userId: string, pin: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.pinHash || !user.pinSalt) return false;
  return verifyPassword(pin, user.pinHash, user.pinSalt);
}

// -------------------------------------------------------------
// TRANSACTIONS CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function saveTransaction(tx: TransactionRecord): Promise<void> {
  if (db) {
    await db.collection<TransactionRecord>('transactions').insertOne(tx);
  }
  memTransactions.unshift(tx);
  if (memTransactions.length > 500) memTransactions.pop();
}

export async function getTransactionByReffOrId(query: string): Promise<TransactionRecord | null> {
  const clean = query.trim().toUpperCase();
  if (db) {
    const tx = await db.collection<TransactionRecord>('transactions').findOne({
      $or: [
        { id: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { reff_id: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { target: query.trim() },
      ],
    });
    if (tx) return tx;
  }
  return (
    memTransactions.find(
      (t) =>
        t.id.toUpperCase() === clean ||
        t.reff_id.toUpperCase() === clean ||
        t.target === query.trim()
    ) || null
  );
}

export async function getUserTransactions(userId: string): Promise<TransactionRecord[]> {
  if (db) {
    return await db
      .collection<TransactionRecord>('transactions')
      .find({ userId })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
  }
  return memTransactions.filter((t) => t.userId === userId);
}

export async function updateTransactionStatus(
  reffIdOrId: string,
  status: TransactionRecord['status'],
  sn?: string
): Promise<void> {
  if (db) {
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (sn) updatePayload.sn = sn;
    await db.collection<TransactionRecord>('transactions').updateOne(
      { $or: [{ reff_id: reffIdOrId }, { id: reffIdOrId }] },
      { $set: updatePayload }
    );
  }
  const tx = memTransactions.find((t) => t.reff_id === reffIdOrId || t.id === reffIdOrId);
  if (tx) {
    tx.status = status;
    if (sn) tx.sn = sn;
    tx.updated_at = new Date().toISOString();
  }
}

// -------------------------------------------------------------
// DEPOSIT CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function saveDeposit(dep: DepositOrder): Promise<void> {
  if (db) {
    await db.collection<DepositOrder>('deposits').insertOne(dep);
  }
  memDeposits.unshift(dep);
  if (memDeposits.length > 300) memDeposits.pop();
}

export async function getDepositById(id: string): Promise<DepositOrder | null> {
  if (db) {
    const dep = await db.collection<DepositOrder>('deposits').findOne({
      $or: [{ id }, { reff_id: id }],
    });
    if (dep) return dep;
  }
  return memDeposits.find((d) => d.id === id || d.reff_id === id) || null;
}

export async function getUserDeposits(userId: string): Promise<DepositOrder[]> {
  if (db) {
    return await db
      .collection<DepositOrder>('deposits')
      .find({ userId })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
  }
  return memDeposits.filter((d) => d.userId === userId);
}

export async function updateDepositStatus(id: string, status: DepositOrder['status']): Promise<void> {
  if (db) {
    const dep = await db.collection<DepositOrder>('deposits').findOne({
      $or: [{ id }, { reff_id: id }],
    });
    if (dep) {
      await db.collection<DepositOrder>('deposits').updateOne(
        { _id: (dep as any)._id },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );
      if (status === 'success' && dep.userId) {
        await updateUserBalance(dep.userId, dep.get_balance);
      }
    }
  }

  const memDep = memDeposits.find((d) => d.id === id || d.reff_id === id);
  if (memDep) {
    memDep.status = status;
    if (status === 'success' && memDep.userId) {
      updateUserBalance(memDep.userId, memDep.get_balance);
    }
  }
}

// -------------------------------------------------------------
// PRODUCTS CATALOG (MONGODB / LIVE)
// -------------------------------------------------------------

export async function getProducts(): Promise<ProductItem[]> {
  if (db) {
    try {
      const list = await db.collection<ProductItem>('products').find({}).toArray();
      if (list && list.length > 0) return list;
    } catch (e: any) {
      console.warn('[MongoDB getProducts error]', e.message);
    }
  }
  if (memProducts.length > 0) {
    return memProducts;
  }
  // If empty, auto-sync immediately from Atlantic API
  await syncProductsFromGateway();
  return memProducts;
}

export async function updateProductsList(newProducts: ProductItem[]): Promise<void> {
  memProducts = newProducts;
  if (db && newProducts.length > 0) {
    const col = db.collection<ProductItem>('products');
    await col.deleteMany({});
    await col.insertMany(newProducts);
  }
}

// -------------------------------------------------------------
// SECURITY LOGS (MONGODB)
// -------------------------------------------------------------

export async function logSecurityThreat(log: SecurityAuditLog): Promise<void> {
  memLogs.unshift(log);
  if (memLogs.length > 200) memLogs.pop();
  if (db) {
    try {
      await db.collection('security_logs').insertOne(log);
    } catch (e) {
      // safe fallback
    }
  }
}

export async function getSecurityLogs(limit: number = 50): Promise<SecurityAuditLog[]> {
  if (db) {
    try {
      return await db
        .collection<SecurityAuditLog>('security_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (e) {
      // fallback
    }
  }
  return memLogs.slice(0, limit);
}

// -------------------------------------------------------------
// ADMIN MASTER CONTROLS & ACTIVITY MONITORING
// -------------------------------------------------------------

export async function getAllUsersAdmin(): Promise<User[]> {
  if (db) {
    const users = await db.collection<StoredUser>('users').find({}).sort({ createdAt: -1 }).toArray();
    return users.map(sanitizeUser);
  }
  return memUsers.map(sanitizeUser);
}

export async function getAllTransactionsAdmin(filter?: { status?: string; limit?: number }): Promise<TransactionRecord[]> {
  const lim = filter?.limit || 100;
  const q: any = {};
  if (filter?.status && filter.status !== 'all') {
    q.status = filter.status;
  }
  if (db) {
    return await db.collection<TransactionRecord>('transactions').find(q).sort({ created_at: -1 }).limit(lim).toArray();
  }
  return memTransactions.filter((t) => (!filter?.status || filter.status === 'all' ? true : t.status === filter.status)).slice(0, lim);
}

export async function getAllDepositsAdmin(): Promise<DepositOrder[]> {
  if (db) {
    return await db.collection<DepositOrder>('deposits').find({}).sort({ created_at: -1 }).limit(100).toArray();
  }
  return memDeposits.slice(0, 100);
}

export async function adminUpdateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { balance: newBalance, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u) {
    u.balance = newBalance;
    return true;
  }
  return false;
}

export async function adminSetUserRole(userId: string, role: 'user' | 'admin'): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { role, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u) {
    u.role = role;
    return true;
  }
  return false;
}

export async function getSystemMetrics() {
  let totalUsers = 0;
  let totalTransactions = 0;
  let totalDeposits = 0;
  let totalTurnover = 0;
  let totalSuccessTx = 0;

  if (db) {
    totalUsers = await db.collection('users').countDocuments();
    totalTransactions = await db.collection('transactions').countDocuments();
    totalDeposits = await db.collection('deposits').countDocuments();
    
    const txAgg = await db.collection('transactions').aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } }
    ]).toArray();

    if (txAgg.length > 0) {
      totalTurnover = txAgg[0].total || 0;
      totalSuccessTx = txAgg[0].count || 0;
    }
  } else {
    totalUsers = memUsers.length;
    totalTransactions = memTransactions.length;
    totalDeposits = memDeposits.length;
    const successList = memTransactions.filter((t) => t.status === 'success');
    totalTurnover = successList.reduce((acc, t) => acc + (t.price || 0), 0);
    totalSuccessTx = successList.length;
  }

  return {
    totalUsers,
    totalTransactions,
    totalDeposits,
    totalTurnover,
    totalSuccessTx,
    dbStatus: isConnected ? 'MONGODB_CONNECTED_HEALTHY' : 'CONNECTING_OR_FALLBACK',
    dbName: DB_NAME,
    cachedProducts: memProducts.length,
    timestamp: new Date().toISOString(),
  };
}

export interface StoredTransfer {
  id: string;
  reff_id: string;
  nama: string;
  nomor_tujuan: string;
  nominal: number;
  fee: number;
  total: number;
  status: 'pending' | 'success' | 'failed' | string;
  bank_code: string;
  detail?: {
    email?: string;
    phone?: string;
    note?: string;
  };
  created_at: string;
}

let memTransfers: StoredTransfer[] = [];

export async function saveTransferRecord(tx: StoredTransfer): Promise<void> {
  if (db) {
    await db.collection<StoredTransfer>('transfers').updateOne(
      { id: tx.id },
      { $set: tx },
      { upsert: true }
    );
  }
  const idx = memTransfers.findIndex((t) => t.id === tx.id || t.reff_id === tx.reff_id);
  if (idx >= 0) {
    memTransfers[idx] = tx;
  } else {
    memTransfers.unshift(tx);
  }
}

export async function getTransferRecordByIdOrRef(query: string): Promise<StoredTransfer | null> {
  if (db) {
    const res = await db.collection<StoredTransfer>('transfers').findOne({
      $or: [{ id: query }, { reff_id: query }, { nomor_tujuan: query }],
    });
    if (res) return res;
  }
  return memTransfers.find((t) => t.id === query || t.reff_id === query || t.nomor_tujuan === query) || null;
}

export async function getAllTransferRecords(): Promise<StoredTransfer[]> {
  if (db) {
    return await db.collection<StoredTransfer>('transfers').find().sort({ created_at: -1 }).toArray();
  }
  return [...memTransfers];
}

// Auto-boot MongoDB connection
connectMongo().catch((e) => console.error('[Mongo Boot Catch]', e));
