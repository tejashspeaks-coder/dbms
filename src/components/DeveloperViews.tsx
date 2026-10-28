import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Database,
  Edit3,
  Eye,
  FileCode,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  generate02DataSql,
  JDBC_SAMPLE_JAVA,
  SQL_01_DDL,
  SQL_03_DML_TCL,
  SQL_04_PLSQL,
  SQL_05_LAB_CYCLE,
  SQL_06_MODULE_QUERIES,
  SQL_07_TRANSACTIONS,
} from '../seedData';
import {
  LAB_CYCLE_QUERIES,
  MODULE_1_QUERIES,
  MODULE_2_QUERIES,
  QueryDefinition,
  QueryExecutionResult,
} from '../queryRunner';
import {
  dateProximityScore,
  keywordOverlapScore,
  PK_FIELD_MAP,
  SEQ_NAME_MAP,
  useStore,
} from '../store';
import { TableName } from '../types';
import { TransactionExplainerCard } from './TransactionExplainer';

// ============================================================================
// THREE-SCHEMA ABSTRACTION LAYERS CARD
// ============================================================================
export const DatabaseLayersCard: React.FC = () => (
  <div
    className="rounded-[20px] border p-5 space-y-3"
    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
  >
    <div className="flex items-center gap-2">
      <Layers size={16} style={{ color: 'var(--indigo)' }} />
      <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
        ANSI-SPARC Three-Level Database Abstraction
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
        <div className="font-mono font-bold" style={{ color: 'var(--indigo)' }}>
          1. View Level (External Schema)
        </div>
        <div className="font-medium" style={{ color: 'var(--text)' }}>
          What students & staff see
        </div>
        <p style={{ color: 'var(--muted)' }}>
          Plain language statuses (&ldquo;Still looking&rdquo;, &ldquo;Waiting for its owner&rdquo;), friendly references (LR-0012), redacted wallet/ID details, and v_open_matches view.
        </p>
      </div>

      <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
        <div className="font-mono font-bold" style={{ color: 'var(--teal)' }}>
          2. Logical Level (Conceptual Schema)
        </div>
        <div className="font-medium" style={{ color: 'var(--text)' }}>
          Tables, constraints & PL/SQL
        </div>
        <p style={{ color: 'var(--muted)' }}>
          8 normalized relational tables (PERSON, ITEMCATEGORY, CAMPUSLOCATION, ADMIN, LOSTREPORT, FOUNDREPORT, MATCHSCORE, CLAIMREQUEST), PK/FK/CHECK rules, and triggers.
        </p>
      </div>

      <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
        <div className="font-mono font-bold" style={{ color: 'var(--amber)' }}>
          3. Physical Level (Internal Schema)
        </div>
        <div className="font-medium" style={{ color: 'var(--text)' }}>
          Storage, sequences & indexes
        </div>
        <p style={{ color: 'var(--muted)' }}>
          B-tree indexes (idx_lost_category, idx_found_category), sequences starting at 101, BroadcastChannel memory sync in Demo, and Oracle XE blocks via JDBC in Live.
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// MANAGE DATA (8 TABLES: Insert, Edit, Delete, Search, Display + FK Dropdowns)
// ============================================================================
const TABLE_LIST: { name: TableName; label: string }[] = [
  { name: 'lostreport', label: 'LOSTREPORT' },
  { name: 'foundreport', label: 'FOUNDREPORT' },
  { name: 'matchscore', label: 'MATCHSCORE' },
  { name: 'claimrequest', label: 'CLAIMREQUEST' },
  { name: 'person', label: 'PERSON' },
  { name: 'itemcategory', label: 'ITEMCATEGORY' },
  { name: 'campuslocation', label: 'CAMPUSLOCATION' },
  { name: 'admin', label: 'ADMIN' },
];

export const DeveloperManageDataView: React.FC = () => {
  const { db, insertTableRow, updateTableRow, deleteTableRow } = useStore();
  const [selectedTable, setSelectedTable] = useState<TableName>('lostreport');
  const [search, setSearch] = useState('');
  const [statusChip, setStatusChip] = useState<string>('All');
  const [sortCol, setSortCol] = useState<string>('lost_id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Drawer / Modal states
  const [drawerMode, setDrawerMode] = useState<'insert' | 'edit' | null>(null);
  const [editingPk, setEditingPk] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | null>>({});
  const [drawerError, setDrawerError] = useState<string>('');

  const [deleteTargetPk, setDeleteTargetPk] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');
  const [displayRow, setDisplayRow] = useState<Record<string, unknown> | null>(null);

  const pkField = PK_FIELD_MAP[selectedTable];
  const rawRows = db[selectedTable] as unknown as Record<string, unknown>[];

  const handleSelectTable = (t: TableName) => {
    setSelectedTable(t);
    setSortCol(PK_FIELD_MAP[t]);
    setSortAsc(true);
    setSearch('');
    setStatusChip('All');
    setPage(1);
    setDeleteError('');
  };

  // Status filter chips if the table has a status column
  const availableStatuses = useMemo(() => {
    if (selectedTable === 'lostreport') return ['All', 'Active', 'Matched', 'Closed'];
    if (selectedTable === 'foundreport') return ['All', 'Unclaimed', 'Claimed', 'Returned'];
    if (selectedTable === 'claimrequest') return ['All', 'Pending', 'Verified', 'Rejected'];
    if (selectedTable === 'person') return ['All', 'Student', 'Staff'];
    return [];
  }, [selectedTable]);

  // Helper to resolve human-friendly FK label alongside raw ID
  const resolveFkDisplay = (col: string, val: unknown): string => {
    if (val === null || val === undefined) return 'NULL';
    const num = Number(val);
    if (col === 'person_id') {
      const p = db.person.find((x) => x.person_id === num);
      return p ? `${num} (${p.name})` : String(val);
    }
    if (col === 'category_id') {
      const c = db.itemcategory.find((x) => x.category_id === num);
      return c ? `${num} (${c.category_name})` : String(val);
    }
    if (col === 'location_id') {
      const l = db.campuslocation.find((x) => x.location_id === num);
      return l ? `${num} (${l.zone_name})` : String(val);
    }
    if (col === 'admin_id') {
      const a = db.admin.find((x) => x.admin_id === num);
      return a ? `${num} (${a.name})` : String(val);
    }
    return String(val);
  };

  const filteredAndSortedRows = useMemo(() => {
    return rawRows
      .filter((r) => {
        if (statusChip !== 'All') {
          const stVal = r.status ?? r.verification_status ?? r.role;
          if (stVal !== statusChip) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return Object.entries(r).some(([k, v]) =>
            resolveFkDisplay(k, v).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const va = a[sortCol];
        const vb = b[sortCol];
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortAsc ? va - vb : vb - va;
        }
        return sortAsc
          ? String(va ?? '').localeCompare(String(vb ?? ''))
          : String(vb ?? '').localeCompare(String(va ?? ''));
      });
  }, [rawRows, statusChip, search, sortCol, sortAsc, db]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const pagedRows = filteredAndSortedRows.slice((page - 1) * pageSize, page * pageSize);

  const columns = useMemo(() => {
    if (rawRows.length > 0) return Object.keys(rawRows[0]);
    switch (selectedTable) {
      case 'person':
        return ['person_id', 'name', 'reg_no', 'phone', 'email', 'role'];
      case 'itemcategory':
        return ['category_id', 'category_name'];
      case 'campuslocation':
        return ['location_id', 'zone_name'];
      case 'admin':
        return ['admin_id', 'name', 'designation'];
      case 'lostreport':
        return ['lost_id', 'person_id', 'category_id', 'location_id', 'description', 'date_lost', 'status'];
      case 'foundreport':
        return ['found_id', 'person_id', 'category_id', 'location_id', 'storage_location', 'description', 'date_found', 'status'];
      case 'matchscore':
        return ['match_id', 'lost_id', 'found_id', 'category_score', 'location_score', 'date_score', 'description_score', 'total_score', 'computed_date'];
      case 'claimrequest':
        return ['claim_id', 'match_id', 'person_id', 'admin_id', 'claim_date', 'verification_status'];
    }
  }, [rawRows, selectedTable]);

  const openInsertDrawer = () => {
    setDrawerError('');
    setDrawerMode('insert');
    setEditingPk(null);
    const defaults: Record<string, string | number | null> = {};
    if (selectedTable === 'person') {
      defaults.name = '';
      defaults.reg_no = '';
      defaults.phone = '';
      defaults.email = '';
      defaults.role = 'Student';
    } else if (selectedTable === 'itemcategory') {
      defaults.category_name = '';
    } else if (selectedTable === 'campuslocation') {
      defaults.zone_name = '';
    } else if (selectedTable === 'admin') {
      defaults.name = '';
      defaults.designation = '';
    } else if (selectedTable === 'lostreport') {
      defaults.person_id = db.person[0]?.person_id || 1;
      defaults.category_id = db.itemcategory[0]?.category_id || 1;
      defaults.location_id = db.campuslocation[0]?.location_id || 1;
      defaults.description = '';
      defaults.date_lost = '2026-10-16';
      defaults.status = 'Active';
    } else if (selectedTable === 'foundreport') {
      defaults.person_id = db.person[0]?.person_id || 1;
      defaults.category_id = db.itemcategory[0]?.category_id || 1;
      defaults.location_id = db.campuslocation[0]?.location_id || 1;
      defaults.storage_location = 'Admin Office Shelf A';
      defaults.description = '';
      defaults.date_found = '2026-10-16';
      defaults.status = 'Unclaimed';
    } else if (selectedTable === 'matchscore') {
      defaults.lost_id = db.lostreport[0]?.lost_id || 1;
      defaults.found_id = db.foundreport[0]?.found_id || 1;
      defaults.category_score = 40;
      defaults.location_score = 20;
      defaults.date_score = 20;
      defaults.description_score = 15;
      defaults.total_score = 95;
      defaults.computed_date = '2026-10-16';
    } else if (selectedTable === 'claimrequest') {
      defaults.match_id = db.matchscore[0]?.match_id || 1;
      defaults.person_id = db.person[0]?.person_id || 1;
      defaults.admin_id = null;
      defaults.claim_date = '2026-10-16';
      defaults.verification_status = 'Pending';
    }
    setFormValues(defaults);
  };

  const openEditDrawer = (row: Record<string, unknown>) => {
    setDrawerError('');
    setDrawerMode('edit');
    setEditingPk(Number(row[pkField]));
    const copy: Record<string, string | number | null> = {};
    for (const k of Object.keys(row)) {
      if (k !== pkField) {
        copy[k] = row[k] as string | number | null;
      }
    }
    setFormValues(copy);
  };

  const handleDrawerSave = () => {
    setDrawerError('');
    // Validate required non-null fields
    for (const [k, v] of Object.entries(formValues)) {
      if (k === 'admin_id' || k === 'phone' || k === 'email' || k === 'designation' || k === 'storage_location' || k === 'rejection_reason') {
        continue;
      }
      if (v === '' || v === null || v === undefined) {
        setDrawerError(`Field "${k}" cannot be empty (NOT NULL constraint)`);
        return;
      }
    }

    if (drawerMode === 'insert') {
      const res = insertTableRow(selectedTable, formValues as never);
      if (!res.ok) {
        setDrawerError(res.error || 'Insert failed');
        return;
      }
      setDrawerMode(null);
    } else if (drawerMode === 'edit' && editingPk !== null) {
      const res = updateTableRow(selectedTable, editingPk, formValues as never);
      if (!res.ok) {
        setDrawerError(res.error || 'Update failed');
        return;
      }
      setDrawerMode(null);
    }
  };

  const renderFieldInput = (col: string) => {
    const val = formValues[col];

    // Foreign Key dropdowns showing names
    if (col === 'person_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.person.map((p) => (
            <option key={p.person_id} value={p.person_id}>
              #{p.person_id} — {p.name} ({p.reg_no})
            </option>
          ))}
        </select>
      );
    }
    if (col === 'category_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.itemcategory.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              #{c.category_id} — {c.category_name}
            </option>
          ))}
        </select>
      );
    }
    if (col === 'location_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.campuslocation.map((l) => (
            <option key={l.location_id} value={l.location_id}>
              #{l.location_id} — {l.zone_name}
            </option>
          ))}
        </select>
      );
    }
    if (col === 'admin_id') {
      return (
        <select
          value={val === null || val === undefined ? '' : String(val)}
          onChange={(e) =>
            setFormValues({
              ...formValues,
              [col]: e.target.value === '' ? null : Number(e.target.value),
            })
          }
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="">NULL (Not assigned)</option>
          {db.admin.map((a) => (
            <option key={a.admin_id} value={a.admin_id}>
              #{a.admin_id} — {a.name} ({a.designation})
            </option>
          ))}
        </select>
      );
    }
    if (col === 'lost_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.lostreport.map((l) => (
            <option key={l.lost_id} value={l.lost_id}>
              #{l.lost_id} — {l.description}
            </option>
          ))}
        </select>
      );
    }
    if (col === 'found_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.foundreport.map((f) => (
            <option key={f.found_id} value={f.found_id}>
              #{f.found_id} — {f.description}
            </option>
          ))}
        </select>
      );
    }
    if (col === 'match_id') {
      return (
        <select
          value={val ?? ''}
          onChange={(e) => setFormValues({ ...formValues, [col]: Number(e.target.value) })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {db.matchscore.map((m) => (
            <option key={m.match_id} value={m.match_id}>
              Match #{m.match_id} (Lost #{m.lost_id} ↔ Found #{m.found_id}, Score {m.total_score})
            </option>
          ))}
        </select>
      );
    }

    // Check constraints dropdowns
    if (col === 'role') {
      return (
        <select
          value={String(val || 'Student')}
          onChange={(e) => setFormValues({ ...formValues, [col]: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="Student">Student</option>
          <option value="Staff">Staff</option>
        </select>
      );
    }
    if (col === 'status' && selectedTable === 'lostreport') {
      return (
        <select
          value={String(val || 'Active')}
          onChange={(e) => setFormValues({ ...formValues, [col]: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="Active">Active</option>
          <option value="Matched">Matched</option>
          <option value="Closed">Closed</option>
        </select>
      );
    }
    if (col === 'status' && selectedTable === 'foundreport') {
      return (
        <select
          value={String(val || 'Unclaimed')}
          onChange={(e) => setFormValues({ ...formValues, [col]: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="Unclaimed">Unclaimed</option>
          <option value="Claimed">Claimed</option>
          <option value="Returned">Returned</option>
        </select>
      );
    }
    if (col === 'verification_status') {
      return (
        <select
          value={String(val || 'Pending')}
          onChange={(e) => setFormValues({ ...formValues, [col]: e.target.value })}
          className="w-full h-10 px-3 rounded-xl border text-xs font-medium outline-none"
          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      );
    }

    const isDate = col.includes('date');
    const isScore = col.includes('score');

    return (
      <input
        type={isDate ? 'date' : isScore ? 'number' : 'text'}
        value={val ?? ''}
        onChange={(e) =>
          setFormValues({
            ...formValues,
            [col]: isScore ? Number(e.target.value) : e.target.value,
          })
        }
        className="w-full h-10 px-3 rounded-xl border text-xs outline-none"
        style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <DatabaseLayersCard />

      <div
        className="rounded-[20px] border p-6 space-y-5"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Manage Data (8 Relational Oracle Tables)
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Demonstrates Insert, Update, Delete (with foreign-key constraint protection), Search, and Display.
            </p>
          </div>

          <button
            type="button"
            onClick={openInsertDrawer}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:opacity-95"
            style={{ backgroundColor: 'var(--indigo)' }}
          >
            <Plus size={15} />
            <span>Insert into {selectedTable.toUpperCase()}</span>
          </button>
        </div>

        {/* 8-Table Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TABLE_LIST.map((t) => {
            const count = db[t.name].length;
            const active = selectedTable === t.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => handleSelectTable(t.name)}
                className="px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold cursor-pointer transition-all"
                style={{
                  backgroundColor: active ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: active ? 'var(--indigo)' : 'var(--border)',
                  color: active ? 'var(--indigo)' : 'var(--text)',
                }}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-3" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${selectedTable.toUpperCase()}...`}
              className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs outline-none"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          {availableStatuses.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {availableStatuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusChip(st);
                    setPage(1);
                  }}
                  className="px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: statusChip === st ? 'var(--teal-soft)' : 'var(--raised)',
                    borderColor: statusChip === st ? 'var(--teal)' : 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--raised)' }}>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => {
                      if (sortCol === col) setSortAsc(!sortAsc);
                      else {
                        setSortCol(col);
                        setSortAsc(true);
                      }
                    }}
                    className="py-3 px-3.5 font-mono font-semibold border-b cursor-pointer whitespace-nowrap select-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    {col.toUpperCase()} {sortCol === col ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th
                  className="py-3 px-3.5 font-mono font-semibold border-b text-right whitespace-nowrap"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center" style={{ color: 'var(--muted)' }}>
                    No rows match your search criteria.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const pk = Number(row[pkField]);
                  return (
                    <tr
                      key={pk}
                      className="border-b transition-colors hover:opacity-95"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={`py-2.5 px-3.5 whitespace-nowrap ${
                            col === pkField || col.includes('score') || col.includes('_id')
                              ? 'font-mono tabular-nums'
                              : ''
                          }`}
                          style={{ color: col === pkField ? 'var(--indigo)' : 'var(--text)' }}
                        >
                          {resolveFkDisplay(col, row[col])}
                        </td>
                      ))}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setDisplayRow(row)}
                          className="p-1.5 rounded-lg border cursor-pointer"
                          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          title="Display record"
                          aria-label={`Display row ${pk}`}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDrawer(row)}
                          className="p-1.5 rounded-lg border cursor-pointer"
                          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--indigo)' }}
                          title="Edit record"
                          aria-label={`Edit row ${pk}`}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTargetPk(pk);
                          }}
                          className="p-1.5 rounded-lg border cursor-pointer"
                          style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--red)' }}
                          title="Delete record"
                          aria-label={`Delete row ${pk}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span>
            Showing {pagedRows.length} of {filteredAndSortedRows.length} row(s) · Next sequence{' '}
            <code className="font-mono">{SEQ_NAME_MAP[selectedTable]}.NEXTVAL = {db.sequences[selectedTable]}</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border disabled:opacity-40 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Prev
            </button>
            <span className="tabular-nums">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg border disabled:opacity-40 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <TransactionExplainerCard />

      {/* RIGHT DRAWER FOR INSERT / EDIT */}
      {drawerMode && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(15, 17, 21, 0.55)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md h-full p-6 overflow-y-auto border-l flex flex-col justify-between"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="text-xs font-mono" style={{ color: 'var(--indigo)' }}>
                    {selectedTable.toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                    {drawerMode === 'insert'
                      ? `Insert New Row (${SEQ_NAME_MAP[selectedTable]}.NEXTVAL = ${db.sequences[selectedTable]})`
                      : `Edit ${pkField} = ${editingPk}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerMode(null)}
                  className="p-1.5 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {drawerError && (
                <div
                  className="p-3 rounded-xl border text-xs font-medium flex items-center gap-2"
                  style={{ backgroundColor: 'var(--red-soft)', borderColor: 'var(--red)', color: 'var(--red)' }}
                >
                  <AlertCircle size={14} />
                  <span>{drawerError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {Object.keys(formValues).map((col) => (
                  <div key={col} className="space-y-1">
                    <label className="block text-xs font-mono font-semibold" style={{ color: 'var(--muted)' }}>
                      {col}
                    </label>
                    {renderFieldInput(col)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setDrawerMode(null)}
                className="px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDrawerSave}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--indigo)' }}
              >
                {drawerMode === 'insert' ? 'Insert Row' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL (shows FK block message if referenced) */}
      {deleteTargetPk !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 17, 21, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-[20px] border p-6 space-y-4"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={20} style={{ color: 'var(--red)' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Delete from {selectedTable.toUpperCase()}?
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              You are about to execute <code className="font-mono">DELETE FROM {selectedTable} WHERE {pkField} = {deleteTargetPk};</code>. Foreign-key constraints will be checked before deletion.
            </p>

            {deleteError && (
              <div
                className="p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2"
                style={{ backgroundColor: 'var(--red-soft)', borderColor: 'var(--red)', color: 'var(--red)' }}
              >
                <AlertCircle size={15} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetPk(null);
                  setDeleteError('');
                }}
                className="px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteTableRow(selectedTable, deleteTargetPk);
                  if (!res.ok) {
                    setDeleteError(res.error || 'Cannot delete referenced record');
                  } else {
                    setDeleteTargetPk(null);
                    setDeleteError('');
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--red)' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPLAY RECORD MODAL */}
      {displayRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 17, 21, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-[20px] border p-6 space-y-4"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold font-mono" style={{ color: 'var(--text)' }}>
                DISPLAY: {selectedTable.toUpperCase()} #{String(displayRow[pkField])}
              </h3>
              <button
                type="button"
                onClick={() => setDisplayRow(null)}
                className="text-xs px-2 py-1 rounded border cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(displayRow).map(([k, v]) => (
                <div
                  key={k}
                  className="p-2.5 rounded-xl border flex items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
                >
                  <span className="font-mono font-semibold" style={{ color: 'var(--muted)' }}>
                    {k}
                  </span>
                  <span className="font-mono font-medium text-right" style={{ color: 'var(--text)' }}>
                    {resolveFkDisplay(k, v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULES AND QUERIES (Module 1 Tejash Raj, Module 2 Soham Sharma, Lab Cycle Q1-Q15)
// ============================================================================
export const DeveloperModulesQueriesView: React.FC = () => {
  const { runQueryById, canUndoDml, undoLastDml, showToast } = useStore();
  const [activeSection, setActiveSection] = useState<'M1' | 'M2' | 'LAB'>('M1');
  const [resultsMap, setResultsMap] = useState<Record<string, QueryExecutionResult>>({});

  const handleRunOne = (qId: string) => {
    const res = runQueryById(qId);
    setResultsMap((prev) => ({ ...prev, [qId]: res }));
  };

  const handleRunAllInActiveSection = () => {
    const list =
      activeSection === 'M1'
        ? MODULE_1_QUERIES
        : activeSection === 'M2'
        ? MODULE_2_QUERIES
        : LAB_CYCLE_QUERIES;
    const nextMap = { ...resultsMap };
    for (const q of list) {
      nextMap[q.id] = runQueryById(q.id);
    }
    setResultsMap(nextMap);
    showToast(`Executed all ${list.length} queries in section`, 'success');
  };

  const currentList: QueryDefinition[] =
    activeSection === 'M1'
      ? MODULE_1_QUERIES
      : activeSection === 'M2'
      ? MODULE_2_QUERIES
      : LAB_CYCLE_QUERIES;

  return (
    <div className="space-y-6">
      {/* Three Module Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveSection('M1')}
          className="p-5 rounded-[20px] border text-left transition-all cursor-pointer"
          style={{
            backgroundColor: activeSection === 'M1' ? 'var(--indigo-soft)' : 'var(--card)',
            borderColor: activeSection === 'M1' ? 'var(--indigo)' : 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
            MODULE 1 · M1-1 to M1-9
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}>
            Lost & Found Reporting and Match Engine
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Tejash Raj (25BDE0062)
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('M2')}
          className="p-5 rounded-[20px] border text-left transition-all cursor-pointer"
          style={{
            backgroundColor: activeSection === 'M2' ? 'var(--teal-soft)' : 'var(--card)',
            borderColor: activeSection === 'M2' ? 'var(--teal)' : 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-xs font-mono font-bold" style={{ color: 'var(--teal)' }}>
            MODULE 2 · M2-1 to M2-10
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}>
            Claims, Verification and Analytics
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Soham Sharma (25BDE0030)
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('LAB')}
          className="p-5 rounded-[20px] border text-left transition-all cursor-pointer"
          style={{
            backgroundColor: activeSection === 'LAB' ? 'var(--indigo-soft)' : 'var(--card)',
            borderColor: activeSection === 'LAB' ? 'var(--indigo)' : 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-xs font-mono font-bold" style={{ color: 'var(--amber)' }}>
            LAB CYCLE · Q1 to Q15
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: 'var(--text)' }}>
            Oracle SQL Lab Cycle Queries
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Joins, subqueries, set operators & views
          </div>
        </button>
      </div>

      {/* Action Bar: Run All in Section + Undo DML */}
      <div
        className="rounded-[20px] border p-4 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          Every query executes live against the central store (using real today&apos;s date for <code className="font-mono">SYSDATE</code>).
        </div>
        <div className="flex items-center gap-2.5">
          {canUndoDml && (
            <button
              type="button"
              onClick={undoLastDml}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--amber)' }}
            >
              <RotateCcw size={14} />
              <span>Undo Module DML Changes</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRunAllInActiveSection}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'var(--indigo)' }}
          >
            <Play size={14} />
            <span>Run All ({currentList.length})</span>
          </button>
        </div>
      </div>

      {/* Query Cards */}
      <div className="space-y-4">
        {currentList.map((q) => {
          const res = resultsMap[q.id];
          return (
            <div
              key={q.id}
              className="rounded-[20px] border p-5 space-y-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {q.title}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {q.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(q.sql);
                      showToast(`Copied ${q.id} SQL`, 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                    style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunOne(q.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: q.isDml ? 'var(--teal)' : 'var(--indigo)' }}
                  >
                    <Play size={12} />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              <pre
                className="p-3.5 rounded-xl text-xs font-mono overflow-x-auto m-0 border"
                style={{ backgroundColor: '#0D1017', borderColor: '#262B36', color: '#E2E8F0' }}
              >
                {q.sql}
              </pre>

              {res && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span style={{ color: 'var(--teal)' }}>
                      {res.isDml ? res.affectedMessage : `${res.rowCount} row(s) returned`}
                    </span>
                  </div>

                  {res.rows.length === 0 ? (
                    <div
                      className="p-4 rounded-xl border text-xs text-center"
                      style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      Query executed successfully — 0 rows returned.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr style={{ backgroundColor: 'var(--raised)' }}>
                            {res.columns.map((col) => (
                              <th
                                key={col}
                                className="py-2 px-3 border-b whitespace-nowrap"
                                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                              >
                                {col.toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {res.rows.map((r, rIdx) => (
                            <tr key={rIdx} className="border-b" style={{ borderColor: 'var(--border)' }}>
                              {res.columns.map((col) => (
                                <td
                                  key={col}
                                  className="py-2 px-3 whitespace-nowrap tabular-nums"
                                  style={{ color: 'var(--text)' }}
                                >
                                  {r[col] === null || r[col] === undefined ? 'NULL' : String(r[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TransactionExplainerCard />
    </div>
  );
};

// ============================================================================
// PL/SQL LAB (Functions, Procedures, Cursor, and Both Triggers)
// ============================================================================
export const DeveloperPlSqlLabView: React.FC = () => {
  const {
    db,
    computeMatchScoreAction,
    runAllMatchingAction,
    verifyClaimAction,
    raiseClaimAction,
    setLastTransaction,
    showToast,
  } = useStore();

  // Function 1: keyword_overlap_score inputs
  const [kwDesc1, setKwDesc1] = useState('black leather wallet');
  const [kwDesc2, setKwDesc2] = useState('black leather wallet cards inside');
  const [kwOutput, setKwOutput] = useState<number | null>(15);

  // Function 2: date_proximity_score inputs
  const [dpLostDate, setDpLostDate] = useState('2026-10-01');
  const [dpFoundDate, setDpFoundDate] = useState('2026-10-02');
  const [dpOutput, setDpOutput] = useState<number | null>(20);

  // Procedure 1: compute_match_score inputs
  const [cmsLostId, setCmsLostId] = useState<number>(1);
  const [cmsFoundId, setCmsFoundId] = useState<number>(11);
  const [cmsResultText, setCmsResultText] = useState<string>('');

  // Procedure 2: run_all_matching cursor output
  const [ramOutput, setRamOutput] = useState<string>('');

  // Procedure 3: verify_claim inputs
  const [vcClaimId, setVcClaimId] = useState<number>(2);
  const [vcAdminId, setVcAdminId] = useState<number>(3);
  const [vcOutput, setVcOutput] = useState<string>('');

  // Trigger 1: trg_block_low_score_claim output
  const [triggerBlockOutput, setTriggerBlockOutput] = useState<string>('');

  const handleRunKeywordFn = () => {
    const score = keywordOverlapScore(kwDesc1, kwDesc2);
    setKwOutput(score);
    setLastTransaction({
      id: `tx-fn-kw-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      userOperation: `Call keyword_overlap_score('${kwDesc1}', '${kwDesc2}')`,
      tablesAffected: ['DUAL'],
      sqlComponent: 'Function keyword_overlap_score',
      rowsChanged: '0 rows changed (pure function)',
      resultProduced: `RETURN ${score}`,
      rawSql: `SELECT keyword_overlap_score('${kwDesc1.replace(/'/g, "''")}', '${kwDesc2.replace(/'/g, "''")}') AS score FROM dual;\n-- Result: ${score}`,
    });
    showToast(`keyword_overlap_score = ${score}`, 'success');
  };

  const handleRunDateFn = () => {
    const score = dateProximityScore(dpLostDate, dpFoundDate);
    setDpOutput(score);
    setLastTransaction({
      id: `tx-fn-dp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      userOperation: `Call date_proximity_score(DATE '${dpLostDate}', DATE '${dpFoundDate}')`,
      tablesAffected: ['DUAL'],
      sqlComponent: 'Function date_proximity_score',
      rowsChanged: '0 rows changed (pure function)',
      resultProduced: `RETURN ${score}`,
      rawSql: `SELECT date_proximity_score(DATE '${dpLostDate}', DATE '${dpFoundDate}') AS score FROM dual;\n-- Result: ${score}`,
    });
    showToast(`date_proximity_score = ${score}`, 'success');
  };

  const handleRunCms = () => {
    const res = computeMatchScoreAction(cmsLostId, cmsFoundId);
    if (!res.ok) {
      setCmsResultText(`ORA-20001: ${res.error}`);
    } else if (res.match) {
      setCmsResultText(
        `Lost ${cmsLostId} vs Found ${cmsFoundId} => total score ${res.match.total_score} (Cat:${res.match.category_score}, Loc:${res.match.location_score}, Date:${res.match.date_score}, Desc:${res.match.description_score})`
      );
    }
  };

  const handleTryWeakClaimTrigger = () => {
    // Ensure compute_match_score(1, 11) is evaluated first (score 45)
    const cms = computeMatchScoreAction(1, 11);
    const matchId = cms.match?.match_id || db.matchscore.find((m) => m.lost_id === 1 && m.found_id === 11)?.match_id;
    if (matchId) {
      const claimRes = raiseClaimAction(matchId, 1);
      if (!claimRes.ok) {
        setTriggerBlockOutput(claimRes.error || 'Claim blocked');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          PL/SQL Interactive Lab (Appendix D)
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Test stored functions, procedures, explicit cursor loops, and BEFORE/AFTER triggers against live store tables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. keyword_overlap_score */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
              FUNCTION keyword_overlap_score
            </span>
            <button
              type="button"
              onClick={handleRunKeywordFn}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              <Play size={12} />
              <span>Run Function</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_desc1 (VARCHAR2)
              </label>
              <input
                type="text"
                value={kwDesc1}
                onChange={(e) => setKwDesc1(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_desc2 (VARCHAR2)
              </label>
              <input
                type="text"
                value={kwDesc2}
                onChange={(e) => setKwDesc2(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {kwOutput !== null && (
            <div className="p-3 rounded-xl border font-mono text-xs flex items-center justify-between" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>RETURN NUMBER (0..20):</span>
              <span className="font-bold text-sm" style={{ color: 'var(--teal)' }}>
                {kwOutput}
              </span>
            </div>
          )}
        </div>

        {/* 2. date_proximity_score */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
              FUNCTION date_proximity_score
            </span>
            <button
              type="button"
              onClick={handleRunDateFn}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              <Play size={12} />
              <span>Run Function</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_date_lost (DATE)
              </label>
              <input
                type="date"
                value={dpLostDate}
                onChange={(e) => setDpLostDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_date_found (DATE)
              </label>
              <input
                type="date"
                value={dpFoundDate}
                onChange={(e) => setDpFoundDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {dpOutput !== null && (
            <div className="p-3 rounded-xl border font-mono text-xs flex items-center justify-between" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>RETURN NUMBER (0, 5, 12, or 20):</span>
              <span className="font-bold text-sm" style={{ color: 'var(--teal)' }}>
                {dpOutput}
              </span>
            </div>
          )}
        </div>

        {/* 3. compute_match_score */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--teal)' }}>
              PROCEDURE compute_match_score
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCmsLostId(1);
                  setCmsFoundId(11);
                  const res = computeMatchScoreAction(1, 11);
                  if (res.match) {
                    setCmsResultText(`Lost 1 vs Found 11 => total score ${res.match.total_score}`);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl border text-[11px] font-mono cursor-pointer"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Preset (1, 11)
              </button>
              <button
                type="button"
                onClick={handleRunCms}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--teal)' }}
              >
                <Play size={12} />
                <span>Execute</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_lost_id
              </label>
              <select
                value={cmsLostId}
                onChange={(e) => setCmsLostId(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.lostreport.map((l) => (
                  <option key={l.lost_id} value={l.lost_id}>
                    #{l.lost_id} (Cat {l.category_id}) {l.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_found_id
              </label>
              <select
                value={cmsFoundId}
                onChange={(e) => setCmsFoundId(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.foundreport.map((f) => (
                  <option key={f.found_id} value={f.found_id}>
                    #{f.found_id} (Cat {f.category_id}) {f.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cmsResultText && (
            <div className="p-3 rounded-xl border font-mono text-xs" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {cmsResultText}
            </div>
          )}
        </div>

        {/* 4. run_all_matching (Explicit Cursor) */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--teal)' }}>
              PROCEDURE run_all_matching (Explicit Cursor c_pairs)
            </span>
            <button
              type="button"
              onClick={() => {
                const res = runAllMatchingAction();
                setRamOutput(res.message);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--teal)' }}
            >
              <Play size={12} />
              <span>Run Cursor</span>
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Opens <code className="font-mono">CURSOR c_pairs</code> joining Active/Matched lost reports with Unclaimed found reports of the same category, ordered by <code className="font-mono">l.lost_id, f.found_id</code>.
          </p>

          {ramOutput && (
            <div className="p-3 rounded-xl border font-mono text-xs font-bold" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--indigo)' }}>
              DBMS_OUTPUT: {ramOutput}
            </div>
          )}
        </div>

        {/* 5. verify_claim + Trigger trg_claim_verified */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--indigo)' }}>
              PROCEDURE verify_claim + TRIGGER trg_claim_verified
            </span>
            <button
              type="button"
              onClick={() => {
                const res = verifyClaimAction(vcClaimId, vcAdminId);
                if (!res.ok) {
                  setVcOutput(`ORA-20003: ${res.error}`);
                } else {
                  setVcOutput(`Claim ${vcClaimId} verified by admin ${vcAdminId} -> trg_claim_verified updated FOUNDREPORT to 'Claimed' and LOSTREPORT to 'Closed'`);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--indigo)' }}
            >
              <Play size={12} />
              <span>Execute verify_claim</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_claim_id
              </label>
              <select
                value={vcClaimId}
                onChange={(e) => setVcClaimId(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.claimrequest.map((c) => (
                  <option key={c.claim_id} value={c.claim_id}>
                    Claim #{c.claim_id} (Match #{c.match_id} · {c.verification_status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono mb-1" style={{ color: 'var(--muted)' }}>
                p_admin_id
              </label>
              <select
                value={vcAdminId}
                onChange={(e) => setVcAdminId(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {db.admin.map((a) => (
                  <option key={a.admin_id} value={a.admin_id}>
                    Admin #{a.admin_id} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {vcOutput && (
            <div className="p-3 rounded-xl border font-mono text-xs" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {vcOutput}
            </div>
          )}
        </div>

        {/* 6. Trigger trg_block_low_score_claim */}
        <div
          className="rounded-[20px] border p-5 space-y-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--red)' }}>
              TRIGGER trg_block_low_score_claim (BEFORE INSERT)
            </span>
            <button
              type="button"
              onClick={handleTryWeakClaimTrigger}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--red)' }}
            >
              <Play size={12} />
              <span>Try a weak claim (score 45)</span>
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Computes <code className="font-mono">compute_match_score(1, 11)</code> (score 45) and attempts to insert a <code className="font-mono">CLAIMREQUEST</code> on that match. Blocked by <code className="font-mono">trg_block_low_score_claim</code> when <code className="font-mono">total_score &lt; 50</code>.
          </p>

          {triggerBlockOutput && (
            <div
              className="p-3 rounded-xl border font-mono text-xs font-semibold"
              style={{ backgroundColor: 'var(--red-soft)', borderColor: 'var(--red)', color: 'var(--red)' }}
            >
              ORA-20002: {triggerBlockOutput}
            </div>
          )}
        </div>
      </div>

      <TransactionExplainerCard />
    </div>
  );
};

// ============================================================================
// SQL SCRIPTS (7 Files with Copy Button, Dark Code Panel, Line Numbers)
// ============================================================================
export const DeveloperSqlScriptsView: React.FC = () => {
  const { showToast } = useStore();
  const [selectedFile, setSelectedFile] = useState<string>('01_ddl.sql');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const files = useMemo(
    () => [
      { name: '01_ddl.sql', label: '01_ddl.sql (Appendix A - Tables & Sequences)', content: SQL_01_DDL },
      { name: '02_data.sql', label: '02_data.sql (Auto-generated Seed INSERTs)', content: generate02DataSql() },
      { name: '03_dml_tcl.sql', label: '03_dml_tcl.sql (Appendix C - DDL/DML/TCL)', content: SQL_03_DML_TCL },
      { name: '04_plsql.sql', label: '04_plsql.sql (Appendix D - Functions, Procedures, Triggers)', content: SQL_04_PLSQL },
      { name: '05_lab_cycle_queries.sql', label: '05_lab_cycle_queries.sql (Appendix E - Q1 to Q15)', content: SQL_05_LAB_CYCLE },
      { name: '06_module_queries.sql', label: '06_module_queries.sql (Appendix F - M1 & M2)', content: SQL_06_MODULE_QUERIES },
      { name: '07_transactions.sql', label: '07_transactions.sql (Appendix G - T1 to T4)', content: SQL_07_TRANSACTIONS },
    ],
    []
  );

  const activeFileObj = files.find((f) => f.name === selectedFile) || files[0];
  const codeLines = activeFileObj.content.split('\n');

  const handleCopyFile = (fileName: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedFile(fileName);
    showToast(`Copied ${fileName} to clipboard`, 'success');
    window.setTimeout(() => setCopiedFile(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* File Tree Sidebar */}
      <div
        className="lg:col-span-4 rounded-[20px] border p-4 space-y-2"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="px-2 py-1 text-xs font-bold" style={{ color: 'var(--text)' }}>
          Oracle SQL Script Repository
        </div>
        {files.map((f) => {
          const active = f.name === selectedFile;
          return (
            <div
              key={f.name}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all"
              style={{
                backgroundColor: active ? 'var(--indigo-soft)' : 'var(--raised)',
                borderColor: active ? 'var(--indigo)' : 'var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedFile(f.name)}
                className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
              >
                <FileCode size={15} style={{ color: active ? 'var(--indigo)' : 'var(--muted)' }} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold truncate" style={{ color: 'var(--text)' }}>
                    {f.name}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                    {f.label.replace(f.name, '').trim()}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCopyFile(f.name, f.content)}
                className="p-1.5 rounded-lg border text-xs cursor-pointer shrink-0"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                title={`Copy ${f.name}`}
                aria-label={`Copy ${f.name}`}
              >
                {copiedFile === f.name ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Dark Code Panel with Line Numbers (dark in both themes) */}
      <div
        className="lg:col-span-8 rounded-[20px] border overflow-hidden"
        style={{ backgroundColor: '#0D1017', borderColor: '#262B36', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ backgroundColor: '#131822', borderColor: '#262B36' }}
        >
          <div className="flex items-center gap-2">
            <Code2 size={15} className="text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-100">{activeFileObj.label}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyFile(activeFileObj.name, activeFileObj.content)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-mono text-slate-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copiedFile === activeFileObj.name ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy {activeFileObj.name}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[640px] overflow-y-auto font-mono text-xs leading-relaxed">
          {codeLines.map((line, idx) => {
            const isComment = line.trim().startsWith('--');
            return (
              <div key={idx} className="flex">
                <span className="w-10 select-none text-right pr-4 text-slate-600 tabular-nums shrink-0">
                  {idx + 1}
                </span>
                <span className={`whitespace-pre ${isComment ? 'text-teal-400' : 'text-slate-200'}`}>
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SETTINGS VIEW (Demo/Live toggle, REST API URL, Reset, Empty DB, JDBC Sample)
// ============================================================================
export const DeveloperSettingsView: React.FC = () => {
  const {
    dataMode,
    setDataMode,
    apiBaseUrl,
    setApiBaseUrl,
    apiConnected,
    resetToReportDataset,
    startWithEmptyDatabase,
    showToast,
  } = useStore();

  const [copiedJdbc, setCopiedJdbc] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] border p-6 space-y-5"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Data Layer & Environment Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Demo and Live share the exact same data-layer interface (getAll, insert, update, delete per table).
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl border" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => void setDataMode('Demo')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: dataMode === 'Demo' ? 'var(--card)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              Demo (In-Memory)
            </button>
            <button
              type="button"
              onClick={() => void setDataMode('Live')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: dataMode === 'Live' ? 'var(--card)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              Live (REST API)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8 space-y-1.5">
            <label htmlFor="rest-api-url" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
              REST API Base URL (<code className="font-mono">GET/POST/PUT/DELETE &#123;baseUrl&#125;/&#123;table&#125;</code>)
            </label>
            <input
              id="rest-api-url"
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border text-xs font-mono outline-none"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          <div className="md:col-span-4 flex items-center justify-between h-11 px-4 rounded-xl border text-xs" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>Connection Status:</span>
            <span className="font-semibold" style={{ color: apiConnected ? 'var(--green)' : 'var(--indigo)' }}>
              {apiConnected ? 'Connected (Live)' : 'In-Memory Active (Demo)'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={resetToReportDataset}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: 'var(--indigo)' }}
          >
            <RotateCcw size={14} />
            <span>Reset to report dataset</span>
          </button>

          <button
            type="button"
            onClick={startWithEmptyDatabase}
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Database size={14} />
            <span>Start with empty database</span>
          </button>
        </div>
      </div>

      {/* JDBC Connectivity Panel (Appendix H verbatim) */}
      <div
        className="rounded-[20px] border p-6 space-y-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server size={18} style={{ color: 'var(--teal)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              JDBC Connectivity (Appendix H)
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold" style={{ color: 'var(--indigo)' }}>
            <span>Front-end</span>
            <ArrowRight size={13} />
            <span>REST API</span>
            <ArrowRight size={13} />
            <span>JDBC</span>
            <ArrowRight size={13} />
            <span>Oracle</span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: '#0D1017', borderColor: '#262B36' }}>
          <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: '#262B36', backgroundColor: '#131822' }}>
            <span className="text-xs font-mono text-slate-300">FindItJdbcDemo.java</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(JDBC_SAMPLE_JAVA);
                setCopiedJdbc(true);
                showToast('Copied FindItJdbcDemo.java', 'success');
                window.setTimeout(() => setCopiedJdbc(false), 1800);
              }}
              className="px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono text-slate-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedJdbc ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedJdbc ? 'Copied' : 'Copy Java'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed m-0">
            {JDBC_SAMPLE_JAVA}
          </pre>
        </div>
      </div>
    </div>
  );
};
