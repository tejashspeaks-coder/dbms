import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  FileCheck2,
  GraduationCap,
  MapPin,
  PackageCheck,
  Play,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  formatClaimRef,
  formatFoundRef,
  formatLostRef,
  useStore,
} from '../store';
import { CategoryIconBadge, ScoreRing, StatusLabel } from './IconsAndGraphics';
import { HandoverSlipModal } from './HandoverSlipModal';

export const QuickLookupModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const {
    db,
    theme,
    setRole,
    setActiveTab,
    setSelectedStudentPersonId,
    prefillLostFromFound,
    raiseClaimAction,
    verifyClaimAction,
    markHandedOverAction,
    updateFormDraft,
    showToast,
  } = useStore();

  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'lost' | 'found' | 'claims' | 'people'>('all');
  const [slipClaimId, setSlipClaimId] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    const q = normalizedQuery;

    const lostMatches = db.lostreport.filter((l) => {
      if (filterScope !== 'all' && filterScope !== 'lost') return false;
      if (!q) return true;
      const ref = formatLostRef(l.lost_id).toLowerCase();
      const owner = db.person.find((p) => p.person_id === l.person_id);
      const cat = db.itemcategory.find((c) => c.category_id === l.category_id);
      const zone = db.campuslocation.find((z) => z.location_id === l.location_id);
      return (
        ref.includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (owner?.name.toLowerCase().includes(q) ?? false) ||
        (owner?.reg_no.toLowerCase().includes(q) ?? false) ||
        (cat?.category_name.toLowerCase().includes(q) ?? false) ||
        (zone?.zone_name.toLowerCase().includes(q) ?? false)
      );
    });

    const foundMatches = db.foundreport.filter((f) => {
      if (filterScope !== 'all' && filterScope !== 'found') return false;
      if (!q) return true;
      const ref = formatFoundRef(f.found_id).toLowerCase();
      const finder = db.person.find((p) => p.person_id === f.person_id);
      const cat = db.itemcategory.find((c) => c.category_id === f.category_id);
      const zone = db.campuslocation.find((z) => z.location_id === f.location_id);
      return (
        ref.includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.storage_location.toLowerCase().includes(q) ||
        (finder?.name.toLowerCase().includes(q) ?? false) ||
        (cat?.category_name.toLowerCase().includes(q) ?? false) ||
        (zone?.zone_name.toLowerCase().includes(q) ?? false)
      );
    });

    const claimMatches = db.claimrequest.filter((c) => {
      if (filterScope !== 'all' && filterScope !== 'claims') return false;
      const ref = formatClaimRef(c.claim_id).toLowerCase();
      const claimant = db.person.find((p) => p.person_id === c.person_id);
      const match = db.matchscore.find((m) => m.match_id === c.match_id);
      const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
      const found = db.foundreport.find((f) => f.found_id === match?.found_id);
      if (!q) return true;
      return (
        ref.includes(q) ||
        c.verification_status.toLowerCase().includes(q) ||
        (claimant?.name.toLowerCase().includes(q) ?? false) ||
        (claimant?.reg_no.toLowerCase().includes(q) ?? false) ||
        (lost?.description.toLowerCase().includes(q) ?? false) ||
        (found?.description.toLowerCase().includes(q) ?? false)
      );
    });

    const personMatches = db.person.filter((p) => {
      if (filterScope !== 'all' && filterScope !== 'people') return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.reg_no.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });

    return {
      lost: lostMatches.slice(0, 6),
      found: foundMatches.slice(0, 6),
      claims: claimMatches.slice(0, 6),
      people: personMatches.slice(0, 6),
    };
  }, [db, normalizedQuery, filterScope]);

  if (!open) return null;

  const quickRefs = ['LR-0002', 'FR-0011', 'CL-0001', 'CL-0007', 'hoodie', 'wallet', 'laptop'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto no-print"
      style={{ backgroundColor: 'rgba(15, 17, 21, 0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Reference Lookup and Campus Finder"
    >
      <div
        className="w-full max-w-3xl rounded-[20px] border p-5 md:p-6 space-y-5"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Top Search Input */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-3.5" style={{ color: 'var(--indigo)' }} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Ref ID (LR-0002, FR-0011, CL-0007), Reg No, Student Name, or Item..."
              className="w-full h-11 pl-11 pr-4 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--raised)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-3.5 rounded-xl border text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <X size={15} />
            <span>Close</span>
          </button>
        </div>

        {/* Quick Preset Chips & Scope Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium mr-1" style={{ color: 'var(--muted)' }}>
              Try:
            </span>
            {quickRefs.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(chip)}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: query === chip ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: query === chip ? 'var(--indigo)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl border"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
          >
            {(['all', 'lost', 'found', 'claims', 'people'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setFilterScope(sc)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer"
                style={{
                  backgroundColor: filterScope === sc ? 'var(--card)' : 'transparent',
                  color: filterScope === sc ? 'var(--indigo)' : 'var(--muted)',
                }}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        {/* One-Click Fast Actions Strip */}
        <div
          className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <Zap size={14} style={{ color: 'var(--indigo)' }} />
            <span>1-Click Shortcuts:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRole('Student');
                updateFormDraft({ mode: 'lost', step: 1 });
                setActiveTab('home');
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              + Report Lost Item
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('Student');
                updateFormDraft({ mode: 'found', step: 1 });
                setActiveTab('home');
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--teal)' }}
            >
              + Report Found Item
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('Student');
                updateFormDraft({
                  mode: 'lost',
                  step: 1,
                  category_id: 9,
                  description: 'navy blue hoodie',
                  location_id: 2,
                  date_str: '2026-10-14',
                  date_preset: 'custom',
                  person_mode: 'existing',
                  person_id: 2,
                });
                setActiveTab('home');
                showToast('Pre-filled "navy blue hoodie" demo report — ready to submit!', 'info');
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Auto-Fill Demo Hoodie (Score 85)
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[420px] overflow-y-auto space-y-5 pr-1">
          {/* Claims Section */}
          {results.claims.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Claim Requests ({results.claims.length})
              </div>
              <div className="space-y-2">
                {results.claims.map((c) => {
                  const claimant = db.person.find((p) => p.person_id === c.person_id);
                  const match = db.matchscore.find((m) => m.match_id === c.match_id);
                  const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
                  const found = db.foundreport.find((f) => f.found_id === match?.found_id);
                  return (
                    <div
                      key={c.claim_id}
                      className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold" style={{ color: 'var(--indigo)' }}>
                            {formatClaimRef(c.claim_id)}
                          </span>
                          <span>·</span>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>
                            {lost?.description || found?.description}
                          </span>
                          <StatusLabel kind="claim" status={c.verification_status} />
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          Claimant: {claimant?.name} ({claimant?.reg_no}) · Match Score: {match?.total_score}/100 · Storage:{' '}
                          {found?.storage_location}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.verification_status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              verifyClaimAction(c.claim_id, 3);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
                            style={{ backgroundColor: 'var(--teal)' }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Verify Now</span>
                          </button>
                        )}
                        {c.verification_status === 'Verified' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSlipClaimId(c.claim_id)}
                              className="px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                            >
                              <FileCheck2 size={13} />
                              <span>QR Slip</span>
                            </button>
                            {found?.status !== 'Returned' && (
                              <button
                                type="button"
                                onClick={() => markHandedOverAction(c.claim_id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
                                style={{ backgroundColor: 'var(--indigo)' }}
                              >
                                <PackageCheck size={13} />
                                <span>Hand Over</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lost Reports Section */}
          {results.lost.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Lost Item Reports ({results.lost.length})
              </div>
              <div className="space-y-2">
                {results.lost.map((l) => {
                  const owner = db.person.find((p) => p.person_id === l.person_id);
                  const zone = db.campuslocation.find((z) => z.location_id === l.location_id);
                  const bestMatch = db.matchscore
                    .filter((m) => m.lost_id === l.lost_id)
                    .sort((a, b) => b.total_score - a.total_score)[0];
                  const existingClaim = bestMatch
                    ? db.claimrequest.find((c) => c.match_id === bestMatch.match_id)
                    : undefined;

                  return (
                    <div
                      key={l.lost_id}
                      className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIconBadge categoryId={l.category_id} size="sm" isDark={isDark} />
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold" style={{ color: 'var(--indigo)' }}>
                              {formatLostRef(l.lost_id)}
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--text)' }}>
                              {l.description}
                            </span>
                            <StatusLabel kind="lost" status={l.status} />
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                            Owner: {owner?.name} ({owner?.reg_no}) · {zone?.zone_name} · Lost {l.date_lost}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {bestMatch && bestMatch.total_score >= 50 && !existingClaim && (
                          <button
                            type="button"
                            onClick={() => {
                              raiseClaimAction(bestMatch.match_id, l.person_id);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                            style={{ backgroundColor: 'var(--indigo)' }}
                          >
                            Raise Claim (Score {bestMatch.total_score})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentPersonId(l.person_id);
                            setRole('Student');
                            setActiveTab('my-reports');
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          Track Timeline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Found Reports Section */}
          {results.found.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Found Item Inventory ({results.found.length})
              </div>
              <div className="space-y-2">
                {results.found.map((f) => {
                  const zone = db.campuslocation.find((z) => z.location_id === f.location_id);
                  return (
                    <div
                      key={f.found_id}
                      className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIconBadge categoryId={f.category_id} size="sm" isDark={isDark} />
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold" style={{ color: 'var(--teal)' }}>
                              {formatFoundRef(f.found_id)}
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--text)' }}>
                              {f.description}
                            </span>
                            <StatusLabel kind="found" status={f.status} />
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                            Found at {zone?.zone_name} ({f.date_found}) · Stored at:{' '}
                            <strong style={{ color: 'var(--text)' }}>{f.storage_location}</strong>
                          </div>
                        </div>
                      </div>

                      {f.status === 'Unclaimed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRole('Student');
                            prefillLostFromFound(f);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                          style={{ backgroundColor: 'var(--indigo)' }}
                        >
                          This might be mine
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* People Section */}
          {results.people.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Students &amp; Staff ({results.people.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.people.map((p) => {
                  const lostCnt = db.lostreport.filter((l) => l.person_id === p.person_id).length;
                  const foundCnt = db.foundreport.filter((f) => f.person_id === p.person_id).length;
                  return (
                    <button
                      key={p.person_id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentPersonId(p.person_id);
                        setRole('Student');
                        setActiveTab('my-reports');
                        showToast(`Switched view to ${p.name} (${p.reg_no})`, 'info');
                        onClose();
                      }}
                      className="p-3 rounded-2xl border text-left flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                    >
                      <div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {p.reg_no} · {p.role} · {lostCnt} Lost / {foundCnt} Found
                        </div>
                      </div>
                      <UserCheck size={14} style={{ color: 'var(--indigo)' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <HandoverSlipModal claimId={slipClaimId} onClose={() => setSlipClaimId(null)} />
    </div>
  );
};
