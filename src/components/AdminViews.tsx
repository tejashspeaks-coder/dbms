import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  PackageCheck,
  Play,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { diffDays, getTodayDateStr } from '../queryRunner';
import {
  explainMatchInWords,
  formatClaimRef,
  formatFoundRef,
  formatLostRef,
  useStore,
} from '../store';
import { CategoryIconBadge, ScoreRing, StatusLabel } from './IconsAndGraphics';
import { HandoverSlipModal } from './HandoverSlipModal';

export const SubScoreBars: React.FC<{
  categoryScore: number;
  locationScore: number;
  dateScore: number;
  descriptionScore: number;
}> = ({ categoryScore, locationScore, dateScore, descriptionScore }) => {
  const bars = [
    { label: 'Category', val: categoryScore, max: 40, color: 'var(--indigo)' },
    { label: 'Location', val: locationScore, max: 20, color: 'var(--teal)' },
    { label: 'Date', val: dateScore, max: 20, color: 'var(--amber)' },
    { label: 'Keywords', val: descriptionScore, max: 20, color: 'var(--green)' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
      {bars.map((b) => (
        <div
          key={b.label}
          className="p-2.5 rounded-xl border space-y-1.5"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: 'var(--muted)' }}>{b.label}</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {b.val}/{b.max}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--raised)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(b.val / b.max) * 100}%`, backgroundColor: b.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ADMIN HOME (WORK QUEUE)
// ============================================================================
export const AdminHome: React.FC = () => {
  const {
    db,
    runAllMatchingAction,
    verifyClaimAction,
    raiseClaimAction,
    insertTableRow,
    setActiveTab,
    showToast,
  } = useStore();

  const [selectedAdminId, setSelectedAdminId] = useState<number>(3); // Mohan Raj default or pickable
  const [lastBatchMsg, setLastBatchMsg] = useState<string | null>(null);
  const [showQuickFoundForm, setShowQuickFoundForm] = useState(true);
  const [quickFoundCat, setQuickFoundCat] = useState<number>(4);
  const [quickFoundLoc, setQuickFoundLoc] = useState<number>(1);
  const [quickFoundDesc, setQuickFoundDesc] = useState('');
  const [quickFoundStorage, setQuickFoundStorage] = useState('Admin Office Shelf A');
  const sysdate = getTodayDateStr();

  const pendingClaims = db.claimrequest.filter((c) => c.verification_status === 'Pending');
  const unclaimedOver60Days = db.foundreport
    .map((f) => ({ ...f, daysStored: diffDays(sysdate, f.date_found) }))
    .filter((f) => f.status === 'Unclaimed' && f.daysStored > 60)
    .sort((a, b) => b.daysStored - a.daysStored);

  const claimedMatchIds = new Set(db.claimrequest.map((c) => c.match_id));
  const newPossibleMatches = db.matchscore
    .filter((m) => m.total_score >= 50 && !claimedMatchIds.has(m.match_id))
    .sort((a, b) => b.total_score - a.total_score);

  const handleRunMatching = () => {
    const res = runAllMatchingAction();
    setLastBatchMsg(res.message);
  };

  const handleBatchVerifyAll = () => {
    pendingClaims.forEach((c) => {
      verifyClaimAction(c.claim_id, selectedAdminId);
    });
    showToast(`Verified ${pendingClaims.length} pending claim(s)`, 'success');
  };

  const handleQuickFoundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = db.itemcategory.find((c) => c.category_id === quickFoundCat)?.category_name || 'Campus item';
    const locName = db.campuslocation.find((l) => l.location_id === quickFoundLoc)?.zone_name || 'Central Library';
    const finalDesc = quickFoundDesc.trim() || `${catName.toLowerCase()} handed in from ${locName}`;

    const res = insertTableRow('foundreport', {
      person_id: 1,
      category_id: quickFoundCat,
      location_id: quickFoundLoc,
      date_found: sysdate,
      description: finalDesc,
      storage_location: quickFoundStorage.trim() || 'Admin Office Shelf A',
      status: 'Unclaimed',
    });
    if (res.ok) {
      setQuickFoundDesc('');
      setLastBatchMsg(`Stored Found Item "${finalDesc}" & ran automatic match scan.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Admin Selector, Quick Log Found Item & Run Matching Button */}
      <div
        className="rounded-[20px] border p-6 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--teal)' }}>
              Campus Lost & Found Administration
            </div>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
              Officer Work Queue
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Review pending claims, log desk items in 1 click, run batch PL/SQL matching, and manage 60-day compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <label htmlFor="admin-officer-select" className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                Active Officer:
              </label>
              <select
                id="admin-officer-select"
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(Number(e.target.value))}
                className="h-10 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.admin.map((a) => (
                  <option key={a.admin_id} value={a.admin_id}>
                    #{a.admin_id} {a.name} ({a.designation})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickFoundForm((p) => !p)}
              className="h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: showQuickFoundForm ? 'var(--teal-soft)' : 'var(--raised)',
                borderColor: showQuickFoundForm ? 'var(--teal)' : 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <span>{showQuickFoundForm ? '✕ Close Desk Form' : '+ Quick Log Found Item'}</span>
            </button>

            <button
              type="button"
              onClick={handleRunMatching}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-95"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              <Play size={14} />
              <span>Run Matching</span>
            </button>
          </div>
        </div>

        {/* Quick Desk Found Item Drawer */}
        {showQuickFoundForm && (
          <form
            onSubmit={handleQuickFoundSubmit}
            className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
          >
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Category
              </label>
              <select
                value={quickFoundCat}
                onChange={(e) => setQuickFoundCat(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.itemcategory.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Found Zone
              </label>
              <select
                value={quickFoundLoc}
                onChange={(e) => setQuickFoundLoc(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.campuslocation.map((z) => (
                  <option key={z.location_id} value={z.location_id}>
                    {z.zone_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Item Description
              </label>
              <input
                type="text"
                value={quickFoundDesc}
                onChange={(e) => setQuickFoundDesc(e.target.value)}
                placeholder="e.g. black leather wallet"
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Storage Desk / Shelf
              </label>
              <input
                type="text"
                value={quickFoundStorage}
                onChange={(e) => setQuickFoundStorage(e.target.value)}
                placeholder="Admin Office Shelf A"
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <button
              type="submit"
              className="h-9 px-4 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--teal)' }}
            >
              Save &amp; Auto-Match
            </button>
          </form>
        )}
      </div>

      {lastBatchMsg && (
        <div
          className="rounded-2xl border px-5 py-3.5 flex items-center justify-between text-xs font-semibold"
          style={{ backgroundColor: 'var(--indigo-soft)', borderColor: 'var(--indigo)', color: 'var(--text)' }}
        >
          <span>PL/SQL Cursor run_all_matching completed — {lastBatchMsg}</span>
          <button
            type="button"
            onClick={() => setLastBatchMsg(null)}
            className="text-xs cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Three Work Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue 1: Claims Waiting */}
        <div
          className="rounded-[20px] border p-5 flex flex-col justify-between space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={17} style={{ color: 'var(--amber)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Claims Waiting ({pendingClaims.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {pendingClaims.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchVerifyAll}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border cursor-pointer"
                    style={{ backgroundColor: 'var(--teal-soft)', borderColor: 'var(--teal)', color: 'var(--text)' }}
                  >
                    Verify all ({pendingClaims.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('claims')}
                  className="text-xs font-semibold cursor-pointer hover:underline"
                  style={{ color: 'var(--indigo)' }}
                >
                  View all
                </button>
              </div>
            </div>

            {pendingClaims.length === 0 ? (
              <div className="p-6 rounded-2xl border text-center text-xs" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                All pending claims have been reviewed.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingClaims.map((c) => {
                  const person = db.person.find((p) => p.person_id === c.person_id);
                  const match = db.matchscore.find((m) => m.match_id === c.match_id);
                  const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
                  return (
                    <div
                      key={c.claim_id}
                      className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                          {formatClaimRef(c.claim_id)} · Score {match?.total_score}
                        </div>
                        <div className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--text)' }}>
                          {lost?.description}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {person?.name} · {c.claim_date}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => verifyClaimAction(c.claim_id, selectedAdminId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0 cursor-pointer"
                        style={{ backgroundColor: 'var(--teal)' }}
                      >
                        Verify
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Queue 2: Items Stored Over 60 Days ("Dispose or donate") */}
        <div
          className="rounded-[20px] border p-5 flex flex-col justify-between space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} style={{ color: 'var(--red)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Stored Over 60 Days ({unclaimedOver60Days.length})
                </h2>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                Dispose or donate
              </span>
            </div>

            {unclaimedOver60Days.length === 0 ? (
              <div className="p-6 rounded-2xl border text-center text-xs" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                No unclaimed items exceed the 60-day threshold.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {unclaimedOver60Days.map((f) => (
                  <div
                    key={f.found_id}
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold" style={{ color: 'var(--red)' }}>
                        {formatFoundRef(f.found_id)} · {f.daysStored}d stored · Dispose or donate
                      </div>
                      <div className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--text)' }}>
                        {f.description}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {f.storage_location}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        showToast(`${formatFoundRef(f.found_id)} logged for campus donation/disposal review`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 cursor-pointer"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Flag action
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Queue 3: New Possible Matches Without Claims */}
        <div
          className="rounded-[20px] border p-5 flex flex-col justify-between space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={17} style={{ color: 'var(--indigo)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Unclaimed Matches ({newPossibleMatches.length})
                </h2>
              </div>
            </div>

            {newPossibleMatches.length === 0 ? (
              <div className="p-6 rounded-2xl border text-center text-xs space-y-2" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <div>All current 50+ matches already have a claim request.</div>
                <div>Click &ldquo;Run Matching&rdquo; after new reports arrive.</div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {newPossibleMatches.map((m) => {
                  const lost = db.lostreport.find((l) => l.lost_id === m.lost_id);
                  const found = db.foundreport.find((f) => f.found_id === m.found_id);
                  const owner = db.person.find((p) => p.person_id === lost?.person_id);
                  return (
                    <div
                      key={m.match_id}
                      className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                          Match #{m.match_id} · Score {m.total_score}
                        </div>
                        <div className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--text)' }}>
                          {lost?.description} ↔ {found?.description}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          Owner: {owner?.name}
                        </div>
                      </div>
                      {lost && (
                        <button
                          type="button"
                          onClick={() => raiseClaimAction(m.match_id, lost.person_id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0 cursor-pointer"
                          style={{ backgroundColor: 'var(--indigo)' }}
                        >
                          Raise claim
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 30-Day Visual Summary & Recovery Analytics */}
      <AdminVisualSummary />
    </div>
  );
};

// ============================================================================
// ADMIN 30-DAY VISUAL SUMMARY COMPONENT (RECHARTS)
// ============================================================================
export const AdminVisualSummary: React.FC = () => {
  const { db } = useStore();
  const [timelineScope, setTimelineScope] = useState<'active' | 'full30'>('active');

  const sysdate = getTodayDateStr();

  const summaryData = useMemo(() => {
    // Build a 30-day calendar window ending at sysdate
    const [sy, sm, sd] = sysdate.split('-').map(Number);
    const endUtc = Date.UTC(sy, sm - 1, sd);
    const calendarDays: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(endUtc - i * 86400000);
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      calendarDays.push(`${y}-${m}-${d}`);
    }

    const windowStart = calendarDays[0];

    // Filter reports in the last 30 days
    const lost30 = db.lostreport.filter((l) => l.date_lost >= windowStart && l.date_lost <= sysdate);
    const found30 = db.foundreport.filter((f) => f.date_found >= windowStart && f.date_found <= sysdate);
    const claims30 = db.claimrequest.filter((c) => c.claim_date >= windowStart && c.claim_date <= sysdate);

    let cumFound = 0;
    let cumRecovered = 0; // Returned or Claimed
    let cumLost = 0;
    let cumResolved = 0; // Closed

    const dailySeries = calendarDays.map((dateStr) => {
      const dayLost = db.lostreport.filter((l) => l.date_lost === dateStr);
      const dayFound = db.foundreport.filter((f) => f.date_found === dateStr);
      const dayReturnedOrClaimed = dayFound.filter(
        (f) => f.status === 'Returned' || f.status === 'Claimed'
      ).length;
      const dayResolvedLost = dayLost.filter((l) => l.status === 'Closed').length;

      cumFound += dayFound.length;
      cumRecovered += dayReturnedOrClaimed;
      cumLost += dayLost.length;
      cumResolved += dayResolvedLost;

      const recoveryRate = cumFound > 0 ? Math.round((cumRecovered / cumFound) * 1000) / 10 : 0;
      const resolutionRate = cumLost > 0 ? Math.round((cumResolved / cumLost) * 1000) / 10 : 0;

      return {
        fullDate: dateStr,
        date: dateStr.slice(5), // MM-DD
        Lost: dayLost.length,
        Found: dayFound.length,
        Recovered: dayReturnedOrClaimed,
        recoveryRate,
        resolutionRate,
        hasActivity: dayLost.length > 0 || dayFound.length > 0,
      };
    });

    const activeSeries = dailySeries.filter((d) => d.hasActivity);

    // Overall 30-day KPIs
    const totalFoundCount = found30.length;
    const returnedCount = found30.filter((f) => f.status === 'Returned').length;
    const claimedCount = found30.filter((f) => f.status === 'Claimed').length;
    const recoveredCount = returnedCount + claimedCount;
    const overallRecoveryRate =
      totalFoundCount > 0 ? Math.round((recoveredCount / totalFoundCount) * 1000) / 10 : 0;
    const strictHandoverRate =
      totalFoundCount > 0 ? Math.round((returnedCount / totalFoundCount) * 1000) / 10 : 0;

    const verifiedClaimsCount = claims30.filter((c) => c.verification_status === 'Verified').length;

    // Zone recovery breakdown over the last 30 days
    const zoneRecovery = db.campuslocation
      .map((z) => {
        const zFound = found30.filter((f) => f.location_id === z.location_id);
        const zLost = lost30.filter((l) => l.location_id === z.location_id);
        const recovered = zFound.filter((f) => f.status === 'Returned' || f.status === 'Claimed').length;
        const unclaimed = zFound.filter((f) => f.status === 'Unclaimed').length;
        return {
          zone: z.zone_name.replace('Department', 'Dept').replace('Central ', ''),
          Recovered: recovered,
          Unclaimed: unclaimed,
          Lost: zLost.length,
          total: zFound.length + zLost.length,
        };
      })
      .filter((z) => z.total > 0);

    return {
      dailySeries,
      activeSeries: activeSeries.length > 0 ? activeSeries : dailySeries.slice(-7),
      totalReports30: lost30.length + found30.length,
      lostCount30: lost30.length,
      foundCount30: found30.length,
      overallRecoveryRate,
      strictHandoverRate,
      recoveredCount,
      returnedCount,
      verifiedClaimsCount,
      totalClaims30: claims30.length,
      zoneRecovery,
    };
  }, [db.lostreport, db.foundreport, db.claimrequest, db.campuslocation, sysdate]);

  const chartSeries = timelineScope === 'active' ? summaryData.activeSeries : summaryData.dailySeries;

  return (
    <section
      className="rounded-[20px] border p-6 space-y-6"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header & 30-Day View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={18} style={{ color: 'var(--teal)' }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              30-Day Campus Activity & Recovery Trends
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Live derived analytics for daily item reports, claim verifications, and successful recovery rates.
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setTimelineScope('active')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
            style={{
              backgroundColor: timelineScope === 'active' ? 'var(--card)' : 'transparent',
              color: 'var(--text)',
            }}
          >
            Active Days
          </button>
          <button
            type="button"
            onClick={() => setTimelineScope('full30')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
            style={{
              backgroundColor: timelineScope === 'full30' ? 'var(--card)' : 'transparent',
              color: 'var(--text)',
            }}
          >
            Full 30 Days
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className="p-4 rounded-2xl border space-y-1"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Reports (Last 30 Days)
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
            {summaryData.totalReports30}
          </div>
          <div className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            <span style={{ color: 'var(--indigo)' }}>{summaryData.lostCount30} Lost</span> ·{' '}
            <span style={{ color: 'var(--teal)' }}>{summaryData.foundCount30} Found</span>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border space-y-1"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Successful Recovery Rate
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--teal)' }}>
            {summaryData.overallRecoveryRate}%
          </div>
          <div className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            {summaryData.recoveredCount} of {summaryData.foundCount30} claimed/returned ({summaryData.strictHandoverRate}% handed over)
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border space-y-1"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Verified Claims (30d)
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--green)' }}>
            {summaryData.verifiedClaimsCount}
          </div>
          <div className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            Out of {summaryData.totalClaims30} total claim requests
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border space-y-1"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Physical Handovers
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--indigo)' }}>
            {summaryData.returnedCount}
          </div>
          <div className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            Items marked Returned to owners
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Daily Item Reports (Lost vs Found) */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              Daily Item Reports (Lost vs Found)
            </h3>
            <BarChart3 size={14} style={{ color: 'var(--indigo)' }} />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSeries} margin={{ top: 6, right: 8, left: -22, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                <Bar dataKey="Lost" name="Lost Reports" fill="var(--indigo)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Found" name="Found Reports" fill="var(--teal)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cumulative Recovery & Resolution Rate (%) Over 30 Days */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              Cumulative Recovery & Resolution Rate (%)
            </h3>
            <TrendingUp size={14} style={{ color: 'var(--teal)' }} />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 6, right: 10, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value}%`, undefined]}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                <Area
                  type="monotone"
                  dataKey="recoveryRate"
                  name="Found Recovery %"
                  stroke="var(--teal)"
                  fill="var(--teal-soft)"
                  strokeWidth={2.2}
                />
                <Area
                  type="monotone"
                  dataKey="resolutionRate"
                  name="Lost Resolved %"
                  stroke="var(--indigo)"
                  fill="var(--indigo-soft)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Recovery Outcome by Campus Zone (30d) */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              Zone Recovery vs Unclaimed (30d)
            </h3>
            <ShieldCheck size={14} style={{ color: 'var(--green)' }} />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaryData.zoneRecovery}
                margin={{ top: 6, right: 8, left: -22, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="zone"
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                <Bar
                  dataKey="Recovered"
                  name="Recovered (Claimed/Returned)"
                  stackId="found"
                  fill="var(--teal)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Unclaimed"
                  name="Waiting (Unclaimed)"
                  stackId="found"
                  fill="var(--amber)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// ADMIN CLAIMS REVIEW TAB (Verify / Reject with reason, Sub-score bars)
// ============================================================================
export const AdminClaimsView: React.FC = () => {
  const { db, verifyClaimAction, rejectClaimAction } = useStore();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [selectedAdminId, setSelectedAdminId] = useState<number>(3);
  const [rejectingClaimId, setRejectingClaimId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [slipClaimId, setSlipClaimId] = useState<number | null>(null);

  const filteredClaims = db.claimrequest
    .filter((c) => (statusFilter === 'All' ? true : c.verification_status === statusFilter))
    .sort((a, b) => a.claim_id - b.claim_id);

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Claim Verification & Review
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Verifying a claim triggers trg_claim_verified: Found item becomes Claimed and Lost report becomes Closed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(Number(e.target.value))}
            aria-label="Select reviewing admin"
            className="h-9 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {db.admin.map((a) => (
              <option key={a.admin_id} value={a.admin_id}>
                Reviewer: #{a.admin_id} {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            {(['All', 'Pending', 'Verified', 'Rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: statusFilter === st ? 'var(--card)' : 'transparent',
                  color: 'var(--text)',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredClaims.map((claim) => {
          const match = db.matchscore.find((m) => m.match_id === claim.match_id);
          const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
          const found = db.foundreport.find((f) => f.found_id === match?.found_id);
          const claimant = db.person.find((p) => p.person_id === claim.person_id);
          const reviewer = claim.admin_id ? db.admin.find((a) => a.admin_id === claim.admin_id) : null;
          const loc = db.campuslocation.find((z) => z.location_id === found?.location_id);
          const reasons =
            match && lost && found ? explainMatchInWords(match, lost, found, loc?.zone_name) : [];

          return (
            <div
              key={claim.claim_id}
              className="rounded-[20px] border p-6 space-y-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold" style={{ color: 'var(--indigo)' }}>
                      {formatClaimRef(claim.claim_id)} (claim_id: {claim.claim_id})
                    </span>
                    <span style={{ color: 'var(--muted)' }}>·</span>
                    <span style={{ color: 'var(--muted)' }}>match_id: {claim.match_id}</span>
                    <span style={{ color: 'var(--muted)' }}>·</span>
                    <span style={{ color: 'var(--muted)' }}>Raised {claim.claim_date}</span>
                  </div>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}>
                    Claimant: {claimant?.name} ({claimant?.reg_no} · {claimant?.phone})
                  </div>
                  {reviewer && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      Reviewed by: #{reviewer.admin_id} {reviewer.name} ({reviewer.designation})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusLabel kind="claim" status={claim.verification_status} />
                  {claim.verification_status === 'Verified' && (
                    <button
                      type="button"
                      onClick={() => setSlipClaimId(claim.claim_id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: 'var(--teal)' }}
                    >
                      <FileCheck2 size={14} />
                      <span>Handover Slip</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Match Pair Comparison + ScoreRing */}
              {match && lost && found && (
                <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    <div className="md:col-span-4 space-y-1">
                      <div className="text-[11px] font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                        LOST: {formatLostRef(lost.lost_id)} (status: {lost.status})
                      </div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {lost.description}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        Date lost: {lost.date_lost}
                      </div>
                    </div>

                    <div className="md:col-span-3 flex justify-center">
                      <ScoreRing score={match.total_score} size={56} showLabel />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <div className="text-[11px] font-mono font-semibold" style={{ color: 'var(--teal)' }}>
                        FOUND: {formatFoundRef(found.found_id)} (status: {found.status})
                      </div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {found.description}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        Stored at: {found.storage_location} · Found {found.date_found}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs pt-1" style={{ color: 'var(--muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>Match reasons:</strong> {reasons.join(' · ')}
                  </div>

                  {/* Four sub-score bars (Admin and Developer views only) */}
                  <SubScoreBars
                    categoryScore={match.category_score}
                    locationScore={match.location_score}
                    dateScore={match.date_score}
                    descriptionScore={match.description_score}
                  />
                </div>
              )}

              {/* Verify / Reject Controls for Pending Claims */}
              {claim.verification_status === 'Pending' && (
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                  {rejectingClaimId === claim.claim_id ? (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="h-9 px-3 rounded-xl border text-xs outline-none flex-1 sm:w-64"
                        style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          rejectClaimAction(claim.claim_id, selectedAdminId, rejectReason);
                          setRejectingClaimId(null);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                        style={{ backgroundColor: 'var(--red)' }}
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingClaimId(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => verifyClaimAction(claim.claim_id, selectedAdminId)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                        style={{ backgroundColor: 'var(--teal)' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Verify Claim</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingClaimId(claim.claim_id)}
                        className="px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <HandoverSlipModal claimId={slipClaimId} onClose={() => setSlipClaimId(null)} />
    </div>
  );
};

// ============================================================================
// ADMIN ALL REPORTS TAB (with Download Report print-friendly PDF generator)
// ============================================================================
export const AdminAllReportsView: React.FC = () => {
  const {
    db,
    theme,
    showToast,
    lastUpdated,
    closeLostReportAction,
    raiseClaimAction,
    updateTableRow,
  } = useStore();
  const isDark = theme === 'dark';
  const [viewKind, setViewKind] = useState<'lost' | 'found' | 'matches'>('lost');
  const [search, setSearch] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const sysdate = getTodayDateStr();

  // Derived System Activity Summary Metrics for the Print Report
  const activeLostCount = db.lostreport.filter((l) => l.status === 'Active').length;
  const matchedLostCount = db.lostreport.filter((l) => l.status === 'Matched').length;
  const closedLostCount = db.lostreport.filter((l) => l.status === 'Closed').length;

  const unclaimedFoundCount = db.foundreport.filter((f) => f.status === 'Unclaimed').length;
  const claimedFoundCount = db.foundreport.filter((f) => f.status === 'Claimed').length;
  const returnedFoundCount = db.foundreport.filter((f) => f.status === 'Returned').length;
  const recoveryPercent =
    db.foundreport.length > 0
      ? Math.round(((returnedFoundCount + claimedFoundCount) / db.foundreport.length) * 1000) / 10
      : 0;

  const pendingClaimsCount = db.claimrequest.filter((c) => c.verification_status === 'Pending').length;
  const verifiedClaimsCount = db.claimrequest.filter((c) => c.verification_status === 'Verified').length;
  const rejectedClaimsCount = db.claimrequest.filter((c) => c.verification_status === 'Rejected').length;

  const highConfidenceMatches = db.matchscore
    .filter((m) => m.total_score >= 50)
    .sort((a, b) => b.total_score - a.total_score);

  const handleDownloadReport = () => {
    showToast('Opening print-to-PDF dialog for System Activity Summary Report', 'info');
    window.setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleExportCsv = () => {
    let csv = '';
    let filename = `findit_${viewKind}_reports_${sysdate}.csv`;
    if (viewKind === 'lost') {
      csv = 'Ref,Description,Category,Zone,Owner,RegNo,DateLost,Status\n';
      db.lostreport.forEach((l) => {
        const p = db.person.find((x) => x.person_id === l.person_id);
        const c = db.itemcategory.find((x) => x.category_id === l.category_id);
        const z = db.campuslocation.find((x) => x.location_id === l.location_id);
        csv += `"${formatLostRef(l.lost_id)}","${l.description}","${c?.category_name || ''}","${z?.zone_name || ''}","${p?.name || ''}","${p?.reg_no || ''}","${l.date_lost}","${l.status}"\n`;
      });
    } else if (viewKind === 'found') {
      csv = 'Ref,Description,Category,Zone,StorageLocation,Finder,DateFound,Status\n';
      db.foundreport.forEach((f) => {
        const p = db.person.find((x) => x.person_id === f.person_id);
        const c = db.itemcategory.find((x) => x.category_id === f.category_id);
        const z = db.campuslocation.find((x) => x.location_id === f.location_id);
        csv += `"${formatFoundRef(f.found_id)}","${f.description}","${c?.category_name || ''}","${z?.zone_name || ''}","${f.storage_location}","${p?.name || ''}","${f.date_found}","${f.status}"\n`;
      });
    } else {
      csv = 'MatchID,LostRef,FoundRef,CategoryScore,LocationScore,DateScore,KeywordScore,TotalScore\n';
      db.matchscore.forEach((m) => {
        csv += `${m.match_id},"${formatLostRef(m.lost_id)}","${formatFoundRef(m.found_id)}",${m.category_score},${m.location_score},${m.date_score},${m.description_score},${m.total_score}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Interactive Controls Bar (hidden when printing) */}
      <div
        className="rounded-[20px] border p-6 flex flex-wrap items-center justify-between gap-4 no-print"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-2 p-1 rounded-xl border"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setViewKind('lost')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: viewKind === 'lost' ? 'var(--card)' : 'transparent', color: 'var(--text)' }}
            >
              Lost Reports ({db.lostreport.length})
            </button>
            <button
              type="button"
              onClick={() => setViewKind('found')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: viewKind === 'found' ? 'var(--card)' : 'transparent', color: 'var(--text)' }}
            >
              Found Reports ({db.foundreport.length})
            </button>
            <button
              type="button"
              onClick={() => setViewKind('matches')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: viewKind === 'matches' ? 'var(--card)' : 'transparent', color: 'var(--text)' }}
            >
              Match Scores ({db.matchscore.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3.5 top-2.5" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter descriptions..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs outline-none"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintPreview((p) => !p)}
            className="h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Printer size={14} />
            <span>{showPrintPreview ? 'Hide Print Preview' : 'Preview Summary'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-95 whitespace-nowrap"
            style={{ backgroundColor: 'var(--indigo)' }}
          >
            <Download size={14} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* PRINT-FRIENDLY SYSTEM ACTIVITY SUMMARY DOCUMENT (Shown on print or when Preview is toggled) */}
      <div
        className={`${showPrintPreview ? 'block' : 'print-only'} rounded-[20px] border p-6 md:p-8 space-y-6`}
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Document Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--indigo)' }}>
              Vellore Institute of Technology · Course BACSE202
            </div>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
              FindIt — Campus Lost &amp; Found System Activity Summary
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Prepared by Tejash Raj (25BDE0062) and Soham Sharma (25BDE0030) · Generated on {sysdate} at {lastUpdated}
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--teal)' }}
            >
              <Printer size={13} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Section 1: Executive KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print-break-inside-avoid">
          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div style={{ color: 'var(--muted)' }}>Total Lost Reports</div>
            <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--indigo)' }}>
              {db.lostreport.length}
            </div>
            <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--muted)' }}>
              {activeLostCount} Active · {matchedLostCount} Matched · {closedLostCount} Closed
            </div>
          </div>

          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div style={{ color: 'var(--muted)' }}>Total Found Reports</div>
            <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--teal)' }}>
              {db.foundreport.length}
            </div>
            <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--muted)' }}>
              {unclaimedFoundCount} Unclaimed · {claimedFoundCount} Claimed · {returnedFoundCount} Returned
            </div>
          </div>

          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div style={{ color: 'var(--muted)' }}>Recovery Rate</div>
            <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--green)' }}>
              {recoveryPercent}%
            </div>
            <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--muted)' }}>
              {returnedFoundCount + claimedFoundCount} of {db.foundreport.length} items claimed/returned
            </div>
          </div>

          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div style={{ color: 'var(--muted)' }}>Claims &amp; Matches</div>
            <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
              {db.claimrequest.length} Claims · {highConfidenceMatches.length} Matches
            </div>
            <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--muted)' }}>
              {verifiedClaimsCount} Verified · {pendingClaimsCount} Pending · {rejectedClaimsCount} Rejected
            </div>
          </div>
        </div>

        {/* Section 2: Lost Reports Summary Table */}
        <div className="space-y-2 print-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            1. Lost Item Reports ({db.lostreport.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--raised)' }}>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>REF</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>ITEM DESCRIPTION</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>CATEGORY</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>ZONE</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>OWNER</th>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>DATE LOST</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {db.lostreport.map((l) => {
                  const p = db.person.find((x) => x.person_id === l.person_id);
                  const c = db.itemcategory.find((x) => x.category_id === l.category_id);
                  const z = db.campuslocation.find((x) => x.location_id === l.location_id);
                  return (
                    <tr key={l.lost_id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 px-3 font-mono font-semibold tabular-nums" style={{ color: 'var(--indigo)' }}>
                        {formatLostRef(l.lost_id)}
                      </td>
                      <td className="py-2 px-3 font-medium" style={{ color: 'var(--text)' }}>{l.description}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{c?.category_name}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{z?.zone_name}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                        {p?.name} <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>({p?.reg_no})</span>
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums" style={{ color: 'var(--muted)' }}>{l.date_lost}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>{l.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Found Reports Summary Table */}
        <div className="space-y-2 print-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            2. Found Item Reports &amp; Storage Inventory ({db.foundreport.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--raised)' }}>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>REF</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>ITEM DESCRIPTION</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>ZONE</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>STORAGE LOCATION</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>FINDER</th>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>DATE FOUND</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {db.foundreport.map((f) => {
                  const p = db.person.find((x) => x.person_id === f.person_id);
                  const z = db.campuslocation.find((x) => x.location_id === f.location_id);
                  return (
                    <tr key={f.found_id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 px-3 font-mono font-semibold tabular-nums" style={{ color: 'var(--teal)' }}>
                        {formatFoundRef(f.found_id)}
                      </td>
                      <td className="py-2 px-3 font-medium" style={{ color: 'var(--text)' }}>{f.description}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{z?.zone_name}</td>
                      <td className="py-2 px-3 font-medium" style={{ color: 'var(--text)' }}>{f.storage_location}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{p?.name}</td>
                      <td className="py-2 px-3 font-mono tabular-nums" style={{ color: 'var(--muted)' }}>{f.date_found}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>{f.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Claims & Match Verification Log */}
        <div className="space-y-2 print-break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            3. Claim Verification &amp; Match Score Log ({db.claimrequest.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--raised)' }}>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>CLAIM REF</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>CLAIMANT</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>MATCHED PAIR</th>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>SCORE</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>REVIEWER</th>
                  <th className="py-2 px-3 border-b font-mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>CLAIM DATE</th>
                  <th className="py-2 px-3 border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {db.claimrequest.map((cr) => {
                  const claimant = db.person.find((p) => p.person_id === cr.person_id);
                  const admin = cr.admin_id ? db.admin.find((a) => a.admin_id === cr.admin_id) : null;
                  const match = db.matchscore.find((m) => m.match_id === cr.match_id);
                  const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
                  const found = db.foundreport.find((f) => f.found_id === match?.found_id);
                  return (
                    <tr key={cr.claim_id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 px-3 font-mono font-semibold tabular-nums" style={{ color: 'var(--indigo)' }}>
                        {formatClaimRef(cr.claim_id)}
                      </td>
                      <td className="py-2 px-3 font-medium" style={{ color: 'var(--text)' }}>
                        {claimant?.name} ({claimant?.reg_no})
                      </td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>
                        {lost ? formatLostRef(lost.lost_id) : ''} ↔ {found ? formatFoundRef(found.found_id) : ''} ({lost?.description})
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                        {match?.total_score ?? '-'}/100
                      </td>
                      <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>
                        {admin ? admin.name : 'Not assigned'}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums" style={{ color: 'var(--muted)' }}>
                        {cr.claim_date}
                      </td>
                      <td className="py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>
                        {cr.verification_status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Screen Cards (hidden during print so the PDF is clean and tabular) */}
      <div className="no-print">
        {viewKind === 'lost' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.lostreport
              .filter((l) => l.description.toLowerCase().includes(search.toLowerCase()))
              .map((l) => {
                const p = db.person.find((x) => x.person_id === l.person_id);
                const c = db.itemcategory.find((x) => x.category_id === l.category_id);
                const z = db.campuslocation.find((x) => x.location_id === l.location_id);
                return (
                  <div
                    key={l.lost_id}
                    className="rounded-[20px] border p-5 flex items-start justify-between gap-4"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start gap-3">
                      <CategoryIconBadge categoryId={l.category_id} size="md" isDark={isDark} />
                      <div>
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                          {formatLostRef(l.lost_id)} · {c?.category_name}
                        </div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                          {l.description}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Owner: {p?.name} ({p?.reg_no}) · {z?.zone_name} · {l.date_lost}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusLabel kind="lost" status={l.status} />
                      {l.status !== 'Closed' && (
                        <button
                          type="button"
                          onClick={() => closeLostReportAction(l.lost_id)}
                          className="text-[11px] font-medium underline cursor-pointer"
                          style={{ color: 'var(--muted)' }}
                        >
                          Close report
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {viewKind === 'found' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.foundreport
              .filter((f) => f.description.toLowerCase().includes(search.toLowerCase()))
              .map((f) => {
                const p = db.person.find((x) => x.person_id === f.person_id);
                const c = db.itemcategory.find((x) => x.category_id === f.category_id);
                const z = db.campuslocation.find((x) => x.location_id === f.location_id);
                return (
                  <div
                    key={f.found_id}
                    className="rounded-[20px] border p-5 flex items-start justify-between gap-4"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start gap-3">
                      <CategoryIconBadge categoryId={f.category_id} size="md" isDark={isDark} />
                      <div>
                        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--teal)' }}>
                          {formatFoundRef(f.found_id)} · {c?.category_name}
                        </div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                          {f.description}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Finder: {p?.name} · {z?.zone_name} · Stored: {f.storage_location}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusLabel kind="found" status={f.status} />
                      {f.status === 'Claimed' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateTableRow('foundreport', f.found_id, { status: 'Returned' });
                            showToast(`${formatFoundRef(f.found_id)} marked Returned`, 'success');
                          }}
                          className="text-[11px] font-semibold underline cursor-pointer"
                          style={{ color: 'var(--teal)' }}
                        >
                          Mark Returned
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {viewKind === 'matches' && (
          <div className="space-y-4">
            {db.matchscore.map((m) => {
              const l = db.lostreport.find((x) => x.lost_id === m.lost_id);
              const f = db.foundreport.find((x) => x.found_id === m.found_id);
              const existingClaim = db.claimrequest.find((c) => c.match_id === m.match_id);
              if (!l || !f) return null;
              return (
                <div
                  key={m.match_id}
                  className="rounded-[20px] border p-5 space-y-3"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    <div className="md:col-span-4">
                      <div className="text-xs font-mono" style={{ color: 'var(--indigo)' }}>
                        {formatLostRef(l.lost_id)}
                      </div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {l.description}
                      </div>
                    </div>
                    <div className="md:col-span-3 flex flex-col items-center justify-center gap-1.5">
                      <ScoreRing score={m.total_score} size={52} showLabel />
                      {!existingClaim && m.total_score >= 50 && (
                        <button
                          type="button"
                          onClick={() => raiseClaimAction(m.match_id, l.person_id)}
                          className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white cursor-pointer"
                          style={{ backgroundColor: 'var(--indigo)' }}
                        >
                          Raise Claim
                        </button>
                      )}
                    </div>
                    <div className="md:col-span-4">
                      <div className="text-xs font-mono" style={{ color: 'var(--teal)' }}>
                        {formatFoundRef(f.found_id)}
                      </div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {f.description}
                      </div>
                    </div>
                  </div>
                  <SubScoreBars
                    categoryScore={m.category_score}
                    locationScore={m.location_score}
                    dateScore={m.date_score}
                    descriptionScore={m.description_score}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ADMIN HANDOVER DESK TAB
// ============================================================================
export const AdminHandoverView: React.FC = () => {
  const { db, markHandedOverAction } = useStore();
  const [refInput, setRefInput] = useState('');
  const [slipClaimId, setSlipClaimId] = useState<number | null>(null);

  const parseRefToClaimId = (str: string): number | null => {
    const cleaned = str.trim().toUpperCase().replace(/^CL-0*/, '');
    const num = Number(cleaned);
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  const handleMarkByRef = () => {
    const cid = parseRefToClaimId(refInput);
    if (!cid) return;
    markHandedOverAction(cid);
    setRefInput('');
  };

  const verifiedClaims = db.claimrequest.filter((c) => c.verification_status === 'Verified');

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-2.5">
          <PackageCheck size={20} style={{ color: 'var(--teal)' }} />
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Item Handover Desk
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Enter a verified Claim Reference (e.g. CL-0007 or CL-0008) to mark the physical item as Returned.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 max-w-lg">
          <input
            type="text"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="Type Claim Reference (e.g. CL-0007)"
            className="h-11 px-4 rounded-xl border text-sm font-mono outline-none flex-1"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <button
            type="button"
            onClick={handleMarkByRef}
            className="h-11 px-5 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-95"
            style={{ backgroundColor: 'var(--teal)' }}
          >
            Mark handed over
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {verifiedClaims.map((c) => {
          const match = db.matchscore.find((m) => m.match_id === c.match_id);
          const found = db.foundreport.find((f) => f.found_id === match?.found_id);
          const claimant = db.person.find((p) => p.person_id === c.person_id);
          const admin = db.admin.find((a) => a.admin_id === c.admin_id);
          const isReturned = found?.status === 'Returned';

          return (
            <div
              key={c.claim_id}
              className="rounded-[20px] border p-5 flex flex-col justify-between gap-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
                    {formatClaimRef(c.claim_id)}
                  </span>
                  <StatusLabel kind="found" status={found?.status || 'Claimed'} />
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {found?.description}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Claimant: {claimant?.name} ({claimant?.reg_no}) · Storage: {found?.storage_location}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Approved by: {admin?.name} on {c.claim_date}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setSlipClaimId(c.claim_id)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <FileCheck2 size={14} />
                  <span>Open Handover Slip</span>
                </button>

                {!isReturned ? (
                  <button
                    type="button"
                    onClick={() => markHandedOverAction(c.claim_id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: 'var(--teal)' }}
                  >
                    <ShieldCheck size={14} />
                    <span>Mark handed over</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>
                    ✓ Handed over
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <HandoverSlipModal claimId={slipClaimId} onClose={() => setSlipClaimId(null)} />
    </div>
  );
};
