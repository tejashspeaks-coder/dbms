export type RoleType = 'Student' | 'Admin' | 'Developer';

export type PersonRole = 'Student' | 'Staff';
export type LostStatus = 'Active' | 'Matched' | 'Closed';
export type FoundStatus = 'Unclaimed' | 'Claimed' | 'Returned';
export type ClaimStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Person {
  person_id: number;
  name: string;
  reg_no: string;
  phone: string;
  email: string;
  role: PersonRole;
}

export interface ItemCategory {
  category_id: number;
  category_name: string;
}

export interface CampusLocation {
  location_id: number;
  zone_name: string;
}

export interface Admin {
  admin_id: number;
  name: string;
  designation: string;
}

export interface LostReport {
  lost_id: number;
  person_id: number;
  category_id: number;
  location_id: number;
  description: string;
  date_lost: string; // YYYY-MM-DD
  status: LostStatus;
}

export interface FoundReport {
  found_id: number;
  person_id: number; // finder
  category_id: number;
  location_id: number;
  storage_location: string;
  description: string;
  date_found: string; // YYYY-MM-DD
  status: FoundStatus;
}

export interface MatchScore {
  match_id: number;
  lost_id: number;
  found_id: number;
  category_score: number;
  location_score: number;
  date_score: number;
  description_score: number;
  total_score: number;
  computed_date: string; // YYYY-MM-DD
}

export interface ClaimRequest {
  claim_id: number;
  match_id: number;
  person_id: number;
  admin_id: number | null;
  claim_date: string; // YYYY-MM-DD
  verification_status: ClaimStatus;
  rejection_reason?: string;
}

export type TableName =
  | 'person'
  | 'itemcategory'
  | 'campuslocation'
  | 'admin'
  | 'lostreport'
  | 'foundreport'
  | 'matchscore'
  | 'claimrequest';

export interface Sequences {
  person: number;
  itemcategory: number;
  campuslocation: number;
  admin: number;
  lostreport: number;
  foundreport: number;
  matchscore: number;
  claimrequest: number;
}

export interface AppNotification {
  id: string;
  person_id?: number; // relevant student/staff if applicable
  message: string;
  timestamp: string;
  read: boolean;
  type: 'match' | 'claim' | 'verified' | 'handover' | 'system';
  refId?: string;
}

export interface TransactionExplainerData {
  id: string;
  timestamp: string;
  userOperation: string;
  tablesAffected: string[];
  sqlComponent: string;
  rowsChanged: string;
  resultProduced: string;
  rawSql: string;
}

export interface ReportFormDraft {
  mode: 'lost' | 'found' | null;
  step: 1 | 2 | 3 | 4; // 4 = review
  category_id: number | null;
  description: string;
  location_id: number | null;
  date_str: string;
  date_preset: 'today' | 'yesterday' | 'custom' | null;
  storage_location: string;
  person_mode: 'existing' | 'new';
  person_id: number | null;
  new_name: string;
  new_reg_no: string;
  new_phone: string;
  new_email: string;
  new_role: PersonRole;
  extra_details: string;
  show_extra: boolean;
}

export interface DatabaseState {
  person: Person[];
  itemcategory: ItemCategory[];
  campuslocation: CampusLocation[];
  admin: Admin[];
  lostreport: LostReport[];
  foundreport: FoundReport[];
  matchscore: MatchScore[];
  claimrequest: ClaimRequest[];
  sequences: Sequences;
}

export interface DataLayerInterface {
  getAll: <T extends TableName>(table: T) => Promise<DatabaseState[T]>;
  insert: <T extends TableName>(table: T, row: DatabaseState[T][number]) => Promise<DatabaseState[T][number]>;
  update: <T extends TableName>(table: T, pkValue: number, patch: Partial<DatabaseState[T][number]>) => Promise<DatabaseState[T][number]>;
  remove: <T extends TableName>(table: T, pkValue: number) => Promise<void>;
}
