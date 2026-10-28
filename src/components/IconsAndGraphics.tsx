import React, { useEffect, useState } from 'react';
import {
  Backpack,
  BookOpen,
  CupSoda,
  FileText,
  Glasses,
  Headphones,
  IdCard,
  KeyRound,
  Laptop,
  Package,
  PenTool,
  Shirt,
  Smartphone,
  Trophy,
  Wallet,
  Watch,
} from 'lucide-react';
import { CATEGORY_META } from '../seedData';
import { ClaimStatus, FoundStatus, LostStatus } from '../types';

export const FindItLogo: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0"
  >
    <circle cx="14" cy="14" r="9.5" stroke="var(--indigo)" strokeWidth="2.4" />
    <path d="M21 21L27.5 27.5" stroke="var(--indigo)" strokeWidth="2.6" strokeLinecap="round" />
    <path
      d="M14 9C11.65 9 9.75 10.9 9.75 13.25C9.75 16.2 14 19.6 14 19.6C14 19.6 18.25 16.2 18.25 13.25C18.25 10.9 16.35 9 14 9Z"
      fill="var(--teal)"
    />
    <circle cx="14" cy="13" r="1.7" fill="var(--card)" />
    <path
      d="M24.5 4.5L25.3 6.9L27.7 7.7L25.3 8.5L24.5 10.9L23.7 8.5L21.3 7.7L23.7 6.9L24.5 4.5Z"
      fill="var(--teal)"
    />
  </svg>
);

export const CampusHeroIllustration: React.FC = () => (
  <div className="relative flex items-center justify-center select-none pointer-events-none">
    <svg
      viewBox="0 0 380 230"
      className="w-full max-w-[360px] h-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Campus recovery radar illustration showing academic building, location pin, backpack, wallet, and ID card"
    >
      {/* Animated Radar Pulse Rings behind Campus */}
      <circle
        cx="190"
        cy="115"
        r="78"
        stroke="var(--indigo-border)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="animate-radar-ring"
      />
      <circle
        cx="190"
        cy="115"
        r="102"
        stroke="var(--teal-border)"
        strokeWidth="1.2"
        opacity="0.55"
      />

      {/* Ground line & subtle platform */}
      <ellipse cx="190" cy="202" rx="142" ry="12" fill="var(--indigo-soft)" />

      {/* Main Campus Academic Building (Floating gently) */}
      <g className="animate-hero-float">
        <rect
          x="98"
          y="78"
          width="184"
          height="112"
          rx="12"
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="2"
        />
        {/* Pediment / Roof */}
        <path
          d="M88 80L190 36L292 80H88Z"
          fill="var(--raised)"
          stroke="var(--border)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Clock / Emblem in pediment */}
        <circle cx="190" cy="62" r="9.5" fill="var(--indigo-soft)" stroke="var(--indigo)" strokeWidth="1.8" />
        <path d="M190 57.5V62L193.5 64" stroke="var(--indigo)" strokeWidth="1.6" strokeLinecap="round" />

        {/* Building Windows & Pillars */}
        <rect x="118" y="96" width="24" height="28" rx="5" fill="var(--indigo-soft)" stroke="var(--indigo-border)" strokeWidth="1.4" />
        <rect x="154" y="96" width="24" height="28" rx="5" fill="var(--indigo-soft)" stroke="var(--indigo-border)" strokeWidth="1.4" />
        <rect x="202" y="96" width="24" height="28" rx="5" fill="var(--teal-soft)" stroke="var(--teal-border)" strokeWidth="1.4" />
        <rect x="238" y="96" width="24" height="28" rx="5" fill="var(--teal-soft)" stroke="var(--teal-border)" strokeWidth="1.4" />

        {/* Entrance Arch */}
        <path
          d="M170 190V150C170 138.954 178.954 130 190 130C201.046 130 210 138.954 210 150V190H170Z"
          fill="var(--raised)"
          stroke="var(--border)"
          strokeWidth="1.8"
        />

        {/* Connection Arcs from Building to Floating Items */}
        <path
          d="M98 124C76 120 68 118 58 118"
          stroke="var(--indigo)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.55"
        />
        <path
          d="M282 96C296 86 304 78 312 74"
          stroke="var(--teal)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.65"
        />
      </g>

      {/* Floating Card 1: Backpack (Left, reverse float) */}
      <g className="animate-hero-float-delayed">
        <g transform="translate(22, 92)">
          <rect width="60" height="64" rx="15" fill="var(--card)" stroke="var(--indigo-border)" strokeWidth="1.8" />
          <path
            d="M22 23C22 18.5 25.5 15 30 15C34.5 15 38 18.5 38 23"
            stroke="var(--indigo)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect x="17" y="22" width="26" height="28" rx="6" fill="var(--indigo-soft)" stroke="var(--indigo)" strokeWidth="1.8" />
          <rect x="22" y="34" width="16" height="9" rx="3" fill="var(--card)" stroke="var(--indigo)" strokeWidth="1.5" />
        </g>
      </g>

      {/* Floating Card 2: Wallet + Match Badge (Top Right) */}
      <g className="animate-hero-float">
        <g transform="translate(290, 42)">
          <rect width="64" height="54" rx="14" fill="var(--card)" stroke="var(--teal-border)" strokeWidth="1.8" />
          <rect x="15" y="16" width="32" height="22" rx="5" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.8" />
          <path d="M37 23H47V31H37C35 31 34 29.5 34 27C34 24.5 35 23 37 23Z" fill="var(--card)" stroke="var(--teal)" strokeWidth="1.5" />
          <circle cx="38.5" cy="27" r="1.4" fill="var(--teal)" />
          <circle cx="54" cy="10" r="8" fill="var(--green)" />
          <path d="M50.5 10L53 12.5L57.5 7.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Floating Card 3: Student ID Card (Bottom Right, reverse float) */}
      <g className="animate-hero-float-delayed">
        <g transform="translate(280, 126)">
          <rect width="70" height="52" rx="13" fill="var(--card)" stroke="var(--border)" strokeWidth="1.8" />
          <circle cx="24" cy="26" r="7" fill="var(--indigo-soft)" stroke="var(--indigo)" strokeWidth="1.6" />
          <path d="M15 39C16.5 35 20 33 24 33C28 33 31.5 35 33 39" stroke="var(--indigo)" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="38" y1="21" x2="56" y2="21" stroke="var(--teal)" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="38" y1="28" x2="52" y2="28" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="38" y1="35" x2="48" y2="35" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Floating Location Pin above Campus */}
      <g className="animate-hero-float">
        <g transform="translate(172, 6)">
          <path
            d="M18 2C10.82 2 5 7.82 5 15C5 24.2 18 35 18 35C18 35 31 24.2 31 15C31 7.82 25.18 2 18 2Z"
            fill="var(--teal)"
          />
          <circle cx="18" cy="14.5" r="4.5" fill="var(--card)" />
        </g>
      </g>
    </svg>
  </div>
);

export const InteractiveCampusZoneMap: React.FC<{
  selectedLocationId: number | null;
  onSelectLocation: (locId: number) => void;
  zoneCounts?: Record<number, number>;
  accentColor?: string;
}> = ({ selectedLocationId, onSelectLocation, zoneCounts = {}, accentColor = 'var(--indigo)' }) => {
  const MAP_NODES: { id: number; label: string; short: string; x: number; y: number }[] = [
    { id: 5, label: 'Main Gate', short: 'Main Gate', x: 65, y: 145 },
    { id: 10, label: 'Parking Area', short: 'Parking', x: 65, y: 70 },
    { id: 1, label: 'Central Library', short: 'Library', x: 185, y: 82 },
    { id: 6, label: 'Academic Block', short: 'Academic', x: 185, y: 145 },
    { id: 8, label: 'CSE Department', short: 'CSE Dept', x: 295, y: 62 },
    { id: 9, label: 'Auditorium', short: 'Auditorium', x: 295, y: 122 },
    { id: 4, label: 'Canteen', short: 'Canteen', x: 395, y: 95 },
    { id: 7, label: 'Sports Complex', short: 'Sports', x: 395, y: 155 },
    { id: 2, label: 'Hostel Block A', short: 'Hostel A', x: 505, y: 72 },
    { id: 3, label: 'Hostel Block B', short: 'Hostel B', x: 505, y: 142 },
  ];

  return (
    <div
      className="rounded-2xl border p-3.5 overflow-hidden"
      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Interactive Campus Zone Map — click any building to select
        </span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          10 Campus Zones
        </span>
      </div>
      <svg
        viewBox="0 0 575 195"
        className="w-full h-auto select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle Campus Pathways */}
        <path
          d="M65 145 L185 145 L185 82 L295 62 L395 95 L505 72 M185 145 L295 122 L395 155 L505 142 M65 70 L65 145 M395 95 L395 155 M505 72 L505 142"
          stroke="var(--border)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {MAP_NODES.map((node) => {
          const isSelected = selectedLocationId === node.id;
          const count = zoneCounts[node.id] || 0;
          return (
            <g
              key={node.id}
              onClick={() => onSelectLocation(node.id)}
              className="cursor-pointer transition-opacity hover:opacity-90"
            >
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="28"
                  fill={accentColor}
                  opacity="0.14"
                />
              )}
              <rect
                x={node.x - 44}
                y={node.y - 20}
                width="88"
                height="40"
                rx="10"
                fill={isSelected ? 'var(--card)' : 'var(--bg)'}
                stroke={isSelected ? accentColor : 'var(--border)'}
                strokeWidth={isSelected ? '2.2' : '1.3'}
              />
              <text
                x={node.x}
                y={node.y - 2}
                textAnchor="middle"
                fill="var(--text)"
                fontSize="10.5"
                fontWeight={isSelected ? '700' : '600'}
              >
                {node.short}
              </text>
              <text
                x={node.x}
                y={node.y + 11}
                textAnchor="middle"
                fill={isSelected ? accentColor : 'var(--muted)'}
                fontSize="9"
                fontWeight="500"
              >
                {count} {count === 1 ? 'report' : 'reports'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const CategoryIconBadge: React.FC<{
  categoryId: number;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}> = ({ categoryId, size = 'md', isDark = false }) => {
  const meta = CATEGORY_META[categoryId] || CATEGORY_META[16];
  const bg = isDark ? meta.tintDark : meta.tintLight;
  const color = isDark ? meta.iconColorDark : meta.iconColorLight;

  const boxClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-10 h-10 rounded-xl';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 19;

  const renderIcon = () => {
    switch (categoryId) {
      case 1:
        return <Smartphone size={iconSize} style={{ color }} />;
      case 2:
        return <Laptop size={iconSize} style={{ color }} />;
      case 3:
        return <Headphones size={iconSize} style={{ color }} />;
      case 4:
        return <Wallet size={iconSize} style={{ color }} />;
      case 5:
        return <IdCard size={iconSize} style={{ color }} />;
      case 6:
        return <FileText size={iconSize} style={{ color }} />;
      case 7:
        return <BookOpen size={iconSize} style={{ color }} />;
      case 8:
        return <PenTool size={iconSize} style={{ color }} />;
      case 9:
        return <Backpack size={iconSize} style={{ color }} />;
      case 10:
        return <KeyRound size={iconSize} style={{ color }} />;
      case 11:
        return <Watch size={iconSize} style={{ color }} />;
      case 12:
        return <Glasses size={iconSize} style={{ color }} />;
      case 13:
        return <Shirt size={iconSize} style={{ color }} />;
      case 14:
        return <CupSoda size={iconSize} style={{ color }} />;
      case 15:
        return <Trophy size={iconSize} style={{ color }} />;
      default:
        return <Package size={iconSize} style={{ color }} />;
    }
  };

  return (
    <div
      className={`${boxClass} flex items-center justify-center shrink-0 transition-transform duration-150`}
      style={{ backgroundColor: bg }}
    >
      {renderIcon()}
    </div>
  );
};

export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  showLabel?: boolean;
  hideNumber?: boolean;
}> = ({ score, size = 56, showLabel = true, hideNumber = false }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setAnimatedScore(score);
    }, 30);
    return () => window.clearTimeout(t);
  }, [score]);

  const strokeWidth = size >= 52 ? 5 : 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, animatedScore)) / 100) * circumference;

  const ringColor =
    score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const labelText =
    score >= 80 ? 'Very likely' : score >= 50 ? 'Possible' : 'Unlikely';

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 550ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <span
          className="absolute text-xs font-semibold tabular-nums"
          style={{ color: 'var(--text)' }}
        >
          {hideNumber ? (score >= 80 ? '80+' : score >= 50 ? '50+' : '<50') : `${score}`}
        </span>
      </div>
      {showLabel && (
        <span
          className="text-[11px] font-medium whitespace-nowrap"
          style={{ color: ringColor }}
        >
          {labelText}
        </span>
      )}
    </div>
  );
};

// Plain-language translation for Student / Staff vs raw status for Admin / Developer
export function getPlainLostStatus(status: LostStatus): string {
  switch (status) {
    case 'Active':
      return 'Still looking';
    case 'Matched':
      return 'Possible match found';
    case 'Closed':
      return 'Resolved';
  }
}

export function getPlainFoundStatus(status: FoundStatus): string {
  switch (status) {
    case 'Unclaimed':
      return 'Waiting for its owner';
    case 'Claimed':
      return 'Claim approved';
    case 'Returned':
      return 'Handed over';
  }
}

export function getPlainClaimStatus(status: ClaimStatus): string {
  switch (status) {
    case 'Pending':
      return 'Waiting for verification';
    case 'Verified':
      return 'Claim approved';
    case 'Rejected':
      return 'Not approved';
  }
}

export const StatusLabel: React.FC<{
  kind: 'lost' | 'found' | 'claim';
  status: string;
  plain?: boolean;
}> = ({ kind, status, plain = false }) => {
  let label = status;
  if (plain) {
    if (kind === 'lost') label = getPlainLostStatus(status as LostStatus);
    if (kind === 'found') label = getPlainFoundStatus(status as FoundStatus);
    if (kind === 'claim') label = getPlainClaimStatus(status as ClaimStatus);
  }

  let dotColor = 'var(--muted)';
  if (kind === 'lost') {
    dotColor =
      status === 'Active'
        ? 'var(--indigo)'
        : status === 'Matched'
        ? 'var(--amber)'
        : 'var(--green)';
  } else if (kind === 'found') {
    dotColor =
      status === 'Unclaimed'
        ? 'var(--teal)'
        : status === 'Claimed'
        ? 'var(--amber)'
        : 'var(--green)';
  } else {
    dotColor =
      status === 'Pending'
        ? 'var(--amber)'
        : status === 'Verified'
        ? 'var(--green)'
        : 'var(--red)';
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
};

// Deterministic SVG QR Code representation for Claim Reference (clean fallback with zero external dependency)
export const ClaimQrCode: React.FC<{ value: string; size?: number }> = ({ value, size = 116 }) => {
  const grid = 15;
  const cells: boolean[][] = Array.from({ length: grid }, () => Array(grid).fill(false));

  // Draw 3 standard finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
          cells[r0 + r][c0 + c] = true;
        }
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, grid - 5);
  drawFinder(grid - 5, 0);

  // Fill data modules deterministically from string hash
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= grid - 6;
      const inBottomLeft = r >= grid - 6 && c < 6;
      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        const bitIdx = (r * grid + c) % 31;
        const charFactor = value.charCodeAt((r + c) % value.length) || 7;
        cells[r][c] = ((hash >> bitIdx) ^ (charFactor + r * 3 + c * 5)) % 2 === 0;
      }
    }
  }

  const cellSize = size / grid;

  return (
    <div
      className="p-2.5 rounded-xl border inline-flex flex-col items-center gap-1"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`QR code for ${value}`}
      >
        {cells.map((row, rIdx) =>
          row.map((filled, cIdx) =>
            filled ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx * cellSize}
                y={rIdx * cellSize}
                width={cellSize - 0.5}
                height={cellSize - 0.5}
                rx={1}
                fill="var(--text)"
              />
            ) : null
          )
        )}
      </svg>
      <span className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--muted)' }}>
        {value}
      </span>
    </div>
  );
};
