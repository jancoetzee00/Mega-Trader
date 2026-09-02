import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  StrategyConfig, 
  BacktestResults, 
  AssetSymbol, 
  TimeFrame,
  UserWalletData,
  MT5AccountProfile,
  WalletTransactionRecord
} from './types';

// Initialize Firebase App & Services with robust long-polling support for sandboxed/iframe web environments
const app = initializeApp(firebaseConfig);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration / client is offline.");
    }
  }
}
testFirestoreConnection();

// Helper to sync user profile safely to Firestore
async function syncUserProfileSafely(user: User, customDisplayName?: string) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const photoURL = user.photoURL && user.photoURL.length <= 512 ? user.photoURL : '';
    await setDoc(userRef, {
      userId: user.uid,
      email: user.email || `${user.uid.slice(0, 8)}@trader.internal`,
      displayName: customDisplayName || user.displayName || 'Algorithmic Trader',
      photoURL: photoURL,
      defaultSymbol: 'XAUUSD',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Non-blocking user profile sync warning:', err);
  }
}

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfileSafely(result.user);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups or use Email / Demo sign-in.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing. Please click Sign In again.');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('This web domain is not yet authorized in Firebase OAuth. You can use Email or Demo login.');
    }
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfileSafely(res.user);
    return res.user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please verify your credentials or create a new account.');
    }
    if (error?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(res.user, { displayName });
    }
    await syncUserProfileSafely(res.user, displayName);
    return res.user;
  } catch (error: any) {
    console.error('Email registration error:', error);
    if (error?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (error?.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters long.');
    }
    throw error;
  }
}

export async function signInAsDemoTrader(): Promise<User> {
  try {
    const res = await signInAnonymously(auth);
    await updateProfile(res.user, { displayName: 'Pro Quant Trader' });
    await syncUserProfileSafely(res.user, 'Pro Quant Trader');
    return res.user;
  } catch (error: any) {
    console.error('Demo trader sign in error:', error);
    throw error;
  }
}

export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

// Custom Strategy Cloud Persistence
export interface CloudStrategyDoc {
  id: string;
  userId: string;
  name: string;
  symbol: AssetSymbol;
  timeframe: TimeFrame;
  fastEmaPeriod: number;
  slowEmaPeriod: number;
  trendEmaPeriod: number;
  supertrendPeriod: number;
  supertrendMultiplier: number;
  atrPeriod: number;
  slAtrMultiplier: number;
  tpAtrMultiplier: number;
  riskPercent: number;
  maxDailyLossPercent: number;
  useTrailingStop: boolean;
  trailingStopAtrMultiplier: number;
  useBreakEven: boolean;
  breakEvenTriggerR: number;
  useRsiFilter: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function saveStrategyToCloud(userId: string, strategy: StrategyConfig): Promise<void> {
  const strategyId = strategy.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'custom_strategy';
  const path = `users/${userId}/strategies/${strategyId}`;
  const data: CloudStrategyDoc = {
    id: strategyId,
    userId,
    name: strategy.name,
    symbol: strategy.symbol,
    timeframe: strategy.timeframe,
    fastEmaPeriod: strategy.fastEmaPeriod,
    slowEmaPeriod: strategy.slowEmaPeriod,
    trendEmaPeriod: strategy.trendEmaPeriod,
    supertrendPeriod: strategy.supertrendPeriod,
    supertrendMultiplier: strategy.supertrendMultiplier,
    atrPeriod: strategy.atrPeriod,
    slAtrMultiplier: strategy.slAtrMultiplier,
    tpAtrMultiplier: strategy.tpAtrMultiplier,
    riskPercent: strategy.riskPercent,
    maxDailyLossPercent: strategy.maxDailyLossPercent,
    useTrailingStop: strategy.useTrailingStop,
    trailingStopAtrMultiplier: strategy.trailingStopAtrMultiplier,
    useBreakEven: strategy.useBreakEven,
    breakEvenTriggerR: strategy.breakEvenTriggerR,
    useRsiFilter: strategy.useRsiFilter,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', userId, 'strategies', strategyId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserStrategies(
  userId: string, 
  onUpdate: (strategies: CloudStrategyDoc[]) => void
): Unsubscribe {
  const path = `users/${userId}/strategies`;
  return onSnapshot(
    collection(db, 'users', userId, 'strategies'),
    (snapshot) => {
      const items: CloudStrategyDoc[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as CloudStrategyDoc);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Backtest Run Cloud Persistence
export interface CloudBacktestDoc {
  id: string;
  userId: string;
  strategyName: string;
  symbol: AssetSymbol;
  timeframe: TimeFrame;
  netProfit: number;
  profitFactor: number;
  winRate: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  createdAt: string;
}

export async function saveBacktestToCloud(
  userId: string, 
  result: BacktestResults, 
  config: StrategyConfig
): Promise<void> {
  const backtestId = `bt_${Date.now()}`;
  const path = `users/${userId}/backtests/${backtestId}`;
  const data: CloudBacktestDoc = {
    id: backtestId,
    userId,
    strategyName: config.name,
    symbol: config.symbol,
    timeframe: config.timeframe,
    netProfit: Number(result.netProfit.toFixed(2)),
    profitFactor: Number(result.profitFactor.toFixed(2)),
    winRate: Number(result.winRate.toFixed(1)),
    sharpeRatio: Number(result.sharpeRatio.toFixed(2)),
    sortinoRatio: Number(result.sortinoRatio.toFixed(2)),
    maxDrawdown: Number(result.maxDrawdownPercent.toFixed(2)),
    totalTrades: result.totalTrades,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', userId, 'backtests', backtestId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserBacktests(
  userId: string,
  onUpdate: (backtests: CloudBacktestDoc[]) => void
): Unsubscribe {
  const path = `users/${userId}/backtests`;
  return onSnapshot(
    collection(db, 'users', userId, 'backtests'),
    (snapshot) => {
      const items: CloudBacktestDoc[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as CloudBacktestDoc);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// User Vault Wallet Persistence
export async function saveUserWalletToCloud(userId: string, wallet: UserWalletData): Promise<void> {
  const path = `users/${userId}/wallet/main`;
  try {
    await setDoc(doc(db, 'users', userId, 'wallet', 'main'), {
      userId,
      vaultBalance: Number(wallet.vaultBalance.toFixed(2)),
      mt5Balance: Number(wallet.mt5Balance.toFixed(2)),
      pendingWithdrawal: Number(wallet.pendingWithdrawal.toFixed(2)),
      currency: wallet.currency || 'USD',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserWallet(
  userId: string,
  onUpdate: (wallet: UserWalletData | null) => void
): Unsubscribe {
  const path = `users/${userId}/wallet/main`;
  return onSnapshot(
    doc(db, 'users', userId, 'wallet', 'main'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          vaultBalance: Number(data.vaultBalance || 0),
          mt5Balance: Number(data.mt5Balance || 0),
          pendingWithdrawal: Number(data.pendingWithdrawal || 0),
          currency: data.currency || 'USD',
          lastUpdated: data.updatedAt || new Date().toISOString()
        });
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// MT5 Connection Persistence
export async function saveMT5ConnectionToCloud(userId: string, mt5: MT5AccountProfile): Promise<void> {
  const path = `users/${userId}/mt5/connection`;
  try {
    await setDoc(doc(db, 'users', userId, 'mt5', 'connection'), {
      userId,
      accountNumber: mt5.accountNumber,
      brokerServer: mt5.brokerServer,
      accountType: mt5.accountType,
      leverage: mt5.leverage,
      currency: mt5.currency || 'USD',
      isConnected: mt5.status === 'CONNECTED',
      lastConnected: new Date().toISOString(),
      autoTradingEnabled: mt5.autoTradingEnabled
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeMT5Connection(
  userId: string,
  onUpdate: (data: any | null) => void
): Unsubscribe {
  const path = `users/${userId}/mt5/connection`;
  return onSnapshot(
    doc(db, 'users', userId, 'mt5', 'connection'),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Wallet Transactions Persistence
export async function recordWalletTransactionToCloud(userId: string, tx: WalletTransactionRecord): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), {
      id: tx.id,
      userId,
      type: tx.type,
      amount: Number(tx.amount.toFixed(2)),
      currency: tx.currency || 'USD',
      status: tx.status,
      method: tx.method,
      destination: tx.destination,
      referenceId: tx.referenceId,
      createdAt: tx.createdAt || new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeWalletTransactions(
  userId: string,
  onUpdate: (txs: WalletTransactionRecord[]) => void
): Unsubscribe {
  const path = `users/${userId}/transactions`;
  return onSnapshot(
    collection(db, 'users', userId, 'transactions'),
    (snapshot) => {
      const items: WalletTransactionRecord[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        items.push({
          id: d.id,
          type: d.type,
          amount: Number(d.amount),
          fee: 0,
          currency: d.currency || 'USD',
          status: d.status,
          method: d.method,
          destination: d.destination || '',
          referenceId: d.referenceId,
          createdAt: d.createdAt
        });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

