import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, Copy, Database, Terminal } from 'lucide-react';
import { useStore } from '../store';
import { TransactionExplainerData } from '../types';

export const TransactionExplainerCard: React.FC<{
  tx?: TransactionExplainerData | null;
  compact?: boolean;
}> = ({ tx: propTx, compact = false }) => {
  const { lastTransaction, showToast } = useStore();
  const tx = propTx ?? lastTransaction;
  const [copied, setCopied] = useState(false);

  if (!tx) return null;

  const steps = [
    'User Operation',
    'SQL/PL-SQL',
    'Database Processing',
    'Database Update',
    'Result',
  ];

  const handleCopy = () => {
    navigator.clipboard?.writeText(tx.rawSql);
    setCopied(true);
    showToast('Oracle SQL copied to clipboard', 'info');
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="rounded-[20px] border p-5 transition-all no-print"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: 'var(--indigo)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Transaction Explainer
          </h3>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            · {tx.timestamp}
          </span>
        </div>

        {/* 5-Stage Pipeline Flow */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {steps.map((s, idx) => (
            <React.Fragment key={s}>
              <span
                className="px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {s}
              </span>
              {idx < steps.length - 1 && <ArrowRight size={12} style={{ color: 'var(--muted)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Five mandatory explainer lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--muted)' }}>
            What operation?
          </div>
          <div className="font-semibold" style={{ color: 'var(--text)' }}>
            {tx.userOperation}
          </div>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--muted)' }}>
            Which table(s)?
          </div>
          <div className="font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
            {tx.tablesAffected.join(', ')}
          </div>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--muted)' }}>
            Which SQL/PL-SQL component ran?
          </div>
          <div className="font-mono font-medium" style={{ color: 'var(--text)' }}>
            {tx.sqlComponent}
          </div>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--muted)' }}>
            How was the database affected?
          </div>
          <div className="font-medium" style={{ color: 'var(--text)' }}>
            {tx.rowsChanged}
          </div>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
          <div className="font-medium mb-1" style={{ color: 'var(--muted)' }}>
            What result was produced?
          </div>
          <div className="font-semibold" style={{ color: 'var(--teal)' }}>
            {tx.resultProduced}
          </div>
        </div>
      </div>

      {!compact && tx.rawSql && (
        <div className="mt-3 rounded-xl overflow-hidden border" style={{ backgroundColor: '#0D1017', borderColor: '#262B36' }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b" style={{ borderColor: '#262B36' }}>
            <span className="text-[11px] font-mono text-slate-400">Executed Oracle SQL / PL-SQL</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed m-0">
            {tx.rawSql}
          </pre>
        </div>
      )}
    </div>
  );
};

export const DeveloperBottomSqlPanel: React.FC = () => {
  const { role, showSqlBar, setShowSqlBar, lastTransaction, showToast } = useStore();
  const [expanded, setExpanded] = useState(false);

  if (role !== 'Developer' || !showSqlBar || !lastTransaction) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(lastTransaction.rawSql);
    showToast('SQL copied to clipboard', 'info');
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t no-print"
      style={{ backgroundColor: '#11141C', borderColor: '#2A2F3A', color: '#E8EAF0' }}
    >
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex items-center justify-between py-2.5 gap-4">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-2.5 text-xs font-mono text-left truncate cursor-pointer hover:opacity-90"
          >
            <Terminal size={14} style={{ color: 'var(--teal)' }} className="shrink-0" />
            <span className="font-semibold text-indigo-300 shrink-0">Oracle SQL Log:</span>
            <span className="text-slate-300 truncate">{lastTransaction.userOperation}</span>
            <span className="text-slate-500 shrink-0">({lastTransaction.sqlComponent})</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md text-xs font-mono border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              Copy SQL
            </button>
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer"
              aria-label={expanded ? 'Collapse SQL drawer' : 'Expand SQL drawer'}
            >
              <span>{expanded ? 'Hide' : 'Inspect'}</span>
              {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setShowSqlBar(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-1.5 cursor-pointer"
              title="Close SQL bar (can re-enable in top bar)"
            >
              ✕
            </button>
          </div>
        </div>

        {expanded && (
          <div className="pb-4 pt-1 border-t border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>User Operation</span>
              <ArrowRight size={11} />
              <span>SQL/PL-SQL ({lastTransaction.sqlComponent})</span>
              <ArrowRight size={11} />
              <span>Tables ({lastTransaction.tablesAffected.join(', ')})</span>
              <ArrowRight size={11} />
              <span>Update ({lastTransaction.rowsChanged})</span>
              <ArrowRight size={11} />
              <span className="text-teal-300">{lastTransaction.resultProduced}</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-40 m-0">
              {lastTransaction.rawSql}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
