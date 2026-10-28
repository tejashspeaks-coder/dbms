import { DatabaseState, TransactionExplainerData } from './types';

export interface QueryDefinition {
  id: string;
  group: 'M1' | 'M2' | 'LAB';
  title: string;
  description: string;
  sql: string;
  isDml?: boolean;
}

export interface QueryExecutionResult {
  columns: string[];
  rows: Record<string, string | number | null>[];
  rowCount: number;
  isDml: boolean;
  affectedMessage?: string;
  newState?: DatabaseState;
  explainer: TransactionExplainerData;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatOracleDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dd = String(d).padStart(2, '0');
  const mon = MONTHS_SHORT[m - 1] || 'Jan';
  return `${dd}-${mon}-${y}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDays(dateLater: string, dateEarlier: string): number {
  const [y1, m1, d1] = dateLater.split('-').map(Number);
  const [y2, m2, d2] = dateEarlier.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export function addOneMonth(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m, d)); // m is 1-based, so Date.UTC(y, m, d) is +1 month
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const rd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

export const MODULE_1_QUERIES: QueryDefinition[] = [
  {
    id: 'M1-1',
    group: 'M1',
    title: 'M1-1 INSERT: register a new lost report',
    description: 'Registers a new lost stationery report for Divya Reddy using seq_lost.NEXTVAL.',
    isDml: true,
    sql: `INSERT INTO lostreport (lost_id, person_id, category_id, location_id,
                        description, date_lost)
VALUES (seq_lost.NEXTVAL, 12, 8, 6, 'blue parker pen box', DATE '2026-10-15');`,
  },
  {
    id: 'M1-2',
    group: 'M1',
    title: 'M1-2 UPDATE: correct description and zone',
    description: 'Updates the lost pen box report with a more detailed description and CSE Department location.',
    isDml: true,
    sql: `UPDATE lostreport
SET    description = 'blue parker pen box with gold clip',
       location_id = 8
WHERE  description = 'blue parker pen box';`,
  },
  {
    id: 'M1-3',
    group: 'M1',
    title: 'M1-3 DELETE: withdraw the report',
    description: 'Withdraws (deletes) the active blue parker pen box lost report.',
    isDml: true,
    sql: `DELETE FROM lostreport
WHERE  description LIKE 'blue parker pen box%' AND status = 'Active';`,
  },
  {
    id: 'M1-4',
    group: 'M1',
    title: 'M1-4 SELECT (simple): unclaimed found items, newest first',
    description: 'Lists all unclaimed found items ordered by date_found descending.',
    sql: `SELECT found_id, description, storage_location, date_found
FROM   foundreport
WHERE  status = 'Unclaimed'
ORDER BY date_found DESC;`,
  },
  {
    id: 'M1-5',
    group: 'M1',
    title: 'M1-5 SELECT (join): found items with category, zone and finder',
    description: 'Joins foundreport with itemcategory, campuslocation, and person to show full finder details.',
    sql: `SELECT f.found_id, c.category_name, z.zone_name, p.name AS finder,
       f.storage_location
FROM   foundreport f
       JOIN itemcategory c   ON f.category_id = c.category_id
       JOIN campuslocation z ON f.location_id = z.location_id
       JOIN person p         ON f.person_id   = p.person_id
ORDER BY f.found_id;`,
  },
  {
    id: 'M1-6',
    group: 'M1',
    title: 'M1-6 SELECT (nested): zone(s) with the most lost reports',
    description: 'Uses a nested aggregate subquery in HAVING to find the campus zone(s) with the highest lost count.',
    sql: `SELECT z.zone_name, COUNT(*) AS lost_total
FROM   lostreport l
       JOIN campuslocation z ON l.location_id = z.location_id
GROUP BY z.zone_name
HAVING COUNT(*) = (SELECT MAX(COUNT(*))
                   FROM   lostreport
                   GROUP BY location_id);`,
  },
  {
    id: 'M1-7',
    group: 'M1',
    title: 'M1-7 SELECT (SQL functions): days since each open report was lost',
    description: 'Computes days open using TRUNC(SYSDATE) - date_lost and formats category in uppercase.',
    sql: `SELECT l.lost_id, UPPER(c.category_name) AS category,
       TO_CHAR(l.date_lost, 'DD-Mon-YYYY')  AS lost_on,
       TRUNC(SYSDATE) - l.date_lost         AS days_since_lost
FROM   lostreport l
       JOIN itemcategory c ON l.category_id = c.category_id
WHERE  l.status IN ('Active', 'Matched')
ORDER BY days_since_lost DESC;`,
  },
  {
    id: 'M1-8',
    group: 'M1',
    title: 'M1-8 SELECT (join): match score breakdown',
    description: 'Joins matchscore with lostreport and foundreport to display all sub-scores and total score.',
    sql: `SELECT m.match_id, l.description AS lost_item, f.description AS found_item,
       m.category_score, m.location_score, m.date_score,
       m.description_score, m.total_score
FROM   matchscore m
       JOIN lostreport l  ON m.lost_id  = l.lost_id
       JOIN foundreport f ON m.found_id = f.found_id
ORDER BY m.total_score DESC;`,
  },
  {
    id: 'M1-9',
    group: 'M1',
    title: 'M1-9 SELECT (correlated nested): best match for every lost report',
    description: 'Uses a correlated subquery to retrieve the highest-scoring match for each lost report.',
    sql: `SELECT m.lost_id, m.found_id, m.total_score
FROM   matchscore m
WHERE  m.total_score = (SELECT MAX(m2.total_score)
                        FROM   matchscore m2
                        WHERE  m2.lost_id = m.lost_id)
ORDER BY m.lost_id;`,
  },
];

export const MODULE_2_QUERIES: QueryDefinition[] = [
  {
    id: 'M2-1',
    group: 'M2',
    title: 'M2-1 INSERT: raise a competing claim on match 2',
    description: 'Inserts a competing claim request on match 2 by person 12 (Divya Reddy).',
    isDml: true,
    sql: `INSERT INTO claimrequest (claim_id, match_id, person_id)
VALUES (seq_claim.NEXTVAL, 2, 12);`,
  },
  {
    id: 'M2-2',
    group: 'M2',
    title: 'M2-2 UPDATE: admin rejects the competing claim',
    description: 'Admin 2 (Kavitha S) marks the competing claim on match 2 by person 12 as Rejected.',
    isDml: true,
    sql: `UPDATE claimrequest
SET    verification_status = 'Rejected', admin_id = 2
WHERE  match_id = 2 AND person_id = 12;`,
  },
  {
    id: 'M2-3',
    group: 'M2',
    title: 'M2-3 DELETE: remove the rejected claim record',
    description: 'Deletes the rejected competing claim record for match 2 and person 12.',
    isDml: true,
    sql: `DELETE FROM claimrequest
WHERE  match_id = 2 AND person_id = 12;`,
  },
  {
    id: 'M2-4',
    group: 'M2',
    title: 'M2-4 SELECT (simple): claims waiting for review',
    description: 'Selects all Pending claim requests ordered by claim_date.',
    sql: `SELECT claim_id, match_id, person_id, claim_date
FROM   claimrequest
WHERE  verification_status = 'Pending'
ORDER BY claim_date;`,
  },
  {
    id: 'M2-5',
    group: 'M2',
    title: 'M2-5 SELECT (join): claims with claimant and reviewing admin',
    description: 'Uses an inner join on person and left join on admin to list all claims and their reviewers.',
    sql: `SELECT cr.claim_id, p.name AS claimant, a.name AS reviewed_by,
       cr.verification_status
FROM   claimrequest cr
       JOIN person p     ON cr.person_id = p.person_id
       LEFT JOIN admin a ON cr.admin_id  = a.admin_id
ORDER BY cr.claim_id;`,
  },
  {
    id: 'M2-6',
    group: 'M2',
    title: 'M2-6 SELECT (nested): admins who verified at least one claim',
    description: 'Finds admins whose admin_id appears in Verified claim requests.',
    sql: `SELECT name, designation
FROM   admin
WHERE  admin_id IN (SELECT admin_id FROM claimrequest
                    WHERE  verification_status = 'Verified');`,
  },
  {
    id: 'M2-7',
    group: 'M2',
    title: 'M2-7 SELECT (SQL functions): how long pending claims have waited',
    description: 'Calculates waiting days for pending claims using TRUNC(SYSDATE) - claim_date.',
    sql: `SELECT claim_id, TO_CHAR(claim_date, 'DD-Mon-YYYY') AS raised_on,
       TRUNC(SYSDATE) - claim_date                AS days_waiting,
       UPPER(verification_status)                 AS status
FROM   claimrequest
WHERE  verification_status = 'Pending'
ORDER BY days_waiting DESC;`,
  },
  {
    id: 'M2-8',
    group: 'M2',
    title: 'M2-8 SELECT (aggregate): claims handled per admin',
    description: 'Left joins admin with claimrequest and counts claims handled per administrator.',
    sql: `SELECT a.name, COUNT(cr.claim_id) AS claims_handled
FROM   admin a
       LEFT JOIN claimrequest cr ON a.admin_id = cr.admin_id
GROUP BY a.name
ORDER BY claims_handled DESC, a.name;`,
  },
  {
    id: 'M2-9',
    group: 'M2',
    title: 'M2-9 SELECT (SQL functions): 60-day disposal rule',
    description: 'Flags unclaimed items stored for more than 60 days as "Dispose or donate", else "Keep".',
    sql: `SELECT found_id, description,
       TRUNC(SYSDATE) - date_found AS days_stored,
       CASE WHEN TRUNC(SYSDATE) - date_found > 60
            THEN 'Dispose or donate' ELSE 'Keep' END AS action
FROM   foundreport
WHERE  status = 'Unclaimed'
ORDER BY days_stored DESC;`,
  },
  {
    id: 'M2-10',
    group: 'M2',
    title: 'M2-10 SELECT (aggregate): recovery rate of found items',
    description: 'Calculates total found items, returned count, and overall recovery percentage.',
    sql: `SELECT COUNT(*) AS total_found,
       SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) AS returned,
       ROUND(100 * SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END)
             / COUNT(*), 1) AS recovery_percent
FROM   foundreport;`,
  },
];

export const LAB_CYCLE_QUERIES: QueryDefinition[] = [
  {
    id: 'Q1',
    group: 'LAB',
    title: 'Q1 Selection with WHERE and ORDER BY',
    description: 'Retrieves all Active lost reports ordered chronologically by date_lost.',
    sql: `SELECT lost_id, description, date_lost, status
FROM   lostreport
WHERE  status = 'Active'
ORDER BY date_lost;`,
  },
  {
    id: 'Q2',
    group: 'LAB',
    title: 'Q2 Operators BETWEEN, LIKE, IN',
    description: 'Filters lost reports between 2026-10-03 and 2026-10-08 matching "%black%" or categories 1, 2.',
    sql: `SELECT lost_id, description, date_lost
FROM   lostreport
WHERE  date_lost BETWEEN DATE '2026-10-03' AND DATE '2026-10-08'
  AND  (description LIKE '%black%' OR category_id IN (1, 2))
ORDER BY date_lost;`,
  },
  {
    id: 'Q3',
    group: 'LAB',
    title: 'Q3 Single-row character functions',
    description: 'Applies UPPER, LENGTH, SUBSTR, and REPLACE to person records.',
    sql: `SELECT person_id,
       UPPER(name)                         AS name_upper,
       LENGTH(name)                        AS name_length,
       SUBSTR(reg_no, 1, 2)                AS batch_code,
       REPLACE(email, '@college.edu', '')  AS username
FROM   person
ORDER BY person_id;`,
  },
  {
    id: 'Q4',
    group: 'LAB',
    title: 'Q4 Date functions',
    description: 'Demonstrates TO_CHAR, TRUNC(SYSDATE) - date_lost, MONTHS_BETWEEN, and ADD_MONTHS.',
    sql: `SELECT lost_id,
       TO_CHAR(date_lost, 'DD-Mon-YYYY')            AS lost_on,
       TRUNC(SYSDATE) - date_lost                   AS days_open,
       ROUND(MONTHS_BETWEEN(SYSDATE, date_lost), 2) AS months_old,
       ADD_MONTHS(date_lost, 1)                     AS review_date
FROM   lostreport
ORDER BY lost_id;`,
  },
  {
    id: 'Q5',
    group: 'LAB',
    title: 'Q5 CASE expression and numeric functions',
    description: 'Converts match total_score to a 5-point rating and classifies confidence level using CASE.',
    sql: `SELECT match_id, total_score,
       ROUND(total_score / 100 * 5, 1) AS rating_out_of_5,
       CASE WHEN total_score >= 80 THEN 'Very likely'
            WHEN total_score >= 50 THEN 'Possible'
            ELSE 'Unlikely'
       END AS confidence
FROM   matchscore
ORDER BY total_score DESC;`,
  },
  {
    id: 'Q6',
    group: 'LAB',
    title: 'Q6 NVL and DECODE',
    description: 'Replaces NULL admin_id with "Not assigned" and maps verification_status to next_step.',
    sql: `SELECT claim_id, verification_status,
       NVL(TO_CHAR(admin_id), 'Not assigned') AS reviewer,
       DECODE(verification_status, 'Verified', 'Handover ready',
                                   'Rejected', 'Closed',
                                   'Awaiting review') AS next_step
FROM   claimrequest
ORDER BY claim_id;`,
  },
  {
    id: 'Q7',
    group: 'LAB',
    title: 'Q7 Aggregate functions',
    description: 'Computes COUNT, ROUND(AVG), MAX, and MIN across all matchscore rows.',
    sql: `SELECT COUNT(*)                AS total_matches,
       ROUND(AVG(total_score), 2) AS avg_score,
       MAX(total_score)         AS best_score,
       MIN(total_score)         AS lowest_score
FROM   matchscore;`,
  },
  {
    id: 'Q8',
    group: 'LAB',
    title: 'Q8 GROUP BY and HAVING',
    description: 'Groups found reports by status and keeps statuses with more than 1 item.',
    sql: `SELECT status, COUNT(*) AS item_count
FROM   foundreport
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY item_count DESC;`,
  },
  {
    id: 'Q9',
    group: 'LAB',
    title: 'Q9 Inner join of four tables',
    description: 'Joins lostreport, person, itemcategory, and campuslocation for full report context.',
    sql: `SELECT l.lost_id, p.name AS owner, c.category_name, z.zone_name,
       l.description, l.status
FROM   lostreport l
       JOIN person p         ON l.person_id   = p.person_id
       JOIN itemcategory c   ON l.category_id = c.category_id
       JOIN campuslocation z ON l.location_id = z.location_id
ORDER BY l.lost_id;`,
  },
  {
    id: 'Q10',
    group: 'LAB',
    title: 'Q10 Left outer join',
    description: 'Finds item categories that currently have zero lost reports.',
    sql: `SELECT c.category_id, c.category_name
FROM   itemcategory c
       LEFT JOIN lostreport l ON c.category_id = l.category_id
WHERE  l.lost_id IS NULL
ORDER BY c.category_id;`,
  },
  {
    id: 'Q11',
    group: 'LAB',
    title: 'Q11 Self join on PERSON (owner and finder)',
    description: 'Joins person twice (as owner and as finder) for matches scoring 50 or above.',
    sql: `SELECT m.match_id, own.name AS owner, fin.name AS finder, m.total_score
FROM   matchscore m
       JOIN lostreport l   ON m.lost_id   = l.lost_id
       JOIN foundreport f  ON m.found_id  = f.found_id
       JOIN person own     ON l.person_id = own.person_id
       JOIN person fin     ON f.person_id = fin.person_id
WHERE  m.total_score >= 50
ORDER BY m.total_score DESC;`,
  },
  {
    id: 'Q12',
    group: 'LAB',
    title: 'Q12 Single-row subquery',
    description: 'Selects matches whose total_score exceeds the average match score.',
    sql: `SELECT l.lost_id, l.description, m.total_score
FROM   matchscore m
       JOIN lostreport l ON m.lost_id = l.lost_id
WHERE  m.total_score > (SELECT AVG(total_score) FROM matchscore)
ORDER BY m.total_score DESC;`,
  },
  {
    id: 'Q13',
    group: 'LAB',
    title: 'Q13 Set operation MINUS',
    description: 'Finds people who have reported found items but have never raised a claim request.',
    sql: `SELECT p.person_id, p.name
FROM   person p
WHERE  p.person_id IN (SELECT person_id FROM foundreport
                       MINUS
                       SELECT person_id FROM claimrequest);`,
  },
  {
    id: 'Q14',
    group: 'LAB',
    title: 'Q14 Set operation UNION',
    description: 'Combines active lost reports with unclaimed found reports in categories 13 and 15.',
    sql: `SELECT description, 'LOST' AS report_type, date_lost AS report_date
FROM   lostreport
WHERE  status = 'Active'
UNION
SELECT description, 'FOUND', date_found
FROM   foundreport
WHERE  status = 'Unclaimed' AND category_id IN (13, 15)
ORDER BY report_date;`,
  },
  {
    id: 'Q15',
    group: 'LAB',
    title: 'Q15 View creation and use',
    description: 'Creates view v_open_matches for Matched lost items vs Unclaimed found items and queries it.',
    sql: `CREATE OR REPLACE VIEW v_open_matches AS
SELECT m.match_id, l.description AS lost_item, f.description AS found_item,
       z.zone_name, m.total_score
FROM   matchscore m
       JOIN lostreport l     ON m.lost_id  = l.lost_id
       JOIN foundreport f    ON m.found_id = f.found_id
       JOIN campuslocation z ON f.location_id = z.location_id
WHERE  l.status = 'Matched' AND f.status = 'Unclaimed';

SELECT * FROM v_open_matches ORDER BY total_score DESC;`,
  },
];

export const ALL_QUERIES: QueryDefinition[] = [
  ...MODULE_1_QUERIES,
  ...MODULE_2_QUERIES,
  ...LAB_CYCLE_QUERIES,
];

export function executeRegisteredQuery(
  queryId: string,
  state: DatabaseState
): QueryExecutionResult {
  const qDef = ALL_QUERIES.find((q) => q.id === queryId);
  const sysdate = getTodayDateStr();
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const makeExplainer = (
    op: string,
    tables: string[],
    comp: string,
    changed: string,
    res: string,
    sql: string
  ): TransactionExplainerData => ({
    id: `${queryId}-${Date.now()}`,
    timestamp: ts,
    userOperation: op,
    tablesAffected: tables,
    sqlComponent: comp,
    rowsChanged: changed,
    resultProduced: res,
    rawSql: sql,
  });

  const sql = qDef?.sql || '';

  switch (queryId) {
    // ================= MODULE 1 =================
    case 'M1-1': {
      const nextId = state.sequences.lostreport;
      const newRow = {
        lost_id: nextId,
        person_id: 12,
        category_id: 8,
        location_id: 6,
        description: 'blue parker pen box',
        date_lost: '2026-10-15',
        status: 'Active' as const,
      };
      const newState: DatabaseState = {
        ...state,
        lostreport: [...state.lostreport, newRow],
        sequences: { ...state.sequences, lostreport: nextId + 1 },
      };
      return {
        columns: ['lost_id', 'person_id', 'category_id', 'location_id', 'description', 'date_lost', 'status'],
        rows: [newRow],
        rowCount: 1,
        isDml: true,
        affectedMessage: '1 row(s) affected',
        newState,
        explainer: makeExplainer(
          'Execute M1-1 INSERT lostreport',
          ['LOSTREPORT'],
          'SQL INSERT with seq_lost.NEXTVAL',
          `1 row inserted into LOSTREPORT (lost_id = ${nextId})`,
          'Registered lost report "blue parker pen box"',
          sql
        ),
      };
    }

    case 'M1-2': {
      let count = 0;
      const updated = state.lostreport.map((r) => {
        if (r.description === 'blue parker pen box') {
          count++;
          return {
            ...r,
            description: 'blue parker pen box with gold clip',
            location_id: 8,
          };
        }
        return r;
      });
      const affectedRows = updated.filter((r) => r.description === 'blue parker pen box with gold clip');
      const newState: DatabaseState = { ...state, lostreport: updated };
      return {
        columns: ['lost_id', 'description', 'location_id', 'status'],
        rows: affectedRows.map((r) => ({
          lost_id: r.lost_id,
          description: r.description,
          location_id: r.location_id,
          status: r.status,
        })),
        rowCount: count,
        isDml: true,
        affectedMessage: `${count} row(s) affected`,
        newState,
        explainer: makeExplainer(
          'Execute M1-2 UPDATE lostreport',
          ['LOSTREPORT'],
          'SQL UPDATE statement',
          `${count} row(s) updated in LOSTREPORT`,
          count > 0 ? 'Updated description and zone to CSE Department (8)' : 'No matching row with description "blue parker pen box" (run M1-1 first)',
          sql
        ),
      };
    }

    case 'M1-3': {
      let count = 0;
      const remaining = state.lostreport.filter((r) => {
        if (r.description.startsWith('blue parker pen box') && r.status === 'Active') {
          count++;
          return false;
        }
        return true;
      });
      const newState: DatabaseState = { ...state, lostreport: remaining };
      return {
        columns: ['result'],
        rows: [{ result: `${count} row(s) deleted from LOSTREPORT` }],
        rowCount: count,
        isDml: true,
        affectedMessage: `${count} row(s) affected`,
        newState,
        explainer: makeExplainer(
          'Execute M1-3 DELETE lostreport',
          ['LOSTREPORT'],
          'SQL DELETE statement',
          `${count} row(s) deleted from LOSTREPORT`,
          'Withdrew active lost report for "blue parker pen box%"',
          sql
        ),
      };
    }

    case 'M1-4': {
      const rows = state.foundreport
        .filter((f) => f.status === 'Unclaimed')
        .sort((a, b) => b.date_found.localeCompare(a.date_found) || a.found_id - b.found_id)
        .map((f) => ({
          found_id: f.found_id,
          description: f.description,
          storage_location: f.storage_location,
          date_found: f.date_found,
        }));
      return {
        columns: ['found_id', 'description', 'storage_location', 'date_found'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-4 SELECT unclaimed found items', ['FOUNDREPORT'], 'SQL SELECT / WHERE / ORDER BY', '0 rows changed (read-only)', `${rows.length} unclaimed found items returned`, sql),
      };
    }

    case 'M1-5': {
      const rows = [...state.foundreport]
        .sort((a, b) => a.found_id - b.found_id)
        .map((f) => {
          const cat = state.itemcategory.find((c) => c.category_id === f.category_id);
          const loc = state.campuslocation.find((l) => l.location_id === f.location_id);
          const per = state.person.find((p) => p.person_id === f.person_id);
          return {
            found_id: f.found_id,
            category_name: cat?.category_name || '',
            zone_name: loc?.zone_name || '',
            finder: per?.name || '',
            storage_location: f.storage_location,
          };
        });
      return {
        columns: ['found_id', 'category_name', 'zone_name', 'finder', 'storage_location'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-5 Multi-table JOIN on foundreport', ['FOUNDREPORT', 'ITEMCATEGORY', 'CAMPUSLOCATION', 'PERSON'], 'SQL 4-table INNER JOIN', '0 rows changed (read-only)', `${rows.length} joined rows returned`, sql),
      };
    }

    case 'M1-6': {
      const countsByLoc = new Map<number, number>();
      for (const l of state.lostreport) {
        countsByLoc.set(l.location_id, (countsByLoc.get(l.location_id) || 0) + 1);
      }
      const maxCount = countsByLoc.size > 0 ? Math.max(...Array.from(countsByLoc.values())) : 0;
      const rows: Record<string, string | number>[] = [];
      countsByLoc.forEach((cnt, locId) => {
        if (cnt === maxCount && maxCount > 0) {
          const z = state.campuslocation.find((loc) => loc.location_id === locId);
          if (z) {
            rows.push({ zone_name: z.zone_name, lost_total: cnt });
          }
        }
      });
      return {
        columns: ['zone_name', 'lost_total'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-6 Nested Aggregate Query', ['LOSTREPORT', 'CAMPUSLOCATION'], 'SQL GROUP BY / HAVING MAX(COUNT(*))', '0 rows changed (read-only)', `${rows.length} top zone(s) returned with ${maxCount} reports`, sql),
      };
    }

    case 'M1-7': {
      const rows = state.lostreport
        .filter((l) => l.status === 'Active' || l.status === 'Matched')
        .map((l) => {
          const cat = state.itemcategory.find((c) => c.category_id === l.category_id);
          return {
            lost_id: l.lost_id,
            category: (cat?.category_name || '').toUpperCase(),
            lost_on: formatOracleDate(l.date_lost),
            days_since_lost: diffDays(sysdate, l.date_lost),
          };
        })
        .sort((a, b) => b.days_since_lost - a.days_since_lost || a.lost_id - b.lost_id);
      return {
        columns: ['lost_id', 'category', 'lost_on', 'days_since_lost'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-7 SQL Date & Character Functions', ['LOSTREPORT', 'ITEMCATEGORY'], 'SQL UPPER, TO_CHAR, TRUNC(SYSDATE)', '0 rows changed (read-only)', `${rows.length} open reports evaluated against SYSDATE (${sysdate})`, sql),
      };
    }

    case 'M1-8': {
      const rows = [...state.matchscore]
        .sort((a, b) => b.total_score - a.total_score || a.match_id - b.match_id)
        .map((m) => {
          const l = state.lostreport.find((lr) => lr.lost_id === m.lost_id);
          const f = state.foundreport.find((fr) => fr.found_id === m.found_id);
          return {
            match_id: m.match_id,
            lost_item: l?.description || '',
            found_item: f?.description || '',
            category_score: m.category_score,
            location_score: m.location_score,
            date_score: m.date_score,
            description_score: m.description_score,
            total_score: m.total_score,
          };
        });
      return {
        columns: ['match_id', 'lost_item', 'found_item', 'category_score', 'location_score', 'date_score', 'description_score', 'total_score'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-8 Match Score Breakdown JOIN', ['MATCHSCORE', 'LOSTREPORT', 'FOUNDREPORT'], 'SQL INNER JOIN with ORDER BY total_score DESC', '0 rows changed (read-only)', `${rows.length} match score breakdowns returned`, sql),
      };
    }

    case 'M1-9': {
      const rows = [...state.matchscore]
        .filter((m) => {
          const sameLost = state.matchscore.filter((m2) => m2.lost_id === m.lost_id);
          const maxScore = Math.max(...sameLost.map((x) => x.total_score));
          return m.total_score === maxScore;
        })
        .sort((a, b) => a.lost_id - b.lost_id)
        .map((m) => ({
          lost_id: m.lost_id,
          found_id: m.found_id,
          total_score: m.total_score,
        }));
      return {
        columns: ['lost_id', 'found_id', 'total_score'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M1-9 Correlated Subquery (Best Match)', ['MATCHSCORE'], 'SQL Correlated Subquery MAX(m2.total_score)', '0 rows changed (read-only)', `${rows.length} best match rows returned`, sql),
      };
    }

    // ================= MODULE 2 =================
    case 'M2-1': {
      const nextId = state.sequences.claimrequest;
      const newClaim = {
        claim_id: nextId,
        match_id: 2,
        person_id: 12,
        admin_id: null,
        claim_date: sysdate,
        verification_status: 'Pending' as const,
      };
      const newState: DatabaseState = {
        ...state,
        claimrequest: [...state.claimrequest, newClaim],
        sequences: { ...state.sequences, claimrequest: nextId + 1 },
      };
      return {
        columns: ['claim_id', 'match_id', 'person_id', 'admin_id', 'claim_date', 'verification_status'],
        rows: [newClaim],
        rowCount: 1,
        isDml: true,
        affectedMessage: '1 row(s) affected',
        newState,
        explainer: makeExplainer(
          'Execute M2-1 INSERT competing claim on match 2',
          ['CLAIMREQUEST', 'MATCHSCORE'],
          'SQL INSERT + trg_block_low_score_claim (passed: score 72 >= 50)',
          `1 row inserted into CLAIMREQUEST (claim_id = ${nextId})`,
          'Competing claim raised on match 2 by person 12',
          sql
        ),
      };
    }

    case 'M2-2': {
      let count = 0;
      const updated = state.claimrequest.map((c) => {
        if (c.match_id === 2 && c.person_id === 12) {
          count++;
          return { ...c, verification_status: 'Rejected' as const, admin_id: 2 };
        }
        return c;
      });
      const affected = updated.filter((c) => c.match_id === 2 && c.person_id === 12);
      const newState: DatabaseState = { ...state, claimrequest: updated };
      return {
        columns: ['claim_id', 'match_id', 'person_id', 'admin_id', 'verification_status'],
        rows: affected.map((c) => ({
          claim_id: c.claim_id,
          match_id: c.match_id,
          person_id: c.person_id,
          admin_id: c.admin_id,
          verification_status: c.verification_status,
        })),
        rowCount: count,
        isDml: true,
        affectedMessage: `${count} row(s) affected`,
        newState,
        explainer: makeExplainer(
          'Execute M2-2 UPDATE reject competing claim',
          ['CLAIMREQUEST'],
          'SQL UPDATE statement',
          `${count} row(s) updated in CLAIMREQUEST`,
          count > 0 ? 'Competing claim marked Rejected by admin 2' : 'No matching claim for match_id=2 and person_id=12 (run M2-1 first)',
          sql
        ),
      };
    }

    case 'M2-3': {
      let count = 0;
      const remaining = state.claimrequest.filter((c) => {
        if (c.match_id === 2 && c.person_id === 12) {
          count++;
          return false;
        }
        return true;
      });
      const newState: DatabaseState = { ...state, claimrequest: remaining };
      return {
        columns: ['result'],
        rows: [{ result: `${count} row(s) deleted from CLAIMREQUEST` }],
        rowCount: count,
        isDml: true,
        affectedMessage: `${count} row(s) affected`,
        newState,
        explainer: makeExplainer(
          'Execute M2-3 DELETE rejected competing claim',
          ['CLAIMREQUEST'],
          'SQL DELETE statement',
          `${count} row(s) deleted from CLAIMREQUEST`,
          'Removed competing claim record for match 2 and person 12',
          sql
        ),
      };
    }

    case 'M2-4': {
      const rows = state.claimrequest
        .filter((c) => c.verification_status === 'Pending')
        .sort((a, b) => a.claim_date.localeCompare(b.claim_date) || a.claim_id - b.claim_id)
        .map((c) => ({
          claim_id: c.claim_id,
          match_id: c.match_id,
          person_id: c.person_id,
          claim_date: c.claim_date,
        }));
      return {
        columns: ['claim_id', 'match_id', 'person_id', 'claim_date'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-4 Pending Claims SELECT', ['CLAIMREQUEST'], 'SQL SELECT / WHERE / ORDER BY', '0 rows changed (read-only)', `${rows.length} pending claims returned`, sql),
      };
    }

    case 'M2-5': {
      const rows = [...state.claimrequest]
        .sort((a, b) => a.claim_id - b.claim_id)
        .map((cr) => {
          const p = state.person.find((per) => per.person_id === cr.person_id);
          const a = cr.admin_id ? state.admin.find((adm) => adm.admin_id === cr.admin_id) : null;
          return {
            claim_id: cr.claim_id,
            claimant: p?.name || '',
            reviewed_by: a?.name || null,
            verification_status: cr.verification_status,
          };
        });
      return {
        columns: ['claim_id', 'claimant', 'reviewed_by', 'verification_status'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-5 Claims with Claimant and Admin', ['CLAIMREQUEST', 'PERSON', 'ADMIN'], 'SQL JOIN + LEFT JOIN', '0 rows changed (read-only)', `${rows.length} claim records returned`, sql),
      };
    }

    case 'M2-6': {
      const verifiedAdminIds = new Set(
        state.claimrequest
          .filter((c) => c.verification_status === 'Verified' && c.admin_id !== null)
          .map((c) => c.admin_id as number)
      );
      const rows = state.admin
        .filter((a) => verifiedAdminIds.has(a.admin_id))
        .map((a) => ({
          name: a.name,
          designation: a.designation,
        }));
      return {
        columns: ['name', 'designation'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-6 Admins who verified claims', ['ADMIN', 'CLAIMREQUEST'], 'SQL IN Subquery', '0 rows changed (read-only)', `${rows.length} admins returned`, sql),
      };
    }

    case 'M2-7': {
      const rows = state.claimrequest
        .filter((c) => c.verification_status === 'Pending')
        .map((c) => ({
          claim_id: c.claim_id,
          raised_on: formatOracleDate(c.claim_date),
          days_waiting: diffDays(sysdate, c.claim_date),
          status: c.verification_status.toUpperCase(),
        }))
        .sort((a, b) => b.days_waiting - a.days_waiting || a.claim_id - b.claim_id);
      return {
        columns: ['claim_id', 'raised_on', 'days_waiting', 'status'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-7 Pending Claims Waiting Days', ['CLAIMREQUEST'], 'SQL TO_CHAR, TRUNC(SYSDATE), UPPER', '0 rows changed (read-only)', `${rows.length} pending claims evaluated`, sql),
      };
    }

    case 'M2-8': {
      const rows = state.admin
        .map((a) => {
          const cnt = state.claimrequest.filter((c) => c.admin_id === a.admin_id).length;
          return {
            name: a.name,
            claims_handled: cnt,
          };
        })
        .sort((a, b) => b.claims_handled - a.claims_handled || a.name.localeCompare(b.name));
      return {
        columns: ['name', 'claims_handled'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-8 Claims Handled per Admin', ['ADMIN', 'CLAIMREQUEST'], 'SQL LEFT JOIN + GROUP BY + COUNT', '0 rows changed (read-only)', `${rows.length} admin rows aggregated`, sql),
      };
    }

    case 'M2-9': {
      const rows = state.foundreport
        .filter((f) => f.status === 'Unclaimed')
        .map((f) => {
          const days = diffDays(sysdate, f.date_found);
          return {
            found_id: f.found_id,
            description: f.description,
            days_stored: days,
            action: days > 60 ? 'Dispose or donate' : 'Keep',
          };
        })
        .sort((a, b) => b.days_stored - a.days_stored || a.found_id - b.found_id);
      return {
        columns: ['found_id', 'description', 'days_stored', 'action'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run M2-9 60-Day Disposal Rule Check', ['FOUNDREPORT'], 'SQL CASE WHEN TRUNC(SYSDATE) - date_found > 60', '0 rows changed (read-only)', `${rows.length} unclaimed items checked for 60-day threshold`, sql),
      };
    }

    case 'M2-10': {
      const total = state.foundreport.length;
      const returned = state.foundreport.filter((f) => f.status === 'Returned').length;
      const pct = total > 0 ? Math.round((100 * returned * 10) / total) / 10 : 0;
      const rows = [{ total_found: total, returned, recovery_percent: pct }];
      return {
        columns: ['total_found', 'returned', 'recovery_percent'],
        rows,
        rowCount: 1,
        isDml: false,
        explainer: makeExplainer('Run M2-10 Recovery Rate Analytics', ['FOUNDREPORT'], 'SQL COUNT, SUM(CASE), ROUND', '0 rows changed (read-only)', `Recovery rate: ${pct}% (${returned} of ${total} items returned)`, sql),
      };
    }

    // ================= LAB CYCLE QUERIES Q1-Q15 =================
    case 'Q1': {
      const rows = state.lostreport
        .filter((l) => l.status === 'Active')
        .sort((a, b) => a.date_lost.localeCompare(b.date_lost) || a.lost_id - b.lost_id)
        .map((l) => ({
          lost_id: l.lost_id,
          description: l.description,
          date_lost: l.date_lost,
          status: l.status,
        }));
      return {
        columns: ['lost_id', 'description', 'date_lost', 'status'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q1 Selection with WHERE and ORDER BY', ['LOSTREPORT'], 'SQL SELECT / WHERE / ORDER BY', '0 rows changed (read-only)', `${rows.length} active lost reports returned`, sql),
      };
    }

    case 'Q2': {
      const rows = state.lostreport
        .filter(
          (l) =>
            l.date_lost >= '2026-10-03' &&
            l.date_lost <= '2026-10-08' &&
            (l.description.toLowerCase().includes('black') || [1, 2].includes(l.category_id))
        )
        .sort((a, b) => a.date_lost.localeCompare(b.date_lost) || a.lost_id - b.lost_id)
        .map((l) => ({
          lost_id: l.lost_id,
          description: l.description,
          date_lost: l.date_lost,
        }));
      return {
        columns: ['lost_id', 'description', 'date_lost'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q2 BETWEEN, LIKE, IN Operators', ['LOSTREPORT'], 'SQL BETWEEN / LIKE / IN', '0 rows changed (read-only)', `${rows.length} matching lost reports returned`, sql),
      };
    }

    case 'Q3': {
      const rows = [...state.person]
        .sort((a, b) => a.person_id - b.person_id)
        .map((p) => ({
          person_id: p.person_id,
          name_upper: p.name.toUpperCase(),
          name_length: p.name.length,
          batch_code: p.reg_no.substring(0, 2),
          username: p.email.replace('@college.edu', ''),
        }));
      return {
        columns: ['person_id', 'name_upper', 'name_length', 'batch_code', 'username'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q3 Single-row Character Functions', ['PERSON'], 'SQL UPPER, LENGTH, SUBSTR, REPLACE', '0 rows changed (read-only)', `${rows.length} person rows transformed`, sql),
      };
    }

    case 'Q4': {
      const rows = [...state.lostreport]
        .sort((a, b) => a.lost_id - b.lost_id)
        .map((l) => {
          const daysOpen = diffDays(sysdate, l.date_lost);
          const monthsOld = Math.round((daysOpen / 30.4375) * 100) / 100;
          return {
            lost_id: l.lost_id,
            lost_on: formatOracleDate(l.date_lost),
            days_open: daysOpen,
            months_old: monthsOld,
            review_date: addOneMonth(l.date_lost),
          };
        });
      return {
        columns: ['lost_id', 'lost_on', 'days_open', 'months_old', 'review_date'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q4 Date Functions', ['LOSTREPORT'], 'SQL TO_CHAR, TRUNC, MONTHS_BETWEEN, ADD_MONTHS', '0 rows changed (read-only)', `${rows.length} date calculations returned`, sql),
      };
    }

    case 'Q5': {
      const rows = [...state.matchscore]
        .sort((a, b) => b.total_score - a.total_score || a.match_id - b.match_id)
        .map((m) => ({
          match_id: m.match_id,
          total_score: m.total_score,
          rating_out_of_5: Math.round((m.total_score / 100) * 5 * 10) / 10,
          confidence: m.total_score >= 80 ? 'Very likely' : m.total_score >= 50 ? 'Possible' : 'Unlikely',
        }));
      return {
        columns: ['match_id', 'total_score', 'rating_out_of_5', 'confidence'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q5 CASE Expression and Numeric Functions', ['MATCHSCORE'], 'SQL ROUND and CASE WHEN', '0 rows changed (read-only)', `${rows.length} scored matches classified`, sql),
      };
    }

    case 'Q6': {
      const rows = [...state.claimrequest]
        .sort((a, b) => a.claim_id - b.claim_id)
        .map((c) => ({
          claim_id: c.claim_id,
          verification_status: c.verification_status,
          reviewer: c.admin_id !== null ? String(c.admin_id) : 'Not assigned',
          next_step:
            c.verification_status === 'Verified'
              ? 'Handover ready'
              : c.verification_status === 'Rejected'
              ? 'Closed'
              : 'Awaiting review',
        }));
      return {
        columns: ['claim_id', 'verification_status', 'reviewer', 'next_step'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q6 NVL and DECODE', ['CLAIMREQUEST'], 'SQL NVL and DECODE', '0 rows changed (read-only)', `${rows.length} claim statuses decoded`, sql),
      };
    }

    case 'Q7': {
      const total = state.matchscore.length;
      const scores = state.matchscore.map((m) => m.total_score);
      const avg = total > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / total) * 100) / 100 : 0;
      const best = total > 0 ? Math.max(...scores) : 0;
      const lowest = total > 0 ? Math.min(...scores) : 0;
      return {
        columns: ['total_matches', 'avg_score', 'best_score', 'lowest_score'],
        rows: [{ total_matches: total, avg_score: avg, best_score: best, lowest_score: lowest }],
        rowCount: 1,
        isDml: false,
        explainer: makeExplainer('Run Q7 Aggregate Functions', ['MATCHSCORE'], 'SQL COUNT, AVG, MAX, MIN', '0 rows changed (read-only)', `Aggregated ${total} match scores`, sql),
      };
    }

    case 'Q8': {
      const counts: Record<string, number> = {};
      for (const f of state.foundreport) {
        counts[f.status] = (counts[f.status] || 0) + 1;
      }
      const rows = Object.entries(counts)
        .filter(([, cnt]) => cnt > 1)
        .sort((a, b) => b[1] - a[1])
        .map(([status, item_count]) => ({ status, item_count }));
      return {
        columns: ['status', 'item_count'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q8 GROUP BY and HAVING', ['FOUNDREPORT'], 'SQL GROUP BY status HAVING COUNT(*) > 1', '0 rows changed (read-only)', `${rows.length} status groups returned`, sql),
      };
    }

    case 'Q9': {
      const rows = [...state.lostreport]
        .sort((a, b) => a.lost_id - b.lost_id)
        .map((l) => {
          const p = state.person.find((per) => per.person_id === l.person_id);
          const c = state.itemcategory.find((cat) => cat.category_id === l.category_id);
          const z = state.campuslocation.find((loc) => loc.location_id === l.location_id);
          return {
            lost_id: l.lost_id,
            owner: p?.name || '',
            category_name: c?.category_name || '',
            zone_name: z?.zone_name || '',
            description: l.description,
            status: l.status,
          };
        });
      return {
        columns: ['lost_id', 'owner', 'category_name', 'zone_name', 'description', 'status'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q9 Inner Join of Four Tables', ['LOSTREPORT', 'PERSON', 'ITEMCATEGORY', 'CAMPUSLOCATION'], 'SQL 4-Table INNER JOIN', '0 rows changed (read-only)', `${rows.length} joined lost reports returned`, sql),
      };
    }

    case 'Q10': {
      const usedCatIds = new Set(state.lostreport.map((l) => l.category_id));
      const rows = state.itemcategory
        .filter((c) => !usedCatIds.has(c.category_id))
        .sort((a, b) => a.category_id - b.category_id)
        .map((c) => ({
          category_id: c.category_id,
          category_name: c.category_name,
        }));
      return {
        columns: ['category_id', 'category_name'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q10 Left Outer Join', ['ITEMCATEGORY', 'LOSTREPORT'], 'SQL LEFT JOIN ... WHERE l.lost_id IS NULL', '0 rows changed (read-only)', `${rows.length} categories with no lost reports`, sql),
      };
    }

    case 'Q11': {
      const rows = state.matchscore
        .filter((m) => m.total_score >= 50)
        .sort((a, b) => b.total_score - a.total_score || a.match_id - b.match_id)
        .map((m) => {
          const l = state.lostreport.find((lr) => lr.lost_id === m.lost_id);
          const f = state.foundreport.find((fr) => fr.found_id === m.found_id);
          const own = state.person.find((p) => p.person_id === l?.person_id);
          const fin = state.person.find((p) => p.person_id === f?.person_id);
          return {
            match_id: m.match_id,
            owner: own?.name || '',
            finder: fin?.name || '',
            total_score: m.total_score,
          };
        });
      return {
        columns: ['match_id', 'owner', 'finder', 'total_score'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q11 Self Join on PERSON (Owner and Finder)', ['MATCHSCORE', 'LOSTREPORT', 'FOUNDREPORT', 'PERSON'], 'SQL Self-Join on PERSON (own & fin)', '0 rows changed (read-only)', `${rows.length} owner-finder pairs returned`, sql),
      };
    }

    case 'Q12': {
      const avg =
        state.matchscore.length > 0
          ? state.matchscore.reduce((acc, m) => acc + m.total_score, 0) / state.matchscore.length
          : 0;
      const rows = state.matchscore
        .filter((m) => m.total_score > avg)
        .sort((a, b) => b.total_score - a.total_score || a.match_id - b.match_id)
        .map((m) => {
          const l = state.lostreport.find((lr) => lr.lost_id === m.lost_id);
          return {
            lost_id: m.lost_id,
            description: l?.description || '',
            total_score: m.total_score,
          };
        });
      return {
        columns: ['lost_id', 'description', 'total_score'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q12 Single-Row Subquery', ['MATCHSCORE', 'LOSTREPORT'], `SQL Subquery > AVG(total_score) (${avg.toFixed(1)})`, '0 rows changed (read-only)', `${rows.length} above-average matches returned`, sql),
      };
    }

    case 'Q13': {
      const finderIds = new Set(state.foundreport.map((f) => f.person_id));
      const claimantIds = new Set(state.claimrequest.map((c) => c.person_id));
      const rows = state.person
        .filter((p) => finderIds.has(p.person_id) && !claimantIds.has(p.person_id))
        .sort((a, b) => a.person_id - b.person_id)
        .map((p) => ({
          person_id: p.person_id,
          name: p.name,
        }));
      return {
        columns: ['person_id', 'name'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q13 Set Operation MINUS', ['PERSON', 'FOUNDREPORT', 'CLAIMREQUEST'], 'SQL MINUS Set Operator', '0 rows changed (read-only)', `${rows.length} finders who never raised a claim`, sql),
      };
    }

    case 'Q14': {
      const part1 = state.lostreport
        .filter((l) => l.status === 'Active')
        .map((l) => ({
          description: l.description,
          report_type: 'LOST',
          report_date: l.date_lost,
        }));
      const part2 = state.foundreport
        .filter((f) => f.status === 'Unclaimed' && [13, 15].includes(f.category_id))
        .map((f) => ({
          description: f.description,
          report_type: 'FOUND',
          report_date: f.date_found,
        }));
      const seen = new Set<string>();
      const combined = [...part1, ...part2].filter((r) => {
        const key = `${r.description}|${r.report_type}|${r.report_date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      combined.sort((a, b) => a.report_date.localeCompare(b.report_date) || a.description.localeCompare(b.description));
      return {
        columns: ['description', 'report_type', 'report_date'],
        rows: combined,
        rowCount: combined.length,
        isDml: false,
        explainer: makeExplainer('Run Q14 Set Operation UNION', ['LOSTREPORT', 'FOUNDREPORT'], 'SQL UNION Set Operator', '0 rows changed (read-only)', `${combined.length} combined rows returned`, sql),
      };
    }

    case 'Q15': {
      const rows = state.matchscore
        .filter((m) => {
          const l = state.lostreport.find((lr) => lr.lost_id === m.lost_id);
          const f = state.foundreport.find((fr) => fr.found_id === m.found_id);
          return l?.status === 'Matched' && f?.status === 'Unclaimed';
        })
        .sort((a, b) => b.total_score - a.total_score || a.match_id - b.match_id)
        .map((m) => {
          const l = state.lostreport.find((lr) => lr.lost_id === m.lost_id);
          const f = state.foundreport.find((fr) => fr.found_id === m.found_id);
          const z = state.campuslocation.find((loc) => loc.location_id === f?.location_id);
          return {
            match_id: m.match_id,
            lost_item: l?.description || '',
            found_item: f?.description || '',
            zone_name: z?.zone_name || '',
            total_score: m.total_score,
          };
        });
      return {
        columns: ['match_id', 'lost_item', 'found_item', 'zone_name', 'total_score'],
        rows,
        rowCount: rows.length,
        isDml: false,
        explainer: makeExplainer('Run Q15 View v_open_matches', ['MATCHSCORE', 'LOSTREPORT', 'FOUNDREPORT', 'CAMPUSLOCATION'], 'SQL CREATE OR REPLACE VIEW v_open_matches + SELECT', '0 rows changed (view queried)', `${rows.length} open match rows from v_open_matches`, sql),
      };
    }

    default:
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        isDml: false,
        explainer: makeExplainer('Unknown Query', [], 'SQL', '0 rows', 'No output', sql),
      };
  }
}
