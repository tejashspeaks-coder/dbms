import React from 'react';
import { CheckCircle2, Download, Printer, X } from 'lucide-react';
import { formatClaimRef, formatFoundRef, formatLostRef, useStore } from '../store';
import { ClaimQrCode } from './IconsAndGraphics';

export const HandoverSlipModal: React.FC<{
  claimId: number | null;
  onClose: () => void;
}> = ({ claimId, onClose }) => {
  const { db, role, markHandedOverAction, showToast } = useStore();

  if (claimId === null) return null;

  const claim = db.claimrequest.find((c) => c.claim_id === claimId);
  if (!claim) return null;

  const match = db.matchscore.find((m) => m.match_id === claim.match_id);
  const found = db.foundreport.find((f) => f.found_id === match?.found_id);
  const lost = db.lostreport.find((l) => l.lost_id === match?.lost_id);
  const claimant = db.person.find((p) => p.person_id === claim.person_id);
  const admin = claim.admin_id ? db.admin.find((a) => a.admin_id === claim.admin_id) : null;
  const category = db.itemcategory.find((c) => c.category_id === found?.category_id);
  const zone = db.campuslocation.find((z) => z.location_id === found?.location_id);

  const claimRef = formatClaimRef(claim.claim_id);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    showToast('Opening print-to-PDF dialog for Handover Slip', 'info');
    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(15, 17, 21, 0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Handover Slip ${claimRef}`}
    >
      <div
        className="w-full max-w-lg rounded-[20px] border p-6 relative"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg border no-print cursor-pointer hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          aria-label="Close handover slip"
        >
          <X size={16} />
        </button>

        <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--teal)' }}>
              Vellore Institute of Technology · Campus Lost & Found
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Official Item Handover Slip
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Present this slip at the storage desk to collect your verified item.
            </p>
          </div>
          <ClaimQrCode value={claimRef} size={88} />
        </div>

        <div className="grid grid-cols-2 gap-3.5 py-4 text-sm">
          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Claim Reference</div>
            <div className="font-mono font-bold text-base mt-0.5" style={{ color: 'var(--indigo)' }}>
              {claimRef}
            </div>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Verification Status</div>
            <div className="font-semibold text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
              <CheckCircle2 size={15} />
              <span>{found?.status === 'Returned' ? 'Handed Over (Returned)' : 'Verified & Approved'}</span>
            </div>
          </div>

          <div className="col-span-2 p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Verified Item</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
              {found?.description || lost?.description}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {category?.category_name} · Found at {zone?.zone_name}
              {role !== 'Student' && found && lost && (
                <span> · ({formatLostRef(lost.lost_id)} ↔ {formatFoundRef(found.found_id)})</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Collect From (Storage)</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--teal)' }}>
              {found?.storage_location || 'Admin Office Shelf A'}
            </div>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Claim Date</div>
            <div className="font-mono font-medium mt-0.5" style={{ color: 'var(--text)' }}>
              {claim.claim_date}
            </div>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Claimant</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
              {claimant?.name}
            </div>
            <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              {claimant?.reg_no} · {claimant?.phone}
            </div>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Verified By Admin</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
              {admin?.name || 'Ramesh Babu'}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {admin?.designation || 'Lost and Found Officer'}
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t no-print"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(role === 'Admin' || role === 'Developer') && found?.status !== 'Returned' && (
              <button
                type="button"
                onClick={() => markHandedOverAction(claim.claim_id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-95"
                style={{ backgroundColor: 'var(--teal)' }}
              >
                Mark handed over
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
