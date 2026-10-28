import {
  Admin,
  CampusLocation,
  ClaimRequest,
  DatabaseState,
  FoundReport,
  ItemCategory,
  LostReport,
  MatchScore,
  Person,
} from './types';

export const SEED_CATEGORIES: ItemCategory[] = [
  { category_id: 1, category_name: 'Phones' },
  { category_id: 2, category_name: 'Laptops and Tablets' },
  { category_id: 3, category_name: 'Chargers and Earphones' },
  { category_id: 4, category_name: 'Wallets and Cards' },
  { category_id: 5, category_name: 'ID Cards' },
  { category_id: 6, category_name: 'Documents and Certificates' },
  { category_id: 7, category_name: 'Books and Notebooks' },
  { category_id: 8, category_name: 'Stationery' },
  { category_id: 9, category_name: 'Bags and Backpacks' },
  { category_id: 10, category_name: 'Keys' },
  { category_id: 11, category_name: 'Watches and Jewellery' },
  { category_id: 12, category_name: 'Spectacles and Eyewear' },
  { category_id: 13, category_name: 'Clothing and Jackets' },
  { category_id: 14, category_name: 'Water Bottles and Lunch Boxes' },
  { category_id: 15, category_name: 'Sports Equipment' },
  { category_id: 16, category_name: 'Others' },
];

export type CategoryGroup =
  | 'Tech'
  | 'Cards and Documents'
  | 'Bags and Carry'
  | 'Personal'
  | 'Study'
  | 'Other';

export interface CategoryMeta {
  id: number;
  group: CategoryGroup;
  popular: boolean;
  tintLight: string;
  tintDark: string;
  iconColorLight: string;
  iconColorDark: string;
}

export const CATEGORY_META: Record<number, CategoryMeta> = {
  1: { id: 1, group: 'Tech', popular: true, tintLight: 'rgba(79, 70, 229, 0.09)', tintDark: 'rgba(129, 140, 248, 0.14)', iconColorLight: '#4F46E5', iconColorDark: '#818CF8' },
  2: { id: 2, group: 'Tech', popular: true, tintLight: 'rgba(59, 130, 246, 0.09)', tintDark: 'rgba(96, 165, 250, 0.14)', iconColorLight: '#2563EB', iconColorDark: '#60A5FA' },
  3: { id: 3, group: 'Tech', popular: true, tintLight: 'rgba(14, 165, 233, 0.09)', tintDark: 'rgba(56, 189, 248, 0.14)', iconColorLight: '#0284C7', iconColorDark: '#38BDF8' },
  4: { id: 4, group: 'Cards and Documents', popular: true, tintLight: 'rgba(217, 119, 6, 0.09)', tintDark: 'rgba(251, 191, 36, 0.14)', iconColorLight: '#D97706', iconColorDark: '#FBBF24' },
  5: { id: 5, group: 'Cards and Documents', popular: true, tintLight: 'rgba(20, 184, 166, 0.09)', tintDark: 'rgba(45, 212, 191, 0.14)', iconColorLight: '#0D9488', iconColorDark: '#2DD4BF' },
  6: { id: 6, group: 'Cards and Documents', popular: false, tintLight: 'rgba(234, 88, 12, 0.09)', tintDark: 'rgba(251, 146, 60, 0.14)', iconColorLight: '#EA580C', iconColorDark: '#FB923C' },
  7: { id: 7, group: 'Study', popular: false, tintLight: 'rgba(22, 163, 74, 0.09)', tintDark: 'rgba(74, 222, 128, 0.14)', iconColorLight: '#16A34A', iconColorDark: '#4ADE80' },
  8: { id: 8, group: 'Study', popular: false, tintLight: 'rgba(101, 163, 13, 0.09)', tintDark: 'rgba(163, 230, 53, 0.14)', iconColorLight: '#65A30D', iconColorDark: '#A3E635' },
  9: { id: 9, group: 'Bags and Carry', popular: true, tintLight: 'rgba(147, 51, 234, 0.09)', tintDark: 'rgba(192, 132, 252, 0.14)', iconColorLight: '#9333EA', iconColorDark: '#C084FC' },
  10: { id: 10, group: 'Bags and Carry', popular: true, tintLight: 'rgba(225, 29, 72, 0.09)', tintDark: 'rgba(251, 113, 133, 0.14)', iconColorLight: '#E11D48', iconColorDark: '#FB7185' },
  11: { id: 11, group: 'Personal', popular: true, tintLight: 'rgba(192, 38, 211, 0.09)', tintDark: 'rgba(232, 121, 249, 0.14)', iconColorLight: '#C026D3', iconColorDark: '#E879F9' },
  12: { id: 12, group: 'Personal', popular: false, tintLight: 'rgba(8, 145, 178, 0.09)', tintDark: 'rgba(34, 211, 238, 0.14)', iconColorLight: '#0891B2', iconColorDark: '#22D3EE' },
  13: { id: 13, group: 'Personal', popular: false, tintLight: 'rgba(99, 102, 241, 0.09)', tintDark: 'rgba(129, 140, 248, 0.14)', iconColorLight: '#4F46E5', iconColorDark: '#818CF8' },
  14: { id: 14, group: 'Personal', popular: false, tintLight: 'rgba(5, 150, 105, 0.09)', tintDark: 'rgba(52, 211, 153, 0.14)', iconColorLight: '#059669', iconColorDark: '#34D399' },
  15: { id: 15, group: 'Other', popular: false, tintLight: 'rgba(220, 38, 38, 0.09)', tintDark: 'rgba(248, 113, 113, 0.14)', iconColorLight: '#DC2626', iconColorDark: '#F87171' },
  16: { id: 16, group: 'Other', popular: false, tintLight: 'rgba(107, 114, 128, 0.09)', tintDark: 'rgba(156, 163, 175, 0.14)', iconColorLight: '#4B5563', iconColorDark: '#9CA3AF' },
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  'Tech',
  'Cards and Documents',
  'Bags and Carry',
  'Personal',
  'Study',
  'Other',
];

export const SEED_LOCATIONS: CampusLocation[] = [
  { location_id: 1, zone_name: 'Central Library' },
  { location_id: 2, zone_name: 'Hostel Block A' },
  { location_id: 3, zone_name: 'Hostel Block B' },
  { location_id: 4, zone_name: 'Canteen' },
  { location_id: 5, zone_name: 'Main Gate' },
  { location_id: 6, zone_name: 'Academic Block' },
  { location_id: 7, zone_name: 'Sports Complex' },
  { location_id: 8, zone_name: 'CSE Department' },
  { location_id: 9, zone_name: 'Auditorium' },
  { location_id: 10, zone_name: 'Parking Area' },
];

export const SEED_ADMINS: Admin[] = [
  { admin_id: 1, name: 'Ramesh Babu', designation: 'Lost and Found Officer' },
  { admin_id: 2, name: 'Kavitha S', designation: 'Assistant Warden' },
  { admin_id: 3, name: 'Mohan Raj', designation: 'Security Supervisor' },
  { admin_id: 4, name: 'Latha Devi', designation: 'Librarian' },
  { admin_id: 5, name: 'Joseph Antony', designation: 'Hostel Warden' },
  { admin_id: 6, name: 'Farah Sheikh', designation: 'Student Affairs Officer' },
  { admin_id: 7, name: 'Gopal Krishnan', designation: 'Head of Security Guards' },
  { admin_id: 8, name: 'Nisha Verma', designation: 'Administrative Officer' },
  { admin_id: 9, name: 'Arun Prakash', designation: 'Canteen Manager' },
  { admin_id: 10, name: 'Deepa Rani', designation: 'Department Coordinator' },
];

export const SEED_PERSONS: Person[] = [
  { person_id: 1, name: 'Aarav Sharma', reg_no: '23BCE1001', phone: '9876500001', email: 'aarav.sharma@college.edu', role: 'Student' },
  { person_id: 2, name: 'Priya Nair', reg_no: '23BCE1002', phone: '9876500002', email: 'priya.nair@college.edu', role: 'Student' },
  { person_id: 3, name: 'Rohan Mehta', reg_no: '23BAI1003', phone: '9876500003', email: 'rohan.mehta@college.edu', role: 'Student' },
  { person_id: 4, name: 'Sneha Iyer', reg_no: '23BDS1004', phone: '9876500004', email: 'sneha.iyer@college.edu', role: 'Student' },
  { person_id: 5, name: 'Karthik Rao', reg_no: '23BCE1005', phone: '9876500005', email: 'karthik.rao@college.edu', role: 'Student' },
  { person_id: 6, name: 'Ananya Das', reg_no: '23BEC1006', phone: '9876500006', email: 'ananya.das@college.edu', role: 'Student' },
  { person_id: 7, name: 'Vikram Singh', reg_no: '23BME1007', phone: '9876500007', email: 'vikram.singh@college.edu', role: 'Student' },
  { person_id: 8, name: 'Meera Pillai', reg_no: '23BCE1008', phone: '9876500008', email: 'meera.pillai@college.edu', role: 'Student' },
  { person_id: 9, name: 'Dr. Suresh Kumar', reg_no: 'STF2001', phone: '9876500009', email: 'suresh.kumar@college.edu', role: 'Staff' },
  { person_id: 10, name: 'Prof. Lakshmi Menon', reg_no: 'STF2002', phone: '9876500010', email: 'lakshmi.menon@college.edu', role: 'Staff' },
  { person_id: 11, name: 'Imran Khan', reg_no: '23BIT1011', phone: '9876500011', email: 'imran.khan@college.edu', role: 'Student' },
  { person_id: 12, name: 'Divya Reddy', reg_no: '23BCE1012', phone: '9876500012', email: 'divya.reddy@college.edu', role: 'Student' },
];

export const SEED_LOST_REPORTS: LostReport[] = [
  { lost_id: 1, person_id: 1, category_id: 4, location_id: 1, description: 'black leather wallet', date_lost: '2026-10-01', status: 'Closed' },
  { lost_id: 2, person_id: 2, category_id: 1, location_id: 6, description: 'blue samsung phone cracked screen', date_lost: '2026-10-02', status: 'Matched' },
  { lost_id: 3, person_id: 3, category_id: 5, location_id: 4, description: 'student id card blue lanyard', date_lost: '2026-10-03', status: 'Closed' },
  { lost_id: 4, person_id: 4, category_id: 9, location_id: 2, description: 'grey laptop backpack red zip', date_lost: '2026-10-04', status: 'Matched' },
  { lost_id: 5, person_id: 5, category_id: 10, location_id: 8, description: 'bike key bunch black keychain', date_lost: '2026-10-05', status: 'Active' },
  { lost_id: 6, person_id: 6, category_id: 2, location_id: 8, description: 'silver dell laptop black sleeve', date_lost: '2026-10-06', status: 'Matched' },
  { lost_id: 7, person_id: 7, category_id: 11, location_id: 7, description: 'black digital sports watch', date_lost: '2026-10-07', status: 'Matched' },
  { lost_id: 8, person_id: 8, category_id: 12, location_id: 1, description: 'black frame spectacles blue case', date_lost: '2026-10-08', status: 'Closed' },
  { lost_id: 9, person_id: 9, category_id: 6, location_id: 6, description: 'brown folder certificates', date_lost: '2026-10-09', status: 'Closed' },
  { lost_id: 10, person_id: 10, category_id: 14, location_id: 3, description: 'steel water bottle silver', date_lost: '2026-10-10', status: 'Matched' },
  { lost_id: 11, person_id: 11, category_id: 3, location_id: 1, description: 'white apple earphones case', date_lost: '2026-10-11', status: 'Matched' },
  { lost_id: 12, person_id: 12, category_id: 7, location_id: 6, description: 'data structures notebook green cover', date_lost: '2026-10-12', status: 'Active' },
];

export const SEED_FOUND_REPORTS: FoundReport[] = [
  { found_id: 1, person_id: 12, category_id: 4, location_id: 1, storage_location: 'Admin Office Shelf A', description: 'black leather wallet cards inside', date_found: '2026-10-02', status: 'Returned' },
  { found_id: 2, person_id: 5, category_id: 1, location_id: 8, storage_location: 'Security Desk Locker 2', description: 'blue phone cracked screen', date_found: '2026-10-05', status: 'Unclaimed' },
  { found_id: 3, person_id: 9, category_id: 5, location_id: 4, storage_location: 'Admin Office Shelf B', description: 'student card with lanyard', date_found: '2026-10-04', status: 'Returned' },
  { found_id: 4, person_id: 8, category_id: 9, location_id: 2, storage_location: 'Hostel Warden Room', description: 'grey bag red zip books inside', date_found: '2026-10-06', status: 'Unclaimed' },
  { found_id: 5, person_id: 10, category_id: 2, location_id: 6, storage_location: 'Admin Office Cabinet', description: 'silver dell laptop black sleeve', date_found: '2026-10-07', status: 'Unclaimed' },
  { found_id: 6, person_id: 2, category_id: 11, location_id: 7, storage_location: 'Sports Office', description: 'black digital watch', date_found: '2026-10-09', status: 'Unclaimed' },
  { found_id: 7, person_id: 4, category_id: 12, location_id: 3, storage_location: 'Security Desk Locker 1', description: 'black spectacles blue case', date_found: '2026-10-10', status: 'Claimed' },
  { found_id: 8, person_id: 3, category_id: 6, location_id: 6, storage_location: 'Admin Office Shelf A', description: 'brown folder certificates marksheets', date_found: '2026-10-11', status: 'Claimed' },
  { found_id: 9, person_id: 6, category_id: 14, location_id: 3, storage_location: 'Hostel Warden Room', description: 'steel bottle silver cap', date_found: '2026-10-15', status: 'Unclaimed' },
  { found_id: 10, person_id: 1, category_id: 3, location_id: 5, storage_location: 'Library Help Desk', description: 'white earphones case', date_found: '2026-10-13', status: 'Unclaimed' },
  { found_id: 11, person_id: 11, category_id: 4, location_id: 5, storage_location: 'Security Desk Locker 2', description: 'brown card holder', date_found: '2026-10-15', status: 'Unclaimed' },
  { found_id: 12, person_id: 7, category_id: 15, location_id: 7, storage_location: 'Sports Office', description: 'yonex badminton racket', date_found: '2026-10-12', status: 'Unclaimed' },
  { found_id: 13, person_id: 5, category_id: 13, location_id: 4, storage_location: 'Canteen Counter', description: 'navy hoodie', date_found: '2026-10-14', status: 'Unclaimed' },
];

export const SEED_MATCH_SCORES: MatchScore[] = [
  { match_id: 1, lost_id: 1, found_id: 1, category_score: 40, location_score: 20, date_score: 20, description_score: 15, total_score: 95, computed_date: '2026-10-02' },
  { match_id: 2, lost_id: 2, found_id: 2, category_score: 40, location_score: 0, date_score: 12, description_score: 20, total_score: 72, computed_date: '2026-10-05' },
  { match_id: 3, lost_id: 3, found_id: 3, category_score: 40, location_score: 20, date_score: 20, description_score: 15, total_score: 95, computed_date: '2026-10-04' },
  { match_id: 4, lost_id: 4, found_id: 4, category_score: 40, location_score: 20, date_score: 20, description_score: 15, total_score: 95, computed_date: '2026-10-06' },
  { match_id: 5, lost_id: 6, found_id: 5, category_score: 40, location_score: 0, date_score: 20, description_score: 20, total_score: 80, computed_date: '2026-10-07' },
  { match_id: 6, lost_id: 7, found_id: 6, category_score: 40, location_score: 20, date_score: 20, description_score: 15, total_score: 95, computed_date: '2026-10-09' },
  { match_id: 7, lost_id: 8, found_id: 7, category_score: 40, location_score: 0, date_score: 20, description_score: 20, total_score: 80, computed_date: '2026-10-10' },
  { match_id: 8, lost_id: 9, found_id: 8, category_score: 40, location_score: 20, date_score: 20, description_score: 15, total_score: 95, computed_date: '2026-10-11' },
  { match_id: 9, lost_id: 10, found_id: 9, category_score: 40, location_score: 20, date_score: 12, description_score: 15, total_score: 87, computed_date: '2026-10-15' },
  { match_id: 10, lost_id: 11, found_id: 10, category_score: 40, location_score: 0, date_score: 20, description_score: 15, total_score: 75, computed_date: '2026-10-13' },
];

export const SEED_CLAIM_REQUESTS: ClaimRequest[] = [
  { claim_id: 1, match_id: 1, person_id: 1, admin_id: 1, claim_date: '2026-10-03', verification_status: 'Verified' },
  { claim_id: 2, match_id: 2, person_id: 2, admin_id: null, claim_date: '2026-10-06', verification_status: 'Pending' },
  { claim_id: 3, match_id: 3, person_id: 3, admin_id: 3, claim_date: '2026-10-05', verification_status: 'Verified' },
  { claim_id: 4, match_id: 4, person_id: 4, admin_id: 2, claim_date: '2026-10-07', verification_status: 'Rejected', rejection_reason: 'Serial tag inside bag did not match claimant description' },
  { claim_id: 5, match_id: 5, person_id: 6, admin_id: null, claim_date: '2026-10-08', verification_status: 'Pending' },
  { claim_id: 6, match_id: 6, person_id: 7, admin_id: null, claim_date: '2026-10-10', verification_status: 'Pending' },
  { claim_id: 7, match_id: 7, person_id: 8, admin_id: 6, claim_date: '2026-10-11', verification_status: 'Verified' },
  { claim_id: 8, match_id: 8, person_id: 9, admin_id: 8, claim_date: '2026-10-12', verification_status: 'Verified' },
  { claim_id: 9, match_id: 9, person_id: 10, admin_id: null, claim_date: '2026-10-16', verification_status: 'Pending' },
  { claim_id: 10, match_id: 10, person_id: 11, admin_id: null, claim_date: '2026-10-14', verification_status: 'Pending' },
];

export function getSeedDatabaseState(): DatabaseState {
  return {
    person: SEED_PERSONS.map((r) => ({ ...r })),
    itemcategory: SEED_CATEGORIES.map((r) => ({ ...r })),
    campuslocation: SEED_LOCATIONS.map((r) => ({ ...r })),
    admin: SEED_ADMINS.map((r) => ({ ...r })),
    lostreport: SEED_LOST_REPORTS.map((r) => ({ ...r })),
    foundreport: SEED_FOUND_REPORTS.map((r) => ({ ...r })),
    matchscore: SEED_MATCH_SCORES.map((r) => ({ ...r })),
    claimrequest: SEED_CLAIM_REQUESTS.map((r) => ({ ...r })),
    sequences: {
      person: 101,
      itemcategory: 101,
      campuslocation: 101,
      admin: 101,
      lostreport: 101,
      foundreport: 101,
      matchscore: 101,
      claimrequest: 101,
    },
  };
}

export function getEmptyDatabaseState(): DatabaseState {
  return {
    person: [],
    itemcategory: SEED_CATEGORIES.map((r) => ({ ...r })),
    campuslocation: SEED_LOCATIONS.map((r) => ({ ...r })),
    admin: SEED_ADMINS.map((r) => ({ ...r })),
    lostreport: [],
    foundreport: [],
    matchscore: [],
    claimrequest: [],
    sequences: {
      person: 101,
      itemcategory: 101,
      campuslocation: 101,
      admin: 101,
      lostreport: 101,
      foundreport: 101,
      matchscore: 101,
      claimrequest: 101,
    },
  };
}

const esc = (s: string) => s.replace(/'/g, "''");

export function generate02DataSql(): string {
  const lines: string[] = ['-- 02_data.sql (Auto-generated from FindIt seed dataset - Oracle SQL syntax)'];

  lines.push('\n-- ITEMCATEGORY');
  for (const c of SEED_CATEGORIES) {
    lines.push(
      `INSERT INTO itemcategory (category_id, category_name) VALUES (${c.category_id}, '${esc(c.category_name)}');`
    );
  }

  lines.push('\n-- CAMPUSLOCATION');
  for (const l of SEED_LOCATIONS) {
    lines.push(
      `INSERT INTO campuslocation (location_id, zone_name) VALUES (${l.location_id}, '${esc(l.zone_name)}');`
    );
  }

  lines.push('\n-- ADMIN');
  for (const a of SEED_ADMINS) {
    lines.push(
      `INSERT INTO admin (admin_id, name, designation) VALUES (${a.admin_id}, '${esc(a.name)}', '${esc(a.designation)}');`
    );
  }

  lines.push('\n-- PERSON');
  for (const p of SEED_PERSONS) {
    lines.push(
      `INSERT INTO person (person_id, name, reg_no, phone, email, role) VALUES (${p.person_id}, '${esc(p.name)}', '${esc(p.reg_no)}', '${esc(p.phone)}', '${esc(p.email)}', '${esc(p.role)}');`
    );
  }

  lines.push('\n-- LOSTREPORT');
  for (const lr of SEED_LOST_REPORTS) {
    lines.push(
      `INSERT INTO lostreport (lost_id, person_id, category_id, location_id, description, date_lost, status) VALUES (${lr.lost_id}, ${lr.person_id}, ${lr.category_id}, ${lr.location_id}, '${esc(lr.description)}', DATE '${lr.date_lost}', '${lr.status}');`
    );
  }

  lines.push('\n-- FOUNDREPORT');
  for (const fr of SEED_FOUND_REPORTS) {
    lines.push(
      `INSERT INTO foundreport (found_id, person_id, category_id, location_id, storage_location, description, date_found, status) VALUES (${fr.found_id}, ${fr.person_id}, ${fr.category_id}, ${fr.location_id}, '${esc(fr.storage_location)}', '${esc(fr.description)}', DATE '${fr.date_found}', '${fr.status}');`
    );
  }

  lines.push('\n-- MATCHSCORE');
  for (const m of SEED_MATCH_SCORES) {
    lines.push(
      `INSERT INTO matchscore (match_id, lost_id, found_id, category_score, location_score, date_score, description_score, total_score, computed_date) VALUES (${m.match_id}, ${m.lost_id}, ${m.found_id}, ${m.category_score}, ${m.location_score}, ${m.date_score}, ${m.description_score}, ${m.total_score}, DATE '${m.computed_date}');`
    );
  }

  lines.push('\n-- CLAIMREQUEST');
  for (const cr of SEED_CLAIM_REQUESTS) {
    const adminVal = cr.admin_id === null ? 'NULL' : String(cr.admin_id);
    lines.push(
      `INSERT INTO claimrequest (claim_id, match_id, person_id, admin_id, claim_date, verification_status) VALUES (${cr.claim_id}, ${cr.match_id}, ${cr.person_id}, ${adminVal}, DATE '${cr.claim_date}', '${cr.verification_status}');`
    );
  }

  lines.push('\nCOMMIT;');
  return lines.join('\n');
}

export const SQL_01_DDL = `CREATE TABLE person (
    person_id   NUMBER(5)     CONSTRAINT pk_person PRIMARY KEY,
    name        VARCHAR2(60)  NOT NULL,
    reg_no      VARCHAR2(20)  NOT NULL,
    phone       VARCHAR2(15),
    email       VARCHAR2(80),
    role        VARCHAR2(10)  DEFAULT 'Student' NOT NULL,
    CONSTRAINT uq_person_regno UNIQUE (reg_no),
    CONSTRAINT ck_person_role  CHECK (role IN ('Student','Staff'))
);
CREATE TABLE itemcategory (
    category_id    NUMBER(3)     CONSTRAINT pk_category PRIMARY KEY,
    category_name  VARCHAR2(40)  NOT NULL,
    CONSTRAINT uq_category_name UNIQUE (category_name)
);
CREATE TABLE campuslocation (
    location_id  NUMBER(3)     CONSTRAINT pk_location PRIMARY KEY,
    zone_name    VARCHAR2(40)  NOT NULL,
    CONSTRAINT uq_zone_name UNIQUE (zone_name)
);
CREATE TABLE admin (
    admin_id     NUMBER(3)     CONSTRAINT pk_admin PRIMARY KEY,
    name         VARCHAR2(60)  NOT NULL,
    designation  VARCHAR2(60)
);
CREATE TABLE lostreport (
    lost_id      NUMBER(6)      CONSTRAINT pk_lost PRIMARY KEY,
    person_id    NUMBER(5)      NOT NULL,
    category_id  NUMBER(3)      NOT NULL,
    location_id  NUMBER(3)      NOT NULL,
    description  VARCHAR2(200)  NOT NULL,
    date_lost    DATE           DEFAULT SYSDATE NOT NULL,
    status       VARCHAR2(10)   DEFAULT 'Active' NOT NULL,
    CONSTRAINT fk_lost_person   FOREIGN KEY (person_id)
        REFERENCES person (person_id),
    CONSTRAINT fk_lost_category FOREIGN KEY (category_id)
        REFERENCES itemcategory (category_id),
    CONSTRAINT fk_lost_location FOREIGN KEY (location_id)
        REFERENCES campuslocation (location_id),
    CONSTRAINT ck_lost_status   CHECK (status IN ('Active','Matched','Closed'))
);
CREATE TABLE foundreport (
    found_id         NUMBER(6)      CONSTRAINT pk_found PRIMARY KEY,
    person_id        NUMBER(5)      NOT NULL,
    category_id      NUMBER(3)      NOT NULL,
    location_id      NUMBER(3)      NOT NULL,
    storage_location VARCHAR2(60),
    description      VARCHAR2(200)  NOT NULL,
    date_found       DATE           DEFAULT SYSDATE NOT NULL,
    status           VARCHAR2(10)   DEFAULT 'Unclaimed' NOT NULL,
    CONSTRAINT fk_found_person   FOREIGN KEY (person_id)
        REFERENCES person (person_id),
    CONSTRAINT fk_found_category FOREIGN KEY (category_id)
        REFERENCES itemcategory (category_id),
    CONSTRAINT fk_found_location FOREIGN KEY (location_id)
        REFERENCES campuslocation (location_id),
    CONSTRAINT ck_found_status   CHECK (status IN ('Unclaimed','Claimed','Returned'))
);
CREATE TABLE matchscore (
    match_id           NUMBER(6)  CONSTRAINT pk_match PRIMARY KEY,
    lost_id            NUMBER(6)  NOT NULL,
    found_id           NUMBER(6)  NOT NULL,
    category_score     NUMBER(3)  DEFAULT 0 NOT NULL,
    location_score     NUMBER(3)  DEFAULT 0 NOT NULL,
    date_score         NUMBER(3)  DEFAULT 0 NOT NULL,
    description_score  NUMBER(3)  DEFAULT 0 NOT NULL,
    total_score        NUMBER(3)  DEFAULT 0 NOT NULL,
    computed_date      DATE       DEFAULT SYSDATE,
    CONSTRAINT fk_match_lost  FOREIGN KEY (lost_id)
        REFERENCES lostreport (lost_id),
    CONSTRAINT fk_match_found FOREIGN KEY (found_id)
        REFERENCES foundreport (found_id),
    CONSTRAINT uq_match_pair  UNIQUE (lost_id, found_id),
    CONSTRAINT ck_match_total CHECK (total_score BETWEEN 0 AND 100)
);
CREATE TABLE claimrequest (
    claim_id            NUMBER(6)    CONSTRAINT pk_claim PRIMARY KEY,
    match_id            NUMBER(6)    NOT NULL,
    person_id           NUMBER(5)    NOT NULL,
    admin_id            NUMBER(3),
    claim_date          DATE         DEFAULT SYSDATE NOT NULL,
    verification_status VARCHAR2(10) DEFAULT 'Pending' NOT NULL,
    CONSTRAINT fk_claim_match  FOREIGN KEY (match_id)
        REFERENCES matchscore (match_id),
    CONSTRAINT fk_claim_person FOREIGN KEY (person_id)
        REFERENCES person (person_id),
    CONSTRAINT fk_claim_admin  FOREIGN KEY (admin_id)
        REFERENCES admin (admin_id),
    CONSTRAINT ck_claim_status CHECK
        (verification_status IN ('Pending','Verified','Rejected'))
);
CREATE SEQUENCE seq_person   START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_category START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_location START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_admin    START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_lost     START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_found    START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_match    START WITH 101 INCREMENT BY 1;
CREATE SEQUENCE seq_claim    START WITH 101 INCREMENT BY 1;`;

export const SQL_03_DML_TCL = `ALTER TABLE person ADD (address VARCHAR2(100));
ALTER TABLE person MODIFY (address VARCHAR2(150));
ALTER TABLE person DROP COLUMN address;
CREATE INDEX idx_lost_category  ON lostreport (category_id);
CREATE INDEX idx_found_category ON foundreport (category_id);
CREATE TABLE person_backup AS SELECT * FROM person;
TRUNCATE TABLE person_backup;
DROP TABLE person_backup;

INSERT INTO person (person_id, name, reg_no, phone, email)
VALUES (seq_person.NEXTVAL, 'Test Student', '23BCE1099', '9876599999',
        'test.student@college.edu');
SAVEPOINT after_insert;
UPDATE person SET phone = '9876511111' WHERE reg_no = '23BCE1099';
SAVEPOINT after_update;
DELETE FROM person WHERE reg_no = '23BCE1099';
SELECT COUNT(*) AS rows_found FROM person WHERE reg_no = '23BCE1099';
ROLLBACK TO SAVEPOINT after_update;
SELECT person_id, name, phone FROM person WHERE reg_no = '23BCE1099';
ROLLBACK TO SAVEPOINT after_insert;
SELECT person_id, name, phone FROM person WHERE reg_no = '23BCE1099';
COMMIT;
DELETE FROM person WHERE reg_no = '23BCE1099';
COMMIT;`;

export const SQL_04_PLSQL = `CREATE OR REPLACE FUNCTION keyword_overlap_score (
    p_desc1 IN VARCHAR2,
    p_desc2 IN VARCHAR2
) RETURN NUMBER IS
    v_word   VARCHAR2(50);
    v_pos    NUMBER := 1;
    v_common NUMBER := 0;
BEGIN
    LOOP
        v_word := LOWER(REGEXP_SUBSTR(p_desc1, '[A-Za-z0-9]+', 1, v_pos));
        EXIT WHEN v_word IS NULL;
        IF LENGTH(v_word) > 2
           AND v_word NOT IN ('the', 'and', 'with', 'near', 'for')
           AND INSTR(' ' || LOWER(p_desc2) || ' ', ' ' || v_word || ' ') > 0
        THEN
            v_common := v_common + 1;
        END IF;
        v_pos := v_pos + 1;
    END LOOP;
    RETURN LEAST(20, v_common * 5);
END keyword_overlap_score;
/
CREATE OR REPLACE FUNCTION date_proximity_score (
    p_date_lost  IN DATE,
    p_date_found IN DATE
) RETURN NUMBER IS
    v_days NUMBER;
BEGIN
    v_days := TRUNC(p_date_found) - TRUNC(p_date_lost);
    IF v_days < 0 THEN
        RETURN 0;
    ELSIF v_days <= 2 THEN
        RETURN 20;
    ELSIF v_days <= 7 THEN
        RETURN 12;
    ELSIF v_days <= 14 THEN
        RETURN 5;
    ELSE
        RETURN 0;
    END IF;
END date_proximity_score;
/
CREATE OR REPLACE PROCEDURE compute_match_score (
    p_lost_id  IN NUMBER,
    p_found_id IN NUMBER
) IS
    v_l_cat   lostreport.category_id%TYPE;
    v_l_loc   lostreport.location_id%TYPE;
    v_l_date  lostreport.date_lost%TYPE;
    v_l_desc  lostreport.description%TYPE;
    v_f_cat   foundreport.category_id%TYPE;
    v_f_loc   foundreport.location_id%TYPE;
    v_f_date  foundreport.date_found%TYPE;
    v_f_desc  foundreport.description%TYPE;
    v_cat     NUMBER := 0;
    v_loc     NUMBER := 0;
    v_dt      NUMBER := 0;
    v_ds      NUMBER := 0;
    v_total   NUMBER := 0;
BEGIN
    SELECT category_id, location_id, date_lost, description
      INTO v_l_cat, v_l_loc, v_l_date, v_l_desc
      FROM lostreport WHERE lost_id = p_lost_id;

    SELECT category_id, location_id, date_found, description
      INTO v_f_cat, v_f_loc, v_f_date, v_f_desc
      FROM foundreport WHERE found_id = p_found_id;

    IF v_l_cat <> v_f_cat THEN
        RAISE_APPLICATION_ERROR(-20001,
            'Different categories: this pair cannot be matched');
    END IF;

    v_cat := 40;
    IF v_l_loc = v_f_loc THEN
        v_loc := 20;
    END IF;
    v_dt    := date_proximity_score(v_l_date, v_f_date);
    v_ds    := keyword_overlap_score(v_l_desc, v_f_desc);
    v_total := v_cat + v_loc + v_dt + v_ds;

    MERGE INTO matchscore m
    USING (SELECT p_lost_id AS lid, p_found_id AS fid FROM dual) s
    ON (m.lost_id = s.lid AND m.found_id = s.fid)
    WHEN MATCHED THEN
        UPDATE SET m.category_score = v_cat, m.location_score = v_loc,
                   m.date_score = v_dt, m.description_score = v_ds,
                   m.total_score = v_total, m.computed_date = SYSDATE
    WHEN NOT MATCHED THEN
        INSERT (match_id, lost_id, found_id, category_score, location_score,
                date_score, description_score, total_score, computed_date)
        VALUES (seq_match.NEXTVAL, p_lost_id, p_found_id, v_cat, v_loc,
                v_dt, v_ds, v_total, SYSDATE);

    IF v_total >= 50 THEN
        UPDATE lostreport SET status = 'Matched'
         WHERE lost_id = p_lost_id AND status = 'Active';
    END IF;

    DBMS_OUTPUT.PUT_LINE('Lost ' || p_lost_id || ' vs Found ' || p_found_id
                         || ' => total score ' || v_total);
END compute_match_score;
/
CREATE OR REPLACE PROCEDURE run_all_matching IS
    CURSOR c_pairs IS
        SELECT l.lost_id, f.found_id
          FROM lostreport l
               JOIN foundreport f ON l.category_id = f.category_id
         WHERE l.status IN ('Active', 'Matched')
           AND f.status = 'Unclaimed'
         ORDER BY l.lost_id, f.found_id;
    v_lost   lostreport.lost_id%TYPE;
    v_found  foundreport.found_id%TYPE;
    v_count  NUMBER := 0;
BEGIN
    OPEN c_pairs;
    LOOP
        FETCH c_pairs INTO v_lost, v_found;
        EXIT WHEN c_pairs%NOTFOUND;
        compute_match_score(v_lost, v_found);
        v_count := v_count + 1;
    END LOOP;
    CLOSE c_pairs;
    DBMS_OUTPUT.PUT_LINE('Pairs evaluated: ' || v_count);
END run_all_matching;
/
CREATE OR REPLACE PROCEDURE verify_claim (
    p_claim_id IN NUMBER,
    p_admin_id IN NUMBER
) IS
    v_status claimrequest.verification_status%TYPE;
BEGIN
    SELECT verification_status INTO v_status
      FROM claimrequest WHERE claim_id = p_claim_id;

    IF v_status <> 'Pending' THEN
        RAISE_APPLICATION_ERROR(-20003, 'This claim was already processed');
    END IF;

    UPDATE claimrequest
       SET verification_status = 'Verified', admin_id = p_admin_id
     WHERE claim_id = p_claim_id;

    DBMS_OUTPUT.PUT_LINE('Claim ' || p_claim_id || ' verified by admin '
                         || p_admin_id);
END verify_claim;
/
CREATE OR REPLACE TRIGGER trg_block_low_score_claim
BEFORE INSERT ON claimrequest
FOR EACH ROW
DECLARE
    v_total matchscore.total_score%TYPE;
BEGIN
    SELECT total_score INTO v_total
      FROM matchscore WHERE match_id = :NEW.match_id;

    IF v_total < 50 THEN
        RAISE_APPLICATION_ERROR(-20002,
            'Claim blocked: match score is below the minimum of 50');
    END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_claim_verified
AFTER UPDATE OF verification_status ON claimrequest
FOR EACH ROW
WHEN (NEW.verification_status = 'Verified'
      AND OLD.verification_status <> 'Verified')
BEGIN
    UPDATE foundreport SET status = 'Claimed'
     WHERE found_id = (SELECT found_id FROM matchscore
                        WHERE match_id = :NEW.match_id);

    UPDATE lostreport SET status = 'Closed'
     WHERE lost_id = (SELECT lost_id FROM matchscore
                       WHERE match_id = :NEW.match_id);
END;
/`;

export const SQL_05_LAB_CYCLE = `-- Q1 Selection with WHERE and ORDER BY
SELECT lost_id, description, date_lost, status
FROM   lostreport
WHERE  status = 'Active'
ORDER BY date_lost;
-- Q2 Operators BETWEEN, LIKE, IN
SELECT lost_id, description, date_lost
FROM   lostreport
WHERE  date_lost BETWEEN DATE '2026-10-03' AND DATE '2026-10-08'
  AND  (description LIKE '%black%' OR category_id IN (1, 2))
ORDER BY date_lost;
-- Q3 Single-row character functions
SELECT person_id,
       UPPER(name)                         AS name_upper,
       LENGTH(name)                        AS name_length,
       SUBSTR(reg_no, 1, 2)                AS batch_code,
       REPLACE(email, '@college.edu', '')  AS username
FROM   person
ORDER BY person_id;
-- Q4 Date functions
SELECT lost_id,
       TO_CHAR(date_lost, 'DD-Mon-YYYY')            AS lost_on,
       TRUNC(SYSDATE) - date_lost                   AS days_open,
       ROUND(MONTHS_BETWEEN(SYSDATE, date_lost), 2) AS months_old,
       ADD_MONTHS(date_lost, 1)                     AS review_date
FROM   lostreport
ORDER BY lost_id;
-- Q5 CASE expression and numeric functions
SELECT match_id, total_score,
       ROUND(total_score / 100 * 5, 1) AS rating_out_of_5,
       CASE WHEN total_score >= 80 THEN 'Very likely'
            WHEN total_score >= 50 THEN 'Possible'
            ELSE 'Unlikely'
       END AS confidence
FROM   matchscore
ORDER BY total_score DESC;
-- Q6 NVL and DECODE
SELECT claim_id, verification_status,
       NVL(TO_CHAR(admin_id), 'Not assigned') AS reviewer,
       DECODE(verification_status, 'Verified', 'Handover ready',
                                   'Rejected', 'Closed',
                                   'Awaiting review') AS next_step
FROM   claimrequest
ORDER BY claim_id;
-- Q7 Aggregate functions
SELECT COUNT(*)                AS total_matches,
       ROUND(AVG(total_score), 2) AS avg_score,
       MAX(total_score)         AS best_score,
       MIN(total_score)         AS lowest_score
FROM   matchscore;
-- Q8 GROUP BY and HAVING
SELECT status, COUNT(*) AS item_count
FROM   foundreport
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY item_count DESC;
-- Q9 Inner join of four tables
SELECT l.lost_id, p.name AS owner, c.category_name, z.zone_name,
       l.description, l.status
FROM   lostreport l
       JOIN person p         ON l.person_id   = p.person_id
       JOIN itemcategory c   ON l.category_id = c.category_id
       JOIN campuslocation z ON l.location_id = z.location_id
ORDER BY l.lost_id;
-- Q10 Left outer join
SELECT c.category_id, c.category_name
FROM   itemcategory c
       LEFT JOIN lostreport l ON c.category_id = l.category_id
WHERE  l.lost_id IS NULL
ORDER BY c.category_id;
-- Q11 Self join on PERSON (owner and finder)
SELECT m.match_id, own.name AS owner, fin.name AS finder, m.total_score
FROM   matchscore m
       JOIN lostreport l   ON m.lost_id   = l.lost_id
       JOIN foundreport f  ON m.found_id  = f.found_id
       JOIN person own     ON l.person_id = own.person_id
       JOIN person fin     ON f.person_id = fin.person_id
WHERE  m.total_score >= 50
ORDER BY m.total_score DESC;
-- Q12 Single-row subquery
SELECT l.lost_id, l.description, m.total_score
FROM   matchscore m
       JOIN lostreport l ON m.lost_id = l.lost_id
WHERE  m.total_score > (SELECT AVG(total_score) FROM matchscore)
ORDER BY m.total_score DESC;
-- Q13 Set operation MINUS
SELECT p.person_id, p.name
FROM   person p
WHERE  p.person_id IN (SELECT person_id FROM foundreport
                       MINUS
                       SELECT person_id FROM claimrequest);
-- Q14 Set operation UNION
SELECT description, 'LOST' AS report_type, date_lost AS report_date
FROM   lostreport
WHERE  status = 'Active'
UNION
SELECT description, 'FOUND', date_found
FROM   foundreport
WHERE  status = 'Unclaimed' AND category_id IN (13, 15)
ORDER BY report_date;
-- Q15 View creation and use
CREATE OR REPLACE VIEW v_open_matches AS
SELECT m.match_id, l.description AS lost_item, f.description AS found_item,
       z.zone_name, m.total_score
FROM   matchscore m
       JOIN lostreport l     ON m.lost_id  = l.lost_id
       JOIN foundreport f    ON m.found_id = f.found_id
       JOIN campuslocation z ON f.location_id = z.location_id
WHERE  l.status = 'Matched' AND f.status = 'Unclaimed';

SELECT * FROM v_open_matches ORDER BY total_score DESC;`;

export const SQL_06_MODULE_QUERIES = `-- MODULE 1 - Lost and Found Reporting and Match Engine (Tejash Raj, 25BDE0062)
-- M1-1 INSERT: register a new lost report
INSERT INTO lostreport (lost_id, person_id, category_id, location_id,
                        description, date_lost)
VALUES (seq_lost.NEXTVAL, 12, 8, 6, 'blue parker pen box', DATE '2026-10-15');
-- M1-2 UPDATE: correct description and zone
UPDATE lostreport
SET    description = 'blue parker pen box with gold clip',
       location_id = 8
WHERE  description = 'blue parker pen box';
-- M1-3 DELETE: withdraw the report
DELETE FROM lostreport
WHERE  description LIKE 'blue parker pen box%' AND status = 'Active';
-- M1-4 SELECT (simple): unclaimed found items, newest first
SELECT found_id, description, storage_location, date_found
FROM   foundreport
WHERE  status = 'Unclaimed'
ORDER BY date_found DESC;
-- M1-5 SELECT (join): found items with category, zone and finder
SELECT f.found_id, c.category_name, z.zone_name, p.name AS finder,
       f.storage_location
FROM   foundreport f
       JOIN itemcategory c   ON f.category_id = c.category_id
       JOIN campuslocation z ON f.location_id = z.location_id
       JOIN person p         ON f.person_id   = p.person_id
ORDER BY f.found_id;
-- M1-6 SELECT (nested): zone(s) with the most lost reports
SELECT z.zone_name, COUNT(*) AS lost_total
FROM   lostreport l
       JOIN campuslocation z ON l.location_id = z.location_id
GROUP BY z.zone_name
HAVING COUNT(*) = (SELECT MAX(COUNT(*))
                   FROM   lostreport
                   GROUP BY location_id);
-- M1-7 SELECT (SQL functions): days since each open report was lost
SELECT l.lost_id, UPPER(c.category_name) AS category,
       TO_CHAR(l.date_lost, 'DD-Mon-YYYY')  AS lost_on,
       TRUNC(SYSDATE) - l.date_lost         AS days_since_lost
FROM   lostreport l
       JOIN itemcategory c ON l.category_id = c.category_id
WHERE  l.status IN ('Active', 'Matched')
ORDER BY days_since_lost DESC;
-- M1-8 SELECT (join): match score breakdown
SELECT m.match_id, l.description AS lost_item, f.description AS found_item,
       m.category_score, m.location_score, m.date_score,
       m.description_score, m.total_score
FROM   matchscore m
       JOIN lostreport l  ON m.lost_id  = l.lost_id
       JOIN foundreport f ON m.found_id = f.found_id
ORDER BY m.total_score DESC;
-- M1-9 SELECT (correlated nested): best match for every lost report
SELECT m.lost_id, m.found_id, m.total_score
FROM   matchscore m
WHERE  m.total_score = (SELECT MAX(m2.total_score)
                        FROM   matchscore m2
                        WHERE  m2.lost_id = m.lost_id)
ORDER BY m.lost_id;

-- MODULE 2 - Claims, Verification and Analytics (Soham Sharma, 25BDE0030)
-- M2-1 INSERT: raise a competing claim on match 2
INSERT INTO claimrequest (claim_id, match_id, person_id)
VALUES (seq_claim.NEXTVAL, 2, 12);
-- M2-2 UPDATE: admin rejects the competing claim
UPDATE claimrequest
SET    verification_status = 'Rejected', admin_id = 2
WHERE  match_id = 2 AND person_id = 12;
-- M2-3 DELETE: remove the rejected claim record
DELETE FROM claimrequest
WHERE  match_id = 2 AND person_id = 12;
-- M2-4 SELECT (simple): claims waiting for review
SELECT claim_id, match_id, person_id, claim_date
FROM   claimrequest
WHERE  verification_status = 'Pending'
ORDER BY claim_date;
-- M2-5 SELECT (join): claims with claimant and reviewing admin
SELECT cr.claim_id, p.name AS claimant, a.name AS reviewed_by,
       cr.verification_status
FROM   claimrequest cr
       JOIN person p     ON cr.person_id = p.person_id
       LEFT JOIN admin a ON cr.admin_id  = a.admin_id
ORDER BY cr.claim_id;
-- M2-6 SELECT (nested): admins who verified at least one claim
SELECT name, designation
FROM   admin
WHERE  admin_id IN (SELECT admin_id FROM claimrequest
                    WHERE  verification_status = 'Verified');
-- M2-7 SELECT (SQL functions): how long pending claims have waited
SELECT claim_id, TO_CHAR(claim_date, 'DD-Mon-YYYY') AS raised_on,
       TRUNC(SYSDATE) - claim_date                AS days_waiting,
       UPPER(verification_status)                 AS status
FROM   claimrequest
WHERE  verification_status = 'Pending'
ORDER BY days_waiting DESC;
-- M2-8 SELECT (aggregate): claims handled per admin
SELECT a.name, COUNT(cr.claim_id) AS claims_handled
FROM   admin a
       LEFT JOIN claimrequest cr ON a.admin_id = cr.admin_id
GROUP BY a.name
ORDER BY claims_handled DESC, a.name;
-- M2-9 SELECT (SQL functions): 60-day disposal rule
SELECT found_id, description,
       TRUNC(SYSDATE) - date_found AS days_stored,
       CASE WHEN TRUNC(SYSDATE) - date_found > 60
            THEN 'Dispose or donate' ELSE 'Keep' END AS action
FROM   foundreport
WHERE  status = 'Unclaimed'
ORDER BY days_stored DESC;
-- M2-10 SELECT (aggregate): recovery rate of found items
SELECT COUNT(*) AS total_found,
       SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) AS returned,
       ROUND(100 * SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END)
             / COUNT(*), 1) AS recovery_percent
FROM   foundreport;`;

export const SQL_07_TRANSACTIONS = `-- T1 Report a lost item
INSERT INTO lostreport (lost_id, person_id, category_id, location_id,
                        description, date_lost)
VALUES (seq_lost.NEXTVAL, 12, 13, 4, 'navy blue hoodie', DATE '2026-10-13');
COMMIT;
-- T2 Run automatic matching
SET SERVEROUTPUT ON;
EXEC run_all_matching;
-- T3 Claim blocked by trigger (score 45)
EXEC compute_match_score(1, 11);
INSERT INTO claimrequest (claim_id, match_id, person_id)
VALUES (seq_claim.NEXTVAL,
        (SELECT match_id FROM matchscore WHERE lost_id = 1 AND found_id = 11), 1);
-- T4 Verify a claim
EXEC verify_claim(2, 3);
COMMIT;`;

export const JDBC_SAMPLE_JAVA = `import java.sql.*;

public class FindItJdbcDemo {
    static final String URL  = "jdbc:oracle:thin:@localhost:1521:XE";
    static final String USER = "YOUR_USER";
    static final String PASS = "YOUR_PASSWORD";

    public static void main(String[] args) throws Exception {
        try (Connection con = DriverManager.getConnection(URL, USER, PASS)) {
            con.setAutoCommit(false);
            String ins = "INSERT INTO lostreport (lost_id, person_id, category_id, "
                       + "location_id, description, date_lost) "
                       + "VALUES (seq_lost.NEXTVAL, ?, ?, ?, ?, SYSDATE)";
            try (PreparedStatement ps = con.prepareStatement(ins)) {
                ps.setInt(1, 12); ps.setInt(2, 8); ps.setInt(3, 6);
                ps.setString(4, "blue parker pen box");
                ps.executeUpdate();
            }
            try (PreparedStatement ps = con.prepareStatement(
                    "UPDATE lostreport SET status = ? WHERE description = ?")) {
                ps.setString(1, "Closed"); ps.setString(2, "blue parker pen box");
                ps.executeUpdate();
            }
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT lost_id, description, status FROM lostreport "
                  + "WHERE description LIKE ?")) {
                ps.setString(1, "%pen%");
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next())
                        System.out.println(rs.getInt(1) + " | " + rs.getString(2)
                                           + " | " + rs.getString(3));
                }
            }
            try (PreparedStatement ps = con.prepareStatement(
                    "DELETE FROM lostreport WHERE description = ?")) {
                ps.setString(1, "blue parker pen box");
                ps.executeUpdate();
            }
            con.commit();
        }
    }
}`;
