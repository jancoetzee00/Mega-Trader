import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
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
import { StrategyConfig, BacktestResults, AssetSymbol, TimeFrame } from './types';

// Initialize Firebase App & Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Sync user profile to Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        userId: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Algorithmic Trader',
        photoURL: result.user.photoURL || '',
        defaultSymbol: 'XAUUSD',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Google Sign-in Error:', error);
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
