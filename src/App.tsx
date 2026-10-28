import React, { useEffect, useState } from 'react';
import {
  Bell,
  Code2,
  GraduationCap,
  Moon,
  Search,
  Shield,
  Sun,
  Terminal,
} from 'lucide-react';
import { StoreProvider, useStore } from './store';
import { RoleType } from './types';
import { FindItLogo } from './components/IconsAndGraphics';
import {
  StudentBrowseFound,
  StudentHelp,
  StudentHome,
  StudentMyReports,
} from './components/StudentViews';
import {
  AdminAllReportsView,
  AdminClaimsView,
  AdminHandoverView,
  AdminHome,
} from './components/AdminViews';
import {
  DatabaseLayersCard,
  DeveloperManageDataView,
  DeveloperModulesQueriesView,
  DeveloperPlSqlLabView,
  DeveloperSettingsView,
  DeveloperSqlScriptsView,
} from './components/DeveloperViews';
import {
  DeveloperBottomSqlPanel,
  TransactionExplainerCard,
} from './components/TransactionExplainer';
import { QuickLookupModal } from './components/QuickToolsModal';

const RoleChooserModal: React.FC = () => {
  const { role, setRole, showRoleModal, setShowRoleModal } = useStore();

  if (!showRoleModal) return null;

  const roles: {
    id: RoleType;
    title: string;
    subtitle: string;
    desc: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'Student',
      title: 'Student / Staff',
      subtitle: 'Default · Maximum Abstraction',
      desc: 'Report lost or found items, browse unclaimed belongings, track your claim timeline, and download handover slips in plain language.',
      icon: <GraduationCap size={20} style={{ color: 'var(--indigo)' }} />,
      accent: 'var(--indigo)',
    },
    {
      id: 'Admin',
      title: 'Admin Officer',
      subtitle: 'Campus Verification & Handover',
      desc: 'Work queue for pending claims, 60-day disposal checks, batch matching trigger, claim verification/rejection, and physical item handover.',
      icon: <Shield size={20} style={{ color: 'var(--teal)' }} />,
      accent: 'var(--teal)',
    },
    {
      id: 'Developer',
      title: 'Developer / Examiner',
      subtitle: 'Full Oracle SQL & PL/SQL Lab (BACSE202)',
      desc: 'Inspect all 8 tables (CRUD + FK constraints), Modules 1 & 2 queries, Lab Cycle Q1–Q15, PL/SQL procedures & triggers, SQL scripts, and live SQL logs.',
      icon: <Code2 size={20} style={{ color: 'var(--amber)' }} />,
      accent: 'var(--amber)',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(15, 17, 21, 0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Who are you? Choose your role"
    >
      <div
        className="w-full max-w-2xl rounded-[20px] border p-6 md:p-8 space-y-6"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <FindItLogo size={34} />
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                Who are you?
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Switch roles anytime from the top bar — your data and form drafts stay in sync.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRoleModal(false)}
            className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Continue as {role}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className="p-5 rounded-[20px] border text-left flex flex-col justify-between gap-4 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--raised)' : 'var(--card)',
                  borderColor: active ? r.accent : 'var(--border)',
                }}
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}>
                    {r.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {r.title}
                    </div>
                    <div className="text-[11px] font-medium" style={{ color: r.accent }}>
                      {r.subtitle}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {r.desc}
                  </p>
                </div>

                <div
                  className="text-xs font-semibold pt-2 border-t flex items-center justify-between"
                  style={{ borderColor: 'var(--border)', color: r.accent }}
                >
                  <span>Enter as {r.title.split(' ')[0]}</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MainWorkspace: React.FC = () => {
  const {
    role,
    setRole,
    setShowRoleModal,
    activeTab,
    setActiveTab,
    setSelectedStudentPersonId,
    theme,
    toggleTheme,
    lastUpdated,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    showSqlBar,
    setShowSqlBar,
    toast,
  } = useStore();

  const [bellOpen, setBellOpen] = useState(false);
  const [quickLookupOpen, setQuickLookupOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickLookupOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems =
    role === 'Student'
      ? [
          { id: 'home', label: 'Home' },
          { id: 'my-reports', label: 'My Reports' },
          { id: 'browse-found', label: 'Browse Found' },
          { id: 'help', label: 'Help' },
        ]
      : role === 'Admin'
      ? [
          { id: 'home', label: 'Home' },
          { id: 'claims', label: 'Claims' },
          { id: 'all-reports', label: 'All Reports' },
          { id: 'handover', label: 'Handover' },
        ]
      : [
          { id: 'manage-data', label: 'Manage Data' },
          { id: 'modules-queries', label: 'Modules & Queries' },
          { id: 'plsql-lab', label: 'PL/SQL Lab' },
          { id: 'sql-scripts', label: 'SQL Scripts' },
          { id: 'settings', label: 'Settings' },
        ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* TOP NAVIGATION BAR */}
      <header
        className="sticky top-0 z-30 border-b no-print"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Left: Logo + Wordmark + Synced telemetry */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(role === 'Developer' ? 'manage-data' : 'home')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <FindItLogo size={28} />
              <span className="text-lg font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--text)' }}>
                FindIt
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--teal)' }}
                aria-hidden="true"
              />
              <span>Synced · {lastUpdated}</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2"
                  style={{
                    color: isActive ? 'var(--indigo)' : 'var(--muted)',
                    borderColor: isActive ? 'var(--indigo)' : 'transparent',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Find (Ctrl+K), 1-Click Role Switcher, Show SQL toggle (Developer), Notification Bell, Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Find / Ref Lookup Button */}
            <button
              type="button"
              onClick={() => setQuickLookupOpen(true)}
              aria-label="Quick Find by Reference or Keyword"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--raised)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <Search size={13} style={{ color: 'var(--indigo)' }} />
              <span className="hidden sm:inline">Quick Find</span>
              <span
                className="hidden xl:inline px-1.5 py-0.5 rounded text-[10px] font-mono border"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                ⌘K
              </span>
            </button>

            {role === 'Developer' && (
              <button
                type="button"
                onClick={() => setShowSqlBar(!showSqlBar)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium cursor-pointer"
                style={{
                  backgroundColor: showSqlBar ? 'var(--indigo-soft)' : 'var(--raised)',
                  borderColor: showSqlBar ? 'var(--indigo)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Terminal size={13} />
                <span>Show SQL</span>
              </button>
            )}

            {/* Instant 1-Click Segmented Role Bar + Switch modal link */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
            >
              {(['Student', 'Admin', 'Developer'] as RoleType[]).map((r) => {
                const isCurr = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isCurr ? 'var(--card)' : 'transparent',
                      color: isCurr ? 'var(--indigo)' : 'var(--muted)',
                    }}
                  >
                    {r === 'Student' ? 'Student' : r === 'Admin' ? 'Admin' : 'Dev'}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                title="Role guide"
                className="px-1.5 py-0.5 text-[11px] font-semibold underline cursor-pointer hidden sm:inline"
                style={{ color: 'var(--indigo)' }}
              >
                Switch
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBellOpen((p) => !p)}
                aria-label="Open notifications"
                className="relative p-2 rounded-xl border cursor-pointer hover:opacity-80"
                style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums"
                    style={{ backgroundColor: 'var(--indigo)' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[20px] border p-4 z-50 space-y-3"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      Notifications ({unreadCount} unread)
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[11px] font-semibold cursor-pointer hover:underline"
                          style={{ color: 'var(--indigo)' }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setBellOpen(false)}
                        className="text-xs cursor-pointer"
                        style={{ color: 'var(--muted)' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.person_id) {
                              setSelectedStudentPersonId(n.person_id);
                              setRole('Student');
                              setActiveTab('my-reports');
                              setBellOpen(false);
                            }
                          }}
                          className="p-3 rounded-xl border text-xs cursor-pointer transition-opacity hover:opacity-90"
                          style={{
                            backgroundColor: n.read ? 'var(--card)' : 'var(--raised)',
                            borderColor: n.read ? 'var(--border)' : 'var(--indigo-border)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={n.read ? 'font-normal' : 'font-semibold'} style={{ color: 'var(--text)' }}>
                              {n.message}
                            </span>
                            {!n.read && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0 mt-1"
                                style={{ backgroundColor: 'var(--indigo)' }}
                              />
                            )}
                          </div>
                          <div className="text-[10px] mt-1 font-mono flex items-center justify-between" style={{ color: 'var(--muted)' }}>
                            <span>
                              {n.timestamp} {n.refId ? `· ${n.refId}` : ''}
                            </span>
                            <span style={{ color: 'var(--indigo)' }}>View report →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-xl border cursor-pointer hover:opacity-80"
              style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip + Developer Quick Switcher */}
        <div
          className="border-t px-4 py-2 flex items-center gap-3 overflow-x-auto md:hidden"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="text-xs font-semibold whitespace-nowrap px-2.5 py-1 rounded-lg cursor-pointer"
              style={{
                backgroundColor: activeTab === item.id ? 'var(--card)' : 'transparent',
                color: activeTab === item.id ? 'var(--indigo)' : 'var(--muted)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* In Developer mode, provide quick secondary tabs to inspect Student & Admin screens too */}
        {role === 'Developer' && (
          <div
            className="border-t px-4 py-1.5"
            style={{ backgroundColor: 'var(--raised)', borderColor: 'var(--border)' }}
          >
            <div className="max-w-[1100px] mx-auto flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="font-mono font-semibold shrink-0" style={{ color: 'var(--muted)' }}>
                All Screens:
              </span>
              {[
                { id: 'manage-data', label: 'Manage Data (CRUD)' },
                { id: 'modules-queries', label: 'Modules & Queries (M1/M2/Q1-Q15)' },
                { id: 'plsql-lab', label: 'PL/SQL Lab' },
                { id: 'sql-scripts', label: 'SQL Scripts (01-07)' },
                { id: 'settings', label: 'Settings & JDBC' },
                { id: 'home', label: 'Student Home' },
                { id: 'my-reports', label: 'Student My Reports' },
                { id: 'browse-found', label: 'Browse Found' },
                { id: 'claims', label: 'Admin Claims' },
                { id: 'handover', label: 'Admin Handover' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveTab(s.id)}
                  className="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: activeTab === s.id ? 'var(--card)' : 'transparent',
                    color: activeTab === s.id ? 'var(--indigo)' : 'var(--muted)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* SINGLE-LINE TOAST (auto-dismisses after 2s) */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 no-print">
          <div
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap shadow-md"
            style={{
              backgroundColor: 'var(--card)',
              borderColor:
                toast.variant === 'error'
                  ? 'var(--red)'
                  : toast.variant === 'success'
                  ? 'var(--teal)'
                  : 'var(--indigo)',
              color: 'var(--text)',
            }}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER (max-w-[1100px]) */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 py-8 space-y-6">
        {/* STUDENT VIEWS */}
        {role === 'Student' && (
          <>
            {activeTab === 'home' && <StudentHome />}
            {activeTab === 'my-reports' && <StudentMyReports />}
            {activeTab === 'browse-found' && <StudentBrowseFound />}
            {activeTab === 'help' && <StudentHelp />}
          </>
        )}

        {/* ADMIN VIEWS */}
        {role === 'Admin' && (
          <>
            {activeTab === 'home' && <AdminHome />}
            {activeTab === 'claims' && <AdminClaimsView />}
            {activeTab === 'all-reports' && <AdminAllReportsView />}
            {activeTab === 'handover' && <AdminHandoverView />}
            <TransactionExplainerCard compact />
          </>
        )}

        {/* DEVELOPER / EXAMINER VIEWS */}
        {role === 'Developer' && (
          <>
            {activeTab === 'manage-data' && <DeveloperManageDataView />}
            {activeTab === 'modules-queries' && <DeveloperModulesQueriesView />}
            {activeTab === 'plsql-lab' && <DeveloperPlSqlLabView />}
            {activeTab === 'sql-scripts' && <DeveloperSqlScriptsView />}
            {activeTab === 'settings' && <DeveloperSettingsView />}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <DatabaseLayersCard />
                <StudentHome />
                <TransactionExplainerCard />
              </div>
            )}
            {activeTab === 'my-reports' && (
              <div className="space-y-6">
                <StudentMyReports />
                <TransactionExplainerCard />
              </div>
            )}
            {activeTab === 'browse-found' && <StudentBrowseFound />}
            {activeTab === 'claims' && (
              <div className="space-y-6">
                <AdminClaimsView />
                <TransactionExplainerCard />
              </div>
            )}
            {activeTab === 'all-reports' && <AdminAllReportsView />}
            {activeTab === 'handover' && (
              <div className="space-y-6">
                <AdminHandoverView />
                <TransactionExplainerCard />
              </div>
            )}
          </>
        )}
      </main>

      {/* MANDATORY FOOTER ON EVERY SCREEN */}
      <footer
        className={`border-t py-5 px-4 text-center text-xs ${
          role === 'Developer' && showSqlBar ? 'pb-16' : ''
        }`}
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            FindIt - Campus Lost and Found Management System · Vellore Institute of Technology
          </span>
          <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
            Tejash Raj (25BDE0062) and Soham Sharma (25BDE0030) - BACSE202
          </span>
        </div>
      </footer>

      <DeveloperBottomSqlPanel />
      <RoleChooserModal />
      <QuickLookupModal open={quickLookupOpen} onClose={() => setQuickLookupOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainWorkspace />
    </StoreProvider>
  );
}
