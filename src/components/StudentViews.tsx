import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  EyeOff,
  FileCheck2,
  HelpCircle,
  MapPin,
  PackageCheck,
  Plus,
  Search,
  Share2,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CATEGORY_GROUPS,
  CATEGORY_META,
  CategoryGroup,
} from '../seedData';
import {
  dateProximityScore,
  explainMatchInWords,
  extractKeywords,
  formatClaimRef,
  formatFoundRef,
  formatLostRef,
  keywordOverlapScore,
  useStore,
} from '../store';
import { diffDays, getTodayDateStr } from '../queryRunner';
import { FoundReport, LostReport, MatchScore } from '../types';
import {
  CampusHeroIllustration,
  CategoryIconBadge,
  InteractiveCampusZoneMap,
  ScoreRing,
  StatusLabel,
} from './IconsAndGraphics';
import { HandoverSlipModal } from './HandoverSlipModal';

const SENSITIVE_CATEGORIES = new Set([4, 5, 6]); // Wallets and Cards, ID Cards, Documents and Certificates

export function getSafeFoundTitle(found: FoundReport, categoryName: string, zoneName: string): {
  title: string;
  isRedacted: boolean;
} {
  if (SENSITIVE_CATEGORIES.has(found.category_id)) {
    const label =
      found.category_id === 5
        ? 'ID card'
        : found.category_id === 4
        ? 'Wallet or card holder'
        : 'Documents / certificates folder';
    return {
      title: `${label} found near ${zoneName}`,
      isRedacted: true,
    };
  }
  return {
    title: found.description,
    isRedacted: false,
  };
}

// ============================================================================
// FLOATING LABEL INPUT & TEXTAREA (48px height, empty by default)
// ============================================================================
export const FloatingInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}> = ({ id, label, value, onChange, type = 'text', error }) => (
  <div className="w-full">
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full h-12 px-4 pt-4 pb-1 rounded-xl border text-sm outline-none transition-all focus:ring-2"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: error ? 'var(--red)' : 'var(--border)',
          color: 'var(--text)',
        }}
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-1.5 text-[11px] font-medium transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[11px]"
        style={{ color: error ? 'var(--red)' : 'var(--muted)' }}
      >
        {label}
      </label>
    </div>
    {error && (
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--red)' }}>
        <AlertCircle size={12} />
        <span>{error}</span>
      </p>
    )}
  </div>
);

// ============================================================================
// SHARE MODAL (excludes sensitive details)
// ============================================================================
export const ShareReportModal: React.FC<{
  itemTitle: string;
  zoneName: string;
  dateStr: string;
  refCode: string;
  kind: 'lost' | 'found';
  isSensitive?: boolean;
  onClose: () => void;
}> = ({ itemTitle, zoneName, dateStr, refCode, kind, isSensitive, onClose }) => {
  const { showToast } = useStore();
  const safeDesc = isSensitive ? `a sensitive personal item (${refCode})` : `"${itemTitle}" (${refCode})`;
  const shareText =
    kind === 'lost'
      ? `Lost on campus near ${zoneName} (${dateStr}): ${safeDesc}. If found, please log it on FindIt Campus Lost & Found.`
      : `Found near ${zoneName} (${dateStr}): ${safeDesc}. Check FindIt Campus Lost & Found to verify ownership.`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://findit.campus.edu';

  const copyMessage = () => {
    navigator.clipboard?.writeText(shareText);
    showToast('Share message copied (sensitive details excluded)', 'success');
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${shareUrl}/?ref=${refCode}`);
    showToast('Direct reference link copied', 'success');
  };

  const shareWhatsApp = () => {
    navigator.clipboard?.writeText(`${shareText} ${shareUrl}/?ref=${refCode}`);
    showToast('WhatsApp message copied to clipboard — paste in your campus group', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 17, 21, 0.6)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-[20px] border p-6 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Share Report ({refCode})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg border cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            ✕
          </button>
        </div>

        <div
          className="p-3.5 rounded-xl border text-xs leading-relaxed"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {shareText}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          Phone numbers, registration numbers, and private card/document details are automatically omitted.
        </p>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={copyMessage}
            className="py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Copy size={13} />
            <span>Copy text</span>
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--teal)' }}
          >
            <Share2 size={13} />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Copy size={13} />
            <span>Copy link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STUDENT HOME VIEW — UNIFIED ALL-ON-HOME-PAGE 1-CLICK STUDIO & WORKSPACE
// ============================================================================
export const StudentHome: React.FC = () => {
  const {
    db,
    theme,
    formDraft,
    updateFormDraft,
    resetFormDraft,
    submitReportFromDraft,
    computeMatchScoreAction,
    runAllMatchingAction,
    raiseClaimAction,
    verifyClaimAction,
    markHandedOverAction,
    closeLostReportAction,
    keepLookingLostReportAction,
    insertTableRow,
    updateTableRow,
    prefillLostFromFound,
    selectedStudentPersonId,
    setSelectedStudentPersonId,
    lastTransaction,
    showToast,
  } = useStore();

  const isDark = theme === 'dark';
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [showMapGraphic, setShowMapGraphic] = useState(true);

  // Unified Home Page Workspace State (Found Vault + My Reports/Claims right on Home)
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCatFilter, setVaultCatFilter] = useState<number | 'ALL'>('ALL');
  const [homeReportsFilter, setHomeReportsFilter] = useState<'ALL_CAMPUS' | 'SELECTED_PERSON'>('ALL_CAMPUS');
  const [editingLostId, setEditingLostId] = useState<number | null>(null);
  const [editingDescText, setEditingDescText] = useState('');
  const [activeSlipClaimId, setActiveSlipClaimId] = useState<number | null>(null);
  const [shareItemState, setShareItemState] = useState<{
    title: string;
    zone: string;
    date: string;
    refCode: string;
    kind: 'lost' | 'found';
    isSensitive?: boolean;
  } | null>(null);

  const CATEGORY_QUICK_TEMPLATES: Record<number, string[]> = {
    1: ['blue samsung phone cracked screen', 'black iphone 14 silicone cover', 'redmi note black case'],
    2: ['silver dell laptop black sleeve', 'macbook air space grey charger', 'hp pavilion laptop bag'],
    3: ['white apple airpods pro case', 'sony black wireless headphones', 'usb-c laptop power adapter'],
    4: ['black leather wallet', 'brown bifold card holder', 'navy fabric zip wallet'],
    5: ['vit student id card blue lanyard', 'hostel access id card', 'library id card'],
    6: ['original mark sheet blue folder', 'internship certificate file', 'exam hall ticket document'],
    7: ['discrete mathematics textbook', 'spiral bound lab record', 'engineering notes register'],
    8: ['casio fx-991ex scientific calculator', 'apple pencil 2nd gen', 'black fountain pen set'],
    9: ['black wildcraft laptop backpack', 'navy nike drawstring gym bag', 'grey canvas messenger bag'],
    10: ['silver key ring red strap', 'hostel room key leather tag', 'bike key black fob'],
    11: ['casio silver analog wristwatch', 'black smartwatch silicone band', 'gold chain bracelet'],
    12: ['black frame spectacles blue case', 'silver rimmed reading glasses', ' polarized sunglasses case'],
    13: ['navy blue hoodie', 'black zip jacket', 'grey cotton sweatshirt'],
    14: ['steel water bottle', 'black insulated hydro flask', 'blue gym shaker bottle'],
    15: ['yonex badminton racquet cover', 'leather cricket ball', 'table tennis paddle case'],
    16: ['black folding umbrella', 'portable power bank 10000mah', 'blue calculators pouch'],
  };

  // 1-Click Instant Scenarios (Fills all fields or submits in 1 click)
  const ONE_CLICK_SCENARIOS = [
    {
      label: 'Lost Blue Samsung Phone',
      mode: 'lost' as const,
      category_id: 1,
      description: 'blue samsung phone cracked screen',
      location_id: 4, // Canteen
      person_id: 2,
      storage_location: '',
    },
    {
      label: 'Lost Black Leather Wallet',
      mode: 'lost' as const,
      category_id: 4,
      description: 'black leather wallet brown stitch',
      location_id: 1, // Central Library
      person_id: 1,
      storage_location: '',
    },
    {
      label: 'Found Silver Dell Laptop',
      mode: 'found' as const,
      category_id: 2,
      description: 'silver dell laptop black sleeve',
      location_id: 8, // CSE Department
      person_id: 6,
      storage_location: 'Admin Office Shelf A',
    },
    {
      label: 'Found Navy Blue Hoodie',
      mode: 'found' as const,
      category_id: 13,
      description: 'navy blue hoodie front zipper',
      location_id: 7, // Sports Complex
      person_id: 4,
      storage_location: 'Sports Office',
    },
  ];

  // Stored Output state after 1-click submission
  const [submittedResult, setSubmittedResult] = useState<{
    refCode: string;
    createdId: number;
    reportType: 'lost' | 'found';
    description: string;
    zoneName: string;
    categoryName: string;
    personName: string;
    dateStr: string;
    matchesFound: { match: MatchScore; lost: LostReport; found: FoundReport }[];
  } | null>(null);

  const activeMode = formDraft.mode || 'lost';

  const detectedKeywords = useMemo(
    () => extractKeywords(`${formDraft.description} ${formDraft.extra_details}`),
    [formDraft.description, formDraft.extra_details]
  );

  // Zone report counts for the Interactive Campus Map
  const zoneReportCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    db.lostreport.forEach((l) => {
      counts[l.location_id] = (counts[l.location_id] || 0) + 1;
    });
    db.foundreport.forEach((f) => {
      counts[f.location_id] = (counts[f.location_id] || 0) + 1;
    });
    return counts;
  }, [db.lostreport, db.foundreport]);

  // Live Possible Matches while configuring fields on the Home Page
  const liveMatches = useMemo(() => {
    const desc = `${formDraft.description} ${formDraft.extra_details}`.trim();
    const today = getTodayDateStr();
    const draftDate = formDraft.date_str || today;

    if (activeMode === 'lost') {
      return db.foundreport
        .filter((f) => f.status === 'Unclaimed')
        .map((f) => {
          const sameCat = formDraft.category_id ? f.category_id === formDraft.category_id : false;
          const catScore = sameCat ? 40 : 0;
          const locScore = formDraft.location_id && f.location_id === formDraft.location_id ? 20 : 0;
          const dtScore = dateProximityScore(draftDate, f.date_found);
          const dsScore = desc ? keywordOverlapScore(desc, f.description) : 10;
          const total = catScore + locScore + dtScore + dsScore;
          const z = db.campuslocation.find((l) => l.location_id === f.location_id);
          const c = db.itemcategory.find((cat) => cat.category_id === f.category_id);
          const safe = getSafeFoundTitle(f, c?.category_name || '', z?.zone_name || '');
          const reasons: string[] = [];
          if (sameCat) reasons.push(`Category (${c?.category_name})`);
          if (locScore === 20) reasons.push(`Zone (${z?.zone_name})`);
          if (desc && dsScore > 0) reasons.push(`Keyword match (+${dsScore})`);
          else if (dtScore > 0) reasons.push(`Date proximity (+${dtScore})`);

          return {
            id: f.found_id,
            foundItem: f,
            lostItem: null as LostReport | null,
            title: safe.title,
            rawDesc: f.description,
            zone: z?.zone_name || '',
            storage: f.storage_location,
            date: f.date_found,
            score: total,
            catScore,
            locScore,
            dtScore,
            dsScore,
            reason: reasons.join(' · ') || 'Campus inventory candidate',
          };
        })
        .filter((m) => m.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
    } else {
      return db.lostreport
        .filter((l) => l.status === 'Active' || l.status === 'Matched')
        .map((l) => {
          const sameCat = formDraft.category_id ? l.category_id === formDraft.category_id : false;
          const catScore = sameCat ? 40 : 0;
          const locScore = formDraft.location_id && l.location_id === formDraft.location_id ? 20 : 0;
          const dtScore = dateProximityScore(l.date_lost, draftDate);
          const dsScore = desc ? keywordOverlapScore(l.description, desc) : 10;
          const total = catScore + locScore + dtScore + dsScore;
          const z = db.campuslocation.find((loc) => loc.location_id === l.location_id);
          const c = db.itemcategory.find((cat) => cat.category_id === l.category_id);
          const reasons: string[] = [];
          if (sameCat) reasons.push(`Category (${c?.category_name})`);
          if (locScore === 20) reasons.push(`Zone (${z?.zone_name})`);
          if (desc && dsScore > 0) reasons.push(`Keyword match (+${dsScore})`);

          return {
            id: l.lost_id,
            foundItem: null as FoundReport | null,
            lostItem: l,
            title: l.description,
            rawDesc: l.description,
            zone: z?.zone_name || '',
            storage: '',
            date: l.date_lost,
            score: total,
            catScore,
            locScore,
            dtScore,
            dsScore,
            reason: reasons.join(' · ') || 'Active lost report candidate',
          };
        })
        .filter((m) => m.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
    }
  }, [
    activeMode,
    formDraft.category_id,
    formDraft.description,
    formDraft.extra_details,
    formDraft.location_id,
    formDraft.date_str,
    db.foundreport,
    db.lostreport,
    db.campuslocation,
    db.itemcategory,
  ]);

  // Derived 4 KPI numbers
  const stillLookingCount = db.lostreport.filter((l) => l.status === 'Active' || l.status === 'Matched').length;
  const waitingForOwnersCount = db.foundreport.filter((f) => f.status === 'Unclaimed').length;
  const possibleMatchesCount = db.matchscore.filter((m) => m.total_score >= 50).length;
  const claimsInProgressCount = db.claimrequest.filter((c) => c.verification_status === 'Pending').length;

  // Derived Insights Chart Data
  const categoryDonutData = useMemo(() => {
    const counts = new Map<number, number>();
    for (const l of db.lostreport) counts.set(l.category_id, (counts.get(l.category_id) || 0) + 1);
    for (const f of db.foundreport) counts.set(f.category_id, (counts.get(f.category_id) || 0) + 1);

    const sorted = Array.from(counts.entries())
      .map(([cid, count]) => ({
        name: db.itemcategory.find((c) => c.category_id === cid)?.category_name || `Cat ${cid}`,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    const top6 = sorted.slice(0, 6);
    const otherSum = sorted.slice(6).reduce((acc, x) => acc + x.value, 0);
    if (otherSum > 0) {
      top6.push({ name: 'Other', value: otherSum });
    }
    return top6;
  }, [db.lostreport, db.foundreport, db.itemcategory]);

  const zoneBarData = useMemo(() => {
    return db.campuslocation.map((z) => ({
      zone: z.zone_name.replace('Department', 'Dept').replace('Central ', ''),
      Lost: db.lostreport.filter((l) => l.location_id === z.location_id).length,
      Found: db.foundreport.filter((f) => f.location_id === z.location_id).length,
    }));
  }, [db.campuslocation, db.lostreport, db.foundreport]);

  const dailyLineData = useMemo(() => {
    const dates = new Set<string>();
    db.lostreport.forEach((l) => dates.add(l.date_lost));
    db.foundreport.forEach((f) => dates.add(f.date_found));
    return Array.from(dates)
      .sort()
      .map((dt) => ({
        date: dt.slice(5),
        Lost: db.lostreport.filter((l) => l.date_lost === dt).length,
        Found: db.foundreport.filter((f) => f.date_found === dt).length,
      }));
  }, [db.lostreport, db.foundreport]);

  const DONUT_COLORS = ['#4F46E5', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#6B7280'];

  const handleDatePreset = (preset: 'today' | 'yesterday' | 'two_days_ago') => {
    const dt = new Date();
    if (preset === 'yesterday') dt.setDate(dt.getDate() - 1);
    if (preset === 'two_days_ago') dt.setDate(dt.getDate() - 2);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    updateFormDraft({
      date_preset: preset === 'two_days_ago' ? 'custom' : preset,
      date_str: `${y}-${m}-${d}`,
    });
  };

  // Single 1-Click Submit & Output Handler (never blocks on multi-step Continue!)
  const handleOneClickSubmit = () => {
    setFormError('');

    const catId = formDraft.category_id || 1;
    const locId = formDraft.location_id || 1;
    const dateVal = formDraft.date_str || getTodayDateStr();
    const catObj = db.itemcategory.find((c) => c.category_id === catId);
    const locObj = db.campuslocation.find((l) => l.location_id === locId);
    const defaultTpl =
      (CATEGORY_QUICK_TEMPLATES[catId] && CATEGORY_QUICK_TEMPLATES[catId][0]) ||
      `${catObj?.category_name || 'Campus item'} near ${locObj?.zone_name || 'Central Library'}`;

    const finalDesc = formDraft.description.trim() || defaultTpl;
    const finalStorage =
      activeMode === 'found'
        ? formDraft.storage_location.trim() || 'Admin Office Shelf A'
        : '';

    // Ensure draft is synced if defaults were applied
    updateFormDraft({
      mode: activeMode,
      category_id: catId,
      location_id: locId,
      date_str: dateVal,
      description: finalDesc,
      storage_location: finalStorage,
      person_id: formDraft.person_id || selectedStudentPersonId || 2,
    });

    // If description was empty, submit via direct state or after syncing
    if (!formDraft.description.trim() || !formDraft.category_id || !formDraft.location_id || !formDraft.date_str) {
      let resolvedPersonId = formDraft.person_id || selectedStudentPersonId || 2;
      if (formDraft.person_mode === 'new') {
        if (!formDraft.new_name.trim() || !formDraft.new_reg_no.trim()) {
          setFormError('Please enter your Name and Registration Number, or switch to "Choose your name".');
          return;
        }
        const newPersonRes = insertTableRow('person', {
          name: formDraft.new_name.trim(),
          reg_no: formDraft.new_reg_no.trim().toUpperCase(),
          phone: formDraft.new_phone.trim() || '9876543210',
          email: formDraft.new_email.trim() || 'student@vit.ac.in',
          role: formDraft.new_role,
        });
        if (!newPersonRes.ok || !newPersonRes.row) {
          setFormError(newPersonRes.error || 'Could not register new person');
          return;
        }
        resolvedPersonId = newPersonRes.row.person_id;
      }

      const fullDescription = [finalDesc, formDraft.extra_details.trim()].filter(Boolean).join(' — ');
      const personObj = db.person.find((p) => p.person_id === resolvedPersonId);

      if (activeMode === 'lost') {
        const ins = insertTableRow('lostreport', {
          person_id: resolvedPersonId,
          category_id: catId,
          location_id: locId,
          date_lost: dateVal,
          description: fullDescription,
          status: 'Active',
        });
        if (!ins.ok || !ins.row) {
          setFormError(ins.error || 'Could not store lost report');
          return;
        }
        const createdLost = ins.row;
        const refCode = formatLostRef(createdLost.lost_id);
        // Gather matches computed automatically
        const computedMatches = db.foundreport
          .filter((f) => f.status === 'Unclaimed' && f.category_id === catId)
          .map((f) => {
            const mRes = computeMatchScoreAction(createdLost.lost_id, f.found_id);
            return mRes.ok && mRes.match ? { match: mRes.match, lost: createdLost, found: f } : null;
          })
          .filter((x): x is { match: MatchScore; lost: LostReport; found: FoundReport } => x !== null)
          .sort((a, b) => b.match.total_score - a.match.total_score);

        setSubmittedResult({
          refCode,
          createdId: createdLost.lost_id,
          reportType: 'lost',
          description: fullDescription,
          zoneName: locObj?.zone_name || 'Campus',
          categoryName: catObj?.category_name || 'Item',
          personName: personObj?.name || 'Student',
          dateStr: dateVal,
          matchesFound: computedMatches,
        });
        showToast(`Stored ${refCode} & computed ${computedMatches.length} match(es) in 1 click!`, 'success');
        return;
      } else {
        const ins = insertTableRow('foundreport', {
          person_id: resolvedPersonId,
          category_id: catId,
          location_id: locId,
          date_found: dateVal,
          description: fullDescription,
          storage_location: finalStorage,
          status: 'Unclaimed',
        });
        if (!ins.ok || !ins.row) {
          setFormError(ins.error || 'Could not store found report');
          return;
        }
        const createdFound = ins.row;
        const refCode = formatFoundRef(createdFound.found_id);
        const computedMatches = db.lostreport
          .filter((l) => (l.status === 'Active' || l.status === 'Matched') && l.category_id === catId)
          .map((l) => {
            const mRes = computeMatchScoreAction(l.lost_id, createdFound.found_id);
            return mRes.ok && mRes.match ? { match: mRes.match, lost: l, found: createdFound } : null;
          })
          .filter((x): x is { match: MatchScore; lost: LostReport; found: FoundReport } => x !== null)
          .sort((a, b) => b.match.total_score - a.match.total_score);

        setSubmittedResult({
          refCode,
          createdId: createdFound.found_id,
          reportType: 'found',
          description: fullDescription,
          zoneName: locObj?.zone_name || 'Campus',
          categoryName: catObj?.category_name || 'Item',
          personName: personObj?.name || 'Student',
          dateStr: dateVal,
          matchesFound: computedMatches,
        });
        showToast(`Stored ${refCode} & computed ${computedMatches.length} match(es) in 1 click!`, 'success');
        return;
      }
    }

    const res = submitReportFromDraft();
    if (!res.ok) {
      setFormError(res.error || 'Please check the form fields');
      return;
    }
    const personObj = db.person.find((p) => p.person_id === (formDraft.person_id || 2));
    setSubmittedResult({
      refCode: res.refCode!,
      createdId: res.createdId || 0,
      reportType: res.reportType!,
      description: [formDraft.description.trim(), formDraft.extra_details.trim()].filter(Boolean).join(' — '),
      zoneName: locObj?.zone_name || 'Campus',
      categoryName: catObj?.category_name || 'Item',
      personName: personObj ? `${personObj.name} (${personObj.reg_no})` : formDraft.new_name || 'Student',
      dateStr: dateVal,
      matchesFound: res.matchesFound || [],
    });
    updateFormDraft({ description: '', extra_details: '' });
    showToast(`Stored ${res.refCode} & generated live output!`, 'success');
  };

  // 1-Click Instant Claim from any Found Item on the Home Page
  const handleOneClickInstantClaimFound = (found: FoundReport) => {
    const claimantId = formDraft.person_id || selectedStudentPersonId || 2;
    // Check if there's already a match with score >= 50 for this found item
    let existingMatch = db.matchscore.find(
      (m) => m.found_id === found.found_id && m.total_score >= 50
    );

    if (!existingMatch) {
      // Create a matching Lost Report for the claimant and compute the match in 1 click
      const lostRes = insertTableRow('lostreport', {
        person_id: claimantId,
        category_id: found.category_id,
        location_id: found.location_id,
        date_lost: found.date_found,
        description: found.description,
        status: 'Matched',
      });
      if (lostRes.ok && lostRes.row) {
        const matchRes = computeMatchScoreAction(lostRes.row.lost_id, found.found_id);
        if (matchRes.ok && matchRes.match) {
          existingMatch = matchRes.match;
        }
      }
    }

    if (existingMatch) {
      const claimRes = raiseClaimAction(existingMatch.match_id, claimantId);
      if (claimRes.ok && claimRes.claim) {
        const locObj = db.campuslocation.find((l) => l.location_id === found.location_id);
        const catObj = db.itemcategory.find((c) => c.category_id === found.category_id);
        const personObj = db.person.find((p) => p.person_id === claimantId);
        const lostObj = db.lostreport.find((l) => l.lost_id === existingMatch!.lost_id);
        if (lostObj) {
          setSubmittedResult({
            refCode: formatClaimRef(claimRes.claim.claim_id),
            createdId: claimRes.claim.claim_id,
            reportType: 'lost',
            description: `Claim raised for ${found.description} (Match Score: ${existingMatch.total_score}/100)`,
            zoneName: locObj?.zone_name || 'Campus',
            categoryName: catObj?.category_name || 'Item',
            personName: personObj ? `${personObj.name} (${personObj.reg_no})` : 'Student',
            dateStr: getTodayDateStr(),
            matchesFound: [{ match: existingMatch, lost: lostObj, found }],
          });
        }
      }
    }
  };

  const popularCategories = db.itemcategory.filter((c) => CATEGORY_META[c.category_id]?.popular);
  const filteredAllCategories = db.itemcategory.filter((c) =>
    c.category_name.toLowerCase().includes(catSearch.trim().toLowerCase())
  );
  const filteredPersons = db.person.filter(
    (p) =>
      p.name.toLowerCase().includes(personSearch.trim().toLowerCase()) ||
      p.reg_no.toLowerCase().includes(personSearch.trim().toLowerCase())
  );

  const selectedCategoryObj = db.itemcategory.find((c) => c.category_id === formDraft.category_id);
  const selectedLocationObj = db.campuslocation.find((l) => l.location_id === formDraft.location_id);
  const selectedPersonObj = db.person.find((p) => p.person_id === formDraft.person_id);

  const activeCategoryTemplates = formDraft.category_id
    ? CATEGORY_QUICK_TEMPLATES[formDraft.category_id] || []
    : CATEGORY_QUICK_TEMPLATES[1];

  // Filtered Unclaimed Found Vault for the Home Page
  const homeFilteredFoundVault = useMemo(() => {
    return db.foundreport
      .filter((f) => f.status === 'Unclaimed')
      .filter((f) => (vaultCatFilter === 'ALL' ? true : f.category_id === vaultCatFilter))
      .filter((f) => {
        if (!vaultSearch.trim()) return true;
        const q = vaultSearch.toLowerCase();
        const cat = db.itemcategory.find((c) => c.category_id === f.category_id)?.category_name.toLowerCase() || '';
        const loc = db.campuslocation.find((l) => l.location_id === f.location_id)?.zone_name.toLowerCase() || '';
        return (
          f.description.toLowerCase().includes(q) ||
          f.storage_location.toLowerCase().includes(q) ||
          cat.includes(q) ||
          loc.includes(q) ||
          formatFoundRef(f.found_id).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.found_id - a.found_id);
  }, [db.foundreport, db.itemcategory, db.campuslocation, vaultCatFilter, vaultSearch]);

  // Filtered Lost Reports & Claims for the Home Page
  const homeLostReports = useMemo(() => {
    return db.lostreport
      .filter((l) => (homeReportsFilter === 'ALL_CAMPUS' ? true : l.person_id === selectedStudentPersonId))
      .slice()
      .sort((a, b) => b.lost_id - a.lost_id);
  }, [db.lostreport, homeReportsFilter, selectedStudentPersonId]);

  const activeSlipClaimObj = activeSlipClaimId
    ? db.claimrequest.find((c) => c.claim_id === activeSlipClaimId) || null
    : null;

  return (
    <div className="space-y-8">
      {/* =====================================================================
          1. HERO COMMAND HEADER WITH ANIMATED GRAPHICS & 1-TAP SCENARIOS
      ===================================================================== */}
      <section
        className="relative rounded-[24px] border p-6 md:p-8 overflow-hidden animate-card-enter"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--hero-glow-indigo)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--hero-glow-teal)' }}
          aria-hidden="true"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-medium tracking-wide" style={{ color: 'var(--muted)' }}>
              Vellore Institute of Technology · All-in-One 1-Click Campus Recovery Studio
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight"
              style={{ color: 'var(--text)', textWrap: 'balance' }}
            >
              Report, match, claim, and verify — everything on one screen in a single click.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
              No multi-step screens or endless &ldquo;Continue&rdquo; buttons. Select or customize every detail right below, click once to store in the database, and immediately view your matches and claims.
            </p>

            {/* Two Mode Selector Cards + 1-Tap Instant Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  updateFormDraft({ mode: 'lost' });
                }}
                className="group text-left p-4 rounded-2xl border interactive-lift cursor-pointer"
                style={{
                  backgroundColor: activeMode === 'lost' ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: activeMode === 'lost' ? 'var(--indigo)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: 'var(--indigo)' }}
                  >
                    <Search size={16} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                    {activeMode === 'lost' ? 'Active Mode' : 'Switch to Lost'}
                  </span>
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  I lost an item
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Store a lost report & scan all unclaimed campus items
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  updateFormDraft({
                    mode: 'found',
                    storage_location: formDraft.storage_location || 'Admin Office Shelf A',
                  });
                }}
                className="group text-left p-4 rounded-2xl border interactive-lift cursor-pointer"
                style={{
                  backgroundColor: activeMode === 'found' ? 'var(--teal-soft)' : 'var(--raised)',
                  borderColor: activeMode === 'found' ? 'var(--teal)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: 'var(--teal)' }}
                  >
                    <Sparkles size={16} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--teal)' }}>
                    {activeMode === 'found' ? 'Active Mode' : 'Switch to Found'}
                  </span>
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  I found an item
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Log a found item & alert students who lost it
                </div>
              </button>
            </div>

            {/* 1-Tap Instant Preset Bar */}
            <div className="pt-1 space-y-2">
              <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Zap size={13} style={{ color: 'var(--indigo)' }} />
                <span>1-Tap Instant Scenarios (fills all fields immediately):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ONE_CLICK_SCENARIOS.map((sc) => (
                  <button
                    key={sc.label}
                    type="button"
                    onClick={() => {
                      setFormError('');
                      updateFormDraft({
                        mode: sc.mode,
                        category_id: sc.category_id,
                        description: sc.description,
                        location_id: sc.location_id,
                        person_mode: 'existing',
                        person_id: sc.person_id,
                        date_str: getTodayDateStr(),
                        date_preset: 'today',
                        storage_location: sc.storage_location || 'Admin Office Shelf A',
                      });
                      showToast(`Loaded "${sc.label}" — click 1-Click Store & Output below!`, 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer interactive-lift"
                    style={{
                      backgroundColor:
                        formDraft.description === sc.description ? 'var(--indigo-soft)' : 'var(--raised)',
                      borderColor:
                        formDraft.description === sc.description ? 'var(--indigo)' : 'var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4">
            <CampusHeroIllustration />
            {/* Live Campus Pulse Strip under Illustration */}
            <div
              className="w-full grid grid-cols-4 gap-2 p-3 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
            >
              <div>
                <div className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--indigo)' }}>
                  {stillLookingCount}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Lost Active
                </div>
              </div>
              <div className="border-l" style={{ borderColor: 'var(--border)' }}>
                <div className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--teal)' }}>
                  {waitingForOwnersCount}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Unclaimed
                </div>
              </div>
              <div className="border-l" style={{ borderColor: 'var(--border)' }}>
                <div className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--text)' }}>
                  {possibleMatchesCount}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Matches
                </div>
              </div>
              <div className="border-l" style={{ borderColor: 'var(--border)' }}>
                <div className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--amber)' }}>
                  {claimsInProgressCount}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Pending
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. ALL-IN-ONE 1-CLICK INTAKE FORM (LEFT) + LIVE OUTPUT & RADAR (RIGHT)
      ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: ALL DETAILS ON ONE PAGE (NO "CONTINUE" BUTTONS) */}
        <div
          className="lg:col-span-7 rounded-[24px] border p-6 space-y-6 animate-card-enter"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {activeMode === 'lost'
                  ? 'All-in-One Lost Item Intake (1-Click Store & Match)'
                  : 'All-in-One Found Item Intake (1-Click Store & Match)'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Every detail is right here on the Home Page — fill or tap chips and submit in one click.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetFormDraft();
                setSubmittedResult(null);
                setFormError('');
              }}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-80"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Reset Fields
            </button>
          </div>

          {formError && (
            <div
              className="p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2"
              style={{ backgroundColor: 'var(--red-soft)', borderColor: 'var(--red)', color: 'var(--red)' }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          {/* BLOCK 1: CATEGORY & DESCRIPTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                01. Item Category & Description
              </label>
              <button
                type="button"
                onClick={() => setShowAllCategories((p) => !p)}
                className="text-xs font-semibold cursor-pointer hover:underline"
                style={{ color: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }}
              >
                {showAllCategories ? 'Show top 8 categories' : 'Show all 16 categories'}
              </button>
            </div>

            {!showAllCategories ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {popularCategories.map((cat) => {
                  const selected = formDraft.category_id === cat.category_id;
                  return (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() => updateFormDraft({ category_id: cat.category_id })}
                      className="p-2.5 rounded-xl border text-left flex items-center gap-2.5 interactive-lift cursor-pointer"
                      style={{
                        backgroundColor: selected
                          ? activeMode === 'lost'
                            ? 'var(--indigo-soft)'
                            : 'var(--teal-soft)'
                          : 'var(--raised)',
                        borderColor: selected
                          ? activeMode === 'lost'
                            ? 'var(--indigo)'
                            : 'var(--teal)'
                          : 'var(--border)',
                      }}
                    >
                      <CategoryIconBadge categoryId={cat.category_id} size="sm" isDark={isDark} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {cat.category_name}
                        </div>
                      </div>
                      {selected && (
                        <Check size={14} style={{ color: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <FloatingInput
                  id="cat-search-input"
                  label="Search all 16 categories"
                  value={catSearch}
                  onChange={setCatSearch}
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                  {filteredAllCategories.map((cat) => {
                    const selected = formDraft.category_id === cat.category_id;
                    return (
                      <button
                        key={cat.category_id}
                        type="button"
                        onClick={() => updateFormDraft({ category_id: cat.category_id })}
                        className="p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer"
                        style={{
                          backgroundColor: selected ? 'var(--indigo-soft)' : 'var(--raised)',
                          borderColor: selected ? 'var(--indigo)' : 'var(--border)',
                        }}
                      >
                        <CategoryIconBadge categoryId={cat.category_id} size="sm" isDark={isDark} />
                        <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text)' }}>
                          {cat.category_name}
                        </span>
                        {selected && <Check size={13} style={{ color: 'var(--indigo)' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description Input + 1-Tap Quick-Fill Suggestions */}
            <div className="space-y-2.5">
              <div className="relative">
                <textarea
                  id="report-description"
                  rows={2}
                  value={formDraft.description}
                  onChange={(e) => updateFormDraft({ description: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 rounded-xl border text-sm outline-none transition-all focus:ring-2 resize-none"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <label
                  htmlFor="report-description"
                  className="absolute left-4 top-2 text-[11px] font-medium transition-all pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px]"
                  style={{ color: 'var(--muted)' }}
                >
                  Item description (or tap a quick-fill chip below — auto-filled if left blank)
                </label>
              </div>

              {activeCategoryTemplates.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                    1-Tap Description:
                  </span>
                  {activeCategoryTemplates.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => updateFormDraft({ description: tpl })}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: formDraft.description === tpl ? 'var(--indigo-soft)' : 'var(--raised)',
                        borderColor: formDraft.description === tpl ? 'var(--indigo)' : 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <div>
                  <span>Keywords indexed for matching: </span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
                    {detectedKeywords.length > 0 ? detectedKeywords.join(' · ') : 'Auto-indexed on submit'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateFormDraft({ show_extra: !formDraft.show_extra })}
                  className="text-xs font-semibold cursor-pointer hover:underline"
                  style={{ color: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }}
                >
                  {formDraft.show_extra ? 'Hide extra marks' : '+ Add sticker / cover mark'}
                </button>
              </div>

              {formDraft.show_extra && (
                <FloatingInput
                  id="extra-details-input"
                  label="Optional distinguishing marks, sticker, cover, or contents"
                  value={formDraft.extra_details}
                  onChange={(v) => updateFormDraft({ extra_details: v })}
                />
              )}
            </div>
          </div>

          {/* BLOCK 2: INTERACTIVE CAMPUS MAP & WHEN */}
          <div className="space-y-4 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                02. Campus Zone & Date ({selectedLocationObj?.zone_name || 'Select Zone'})
              </label>
              <button
                type="button"
                onClick={() => setShowMapGraphic((p) => !p)}
                className="text-xs font-semibold cursor-pointer hover:underline"
                style={{ color: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }}
              >
                {showMapGraphic ? 'Hide Visual Map' : 'Show Visual Map'}
              </button>
            </div>

            {showMapGraphic && (
              <InteractiveCampusZoneMap
                selectedLocationId={formDraft.location_id}
                onSelectLocation={(locId) => updateFormDraft({ location_id: locId })}
                zoneCounts={zoneReportCounts}
                accentColor={activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)'}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {db.campuslocation.map((loc) => {
                const selected = formDraft.location_id === loc.location_id;
                return (
                  <button
                    key={loc.location_id}
                    type="button"
                    onClick={() => updateFormDraft({ location_id: loc.location_id })}
                    className="p-2.5 rounded-xl border text-left flex items-center justify-between gap-1.5 cursor-pointer interactive-lift"
                    style={{
                      backgroundColor: selected
                        ? activeMode === 'lost'
                          ? 'var(--indigo-soft)'
                          : 'var(--teal-soft)'
                        : 'var(--raised)',
                      borderColor: selected
                        ? activeMode === 'lost'
                          ? 'var(--indigo)'
                          : 'var(--teal)'
                        : 'var(--border)',
                    }}
                  >
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {loc.zone_name}
                    </span>
                    {selected && (
                      <Check size={13} style={{ color: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Date Row + Storage Desk (if Found) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              <div className="sm:col-span-7 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  When:
                </span>
                <button
                  type="button"
                  onClick={() => handleDatePreset('today')}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: formDraft.date_preset === 'today' ? 'var(--indigo-soft)' : 'var(--raised)',
                    borderColor: formDraft.date_preset === 'today' ? 'var(--indigo)' : 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('yesterday')}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: formDraft.date_preset === 'yesterday' ? 'var(--indigo-soft)' : 'var(--raised)',
                    borderColor: formDraft.date_preset === 'yesterday' ? 'var(--indigo)' : 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('two_days_ago')}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--raised)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  2 Days Ago
                </button>
              </div>
              <div className="sm:col-span-5">
                <FloatingInput
                  id="report-date-input"
                  label="Date (YYYY-MM-DD)"
                  type="date"
                  value={formDraft.date_str}
                  onChange={(v) => updateFormDraft({ date_str: v, date_preset: 'custom' })}
                />
              </div>
            </div>

            {activeMode === 'found' && (
              <div className="space-y-2 pt-1">
                <FloatingInput
                  id="storage-loc-input"
                  label="Currently stored at (Security Desk / Office Shelf)"
                  value={formDraft.storage_location}
                  onChange={(v) => updateFormDraft({ storage_location: v })}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Admin Office Shelf A',
                    'Security Desk Locker 1',
                    'Hostel Warden Room',
                    'Library Help Desk',
                    'Canteen Counter',
                    'Sports Office',
                  ].map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => updateFormDraft({ storage_location: place })}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer"
                      style={{
                        backgroundColor: formDraft.storage_location === place ? 'var(--teal-soft)' : 'var(--raised)',
                        borderColor: formDraft.storage_location === place ? 'var(--teal)' : 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      {place}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BLOCK 3: REPORTER IDENTITY (1-TAP PILLS OR NEW PERSON INLINE) */}
          <div className="space-y-3.5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                03. Reporter Identity ({selectedPersonObj ? `${selectedPersonObj.name} · ${selectedPersonObj.reg_no}` : 'New Person'})
              </label>
              <div
                className="flex items-center gap-1 p-1 rounded-xl border"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => updateFormDraft({ person_mode: 'existing' })}
                  className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: formDraft.person_mode === 'existing' ? 'var(--card)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  Existing Student/Staff
                </button>
                <button
                  type="button"
                  onClick={() => updateFormDraft({ person_mode: 'new' })}
                  className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: formDraft.person_mode === 'new' ? 'var(--card)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  + New Person
                </button>
              </div>
            </div>

            {formDraft.person_mode === 'existing' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredPersons.slice(0, 6).map((p) => {
                    const selected = formDraft.person_id === p.person_id;
                    return (
                      <button
                        key={p.person_id}
                        type="button"
                        onClick={() => {
                          updateFormDraft({ person_id: p.person_id });
                          setSelectedStudentPersonId(p.person_id);
                        }}
                        className="p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer interactive-lift"
                        style={{
                          backgroundColor: selected ? 'var(--indigo-soft)' : 'var(--raised)',
                          borderColor: selected ? 'var(--indigo)' : 'var(--border)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {p.name}
                          </div>
                          <div className="text-[10px] font-mono truncate" style={{ color: 'var(--muted)' }}>
                            {p.reg_no}
                          </div>
                        </div>
                        {selected && <Check size={13} style={{ color: 'var(--indigo)' }} />}
                      </button>
                    );
                  })}
                </div>
                <FloatingInput
                  id="person-search-box"
                  label="Or search all campus students & staff by name or reg no..."
                  value={personSearch}
                  onChange={setPersonSearch}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingInput
                  id="new-person-name"
                  label="Full Name"
                  value={formDraft.new_name}
                  onChange={(v) => updateFormDraft({ new_name: v })}
                />
                <FloatingInput
                  id="new-person-reg"
                  label="Registration / Staff No (e.g. 25BDE0062)"
                  value={formDraft.new_reg_no}
                  onChange={(v) => updateFormDraft({ new_reg_no: v })}
                />
                <FloatingInput
                  id="new-person-phone"
                  label="Mobile Number (10 digits)"
                  value={formDraft.new_phone}
                  onChange={(v) => updateFormDraft({ new_phone: v })}
                />
                <FloatingInput
                  id="new-person-email"
                  label="Campus Email"
                  value={formDraft.new_email}
                  onChange={(v) => updateFormDraft({ new_email: v })}
                />
              </div>
            )}
          </div>

          {/* SINGLE 1-CLICK SUBMIT & OUTPUT BAR */}
          <div
            className="pt-5 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              Ready to store as{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {activeMode === 'lost' ? 'LOSTREPORT' : 'FOUNDREPORT'}
              </span>{' '}
              · Auto-runs PL/SQL <span className="font-mono">compute_match_score</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOneClickSubmit}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl text-sm font-bold text-white inline-flex items-center justify-center gap-2 cursor-pointer interactive-lift shadow-sm"
                style={{ backgroundColor: activeMode === 'lost' ? 'var(--indigo)' : 'var(--teal)' }}
              >
                <Zap size={16} />
                <span>
                  {activeMode === 'lost'
                    ? '1-Click Store Lost Report & Output Matches'
                    : '1-Click Store Found Item & Output Matches'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: INSTANT OUTPUT RECEIPT + LIVE REAL-TIME MATCH RADAR */}
        <div className="lg:col-span-5 space-y-6">
          {/* STORED RECORD & OUTPUT PANEL (Appears immediately when 1-Click Submit or Instant Claim is clicked) */}
          {submittedResult && (
            <div
              className="rounded-[24px] border p-6 space-y-5 animate-card-enter"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: submittedResult.reportType === 'lost' ? 'var(--indigo)' : 'var(--teal)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-start justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: submittedResult.reportType === 'lost' ? 'var(--indigo-soft)' : 'var(--teal-soft)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 12.5L9.5 18L20 6.5"
                        stroke={submittedResult.reportType === 'lost' ? 'var(--indigo)' : 'var(--teal)'}
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-check-draw"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      Stored in Database · Instant Output Ready
                    </div>
                    <h3 className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
                      Reference:{' '}
                      <span
                        className="font-mono"
                        style={{ color: submittedResult.reportType === 'lost' ? 'var(--indigo)' : 'var(--teal)' }}
                      >
                        {submittedResult.refCode}
                      </span>
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedResult(null)}
                  className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  Clear
                </button>
              </div>

              {/* Stored Item Summary */}
              <div
                className="p-3.5 rounded-2xl border space-y-1.5 text-xs"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
              >
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {submittedResult.description}
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  {submittedResult.categoryName} · {submittedResult.zoneName} · {submittedResult.dateStr}
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  Reporter: <span style={{ color: 'var(--text)' }}>{submittedResult.personName}</span>
                </div>
              </div>

              {/* SQL Execution Output Receipt */}
              {lastTransaction && (
                <div
                  className="p-3 rounded-xl border space-y-1 font-mono text-[11px]"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>
                    SQL Output: {lastTransaction.resultProduced}
                  </div>
                  <div className="truncate">{lastTransaction.sqlComponent}</div>
                </div>
              )}

              {/* Computed Matches & 1-Click Claim / Verify Actions */}
              {submittedResult.matchesFound.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    Matches Computed ({submittedResult.matchesFound.length}) — 1-Click Actions:
                  </div>
                  <div className="space-y-2.5">
                    {submittedResult.matchesFound.map(({ match, lost, found }) => {
                      const z = db.campuslocation.find((l) => l.location_id === found.location_id);
                      const existingClaim = db.claimrequest.find((c) => c.match_id === match.match_id);
                      return (
                        <div
                          key={match.match_id}
                          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                              {found.description} ({formatFoundRef(found.found_id)})
                            </div>
                            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                              {z?.zone_name} · Stored at {found.storage_location}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {!existingClaim && match.total_score >= 50 && (
                                <button
                                  type="button"
                                  onClick={() => raiseClaimAction(match.match_id, lost.person_id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                                  style={{ backgroundColor: 'var(--indigo)' }}
                                >
                                  1-Click Raise Claim
                                </button>
                              )}
                              {existingClaim && existingClaim.verification_status === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={() => verifyClaimAction(existingClaim.claim_id, 1)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                                  style={{ backgroundColor: 'var(--teal)' }}
                                >
                                  1-Click Verify Claim ({formatClaimRef(existingClaim.claim_id)})
                                </button>
                              )}
                              {existingClaim && existingClaim.verification_status === 'Verified' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveSlipClaimId(existingClaim.claim_id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                                  style={{ backgroundColor: 'var(--green)' }}
                                >
                                  Output Handover Slip ({formatClaimRef(existingClaim.claim_id)})
                                </button>
                              )}
                            </div>
                          </div>
                          <ScoreRing score={match.total_score} size={50} showLabel />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Stored in database. No 50+ match threshold crossed yet — you can test matching with any item below in 1 click.
                </div>
              )}
            </div>
          )}

          {/* LIVE REAL-TIME MATCH RADAR PANEL */}
          <div
            className="rounded-[24px] border p-6 space-y-4"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  Live Match & Output Preview
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Updates automatically as you select categories, zones, or keywords
                </p>
              </div>
              <button
                type="button"
                onClick={() => runAllMatchingAction()}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-90"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--indigo)' }}
              >
                Scan All Pairs
              </button>
            </div>

            <div className="space-y-3">
              {liveMatches.length === 0 ? (
                <div
                  className="p-6 rounded-2xl border text-center space-y-2"
                  style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                >
                  <Search size={20} className="mx-auto" style={{ color: 'var(--muted)' }} />
                  <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    No matching items in this category yet
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    Select Phones, Wallets, Laptops, or Clothing to preview instant campus matches.
                  </p>
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border space-y-3 transition-all interactive-lift"
                    style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                          {m.title}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {m.zone} · {m.date}
                          {m.storage ? ` · Kept at ${m.storage}` : ''}
                        </div>
                        <div className="text-[11px] font-medium" style={{ color: 'var(--teal)' }}>
                          {m.reason}
                        </div>
                      </div>
                      <ScoreRing score={m.score} size={50} showLabel />
                    </div>

                    {/* 4-Factor Mini Breakdown + 1-Click Instant Claim Button */}
                    <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                        Cat:{m.catScore}/40 · Loc:{m.locScore}/20 · Date:{m.dtScore}/20 · Desc:{m.dsScore}/20
                      </div>
                      {m.foundItem && (
                        <button
                          type="button"
                          onClick={() => handleOneClickInstantClaimFound(m.foundItem!)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer hover:opacity-95"
                          style={{ backgroundColor: 'var(--indigo)' }}
                        >
                          1-Click Store & Claim →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. UNIFIED FOUND ITEMS VAULT ON HOME PAGE (1-CLICK CLAIM ANY ITEM)
      ===================================================================== */}
      <section
        className="rounded-[24px] border p-6 space-y-5"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Campus Unclaimed Found Vault ({homeFilteredFoundVault.length} items waiting for owners)
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Browse every found item right here on the Home Page — click once to claim or load into the studio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={vaultCatFilter}
              onChange={(e) => setVaultCatFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="h-10 px-3 rounded-xl border text-xs font-semibold outline-none"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="ALL">All Categories ({waitingForOwnersCount})</option>
              {db.itemcategory.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={vaultSearch}
              onChange={(e) => setVaultSearch(e.target.value)}
              placeholder="Filter found items by keyword, zone, shelf..."
              className="h-10 px-3.5 rounded-xl border text-xs outline-none w-64"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeFilteredFoundVault.slice(0, 6).map((found) => {
            const cat = db.itemcategory.find((c) => c.category_id === found.category_id);
            const loc = db.campuslocation.find((l) => l.location_id === found.location_id);
            const { title, isRedacted } = getSafeFoundTitle(found, cat?.category_name || '', loc?.zone_name || '');
            return (
              <div
                key={found.found_id}
                className="p-4 rounded-2xl border flex flex-col justify-between gap-3.5 interactive-lift"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <CategoryIconBadge categoryId={found.category_id} size="md" isDark={isDark} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                      {cat?.category_name} · <span className="font-mono">{formatFoundRef(found.found_id)}</span> · {found.date_found}
                    </div>
                    <div className="text-sm font-bold truncate mt-0.5" style={{ color: 'var(--text)' }}>
                      {title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      Found at <span style={{ color: 'var(--text)' }}>{loc?.zone_name}</span> · Kept at{' '}
                      <span style={{ color: 'var(--teal)' }}>{found.storage_location}</span>
                    </div>
                    {isRedacted && (
                      <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--amber)' }}>
                        <EyeOff size={11} />
                        <span>Sensitive details protected</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOneClickInstantClaimFound(found)}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: 'var(--indigo)' }}
                  >
                    1-Click Claim Now
                  </button>
                  <button
                    type="button"
                    onClick={() => prefillLostFromFound(found)}
                    className="py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Load in Studio ↑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          4. UNIFIED REPORTS, CLAIMS & 1-CLICK HANDOVER DESK ON HOME PAGE
      ===================================================================== */}
      <section
        className="rounded-[24px] border p-6 space-y-5"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Active Reports, Match Scores & 1-Click Claim Verification ({homeLostReports.length})
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Manage lost reports, raise or verify claims, and print official handover slips without leaving the Home Page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1 p-1 rounded-xl border"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setHomeReportsFilter('ALL_CAMPUS')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: homeReportsFilter === 'ALL_CAMPUS' ? 'var(--card)' : 'transparent',
                  color: 'var(--text)',
                }}
              >
                All Campus Reports ({db.lostreport.length})
              </button>
              <button
                type="button"
                onClick={() => setHomeReportsFilter('SELECTED_PERSON')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: homeReportsFilter === 'SELECTED_PERSON' ? 'var(--card)' : 'transparent',
                  color: 'var(--text)',
                }}
              >
                Selected Student Only
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {homeLostReports.slice(0, 8).map((lost) => {
            const cat = db.itemcategory.find((c) => c.category_id === lost.category_id);
            const loc = db.campuslocation.find((l) => l.location_id === lost.location_id);
            const person = db.person.find((p) => p.person_id === lost.person_id);
            const matches = db.matchscore
              .filter((m) => m.lost_id === lost.lost_id)
              .sort((a, b) => b.total_score - a.total_score);
            const topMatch = matches[0];
            const topFound = topMatch
              ? db.foundreport.find((f) => f.found_id === topMatch.found_id)
              : undefined;
            const claim = topMatch
              ? db.claimrequest.find((c) => c.match_id === topMatch.match_id)
              : undefined;

            return (
              <div
                key={lost.lost_id}
                className="p-4 rounded-2xl border space-y-3.5"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <CategoryIconBadge categoryId={lost.category_id} size="md" isDark={isDark} />
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                        <span className="font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                          {formatLostRef(lost.lost_id)}
                        </span>{' '}
                        · {cat?.category_name} · {loc?.zone_name} · {lost.date_lost}
                      </div>
                      {editingLostId === lost.lost_id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editingDescText}
                            onChange={(e) => setEditingDescText(e.target.value)}
                            className="h-8 px-2.5 rounded-lg border text-xs outline-none"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--indigo)', color: 'var(--text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editingDescText.trim()) {
                                updateTableRow('lostreport', lost.lost_id, { description: editingDescText.trim() });
                              }
                              setEditingLostId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white cursor-pointer"
                            style={{ backgroundColor: 'var(--indigo)' }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-bold truncate mt-0.5" style={{ color: 'var(--text)' }}>
                          {lost.description}
                        </div>
                      )}
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Reporter: {person?.name} ({person?.reg_no})
                      </div>
                    </div>
                  </div>
                  <StatusLabel kind="lost" status={lost.status} plain />
                </div>

                {/* Top Match & 1-Click Workflow Buttons */}
                {topMatch && topFound ? (
                  <div
                    className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                        Matched with {formatFoundRef(topFound.found_id)}: {topFound.description}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        Kept at <span style={{ color: 'var(--teal)' }}>{topFound.storage_location}</span> · Score{' '}
                        <span className="font-mono font-semibold">{topMatch.total_score}/100</span>
                      </div>
                      {claim && (
                        <div className="text-[11px] font-medium" style={{ color: 'var(--indigo)' }}>
                          Claim {formatClaimRef(claim.claim_id)}: {claim.verification_status}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!claim && topMatch.total_score >= 50 && (
                        <button
                          type="button"
                          onClick={() => raiseClaimAction(topMatch.match_id, lost.person_id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                          style={{ backgroundColor: 'var(--indigo)' }}
                        >
                          1-Click Raise Claim
                        </button>
                      )}
                      {claim && claim.verification_status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => verifyClaimAction(claim.claim_id, 1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                          style={{ backgroundColor: 'var(--teal)' }}
                        >
                          1-Click Verify
                        </button>
                      )}
                      {claim && claim.verification_status === 'Verified' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveSlipClaimId(claim.claim_id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                            style={{ backgroundColor: 'var(--indigo)' }}
                          >
                            Handover Slip
                          </button>
                          {topFound.status !== 'Returned' && (
                            <button
                              type="button"
                              onClick={() => markHandedOverAction(claim.claim_id)}
                              className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--green)' }}
                            >
                              Mark Returned
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs flex items-center justify-between pt-1" style={{ color: 'var(--muted)' }}>
                    <span>No 50+ match linked yet</span>
                  </div>
                )}

                {/* Quick Utility Footer on Report Card */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLostId(lost.lost_id);
                        setEditingDescText(lost.description);
                      }}
                      className="font-semibold cursor-pointer hover:underline"
                      style={{ color: 'var(--indigo)' }}
                    >
                      Edit Description
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShareItemState({
                          title: lost.description,
                          zone: loc?.zone_name || 'Campus',
                          date: lost.date_lost,
                          refCode: formatLostRef(lost.lost_id),
                          kind: 'lost',
                          isSensitive: SENSITIVE_CATEGORIES.has(lost.category_id),
                        })
                      }
                      className="font-medium cursor-pointer hover:underline"
                      style={{ color: 'var(--muted)' }}
                    >
                      Share
                    </button>
                  </div>
                  {lost.status !== 'Closed' ? (
                    <button
                      type="button"
                      onClick={() => closeLostReportAction(lost.lost_id)}
                      className="font-medium cursor-pointer hover:underline"
                      style={{ color: 'var(--muted)' }}
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => keepLookingLostReportAction(lost.lost_id)}
                      className="font-semibold cursor-pointer hover:underline"
                      style={{ color: 'var(--indigo)' }}
                    >
                      Reopen Search
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. LIVE CAMPUS INSIGHTS & CHARTS ON HOME PAGE
      ===================================================================== */}
      <section
        className="rounded-[24px] border overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <button
          type="button"
          onClick={() => setInsightsOpen((p) => !p)}
          className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:opacity-90"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 size={17} style={{ color: 'var(--indigo)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Insights & Campus Activity Analytics
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              · Categories, campus zones, and daily timeline
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
            <span>{insightsOpen ? 'Hide charts' : 'Show charts'}</span>
            {insightsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {insightsOpen && (
          <div className="px-6 pb-6 pt-2 border-t grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ borderColor: 'var(--border)' }}>
            {/* 1. Donut by top 6 categories + Other */}
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Reports by Top 6 Categories + Other
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {categoryDonutData.map((entry, idx) => (
                        <Cell key={entry.name} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Bar by zone Lost vs Found */}
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>
                By Campus Zone (Lost vs Found)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneBarData} margin={{ top: 5, right: 8, left: -20, bottom: 20 }}>
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
                    <Bar dataKey="Lost" fill="var(--indigo)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Found" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Line of reports per day */}
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Reports Logged per Day
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
                    <Line type="monotone" dataKey="Lost" stroke="var(--indigo)" strokeWidth={2.2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Found" stroke="var(--teal)" strokeWidth={2.2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Handover Slip Modal directly accessible from Home Page */}
      {activeSlipClaimObj && (
        <HandoverSlipModal
          claim={activeSlipClaimObj}
          onClose={() => setActiveSlipClaimId(null)}
        />
      )}

      {/* Share Report Modal directly accessible from Home Page */}
      {shareItemState && (
        <ShareReportModal
          itemTitle={shareItemState.title}
          zoneName={shareItemState.zone}
          dateStr={shareItemState.date}
          refCode={shareItemState.refCode}
          kind={shareItemState.kind}
          isSensitive={shareItemState.isSensitive}
          onClose={() => setShareItemState(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// MY REPORTS VIEW (with Timeline, 14-day prompt, Why this match?, Raise Claim, Handover Slip)
// ============================================================================
export const StudentMyReports: React.FC = () => {
  const {
    db,
    theme,
    selectedStudentPersonId,
    setSelectedStudentPersonId,
    raiseClaimAction,
    closeLostReportAction,
    keepLookingLostReportAction,
    updateTableRow,
    setActiveTab,
    updateFormDraft,
    showToast,
  } = useStore();

  const isDark = theme === 'dark';
  const [expandedWhyMatchId, setExpandedWhyMatchId] = useState<number | null>(null);
  const [slipClaimId, setSlipClaimId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'matches' | 'active' | 'closed'>('all');
  const [editingLostId, setEditingLostId] = useState<number | null>(null);
  const [editingDesc, setEditingDesc] = useState('');
  const [shareModalData, setShareModalData] = useState<{
    itemTitle: string;
    zoneName: string;
    dateStr: string;
    refCode: string;
    kind: 'lost' | 'found';
    isSensitive?: boolean;
  } | null>(null);

  const currentPerson = db.person.find((p) => p.person_id === selectedStudentPersonId) || db.person[0];
  const allMyLostReports = db.lostreport.filter((l) => l.person_id === currentPerson?.person_id);
  const myFoundReports = db.foundreport.filter((f) => f.person_id === currentPerson?.person_id);
  const today = getTodayDateStr();

  const TIMELINE_STEPS = ['Reported', 'Match found', 'Claim raised', 'Verified', 'Handed over'];

  const computeLostTimelineStep = (lost: LostReport): {
    stepIndex: number;
    bestMatch?: MatchScore;
    foundItem?: FoundReport;
    claim?: { claim_id: number; verification_status: string; rejection_reason?: string };
  } => {
    const matches = db.matchscore
      .filter((m) => m.lost_id === lost.lost_id)
      .sort((a, b) => b.total_score - a.total_score);
    const bestMatch = matches[0];
    if (!bestMatch || bestMatch.total_score < 50) {
      return { stepIndex: 0, bestMatch };
    }
    const foundItem = db.foundreport.find((f) => f.found_id === bestMatch.found_id);
    const claim = db.claimrequest.find((c) => c.match_id === bestMatch.match_id);
    if (!claim) {
      return { stepIndex: 1, bestMatch, foundItem };
    }
    if (claim.verification_status === 'Pending' || claim.verification_status === 'Rejected') {
      return { stepIndex: 2, bestMatch, foundItem, claim };
    }
    if (foundItem?.status === 'Returned') {
      return { stepIndex: 4, bestMatch, foundItem, claim };
    }
    return { stepIndex: 3, bestMatch, foundItem, claim };
  };

  const myLostReports = allMyLostReports.filter((l) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'matches') return l.status === 'Matched';
    if (statusFilter === 'active') return l.status === 'Active';
    return l.status === 'Closed';
  });

  const handleSaveDescription = (lostId: number) => {
    if (!editingDesc.trim()) return;
    const res = updateTableRow('lostreport', lostId, { description: editingDesc.trim() });
    if (res.ok) {
      showToast('Description updated and campus matches re-evaluated', 'success');
      setEditingLostId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Person Picker & Quick Action Bar */}
      <div
        className="rounded-[20px] border p-5 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              My Reports & Claim Progress
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Track every item you have reported lost or found on campus, edit descriptions, or download QR slips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UserCheck size={16} style={{ color: 'var(--indigo)' }} />
            <label htmlFor="student-picker" className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>
              Viewing as:
            </label>
            <select
              id="student-picker"
              value={currentPerson?.person_id || ''}
              onChange={(e) => setSelectedStudentPersonId(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {db.person.map((p) => (
                <option key={p.person_id} value={p.person_id}>
                  {p.name} ({p.reg_no})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Chips & Report Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${allMyLostReports.length})` },
                { id: 'matches', label: `Matches Found (${allMyLostReports.filter((l) => l.status === 'Matched').length})` },
                { id: 'active', label: `Still Looking (${allMyLostReports.filter((l) => l.status === 'Active').length})` },
                { id: 'closed', label: `Closed (${allMyLostReports.filter((l) => l.status === 'Closed').length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: statusFilter === tab.id ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: statusFilter === tab.id ? 'var(--indigo)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                updateFormDraft({ mode: 'lost', step: 1, person_mode: 'existing', person_id: currentPerson?.person_id || 2 });
                setActiveTab('home');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              + Report Lost
            </button>
            <button
              type="button"
              onClick={() => {
                updateFormDraft({ mode: 'found', step: 1, person_mode: 'existing', person_id: currentPerson?.person_id || 2 });
                setActiveTab('home');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--teal)' }}
            >
              + Report Found
            </button>
          </div>
        </div>
      </div>

      {/* Lost Reports Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Items I Lost ({myLostReports.length})
        </h2>

        {myLostReports.length === 0 ? (
          <div
            className="rounded-[20px] border p-8 text-center space-y-3"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {statusFilter === 'all'
                ? "You haven't reported any lost items yet."
                : 'No lost reports in this filter view.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {statusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Show all my reports
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  updateFormDraft({ mode: 'lost', step: 1 });
                  setActiveTab('home');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--indigo)' }}
              >
                Report a lost item
              </button>
            </div>
          </div>
        ) : (
          myLostReports.map((lost) => {
            const cat = db.itemcategory.find((c) => c.category_id === lost.category_id);
            const loc = db.campuslocation.find((z) => z.location_id === lost.location_id);
            const { stepIndex, bestMatch, foundItem, claim } = computeLostTimelineStep(lost);
            const daysOld = diffDays(today, lost.date_lost);
            const refCode = formatLostRef(lost.lost_id);
            const foundLoc = db.campuslocation.find((z) => z.location_id === foundItem?.location_id);
            const matchReasons =
              bestMatch && foundItem
                ? explainMatchInWords(bestMatch, lost, foundItem, foundLoc?.zone_name)
                : [];

            return (
              <div
                key={lost.lost_id}
                className="rounded-[20px] border p-6 space-y-5"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <CategoryIconBadge categoryId={lost.category_id} size="lg" isDark={isDark} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span className="font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
                          {refCode}
                        </span>
                        <span>·</span>
                        <span>{cat?.category_name}</span>
                        <span>·</span>
                        <span>{loc?.zone_name}</span>
                        <span>·</span>
                        <span>Lost {lost.date_lost}</span>
                      </div>

                      {editingLostId === lost.lost_id ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                            className="h-9 px-3 rounded-xl border text-xs font-medium outline-none flex-1 min-w-[200px]"
                            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--indigo)', color: 'var(--text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDescription(lost.lost_id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                            style={{ backgroundColor: 'var(--indigo)' }}
                          >
                            Save &amp; Re-Match
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLostId(null)}
                            className="px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer"
                            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 mt-1">
                          <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                            {lost.description}
                          </h3>
                          {lost.status !== 'Closed' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLostId(lost.lost_id);
                                setEditingDesc(lost.description);
                              }}
                              className="text-[11px] font-medium underline cursor-pointer"
                              style={{ color: 'var(--indigo)' }}
                            >
                              Edit details
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusLabel kind="lost" status={lost.status} plain />
                    <button
                      type="button"
                      onClick={() =>
                        setShareModalData({
                          itemTitle: lost.description,
                          zoneName: loc?.zone_name || 'Campus',
                          dateStr: lost.date_lost,
                          refCode,
                          kind: 'lost',
                          isSensitive: SENSITIVE_CATEGORIES.has(lost.category_id),
                        })
                      }
                      className="p-2 rounded-xl border cursor-pointer hover:opacity-80"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                      aria-label={`Share ${refCode}`}
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 5-Step Progress Timeline */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {TIMELINE_STEPS.map((label, idx) => {
                    const reached = idx <= stepIndex;
                    return (
                      <div key={label} className="space-y-1.5">
                        <div
                          className="h-1.5 rounded-full transition-colors"
                          style={{
                            backgroundColor: reached ? 'var(--indigo)' : 'var(--border)',
                          }}
                        />
                        <div
                          className="text-[11px] font-medium truncate"
                          style={{ color: reached ? 'var(--text)' : 'var(--muted)' }}
                        >
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Older than 14 days "Still looking?" prompt */}
                {lost.status === 'Active' && daysOld > 14 && (
                  <div
                    className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
                      <Clock size={14} style={{ color: 'var(--amber)' }} />
                      <span>
                        Reported {daysOld} days ago — <strong>Still looking?</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => keepLookingLostReportAction(lost.lost_id)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        Keep looking
                      </button>
                      <button
                        type="button"
                        onClick={() => closeLostReportAction(lost.lost_id)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                      >
                        Close report
                      </button>
                    </div>
                  </div>
                )}

                {/* Match Card (Lost left, Found right, joined by ScoreRing + "Why this match?" expander) */}
                {bestMatch && foundItem && (
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                      {/* Left: Lost Item */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                          Your Lost Item ({refCode})
                        </div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {lost.description}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {loc?.zone_name} · {lost.date_lost}
                        </div>
                      </div>

                      {/* Center: Animated SVG Score Ring */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center">
                        <ScoreRing score={bestMatch.total_score} size={56} showLabel hideNumber />
                      </div>

                      {/* Right: Found Item */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="text-[11px] font-semibold" style={{ color: 'var(--teal)' }}>
                          Found on Campus ({formatFoundRef(foundItem.found_id)})
                        </div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {getSafeFoundTitle(foundItem, cat?.category_name || '', foundLoc?.zone_name || '').title}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {foundLoc?.zone_name} · {foundItem.date_found} · Stored at {foundItem.storage_location}
                        </div>
                      </div>
                    </div>

                    {/* Actions & "Why this match?" Expander */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedWhyMatchId(
                            expandedWhyMatchId === bestMatch.match_id ? null : bestMatch.match_id
                          )
                        }
                        className="text-xs font-medium inline-flex items-center gap-1 cursor-pointer hover:underline"
                        style={{ color: 'var(--muted)' }}
                      >
                        <span>Why this match? (Score breakdown)</span>
                        {expandedWhyMatchId === bestMatch.match_id ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )}
                      </button>

                      <div className="flex items-center gap-2.5">
                        {!claim && bestMatch.total_score >= 50 && (
                          <button
                            type="button"
                            onClick={() => raiseClaimAction(bestMatch.match_id, lost.person_id)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-95"
                            style={{ backgroundColor: 'var(--indigo)' }}
                          >
                            Raise claim
                          </button>
                        )}

                        {claim && (
                          <div className="flex items-center gap-2.5">
                            <StatusLabel kind="claim" status={claim.verification_status} plain />
                            {claim.verification_status === 'Verified' && (
                              <button
                                type="button"
                                onClick={() => setSlipClaimId(claim.claim_id)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                                style={{ backgroundColor: 'var(--teal)' }}
                              >
                                <FileCheck2 size={14} />
                                <span>Handover Slip ({formatClaimRef(claim.claim_id)})</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedWhyMatchId === bestMatch.match_id && (
                      <div
                        className="p-3.5 rounded-xl border text-xs space-y-3"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <div className="font-medium">{matchReasons.join(' · ')}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'Category', val: bestMatch.category_score, max: 40, color: 'var(--indigo)' },
                            { label: 'Same Zone', val: bestMatch.location_score, max: 20, color: 'var(--teal)' },
                            { label: 'Date Proximity', val: bestMatch.date_score, max: 20, color: 'var(--amber)' },
                            { label: 'Shared Words', val: bestMatch.description_score, max: 20, color: 'var(--green)' },
                          ].map((b) => (
                            <div key={b.label} className="p-2 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
                              <div className="flex items-center justify-between text-[11px]">
                                <span style={{ color: 'var(--muted)' }}>{b.label}</span>
                                <span className="font-mono font-bold">{b.val}/{b.max}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
                                <div className="h-full rounded-full" style={{ width: `${(b.val / b.max) * 100}%`, backgroundColor: b.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Found Reports Logged by Student */}
      {myFoundReports.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Items I Found & Turned In ({myFoundReports.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFoundReports.map((f) => {
              const cat = db.itemcategory.find((c) => c.category_id === f.category_id);
              const loc = db.campuslocation.find((z) => z.location_id === f.location_id);
              return (
                <div
                  key={f.found_id}
                  className="rounded-[20px] border p-5 flex items-center justify-between gap-4"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <CategoryIconBadge categoryId={f.category_id} size="md" isDark={isDark} />
                    <div>
                      <div className="text-xs font-mono" style={{ color: 'var(--teal)' }}>
                        {formatFoundRef(f.found_id)} · {cat?.category_name}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {f.description}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        Found at {loc?.zone_name} · Stored at {f.storage_location}
                      </div>
                    </div>
                  </div>
                  <StatusLabel kind="found" status={f.status} plain />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <HandoverSlipModal claimId={slipClaimId} onClose={() => setSlipClaimId(null)} />
      {shareModalData && (
        <ShareReportModal {...shareModalData} onClose={() => setShareModalData(null)} />
      )}
    </div>
  );
};

// ============================================================================
// BROWSE FOUND VIEW (with privacy redaction for ID Cards, Documents, Wallets)
// ============================================================================
export const StudentBrowseFound: React.FC = () => {
  const { db, theme, prefillLostFromFound } = useStore();
  const isDark = theme === 'dark';

  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<number | 'All'>('All');
  const [last7DaysOnly, setLast7DaysOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareItem, setShareItem] = useState<FoundReport | null>(null);

  const unclaimedItems = useMemo(() => {
    const allDates = db.foundreport.map((f) => f.date_found).sort();
    const refLatestDate = allDates[allDates.length - 1] || getTodayDateStr();

    return db.foundreport
      .filter((f) => f.status === 'Unclaimed')
      .filter((f) => {
        if (selectedGroup !== 'All') {
          const grp = CATEGORY_META[f.category_id]?.group;
          if (grp !== selectedGroup) return false;
        }
        if (selectedZone !== 'All' && f.location_id !== selectedZone) return false;
        if (last7DaysOnly) {
          const d = diffDays(refLatestDate, f.date_found);
          if (d > 7) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const cat = db.itemcategory.find((c) => c.category_id === f.category_id)?.category_name.toLowerCase() || '';
          const zone = db.campuslocation.find((l) => l.location_id === f.location_id)?.zone_name.toLowerCase() || '';
          const safeTitle = getSafeFoundTitle(f, cat, zone).title.toLowerCase();
          return safeTitle.includes(q) || cat.includes(q) || zone.includes(q) || f.storage_location.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.date_found.localeCompare(a.date_found));
  }, [db.foundreport, db.itemcategory, db.campuslocation, selectedGroup, selectedZone, last7DaysOnly, searchQuery]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Browse Found Items Waiting for Owners
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Identifying details on wallets, ID cards, and certificates are hidden so only the true owner can verify them.
            </p>
          </div>
          <div className="w-full md:w-72">
            <FloatingInput
              id="browse-found-search"
              label="Search by item, category, zone, or desk"
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {['All', ...CATEGORY_GROUPS].map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: selectedGroup === grp ? 'var(--teal-soft)' : 'var(--raised)',
                borderColor: selectedGroup === grp ? 'var(--teal)' : 'var(--border)',
                color: 'var(--text)',
              }}
            >
              {grp}
            </button>
          ))}

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            aria-label="Filter by campus zone"
            className="h-8 px-3 rounded-xl border text-xs font-medium outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="All">All Campus Zones</option>
            {db.campuslocation.map((z) => (
              <option key={z.location_id} value={z.location_id}>
                {z.zone_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLast7DaysOnly((p) => !p)}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: last7DaysOnly ? 'var(--indigo-soft)' : 'var(--raised)',
              borderColor: last7DaysOnly ? 'var(--indigo)' : 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Recent (7 days)
          </button>
        </div>
      </div>

      {/* Grid of Unclaimed Items */}
      {unclaimedItems.length === 0 ? (
        <div
          className="rounded-[20px] border p-10 text-center space-y-3"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Search size={24} className="mx-auto" style={{ color: 'var(--muted)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            No unclaimed items match these filters
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedGroup('All');
              setSelectedZone('All');
              setLast7DaysOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unclaimedItems.map((found) => {
            const cat = db.itemcategory.find((c) => c.category_id === found.category_id);
            const loc = db.campuslocation.find((l) => l.location_id === found.location_id);
            const { title, isRedacted } = getSafeFoundTitle(
              found,
              cat?.category_name || '',
              loc?.zone_name || ''
            );
            const refCode = formatFoundRef(found.found_id);

            return (
              <div
                key={found.found_id}
                className="rounded-[20px] border p-5 flex flex-col justify-between gap-4 transition-transform duration-150 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CategoryIconBadge categoryId={found.category_id} size="md" isDark={isDark} />
                    <div className="flex items-center gap-2">
                      <StatusLabel kind="found" status={found.status} plain />
                      <button
                        type="button"
                        onClick={() => setShareItem(found)}
                        className="p-1.5 rounded-lg border cursor-pointer hover:opacity-80"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        aria-label={`Share ${refCode}`}
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {cat?.category_name} · {refCode}
                    </div>
                    <h3 className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                      {title}
                    </h3>
                  </div>

                  {isRedacted && (
                    <div
                      className="p-2.5 rounded-xl border text-[11px] flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      <EyeOff size={13} className="shrink-0" />
                      <span>Details hidden — describe yours in a lost report to match</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs" style={{ color: 'var(--muted)' }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>
                        {loc?.zone_name} · Found {found.date_found}
                      </span>
                    </div>
                    <div className="text-[11px] pl-5">
                      Kept at: <strong style={{ color: 'var(--text)' }}>{found.storage_location}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => prefillLostFromFound(found)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: 'var(--indigo)' }}
                >
                  This might be mine
                </button>
              </div>
            );
          })}
        </div>
      )}

      {shareItem && (
        <ShareReportModal
          itemTitle={shareItem.description}
          zoneName={db.campuslocation.find((l) => l.location_id === shareItem.location_id)?.zone_name || 'Campus'}
          dateStr={shareItem.date_found}
          refCode={formatFoundRef(shareItem.found_id)}
          kind="found"
          isSensitive={SENSITIVE_CATEGORIES.has(shareItem.category_id)}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// HELP VIEW (4-step "How FindIt works" + Interactive Match Simulator + Campus Desk Directory)
// ============================================================================
export const StudentHelp: React.FC = () => {
  const { db } = useStore();
  const [simSameCat, setSimSameCat] = useState(true);
  const [simSameZone, setSimSameZone] = useState(true);
  const [simLostDate, setSimLostDate] = useState('2026-10-14');
  const [simFoundDate, setSimFoundDate] = useState('2026-10-12');
  const [simLostDesc, setSimLostDesc] = useState('navy blue hoodie');
  const [simFoundDesc, setSimFoundDesc] = useState('navy blue hoodie cotton');

  const simCatScore = simSameCat ? 40 : 0;
  const simLocScore = simSameCat && simSameZone ? 20 : 0;
  const simDateScore = simSameCat ? dateProximityScore(simLostDate, simFoundDate) : 0;
  const simDescScore = simSameCat ? keywordOverlapScore(simLostDesc, simFoundDesc) : 0;
  const simTotal = simCatScore + simLocScore + simDateScore + simDescScore;

  const steps = [
    {
      num: '01',
      title: 'Report what you lost or found',
      desc: 'Pick a category, campus zone, and write a plain description. If you found an item, note which desk or office is keeping it safe.',
    },
    {
      num: '02',
      title: 'Automatic smart matching',
      desc: 'FindIt compares items in the same category across campus locations, dates, and shared words to calculate a match confidence score.',
    },
    {
      num: '03',
      title: 'Raise a claim on likely matches',
      desc: 'When a "Very likely" or "Possible" match appears in My Reports, click "Raise claim" so a campus officer can review ownership.',
    },
    {
      num: '04',
      title: 'Verify & collect with your Handover Slip',
      desc: 'Once approved by an officer, download or print your QR Handover Slip and collect your item from the listed storage desk.',
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6 md:p-8 space-y-6"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle size={20} style={{ color: 'var(--indigo)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            How FindIt Works
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-5 rounded-2xl border space-y-2"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
            >
              <div className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
                Step {s.num}
              </div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {s.title}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Match Score Simulator */}
      <div
        className="rounded-[20px] border p-6 md:p-8 space-y-5"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            Interactive Match Score Simulator
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Test how FindIt scores a Lost and Found pair across Category (40), Location (20), Date Proximity (20), and Shared Keywords (20). Claims require a score of at least 50/100.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSimSameCat((p) => !p)}
                className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: simSameCat ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: simSameCat ? 'var(--indigo)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {simSameCat ? '✓ Same Category (+40)' : '✕ Different Category (0)'}
              </button>
              <button
                type="button"
                onClick={() => setSimSameZone((p) => !p)}
                className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: simSameZone ? 'var(--teal-soft)' : 'var(--raised)',
                  borderColor: simSameZone ? 'var(--teal)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {simSameZone ? '✓ Same Campus Zone (+20)' : '✕ Different Zone (+0)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingInput
                id="sim-lost-desc"
                label="Lost Item Description"
                value={simLostDesc}
                onChange={setSimLostDesc}
              />
              <FloatingInput
                id="sim-found-desc"
                label="Found Item Description"
                value={simFoundDesc}
                onChange={setSimFoundDesc}
              />
              <FloatingInput
                id="sim-lost-date"
                label="Date Lost"
                type="date"
                value={simLostDate}
                onChange={setSimLostDate}
              />
              <FloatingInput
                id="sim-found-date"
                label="Date Found"
                type="date"
                value={simFoundDate}
                onChange={setSimFoundDate}
              />
            </div>
          </div>

          <div
            className="lg:col-span-4 p-5 rounded-2xl border flex flex-col items-center text-center space-y-3"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
          >
            <ScoreRing score={simTotal} size={76} showLabel />
            <div className="text-xs font-semibold" style={{ color: simTotal >= 50 ? 'var(--teal)' : 'var(--amber)' }}>
              {simTotal >= 50
                ? '✓ Eligible to Raise a Claim (Score ≥ 50)'
                : 'Blocked by Trigger (Score < 50)'}
            </div>
            <div className="w-full text-[11px] font-mono grid grid-cols-2 gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <div>Category: {simCatScore}/40</div>
              <div>Zone: {simLocScore}/20</div>
              <div>Dates: {simDateScore}/20</div>
              <div>Keywords: {simDescScore}/20</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Storage Desks & Zones Directory */}
      <div
        className="rounded-[20px] border p-6 md:p-8 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            Campus Zones &amp; Collection Desk Directory
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Bring your university ID card and verified Claim Reference (`CL-XXXX`) when collecting an item.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {db.campuslocation.map((z) => {
            const countAtZone = db.foundreport.filter((f) => f.location_id === z.location_id && f.status === 'Unclaimed').length;
            return (
              <div
                key={z.location_id}
                className="p-4 rounded-2xl border space-y-1"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {z.zone_name}
                  </span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--teal)' }}>
                    {countAtZone} unclaimed
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {z.building_description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

