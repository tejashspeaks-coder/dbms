import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AppNotification,
  ClaimRequest,
  DatabaseState,
  FoundReport,
  LostReport,
  MatchScore,
  Person,
  ReportFormDraft,
  RoleType,
  TableName,
  TransactionExplainerData,
} from './types';
import { getEmptyDatabaseState, getSeedDatabaseState } from './seedData';
import { diffDays, executeRegisteredQuery, getTodayDateStr, QueryExecutionResult } from './queryRunner';

const STOP_WORDS = new Set(['the', 'and', 'with', 'near', 'for']);

export function extractKeywords(desc: string): string[] {
  const words = desc.toLowerCase().match(/[a-z0-9]+/g) || [];
  const result: string[] = [];
  for (const w of words) {
    if (w.length > 2 && !STOP_WORDS.has(w)) {
      result.push(w);
    }
  }
  return result;
}

export function keywordOverlapScore(desc1: string, desc2: string): number {
  const words1 = desc1.toLowerCase().match(/[a-z0-9]+/g) || [];
  const paddedDesc2 = ' ' + (desc2.toLowerCase().match(/[a-z0-9]+/g) || []).join(' ') + ' ';
  let common = 0;
  for (const w of words1) {
    if (w.length > 2 && !STOP_WORDS.has(w) && paddedDesc2.includes(' ' + w + ' ')) {
      common += 1;
    }
  }
  return Math.min(20, common * 5);
}

export function getCommonKeywords(desc1: string, desc2: string): string[] {
  const words1 = desc1.toLowerCase().match(/[a-z0-9]+/g) || [];
  const paddedDesc2 = ' ' + (desc2.toLowerCase().match(/[a-z0-9]+/g) || []).join(' ') + ' ';
  const matched: string[] = [];
  for (const w of words1) {
    if (w.length > 2 && !STOP_WORDS.has(w) && paddedDesc2.includes(' ' + w + ' ')) {
      if (!matched.includes(w)) matched.push(w);
    }
  }
  return matched;
}

export function dateProximityScore(lostDateStr: string, foundDateStr: string): number {
  const days = diffDays(foundDateStr, lostDateStr);
  if (days < 0) return 0;
  if (days <= 2) return 20;
  if (days <= 7) return 12;
  if (days <= 14) return 5;
  return 0;
}

export function formatLostRef(id: number): string {
  return `LR-${String(id).padStart(4, '0')}`;
}

export function formatFoundRef(id: number): string {
  return `FR-${String(id).padStart(4, '0')}`;
}

export function formatClaimRef(id: number): string {
  return `CL-${String(id).padStart(4, '0')}`;
}

export function explainMatchInWords(
  match: { category_score: number; location_score: number; date_score: number; description_score: number; total_score: number },
  lost: LostReport,
  found: FoundReport,
  zoneName?: string
): string[] {
  const reasons: string[] = [];
  if (match.location_score === 20) {
    reasons.push(zoneName ? `Same place (${zoneName})` : 'Same place');
  } else {
    reasons.push('Different campus zone');
  }

  const days = diffDays(found.date_found, lost.date_lost);
  if (days >= 0 && days <= 2) {
    reasons.push(days === 0 ? 'Found on the same day' : `Found within ${days} ${days === 1 ? 'day' : 'days'}`);
  } else if (days >= 3 && days <= 7) {
    reasons.push(`Found ${days} days later`);
  } else if (days >= 8 && days <= 14) {
    reasons.push(`Found ${days} days after it was lost`);
  } else if (days < 0) {
    reasons.push('Found date is earlier than lost date');
  } else {
    reasons.push(`Found ${days} days later`);
  }

  const sharedWords = getCommonKeywords(lost.description, found.description);
  if (sharedWords.length > 0) {
    const quoted = sharedWords.map((w) => `'${w}'`).join(', ');
    reasons.push(`Both mention ${quoted}`);
  } else {
    reasons.push('Same item category');
  }

  return reasons;
}

const INITIAL_DRAFT: ReportFormDraft = {
  mode: 'lost',
  step: 1,
  category_id: 1,
  description: '',
  location_id: 1,
  date_str: getTodayDateStr(),
  date_preset: 'today',
  storage_location: 'Admin Office Shelf A',
  person_mode: 'existing',
  person_id: 2,
  new_name: '',
  new_reg_no: '',
  new_phone: '',
  new_email: '',
  new_role: 'Student',
  extra_details: '',
  show_extra: false,
};

function buildInitialNotifications(db: DatabaseState): AppNotification[] {
  return [
    {
      id: 'notif-seed-1',
      person_id: 2,
      message: 'A possible match was found for your blue samsung phone cracked screen',
      timestamp: '2026-10-05 14:20',
      read: false,
      type: 'match',
      refId: 'LR-0002',
    },
    {
      id: 'notif-seed-2',
      person_id: 1,
      message: 'Your claim CL-0001 for black leather wallet was verified',
      timestamp: '2026-10-03 11:15',
      read: false,
      type: 'verified',
      refId: 'CL-0001',
    },
    {
      id: 'notif-seed-3',
      person_id: 6,
      message: 'A possible match was found for your silver dell laptop black sleeve',
      timestamp: '2026-10-07 16:05',
      read: false,
      type: 'match',
      refId: 'LR-0006',
    },
    {
      id: 'notif-seed-4',
      person_id: 8,
      message: 'Your claim CL-0007 for black frame spectacles blue case was verified',
      timestamp: '2026-10-11 10:30',
      read: true,
      type: 'verified',
      refId: 'CL-0007',
    },
  ];
}

export interface ToastMessage {
  id: string;
  text: string;
  variant: 'info' | 'success' | 'error';
}

interface StoreContextValue {
  db: DatabaseState;
  role: RoleType;
  setRole: (r: RoleType) => void;
  showRoleModal: boolean;
  setShowRoleModal: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
  selectedStudentPersonId: number;
  setSelectedStudentPersonId: (id: number) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dataMode: 'Demo' | 'Live';
  setDataMode: (m: 'Demo' | 'Live') => Promise<void>;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  apiConnected: boolean;
  lastUpdated: string;
  showSqlBar: boolean;
  setShowSqlBar: (v: boolean) => void;
  lastTransaction: TransactionExplainerData | null;
  setLastTransaction: (t: TransactionExplainerData | null) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  formDraft: ReportFormDraft;
  updateFormDraft: (patch: Partial<ReportFormDraft>) => void;
  resetFormDraft: () => void;
  prefillLostFromFound: (found: FoundReport) => void;
  toast: ToastMessage | null;
  showToast: (text: string, variant?: 'info' | 'success' | 'error') => void;

  // Business logic & DB operations
  submitReportFromDraft: () => {
    ok: boolean;
    error?: string;
    refCode?: string;
    createdId?: number;
    reportType?: 'lost' | 'found';
    matchesFound?: { match: MatchScore; lost: LostReport; found: FoundReport }[];
  };
  computeMatchScoreAction: (lostId: number, foundId: number) => {
    ok: boolean;
    error?: string;
    match?: MatchScore;
  };
  runAllMatchingAction: () => {
    ok: boolean;
    pairsEvaluated: number;
    message: string;
  };
  raiseClaimAction: (matchId: number, personId: number) => {
    ok: boolean;
    error?: string;
    claim?: ClaimRequest;
  };
  verifyClaimAction: (claimId: number, adminId: number) => {
    ok: boolean;
    error?: string;
  };
  rejectClaimAction: (claimId: number, adminId: number, reason: string) => {
    ok: boolean;
    error?: string;
  };
  markHandedOverAction: (claimId: number) => {
    ok: boolean;
    error?: string;
  };
  closeLostReportAction: (lostId: number) => void;
  keepLookingLostReportAction: (lostId: number) => void;

  // Generic CRUD for Manage Data (8 tables)
  insertTableRow: <T extends TableName>(table: T, rowData: Omit<DatabaseState[T][number], string>) => { ok: boolean; error?: string; row?: DatabaseState[T][number] };
  updateTableRow: <T extends TableName>(table: T, pkValue: number, patch: Partial<DatabaseState[T][number]>) => { ok: boolean; error?: string };
  deleteTableRow: <T extends TableName>(table: T, pkValue: number) => { ok: boolean; error?: string };

  // Query Runner & Undo
  runQueryById: (queryId: string) => QueryExecutionResult;
  canUndoDml: boolean;
  undoLastDml: () => void;

  // Reset / Empty database
  resetToReportDataset: () => void;
  startWithEmptyDatabase: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const PK_FIELD_MAP: Record<TableName, string> = {
  person: 'person_id',
  itemcategory: 'category_id',
  campuslocation: 'location_id',
  admin: 'admin_id',
  lostreport: 'lost_id',
  foundreport: 'found_id',
  matchscore: 'match_id',
  claimrequest: 'claim_id',
};

export const SEQ_NAME_MAP: Record<TableName, string> = {
  person: 'seq_person',
  itemcategory: 'seq_category',
  campuslocation: 'seq_location',
  admin: 'seq_admin',
  lostreport: 'seq_lost',
  foundreport: 'seq_found',
  matchscore: 'seq_match',
  claimrequest: 'seq_claim',
};

function getNowTimeStr(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => getSeedDatabaseState());
  const [dmlUndoSnapshot, setDmlUndoSnapshot] = useState<DatabaseState | null>(null);
  const [role, setRoleState] = useState<RoleType>('Student');
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStudentPersonId, setSelectedStudentPersonId] = useState<number>(2);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [dataMode, setDataModeState] = useState<'Demo' | 'Live'>('Demo');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:8080/api');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => getNowTimeStr());
  const [showSqlBar, setShowSqlBar] = useState<boolean>(true);
  const [lastTransaction, setLastTransaction] = useState<TransactionExplainerData | null>({
    id: 'init-tx',
    timestamp: getNowTimeStr(),
    userOperation: 'Initialize FindIt Oracle Schema & Seed Dataset',
    tablesAffected: ['PERSON', 'ITEMCATEGORY', 'CAMPUSLOCATION', 'ADMIN', 'LOSTREPORT', 'FOUNDREPORT', 'MATCHSCORE', 'CLAIMREQUEST'],
    sqlComponent: '01_ddl.sql + 02_data.sql (8 Tables, 8 Sequences starting at 101)',
    rowsChanged: '85 seed rows loaded across 8 tables',
    resultProduced: 'In-memory relational store synchronized and ready',
    rawSql: `-- Initialized 8 tables and sequences (START WITH 101)\nSELECT COUNT(*) FROM lostreport; -- 12\nSELECT COUNT(*) FROM foundreport; -- 13\nSELECT COUNT(*) FROM matchscore; -- 10\nSELECT COUNT(*) FROM claimrequest; -- 10`,
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    buildInitialNotifications(getSeedDatabaseState())
  );
  const [formDraft, setFormDraft] = useState<ReportFormDraft>(INITIAL_DRAFT);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // BroadcastChannel for two open browser tabs
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('findit_bacse202_channel');
      channelRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'SYNC_STATE') {
          setDb(ev.data.db);
          if (ev.data.notifications) setNotifications(ev.data.notifications);
          if (ev.data.lastTransaction) setLastTransaction(ev.data.lastTransaction);
          setLastUpdated(getNowTimeStr());
        }
      };
      return () => {
        bc.close();
      };
    } catch {
      // BroadcastChannel not supported or blocked in iframe sandbox
    }
  }, []);

  const broadcastUpdate = (
    nextDb: DatabaseState,
    nextNotifs?: AppNotification[],
    nextTx?: TransactionExplainerData | null
  ) => {
    const nowStr = getNowTimeStr();
    setLastUpdated(nowStr);
    try {
      channelRef.current?.postMessage({
        type: 'SYNC_STATE',
        db: nextDb,
        notifications: nextNotifs ?? notifications,
        lastTransaction: nextTx ?? lastTransaction,
      });
    } catch {
      // Ignore broadcast errors
    }
  };

  const showToast = (text: string, variant: 'info' | 'success' | 'error' = 'info') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: String(Date.now()), text, variant });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setRole = (newRole: RoleType) => {
    setRoleState(newRole);
    setShowRoleModal(false);
    // Keep current tab if valid for role, else switch to 'home'
    const validTabs: Record<RoleType, string[]> = {
      Student: ['home', 'my-reports', 'browse-found', 'help'],
      Admin: ['home', 'claims', 'all-reports', 'handover'],
      Developer: ['home', 'manage-data', 'modules-queries', 'plsql-lab', 'sql-scripts', 'settings', 'claims', 'all-reports', 'handover', 'my-reports', 'browse-found'],
    };
    if (!validTabs[newRole].includes(activeTab)) {
      setActiveTab('home');
    }
  };

  // Data-layer REST helper for Live mode
  const syncLiveApi = async (method: string, path: string, body?: unknown): Promise<boolean> => {
    if (dataMode !== 'Live') return true;
    try {
      const cleanBase = apiBaseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanBase}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch {
      setDataModeState('Demo');
      setApiConnected(false);
      showToast('Live REST API unreachable — staying in Demo mode', 'error');
      return false;
    }
  };

  const setDataMode = async (targetMode: 'Demo' | 'Live') => {
    if (targetMode === 'Demo') {
      setDataModeState('Demo');
      setApiConnected(false);
      showToast('Switched to Demo (in-memory) mode', 'info');
      return;
    }
    // Test connection to REST API {baseUrl}/lostreport
    try {
      const cleanBase = apiBaseUrl.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${cleanBase}/lostreport`, { signal: controller.signal });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setDataModeState('Live');
      setApiConnected(true);
      showToast('Connected to Live REST API', 'success');
    } catch {
      setDataModeState('Demo');
      setApiConnected(false);
      showToast(`Could not reach REST API at ${apiBaseUrl}. Staying in Demo mode.`, 'error');
    }
  };

  const updateFormDraft = (patch: Partial<ReportFormDraft>) => {
    setFormDraft((prev) => ({ ...prev, ...patch }));
  };

  const resetFormDraft = () => {
    setFormDraft((prev) => ({
      ...INITIAL_DRAFT,
      mode: prev.mode || 'lost',
      person_id: prev.person_id || 2,
    }));
  };

  const prefillLostFromFound = (found: FoundReport) => {
    setFormDraft((prev) => ({
      ...INITIAL_DRAFT,
      mode: 'lost',
      step: 1,
      category_id: found.category_id,
      location_id: found.location_id,
      description: found.description,
      date_str: found.date_found,
      date_preset: 'custom',
      person_id: prev.person_id || 2,
    }));
    setActiveTab('home');
    showToast('Pre-filled all item details on Home — click 1-Click Submit & Match to store!', 'info');
  };

  const markNotificationRead = (id: string) => {
    const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(next);
    broadcastUpdate(db, next, lastTransaction);
  };

  const markAllNotificationsRead = () => {
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    broadcastUpdate(db, next, lastTransaction);
  };

  // =================================================================
  // CORE PL/SQL BUSINESS LOGIC
  // =================================================================

  const computeMatchOnState = (
    currentDb: DatabaseState,
    lostId: number,
    foundId: number
  ): {
    ok: boolean;
    error?: string;
    nextDb: DatabaseState;
    match?: MatchScore;
    statusUpdated: boolean;
  } => {
    const lost = currentDb.lostreport.find((l) => l.lost_id === lostId);
    const found = currentDb.foundreport.find((f) => f.found_id === foundId);

    if (!lost || !found) {
      return { ok: false, error: 'Lost or Found report not found', nextDb: currentDb, statusUpdated: false };
    }

    if (lost.category_id !== found.category_id) {
      return {
        ok: false,
        error: 'Different categories: this pair cannot be matched',
        nextDb: currentDb,
        statusUpdated: false,
      };
    }

    const v_cat = 40;
    const v_loc = lost.location_id === found.location_id ? 20 : 0;
    const v_dt = dateProximityScore(lost.date_lost, found.date_found);
    const v_ds = keywordOverlapScore(lost.description, found.description);
    const v_total = v_cat + v_loc + v_dt + v_ds;
    const sysdate = getTodayDateStr();

    let nextSequences = { ...currentDb.sequences };
    const existingIdx = currentDb.matchscore.findIndex(
      (m) => m.lost_id === lostId && m.found_id === foundId
    );

    let savedMatch: MatchScore;
    let nextMatches = [...currentDb.matchscore];

    if (existingIdx >= 0) {
      savedMatch = {
        ...nextMatches[existingIdx],
        category_score: v_cat,
        location_score: v_loc,
        date_score: v_dt,
        description_score: v_ds,
        total_score: v_total,
        computed_date: sysdate,
      };
      nextMatches[existingIdx] = savedMatch;
    } else {
      const nextId = nextSequences.matchscore;
      nextSequences.matchscore = nextId + 1;
      savedMatch = {
        match_id: nextId,
        lost_id: lostId,
        found_id: foundId,
        category_score: v_cat,
        location_score: v_loc,
        date_score: v_dt,
        description_score: v_ds,
        total_score: v_total,
        computed_date: sysdate,
      };
      nextMatches.push(savedMatch);
    }

    let statusUpdated = false;
    const nextLost = currentDb.lostreport.map((l) => {
      if (l.lost_id === lostId && v_total >= 50 && l.status === 'Active') {
        statusUpdated = true;
        return { ...l, status: 'Matched' as const };
      }
      return l;
    });

    const nextDb: DatabaseState = {
      ...currentDb,
      matchscore: nextMatches,
      lostreport: nextLost,
      sequences: nextSequences,
    };

    return { ok: true, nextDb, match: savedMatch, statusUpdated };
  };

  const computeMatchScoreAction = (lostId: number, foundId: number) => {
    const res = computeMatchOnState(db, lostId, foundId);
    if (!res.ok || !res.match) {
      const errTx: TransactionExplainerData = {
        id: `tx-err-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `EXEC compute_match_score(${lostId}, ${foundId})`,
        tablesAffected: ['LOSTREPORT', 'FOUNDREPORT'],
        sqlComponent: 'Procedure compute_match_score (RAISE_APPLICATION_ERROR -20001)',
        rowsChanged: '0 rows changed (rolled back)',
        resultProduced: res.error || 'Error',
        rawSql: `EXEC compute_match_score(${lostId}, ${foundId});\n-- ORA-20001: ${res.error}`,
      };
      setLastTransaction(errTx);
      showToast(res.error || 'Could not compute match score', 'error');
      return { ok: false, error: res.error };
    }

    const m = res.match;
    const tx: TransactionExplainerData = {
      id: `tx-cms-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Compute Match Score for Lost #${lostId} and Found #${foundId}`,
      tablesAffected: res.statusUpdated ? ['MATCHSCORE', 'LOSTREPORT'] : ['MATCHSCORE'],
      sqlComponent: 'Procedure compute_match_score + Functions keyword_overlap_score, date_proximity_score',
      rowsChanged: `1 row merged in MATCHSCORE (match_id=${m.match_id})${res.statusUpdated ? `, 1 row updated in LOSTREPORT (status='Matched')` : ''}`,
      resultProduced: `Lost ${lostId} vs Found ${foundId} => total score ${m.total_score} (Cat:${m.category_score} + Loc:${m.location_score} + Date:${m.date_score} + Desc:${m.description_score})`,
      rawSql: `EXEC compute_match_score(${lostId}, ${foundId});\n-- DBMS_OUTPUT: Lost ${lostId} vs Found ${foundId} => total score ${m.total_score}`,
    };

    let nextNotifs = [...notifications];
    if (m.total_score >= 50) {
      const lostRow = res.nextDb.lostreport.find((l) => l.lost_id === lostId);
      if (lostRow) {
        nextNotifs.unshift({
          id: `notif-m-${Date.now()}`,
          person_id: lostRow.person_id,
          message: `A possible match (score ${m.total_score}) was found for your ${lostRow.description}`,
          timestamp: getNowTimeStr(),
          read: false,
          type: 'match',
          refId: formatLostRef(lostId),
        });
      }
    }

    setDb(res.nextDb);
    setNotifications(nextNotifs);
    setLastTransaction(tx);
    broadcastUpdate(res.nextDb, nextNotifs, tx);
    void syncLiveApi('POST', 'matchscore', m);
    showToast(`Match computed: total score ${m.total_score}`, 'success');
    return { ok: true, match: m };
  };

  const runAllMatchingAction = () => {
    let workingDb = { ...db };
    // Explicit-cursor order: lostreport l JOIN foundreport f ON l.category_id = f.category_id
    // WHERE l.status IN ('Active', 'Matched') AND f.status = 'Unclaimed'
    // ORDER BY l.lost_id, f.found_id
    const eligibleLost = [...workingDb.lostreport]
      .filter((l) => l.status === 'Active' || l.status === 'Matched')
      .sort((a, b) => a.lost_id - b.lost_id);
    const eligibleFound = [...workingDb.foundreport]
      .filter((f) => f.status === 'Unclaimed')
      .sort((a, b) => a.found_id - b.found_id);

    let pairsCount = 0;
    let statusChanges = 0;
    const outputLines: string[] = [];
    const newNotifs: AppNotification[] = [];

    for (const l of eligibleLost) {
      for (const f of eligibleFound) {
        if (l.category_id === f.category_id) {
          const res = computeMatchOnState(workingDb, l.lost_id, f.found_id);
          if (res.ok && res.match) {
            workingDb = res.nextDb;
            pairsCount += 1;
            if (res.statusUpdated) statusChanges += 1;
            outputLines.push(
              `Lost ${l.lost_id} vs Found ${f.found_id} => total score ${res.match.total_score}`
            );
            if (res.statusUpdated) {
              newNotifs.push({
                id: `notif-ram-${Date.now()}-${l.lost_id}-${f.found_id}`,
                person_id: l.person_id,
                message: `A possible match was found for your ${l.description}`,
                timestamp: getNowTimeStr(),
                read: false,
                type: 'match',
                refId: formatLostRef(l.lost_id),
              });
            }
          }
        }
      }
    }

    const msg = `Pairs evaluated: ${pairsCount}`;
    const tx: TransactionExplainerData = {
      id: `tx-ram-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: 'Run Automatic Batch Matching (run_all_matching)',
      tablesAffected: ['MATCHSCORE', 'LOSTREPORT', 'FOUNDREPORT'],
      sqlComponent: 'Procedure run_all_matching (Explicit Cursor c_pairs -> compute_match_score)',
      rowsChanged: `${pairsCount} pair(s) merged in MATCHSCORE, ${statusChanges} lost report(s) promoted to 'Matched'`,
      resultProduced: msg,
      rawSql: `SET SERVEROUTPUT ON;\nEXEC run_all_matching;\n-- ${outputLines.join('\n-- ')}\n-- ${msg}`,
    };

    const mergedNotifs = [...newNotifs, ...notifications];
    setDb(workingDb);
    setNotifications(mergedNotifs);
    setLastTransaction(tx);
    broadcastUpdate(workingDb, mergedNotifs, tx);
    showToast(msg, 'success');
    return { ok: true, pairsEvaluated: pairsCount, message: msg };
  };

  const submitReportFromDraft = () => {
    const d = formDraft;
    if (!d.mode) return { ok: false, error: 'Please choose whether you lost or found an item' };
    if (!d.category_id) return { ok: false, error: 'Please choose a category' };
    if (!d.description.trim()) return { ok: false, error: 'Please describe the item' };
    if (!d.location_id) return { ok: false, error: 'Please choose a place' };

    const reportDate = d.date_str || getTodayDateStr();
    const fullDescription = d.extra_details.trim()
      ? `${d.description.trim()} ${d.extra_details.trim()}`
      : d.description.trim();

    let workingDb = { ...db, sequences: { ...db.sequences } };
    let personId = d.person_id;

    if (d.person_mode === 'new') {
      if (!d.new_name.trim()) return { ok: false, error: 'Please enter your full name' };
      if (!d.new_reg_no.trim()) return { ok: false, error: 'Please enter your registration or staff number' };
      const dup = workingDb.person.find(
        (p) => p.reg_no.toLowerCase() === d.new_reg_no.trim().toLowerCase()
      );
      if (dup) {
        personId = dup.person_id;
      } else {
        const nextPid = workingDb.sequences.person;
        workingDb.sequences.person = nextPid + 1;
        const newPerson: Person = {
          person_id: nextPid,
          name: d.new_name.trim(),
          reg_no: d.new_reg_no.trim().toUpperCase(),
          phone: d.new_phone.trim() || '9876500099',
          email: d.new_email.trim() || `${d.new_name.trim().toLowerCase().replace(/\s+/g, '.')}@college.edu`,
          role: d.new_role,
        };
        workingDb.person = [...workingDb.person, newPerson];
        personId = nextPid;
      }
    }

    if (!personId) {
      return { ok: false, error: 'Please select your name from the list' };
    }

    setSelectedStudentPersonId(personId);
    const matchesFound: { match: MatchScore; lost: LostReport; found: FoundReport }[] = [];
    const newNotifs: AppNotification[] = [];

    if (d.mode === 'lost') {
      const nextLostId = workingDb.sequences.lostreport;
      workingDb.sequences.lostreport = nextLostId + 1;
      const newLost: LostReport = {
        lost_id: nextLostId,
        person_id: personId,
        category_id: d.category_id,
        location_id: d.location_id,
        description: fullDescription,
        date_lost: reportDate,
        status: 'Active',
      };
      workingDb.lostreport = [...workingDb.lostreport, newLost];

      // Automatically evaluate against same-category Unclaimed found items
      const candidates = workingDb.foundreport.filter(
        (f) => f.category_id === newLost.category_id && f.status === 'Unclaimed'
      );
      for (const f of candidates) {
        const mRes = computeMatchOnState(workingDb, nextLostId, f.found_id);
        if (mRes.ok && mRes.match) {
          workingDb = mRes.nextDb;
          const updatedLost = workingDb.lostreport.find((l) => l.lost_id === nextLostId)!;
          matchesFound.push({ match: mRes.match, lost: updatedLost, found: f });
          if (mRes.match.total_score >= 50) {
            newNotifs.push({
              id: `notif-newlost-${Date.now()}-${f.found_id}`,
              person_id: personId,
              message: `A possible match was found for your ${newLost.description}`,
              timestamp: getNowTimeStr(),
              read: false,
              type: 'match',
              refId: formatLostRef(nextLostId),
            });
          }
        }
      }

      const refCode = formatLostRef(nextLostId);
      const tx: TransactionExplainerData = {
        id: `tx-ins-lost-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `Submit Lost Item Report (${refCode})`,
        tablesAffected: matchesFound.length > 0 ? ['LOSTREPORT', 'MATCHSCORE'] : ['LOSTREPORT'],
        sqlComponent: `INSERT INTO lostreport (seq_lost.NEXTVAL)${matchesFound.length > 0 ? ' + compute_match_score' : ''}`,
        rowsChanged: `1 row inserted into LOSTREPORT (lost_id=${nextLostId})${matchesFound.length > 0 ? `, ${matchesFound.length} match score(s) computed` : ''}`,
        resultProduced: `Created ${refCode} (${fullDescription})`,
        rawSql: `INSERT INTO lostreport (lost_id, person_id, category_id, location_id, description, date_lost)\nVALUES (seq_lost.NEXTVAL, ${personId}, ${d.category_id}, ${d.location_id}, '${fullDescription.replace(/'/g, "''")}', DATE '${reportDate}');\nCOMMIT;`,
      };

      const allNotifs = [...newNotifs, ...notifications];
      setDb(workingDb);
      setNotifications(allNotifs);
      setLastTransaction(tx);
      broadcastUpdate(workingDb, allNotifs, tx);
      void syncLiveApi('POST', 'lostreport', newLost);
      return {
        ok: true,
        refCode,
        createdId: nextLostId,
        reportType: 'lost' as const,
        matchesFound: matchesFound.sort((a, b) => b.match.total_score - a.match.total_score),
      };
    } else {
      const nextFoundId = workingDb.sequences.foundreport;
      workingDb.sequences.foundreport = nextFoundId + 1;
      const newFound: FoundReport = {
        found_id: nextFoundId,
        person_id: personId,
        category_id: d.category_id,
        location_id: d.location_id,
        storage_location: d.storage_location.trim() || 'Admin Office Shelf A',
        description: fullDescription,
        date_found: reportDate,
        status: 'Unclaimed',
      };
      workingDb.foundreport = [...workingDb.foundreport, newFound];

      // Automatically evaluate against same-category Active/Matched lost items
      const candidates = workingDb.lostreport.filter(
        (l) => l.category_id === newFound.category_id && (l.status === 'Active' || l.status === 'Matched')
      );
      for (const l of candidates) {
        const mRes = computeMatchOnState(workingDb, l.lost_id, nextFoundId);
        if (mRes.ok && mRes.match) {
          workingDb = mRes.nextDb;
          const updatedLost = workingDb.lostreport.find((x) => x.lost_id === l.lost_id)!;
          matchesFound.push({ match: mRes.match, lost: updatedLost, found: newFound });
          if (mRes.match.total_score >= 50) {
            newNotifs.push({
              id: `notif-newfound-${Date.now()}-${l.lost_id}`,
              person_id: l.person_id,
              message: `A possible match was found for your ${l.description}`,
              timestamp: getNowTimeStr(),
              read: false,
              type: 'match',
              refId: formatLostRef(l.lost_id),
            });
          }
        }
      }

      const refCode = formatFoundRef(nextFoundId);
      const tx: TransactionExplainerData = {
        id: `tx-ins-found-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `Submit Found Item Report (${refCode})`,
        tablesAffected: matchesFound.length > 0 ? ['FOUNDREPORT', 'MATCHSCORE', 'LOSTREPORT'] : ['FOUNDREPORT'],
        sqlComponent: `INSERT INTO foundreport (seq_found.NEXTVAL)${matchesFound.length > 0 ? ' + compute_match_score' : ''}`,
        rowsChanged: `1 row inserted into FOUNDREPORT (found_id=${nextFoundId})${matchesFound.length > 0 ? `, ${matchesFound.length} match score(s) computed` : ''}`,
        resultProduced: `Created ${refCode} (${fullDescription})`,
        rawSql: `INSERT INTO foundreport (found_id, person_id, category_id, location_id, storage_location, description, date_found)\nVALUES (seq_found.NEXTVAL, ${personId}, ${d.category_id}, ${d.location_id}, '${newFound.storage_location.replace(/'/g, "''")}', '${fullDescription.replace(/'/g, "''")}', DATE '${reportDate}');\nCOMMIT;`,
      };

      const allNotifs = [...newNotifs, ...notifications];
      setDb(workingDb);
      setNotifications(allNotifs);
      setLastTransaction(tx);
      broadcastUpdate(workingDb, allNotifs, tx);
      void syncLiveApi('POST', 'foundreport', newFound);
      return {
        ok: true,
        refCode,
        createdId: nextFoundId,
        reportType: 'found' as const,
        matchesFound: matchesFound.sort((a, b) => b.match.total_score - a.match.total_score),
      };
    }
  };

  // Trigger trg_block_low_score_claim enforced here
  const raiseClaimAction = (matchId: number, personId: number) => {
    const match = db.matchscore.find((m) => m.match_id === matchId);
    if (!match) {
      return { ok: false, error: 'Match record not found' };
    }

    if (match.total_score < 50) {
      const blockedMsg = 'Claim blocked: match score is below the minimum of 50';
      const tx: TransactionExplainerData = {
        id: `tx-claim-blocked-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `Attempt to Raise Claim on Match #${matchId} (score ${match.total_score})`,
        tablesAffected: ['CLAIMREQUEST', 'MATCHSCORE'],
        sqlComponent: 'Trigger trg_block_low_score_claim (BEFORE INSERT ON claimrequest)',
        rowsChanged: '0 rows inserted (blocked by BEFORE INSERT trigger)',
        resultProduced: blockedMsg,
        rawSql: `INSERT INTO claimrequest (claim_id, match_id, person_id)\nVALUES (seq_claim.NEXTVAL, ${matchId}, ${personId});\n-- ORA-20002: ${blockedMsg}`,
      };
      setLastTransaction(tx);
      showToast(blockedMsg, 'error');
      return { ok: false, error: blockedMsg };
    }

    const nextClaimId = db.sequences.claimrequest;
    const sysdate = getTodayDateStr();
    const newClaim: ClaimRequest = {
      claim_id: nextClaimId,
      match_id: matchId,
      person_id: personId,
      admin_id: null,
      claim_date: sysdate,
      verification_status: 'Pending',
    };

    const nextDb: DatabaseState = {
      ...db,
      claimrequest: [...db.claimrequest, newClaim],
      sequences: { ...db.sequences, claimrequest: nextClaimId + 1 },
    };

    const lost = db.lostreport.find((l) => l.lost_id === match.lost_id);
    const nextNotifs: AppNotification[] = [
      {
        id: `notif-claim-${Date.now()}`,
        person_id: personId,
        message: `Claim ${formatClaimRef(nextClaimId)} submitted for ${lost?.description || 'your item'}`,
        timestamp: getNowTimeStr(),
        read: false,
        type: 'claim',
        refId: formatClaimRef(nextClaimId),
      },
      ...notifications,
    ];

    const tx: TransactionExplainerData = {
      id: `tx-claim-ok-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Raise Claim ${formatClaimRef(nextClaimId)} on Match #${matchId}`,
      tablesAffected: ['CLAIMREQUEST', 'MATCHSCORE'],
      sqlComponent: 'INSERT INTO claimrequest + Trigger trg_block_low_score_claim (passed)',
      rowsChanged: `1 row inserted into CLAIMREQUEST (claim_id=${nextClaimId}, status='Pending')`,
      resultProduced: `Claim ${formatClaimRef(nextClaimId)} awaiting admin verification`,
      rawSql: `INSERT INTO claimrequest (claim_id, match_id, person_id, claim_date, verification_status)\nVALUES (seq_claim.NEXTVAL, ${matchId}, ${personId}, DATE '${sysdate}', 'Pending');\nCOMMIT;`,
    };

    setDb(nextDb);
    setNotifications(nextNotifs);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, nextNotifs, tx);
    void syncLiveApi('POST', 'claimrequest', newClaim);
    showToast(`Claim ${formatClaimRef(nextClaimId)} raised`, 'success');
    return { ok: true, claim: newClaim };
  };

  // Procedure verify_claim + Trigger trg_claim_verified
  const verifyClaimAction = (claimId: number, adminId: number) => {
    const claim = db.claimrequest.find((c) => c.claim_id === claimId);
    if (!claim) {
      return { ok: false, error: 'Claim not found' };
    }
    if (claim.verification_status !== 'Pending') {
      const errMsg = 'This claim was already processed';
      const tx: TransactionExplainerData = {
        id: `tx-ver-err-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `EXEC verify_claim(${claimId}, ${adminId})`,
        tablesAffected: ['CLAIMREQUEST'],
        sqlComponent: 'Procedure verify_claim (RAISE_APPLICATION_ERROR -20003)',
        rowsChanged: '0 rows changed',
        resultProduced: errMsg,
        rawSql: `EXEC verify_claim(${claimId}, ${adminId});\n-- ORA-20003: ${errMsg}`,
      };
      setLastTransaction(tx);
      showToast(errMsg, 'error');
      return { ok: false, error: errMsg };
    }

    const match = db.matchscore.find((m) => m.match_id === claim.match_id);
    const nextClaims = db.claimrequest.map((c) =>
      c.claim_id === claimId ? { ...c, verification_status: 'Verified' as const, admin_id: adminId } : c
    );
    const nextFound = db.foundreport.map((f) =>
      match && f.found_id === match.found_id ? { ...f, status: 'Claimed' as const } : f
    );
    const nextLost = db.lostreport.map((l) =>
      match && l.lost_id === match.lost_id ? { ...l, status: 'Closed' as const } : l
    );

    const nextDb: DatabaseState = {
      ...db,
      claimrequest: nextClaims,
      foundreport: nextFound,
      lostreport: nextLost,
    };

    const lostItem = db.lostreport.find((l) => l.lost_id === match?.lost_id);
    const nextNotifs: AppNotification[] = [
      {
        id: `notif-ver-${Date.now()}`,
        person_id: claim.person_id,
        message: `Your claim ${formatClaimRef(claimId)} for ${lostItem?.description || 'item'} was verified! Ready for handover.`,
        timestamp: getNowTimeStr(),
        read: false,
        type: 'verified',
        refId: formatClaimRef(claimId),
      },
      ...notifications,
    ];

    const tx: TransactionExplainerData = {
      id: `tx-ver-ok-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Verify Claim ${formatClaimRef(claimId)} by Admin #${adminId}`,
      tablesAffected: ['CLAIMREQUEST', 'FOUNDREPORT', 'LOSTREPORT'],
      sqlComponent: 'Procedure verify_claim + Trigger trg_claim_verified (AFTER UPDATE OF verification_status)',
      rowsChanged: `1 row updated in CLAIMREQUEST (Verified), 1 row in FOUNDREPORT (found_id=${match?.found_id} -> 'Claimed'), 1 row in LOSTREPORT (lost_id=${match?.lost_id} -> 'Closed')`,
      resultProduced: `Claim ${claimId} verified by admin ${adminId}; Handover slip generated`,
      rawSql: `EXEC verify_claim(${claimId}, ${adminId});\n-- Trigger trg_claim_verified fired:\n-- UPDATE foundreport SET status = 'Claimed' WHERE found_id = ${match?.found_id};\n-- UPDATE lostreport SET status = 'Closed' WHERE lost_id = ${match?.lost_id};\nCOMMIT;`,
    };

    setDb(nextDb);
    setNotifications(nextNotifs);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, nextNotifs, tx);
    void syncLiveApi('PUT', `claimrequest/${claimId}`, { verification_status: 'Verified', admin_id: adminId });
    showToast(`Claim ${formatClaimRef(claimId)} verified`, 'success');
    return { ok: true };
  };

  const rejectClaimAction = (claimId: number, adminId: number, reason: string) => {
    const claim = db.claimrequest.find((c) => c.claim_id === claimId);
    if (!claim) return { ok: false, error: 'Claim not found' };
    if (claim.verification_status !== 'Pending') {
      showToast('This claim was already processed', 'error');
      return { ok: false, error: 'This claim was already processed' };
    }

    const nextClaims = db.claimrequest.map((c) =>
      c.claim_id === claimId
        ? { ...c, verification_status: 'Rejected' as const, admin_id: adminId, rejection_reason: reason || 'Ownership details could not be verified' }
        : c
    );

    const nextDb: DatabaseState = { ...db, claimrequest: nextClaims };
    const nextNotifs: AppNotification[] = [
      {
        id: `notif-rej-${Date.now()}`,
        person_id: claim.person_id,
        message: `Your claim ${formatClaimRef(claimId)} was rejected: ${reason || 'Unverified details'}`,
        timestamp: getNowTimeStr(),
        read: false,
        type: 'claim',
        refId: formatClaimRef(claimId),
      },
      ...notifications,
    ];

    const tx: TransactionExplainerData = {
      id: `tx-rej-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Reject Claim ${formatClaimRef(claimId)} (Reason: ${reason || 'Not specified'})`,
      tablesAffected: ['CLAIMREQUEST'],
      sqlComponent: 'UPDATE claimrequest SET verification_status = \'Rejected\'',
      rowsChanged: `1 row updated in CLAIMREQUEST (claim_id=${claimId}); LOSTREPORT and FOUNDREPORT unchanged`,
      resultProduced: `Claim ${formatClaimRef(claimId)} marked Rejected`,
      rawSql: `UPDATE claimrequest\nSET verification_status = 'Rejected', admin_id = ${adminId}\nWHERE claim_id = ${claimId};\nCOMMIT;`,
    };

    setDb(nextDb);
    setNotifications(nextNotifs);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, nextNotifs, tx);
    showToast(`Claim ${formatClaimRef(claimId)} rejected`, 'info');
    return { ok: true };
  };

  const markHandedOverAction = (claimId: number) => {
    const claim = db.claimrequest.find((c) => c.claim_id === claimId);
    if (!claim) {
      showToast('Claim reference not found', 'error');
      return { ok: false, error: 'Claim reference not found' };
    }
    if (claim.verification_status !== 'Verified') {
      showToast('Only Verified claims can be marked handed over', 'error');
      return { ok: false, error: 'Only Verified claims can be marked handed over' };
    }
    const match = db.matchscore.find((m) => m.match_id === claim.match_id);
    if (!match) return { ok: false, error: 'Match record not found' };

    const nextFound = db.foundreport.map((f) =>
      f.found_id === match.found_id ? { ...f, status: 'Returned' as const } : f
    );
    const nextDb: DatabaseState = { ...db, foundreport: nextFound };

    const foundItem = db.foundreport.find((f) => f.found_id === match.found_id);
    const nextNotifs: AppNotification[] = [
      {
        id: `notif-handover-${Date.now()}`,
        person_id: claim.person_id,
        message: `Item handed over for claim ${formatClaimRef(claimId)} (${foundItem?.description || 'item'})`,
        timestamp: getNowTimeStr(),
        read: false,
        type: 'handover',
        refId: formatClaimRef(claimId),
      },
      ...notifications,
    ];

    const tx: TransactionExplainerData = {
      id: `tx-ho-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Mark Handed Over for Claim ${formatClaimRef(claimId)}`,
      tablesAffected: ['FOUNDREPORT'],
      sqlComponent: 'UPDATE foundreport SET status = \'Returned\'',
      rowsChanged: `1 row updated in FOUNDREPORT (found_id=${match.found_id} status='Returned')`,
      resultProduced: `Physical item ${formatFoundRef(match.found_id)} marked Returned to owner`,
      rawSql: `UPDATE foundreport\nSET status = 'Returned'\nWHERE found_id = ${match.found_id};\nCOMMIT;`,
    };

    setDb(nextDb);
    setNotifications(nextNotifs);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, nextNotifs, tx);
    showToast(`Marked ${formatFoundRef(match.found_id)} as Handed over (Returned)`, 'success');
    return { ok: true };
  };

  const closeLostReportAction = (lostId: number) => {
    const nextLost = db.lostreport.map((l) =>
      l.lost_id === lostId ? { ...l, status: 'Closed' as const } : l
    );
    const nextDb = { ...db, lostreport: nextLost };
    const tx: TransactionExplainerData = {
      id: `tx-close-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Close Lost Report ${formatLostRef(lostId)}`,
      tablesAffected: ['LOSTREPORT'],
      sqlComponent: 'UPDATE lostreport SET status = \'Closed\'',
      rowsChanged: `1 row updated in LOSTREPORT (lost_id=${lostId})`,
      resultProduced: `Report ${formatLostRef(lostId)} marked Resolved (Closed)`,
      rawSql: `UPDATE lostreport SET status = 'Closed' WHERE lost_id = ${lostId};\nCOMMIT;`,
    };
    setDb(nextDb);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, notifications, tx);
    showToast(`Report ${formatLostRef(lostId)} marked as Resolved`, 'info');
  };

  const keepLookingLostReportAction = (lostId: number) => {
    const today = getTodayDateStr();
    const nextLost = db.lostreport.map((l) =>
      l.lost_id === lostId ? { ...l, status: 'Active' as const, date_lost: today } : l
    );
    const nextDb = { ...db, lostreport: nextLost };
    const tx: TransactionExplainerData = {
      id: `tx-keep-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Keep Looking for Lost Report ${formatLostRef(lostId)}`,
      tablesAffected: ['LOSTREPORT'],
      sqlComponent: 'UPDATE lostreport SET status = \'Active\'',
      rowsChanged: `1 row updated in LOSTREPORT (lost_id=${lostId})`,
      resultProduced: `Report ${formatLostRef(lostId)} kept Active`,
      rawSql: `UPDATE lostreport SET status = 'Active' WHERE lost_id = ${lostId};\nCOMMIT;`,
    };
    setDb(nextDb);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, notifications, tx);
    showToast(`Kept ${formatLostRef(lostId)} active`, 'success');
  };

  // =================================================================
  // GENERIC 8-TABLE CRUD WITH CENTRAL FOREIGN-KEY INTEGRITY
  // =================================================================
  const checkForeignKeyReferences = (table: TableName, pkValue: number): number => {
    switch (table) {
      case 'person': {
        const lostRefs = db.lostreport.filter((r) => r.person_id === pkValue).length;
        const foundRefs = db.foundreport.filter((r) => r.person_id === pkValue).length;
        const claimRefs = db.claimrequest.filter((r) => r.person_id === pkValue).length;
        return lostRefs + foundRefs > 0 ? lostRefs + foundRefs : claimRefs;
      }
      case 'itemcategory': {
        const lostRefs = db.lostreport.filter((r) => r.category_id === pkValue).length;
        const foundRefs = db.foundreport.filter((r) => r.category_id === pkValue).length;
        return lostRefs + foundRefs;
      }
      case 'campuslocation': {
        const lostRefs = db.lostreport.filter((r) => r.location_id === pkValue).length;
        const foundRefs = db.foundreport.filter((r) => r.location_id === pkValue).length;
        return lostRefs + foundRefs;
      }
      case 'admin': {
        return db.claimrequest.filter((r) => r.admin_id === pkValue).length;
      }
      case 'lostreport': {
        return db.matchscore.filter((r) => r.lost_id === pkValue).length;
      }
      case 'foundreport': {
        return db.matchscore.filter((r) => r.found_id === pkValue).length;
      }
      case 'matchscore': {
        return db.claimrequest.filter((r) => r.match_id === pkValue).length;
      }
      case 'claimrequest':
        return 0;
    }
  };

  const insertTableRow = <T extends TableName>(
    table: T,
    rowData: Omit<DatabaseState[T][number], string>
  ): { ok: boolean; error?: string; row?: DatabaseState[T][number] } => {
    const pkField = PK_FIELD_MAP[table];
    const seqName = SEQ_NAME_MAP[table];

    // If inserting claimrequest, enforce trg_block_low_score_claim
    if (table === 'claimrequest') {
      const candidate = rowData as unknown as ClaimRequest;
      const m = db.matchscore.find((x) => x.match_id === Number(candidate.match_id));
      if (!m) return { ok: false, error: 'Referenced match_id does not exist' };
      if (m.total_score < 50) {
        const msg = 'Claim blocked: match score is below the minimum of 50';
        showToast(msg, 'error');
        return { ok: false, error: msg };
      }
    }

    // Check unique constraints
    if (table === 'person') {
      const p = rowData as unknown as Person;
      if (db.person.some((x) => x.reg_no.toLowerCase() === p.reg_no.trim().toLowerCase())) {
        const msg = `Registration number '${p.reg_no}' already exists (UQ_PERSON_REGNO)`;
        showToast(msg, 'error');
        return { ok: false, error: msg };
      }
    }
    if (table === 'itemcategory') {
      const c = rowData as unknown as { category_name: string };
      if (db.itemcategory.some((x) => x.category_name.toLowerCase() === c.category_name.trim().toLowerCase())) {
        const msg = `Category '${c.category_name}' already exists (UQ_CATEGORY_NAME)`;
        showToast(msg, 'error');
        return { ok: false, error: msg };
      }
    }
    if (table === 'campuslocation') {
      const l = rowData as unknown as { zone_name: string };
      if (db.campuslocation.some((x) => x.zone_name.toLowerCase() === l.zone_name.trim().toLowerCase())) {
        const msg = `Zone '${l.zone_name}' already exists (UQ_ZONE_NAME)`;
        showToast(msg, 'error');
        return { ok: false, error: msg };
      }
    }

    const nextId = db.sequences[table];
    const newRow = {
      ...rowData,
      [pkField]: nextId,
    } as unknown as DatabaseState[T][number];

    const nextDb: DatabaseState = {
      ...db,
      [table]: [...db[table], newRow],
      sequences: {
        ...db.sequences,
        [table]: nextId + 1,
      },
    };

    const cols = Object.keys(newRow as object);
    const vals = cols.map((k) => {
      if (k === pkField) return `${seqName}.NEXTVAL`;
      const v = (newRow as unknown as Record<string, unknown>)[k];
      if (v === null || v === undefined || v === '') return 'NULL';
      if (typeof v === 'number') return String(v);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return `DATE '${v}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
    });

    const tx: TransactionExplainerData = {
      id: `tx-crud-ins-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Insert into ${table.toUpperCase()} (${pkField}=${nextId})`,
      tablesAffected: [table.toUpperCase()],
      sqlComponent: `SQL INSERT with ${seqName}.NEXTVAL`,
      rowsChanged: `1 row inserted into ${table.toUpperCase()}`,
      resultProduced: `Created record ${pkField} = ${nextId}`,
      rawSql: `INSERT INTO ${table} (${cols.join(', ')})\nVALUES (${vals.join(', ')});\nCOMMIT;`,
    };

    setDb(nextDb);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, notifications, tx);
    void syncLiveApi('POST', table, newRow);
    showToast(`Inserted row #${nextId} into ${table.toUpperCase()}`, 'success');
    return { ok: true, row: newRow };
  };

  const updateTableRow = <T extends TableName>(
    table: T,
    pkValue: number,
    patch: Partial<DatabaseState[T][number]>
  ): { ok: boolean; error?: string } => {
    const pkField = PK_FIELD_MAP[table];

    // If claimrequest verification_status changes to Verified, run trg_claim_verified
    if (table === 'claimrequest') {
      const existing = db.claimrequest.find((c) => c.claim_id === pkValue);
      const nextStatus = (patch as Partial<ClaimRequest>).verification_status;
      if (existing && existing.verification_status !== 'Verified' && nextStatus === 'Verified') {
        const adminId = (patch as Partial<ClaimRequest>).admin_id ?? existing.admin_id ?? 1;
        return verifyClaimAction(pkValue, adminId);
      }
    }

    const updatedList = db[table].map((row) => {
      const id = (row as unknown as Record<string, unknown>)[pkField];
      if (id === pkValue) {
        return { ...row, ...patch };
      }
      return row;
    });

    const nextDb: DatabaseState = {
      ...db,
      [table]: updatedList,
    };

    const setClauses = Object.entries(patch)
      .filter(([k]) => k !== pkField)
      .map(([k, v]) => {
        if (v === null || v === undefined || v === '') return `${k} = NULL`;
        if (typeof v === 'number') return `${k} = ${v}`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return `${k} = DATE '${v}'`;
        return `${k} = '${String(v).replace(/'/g, "''")}'`;
      });

    const tx: TransactionExplainerData = {
      id: `tx-crud-upd-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Update ${table.toUpperCase()} where ${pkField} = ${pkValue}`,
      tablesAffected: [table.toUpperCase()],
      sqlComponent: 'SQL UPDATE statement',
      rowsChanged: `1 row updated in ${table.toUpperCase()}`,
      resultProduced: `Updated ${pkField} = ${pkValue}`,
      rawSql: `UPDATE ${table}\nSET ${setClauses.join(', ')}\nWHERE ${pkField} = ${pkValue};\nCOMMIT;`,
    };

    setDb(nextDb);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, notifications, tx);
    void syncLiveApi('PUT', `${table}/${pkValue}`, patch);
    showToast(`Updated ${table.toUpperCase()} #${pkValue}`, 'success');
    return { ok: true };
  };

  const deleteTableRow = <T extends TableName>(
    table: T,
    pkValue: number
  ): { ok: boolean; error?: string } => {
    const pkField = PK_FIELD_MAP[table];
    const refCount = checkForeignKeyReferences(table, pkValue);

    if (refCount > 0) {
      const msg = `This is used by ${refCount} ${refCount === 1 ? 'report' : 'reports'}`;
      const tx: TransactionExplainerData = {
        id: `tx-fk-block-${Date.now()}`,
        timestamp: getNowTimeStr(),
        userOperation: `Attempt Delete on ${table.toUpperCase()} (${pkField}=${pkValue})`,
        tablesAffected: [table.toUpperCase()],
        sqlComponent: 'Oracle Foreign Key Constraint Check (ORA-02292)',
        rowsChanged: '0 rows deleted (blocked by foreign key integrity)',
        resultProduced: msg,
        rawSql: `DELETE FROM ${table} WHERE ${pkField} = ${pkValue};\n-- ORA-02292: integrity constraint violated - child record found (${msg})`,
      };
      setLastTransaction(tx);
      showToast(msg, 'error');
      return { ok: false, error: msg };
    }

    const filtered = db[table].filter(
      (row) => (row as unknown as Record<string, unknown>)[pkField] !== pkValue
    );

    const nextDb: DatabaseState = {
      ...db,
      [table]: filtered,
    };

    const tx: TransactionExplainerData = {
      id: `tx-crud-del-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: `Delete from ${table.toUpperCase()} where ${pkField} = ${pkValue}`,
      tablesAffected: [table.toUpperCase()],
      sqlComponent: 'SQL DELETE statement',
      rowsChanged: `1 row deleted from ${table.toUpperCase()}`,
      resultProduced: `Deleted ${pkField} = ${pkValue}`,
      rawSql: `DELETE FROM ${table} WHERE ${pkField} = ${pkValue};\nCOMMIT;`,
    };

    setDb(nextDb);
    setLastTransaction(tx);
    broadcastUpdate(nextDb, notifications, tx);
    void syncLiveApi('DELETE', `${table}/${pkValue}`);
    showToast(`Deleted #${pkValue} from ${table.toUpperCase()}`, 'info');
    return { ok: true };
  };

  // =================================================================
  // MODULES & QUERIES EXECUTION + UNDO
  // =================================================================
  const runQueryById = (queryId: string): QueryExecutionResult => {
    const res = executeRegisteredQuery(queryId, db);
    if (res.isDml && res.newState) {
      if (!dmlUndoSnapshot) {
        setDmlUndoSnapshot(db);
      }
      setDb(res.newState);
      broadcastUpdate(res.newState, notifications, res.explainer);
      showToast(`${queryId}: ${res.affectedMessage}`, 'success');
    } else {
      showToast(`${queryId}: ${res.rowCount} row(s) returned`, 'info');
    }
    setLastTransaction(res.explainer);
    return res;
  };

  const undoLastDml = () => {
    if (!dmlUndoSnapshot) return;
    setDb(dmlUndoSnapshot);
    setDmlUndoSnapshot(null);
    const tx: TransactionExplainerData = {
      id: `tx-undo-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: 'Rollback Module DML Demo Changes',
      tablesAffected: ['LOSTREPORT', 'CLAIMREQUEST'],
      sqlComponent: 'SQL ROLLBACK TO SAVEPOINT before_module_dml',
      rowsChanged: 'Restored pre-demo table rows',
      resultProduced: 'Database state restored cleanly',
      rawSql: 'ROLLBACK;',
    };
    setLastTransaction(tx);
    broadcastUpdate(dmlUndoSnapshot, notifications, tx);
    showToast('Restored database state before DML demo', 'info');
  };

  const resetToReportDataset = () => {
    const seed = getSeedDatabaseState();
    const seedNotifs = buildInitialNotifications(seed);
    setDb(seed);
    setDmlUndoSnapshot(null);
    setNotifications(seedNotifs);
    const tx: TransactionExplainerData = {
      id: `tx-reset-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: 'Reset Database to Report Seed Dataset',
      tablesAffected: ['PERSON', 'ITEMCATEGORY', 'CAMPUSLOCATION', 'ADMIN', 'LOSTREPORT', 'FOUNDREPORT', 'MATCHSCORE', 'CLAIMREQUEST'],
      sqlComponent: '01_ddl.sql + 02_data.sql (Reset Sequences to 101)',
      rowsChanged: 'All 8 tables restored to exact BACSE202 report dataset',
      resultProduced: '12 Persons, 16 Categories, 10 Locations, 10 Admins, 12 Lost, 13 Found, 10 Matches, 10 Claims',
      rawSql: '-- Executed 02_data.sql seed script\nCOMMIT;',
    };
    setLastTransaction(tx);
    broadcastUpdate(seed, seedNotifs, tx);
    showToast('Reset to BACSE202 report dataset', 'success');
  };

  const startWithEmptyDatabase = () => {
    const empty = getEmptyDatabaseState();
    setDb(empty);
    setDmlUndoSnapshot(null);
    setNotifications([]);
    const tx: TransactionExplainerData = {
      id: `tx-empty-${Date.now()}`,
      timestamp: getNowTimeStr(),
      userOperation: 'Start with Empty Transactional Tables',
      tablesAffected: ['PERSON', 'LOSTREPORT', 'FOUNDREPORT', 'MATCHSCORE', 'CLAIMREQUEST'],
      sqlComponent: 'TRUNCATE TABLE claimrequest, matchscore, foundreport, lostreport, person',
      rowsChanged: 'Cleared transactional tables; kept reference lookups (categories, zones, admins)',
      resultProduced: 'Empty database ready for fresh entries (sequences at 101)',
      rawSql: 'TRUNCATE TABLE claimrequest;\nTRUNCATE TABLE matchscore;\nTRUNCATE TABLE foundreport;\nTRUNCATE TABLE lostreport;\nCOMMIT;',
    };
    setLastTransaction(tx);
    broadcastUpdate(empty, [], tx);
    showToast('Started with empty database', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        db,
        role,
        setRole,
        showRoleModal,
        setShowRoleModal,
        activeTab,
        setActiveTab,
        selectedStudentPersonId,
        setSelectedStudentPersonId,
        theme,
        toggleTheme,
        dataMode,
        setDataMode,
        apiBaseUrl,
        setApiBaseUrl,
        apiConnected,
        lastUpdated,
        showSqlBar,
        setShowSqlBar,
        lastTransaction,
        setLastTransaction,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        formDraft,
        updateFormDraft,
        resetFormDraft,
        prefillLostFromFound,
        toast,
        showToast,
        submitReportFromDraft,
        computeMatchScoreAction,
        runAllMatchingAction,
        raiseClaimAction,
        verifyClaimAction,
        rejectClaimAction,
        markHandedOverAction,
        closeLostReportAction,
        keepLookingLostReportAction,
        insertTableRow,
        updateTableRow,
        deleteTableRow,
        runQueryById,
        canUndoDml: dmlUndoSnapshot !== null,
        undoLastDml,
        resetToReportDataset,
        startWithEmptyDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
