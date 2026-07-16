/**
 * Focused sheet-schema smoke for BK-535.
 * It freezes the BK-512-BK-535 planning slice so future Backlog rows keep
 * dependency, ownership, checkpoint, and commit bookkeeping rules intact.
 */
import { readFileSync } from 'fs';
import path from 'path';

type BacklogRow = {
  id: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: string;
  area: string;
  title: string;
  detail: string;
  dependencies: string;
  requiredHarness: string;
  assignedAgent: string;
  acceptanceCriteria: string;
  riskFlag: string;
  notes: string;
  issueIds: string;
  commitHash: string;
  createdAt: string;
  startedAt: string;
  completedAt: string;
};

const sheetColumns: Array<keyof BacklogRow> = [
  'id',
  'status',
  'priority',
  'area',
  'title',
  'detail',
  'dependencies',
  'requiredHarness',
  'assignedAgent',
  'acceptanceCriteria',
  'riskFlag',
  'notes',
  'issueIds',
  'commitHash',
  'createdAt',
  'startedAt',
  'completedAt',
];

const rows: BacklogRow[] = [
  row('BK-512', 'done', 'database', 'Signal explainer seed/read-model contract', '', 'database;domain-contract;risk-compliance', 'database-engineer', '완료: mock seed/read-model 기반 signal explainer companion row.', 'IS-004', '18e4f61'),
  row('BK-513', 'done', 'api', 'Signal explainer read-only API guard', 'BK-512', 'backend;risk-compliance;domain-contract', 'backend-developer', '완료: read-only mock API guard companion row.', 'IS-004', '18e4f61'),
  row('BK-514', 'done', 'ui', 'Signal explainer mobile card', 'BK-512;BK-513', 'frontend;design;risk-compliance', 'frontend-developer', '완료: simulated safety copy and mobile card companion row.', 'IS-004', '18e4f61'),
  row('BK-515', 'done', 'qa', 'Signal explainer 390px smoke', 'BK-514', 'frontend;automation', 'qa-tester', '완료: 390px visual/source smoke companion row.', '', '18e4f61'),
  row('BK-516', 'done', 'database', 'Feed topic cluster seed/read-model contract', '', 'database;domain-contract;risk-compliance', 'database-engineer', '완료: mock seed/read-model topic cluster companion row.', 'IS-004', '3ab2479'),
  row('BK-517', 'done', 'api', 'Feed topic cluster read-only API guard', 'BK-516', 'backend;risk-compliance;domain-contract', 'backend-developer', '완료: read-only topic cluster API guard companion row.', 'IS-004', '3ab2479'),
  row('BK-518', 'done', 'ui', 'Feed topic cluster mobile rail', 'BK-516;BK-517', 'frontend;design;risk-compliance', 'frontend-developer', '완료: mobile cluster rail companion row.', 'IS-004', '3ab2479'),
  row('BK-519', 'done', 'qa', 'Feed topic cluster 390px smoke', 'BK-518', 'frontend;automation', 'qa-tester', '완료: 390px topic cluster smoke companion row.', '', '3ab2479'),
  row('BK-520', 'done', 'ops', 'Server reachability checkpoint 520', 'BK-519', 'automation;frontend', 'qa-tester', '완료: localhost HTTP 200, LAN 확인은 IS-008 제약으로 미실행, sheet-only no file changes.', 'IS-008', ''),
  row('BK-521', 'done', 'database', 'Model review calendar seed/read-model contract', '', 'database;domain-contract;risk-compliance', 'database-engineer', '완료: mock review calendar seed/read-model companion row.', 'IS-004', 'b8a9c75'),
  row('BK-522', 'done', 'api', 'Model review calendar read-only API guard', 'BK-521', 'backend;risk-compliance;domain-contract', 'backend-developer', '완료: read-only review event API guard companion row.', 'IS-004', 'b8a9c75'),
  row('BK-523', 'done', 'ui', 'Model review calendar mobile strip', 'BK-521;BK-522', 'frontend;design;risk-compliance', 'frontend-developer', '완료: mobile review strip companion row.', 'IS-004', 'b8a9c75'),
  row('BK-524', 'done', 'qa', 'Model review calendar 390px smoke', 'BK-523', 'frontend;automation', 'qa-tester', '완료: 390px calendar strip smoke companion row.', '', 'b8a9c75'),
  row('BK-525', 'done', 'database', 'Interest/save state seed/read-model contract', '', 'database;domain-contract;risk-compliance', 'database-engineer', '완료: mock interest/save state seed/read-model companion row.', 'IS-004', '91d1a86'),
  row('BK-526', 'done', 'api', 'Interest/save state read-only API guard', 'BK-525', 'backend;risk-compliance;domain-contract', 'backend-developer', '완료: read-only interest/save state API guard companion row.', 'IS-004', '91d1a86'),
  row('BK-527', 'done', 'ui', 'Interest/save state mobile rail', 'BK-525;BK-526', 'frontend;design;risk-compliance', 'frontend-developer', '완료: mobile interest/save state rail companion row.', 'IS-004', '91d1a86'),
  row('BK-528', 'done', 'qa', 'Interest/save state 390px smoke', 'BK-527', 'frontend;automation', 'qa-tester', '완료: 390px interest/save smoke companion row.', '', '91d1a86'),
  row('BK-529', 'done', 'database', 'Search suggestion seed/read-model contract', '', 'database;domain-contract;risk-compliance', 'database-engineer', '완료: mock search suggestion seed/read-model companion row.', 'IS-004', '3f5c298'),
  row('BK-530', 'done', 'ops', 'Server reachability checkpoint 530', 'BK-529', 'automation;frontend', 'qa-tester', '완료: localhost HTTP 200, LAN 확인은 IS-008 제약으로 미실행, sheet-only no file changes.', 'IS-008', ''),
  row('BK-531', 'done', 'api', 'Search suggestion read-only API guard', 'BK-529', 'backend;risk-compliance;domain-contract', 'backend-developer', '완료: read-only search suggestion API guard companion row.', 'IS-004', '3f5c298'),
  row('BK-532', 'done', 'ui', 'Search suggestion mobile chips', 'BK-529;BK-531', 'frontend;design;risk-compliance', 'frontend-developer', '완료: mobile search suggestion chips companion row.', 'IS-004', '3f5c298'),
  row('BK-533', 'done', 'qa', 'Search suggestion 390px smoke', 'BK-532', 'frontend;automation', 'qa-tester', '완료: 390px search suggestion smoke companion row.', '', '3f5c298'),
  row('BK-534', 'done', 'docs', 'Design sample companion backlog mapping', 'BK-512;BK-533', 'automation;design;frontend;product', 'project-recorder', '완료: docs/design-sample-ui-patterns.md에 companion mapping과 planning rules 기록.', '', 'e6070f5'),
  row('BK-535', 'in_progress', 'automation', 'Backlog dependency/schema audit smoke', 'BK-512;BK-534', 'automation;core;database;frontend', 'project-recorder', '진행 중: BK-512~BK-534 행 규칙을 고정하는 local audit smoke와 package script를 추가한다.', '', ''),
];

const dependencyPattern = /^BK-\d+(;BK-\d+)*$/;
const ids = new Set(rows.map((row) => row.id));

function row(
  id: string,
  status: BacklogRow['status'],
  area: string,
  title: string,
  dependencies: string,
  requiredHarness: string,
  assignedAgent: string,
  notes: string,
  issueIds: string,
  commitHash: string,
): BacklogRow {
  return {
    id,
    status,
    priority: area === 'automation' ? 'P3' : 'P1',
    area,
    title,
    detail: `${title} Backlog schema fixture.`,
    dependencies,
    requiredHarness,
    assignedAgent,
    acceptanceCriteria: 'Local audit smoke keeps sheet row contracts explicit.',
    riskFlag: issueIds.includes('IS-004') ? 'mock-only' : '',
    notes,
    issueIds,
    commitHash,
    createdAt: '2026-07-16T00:00:00+09:00',
    startedAt: status === 'todo' ? '' : '2026-07-16T00:00:00+09:00',
    completedAt: status === 'done' ? '2026-07-16T00:00:00+09:00' : '',
  };
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(haystack: string, needle: string, label: string): void {
  assertCondition(haystack.includes(needle), `${label} should include ${needle}`);
}

function projectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

function assertSchemaShape(): void {
  assertCondition(sheetColumns.length === 17, 'Backlog schema should keep 17 columns');
  for (const backlogRow of rows) {
    const values = sheetColumns.map((key) => backlogRow[key]);
    assertCondition(values.length === 17, `${backlogRow.id} should serialize to 17 columns`);
    assertCondition(/^BK-\d+$/.test(backlogRow.id), `${backlogRow.id} should use BK numeric id`);
    assertCondition(Boolean(backlogRow.assignedAgent), `${backlogRow.id} should have assigned_agent`);
    assertCondition(Boolean(backlogRow.requiredHarness), `${backlogRow.id} should have required_harness`);
    assertCondition(Boolean(backlogRow.notes), `${backlogRow.id} should have Korean notes when selected or completed`);
  }
}

function assertDependencyRules(): void {
  for (const backlogRow of rows) {
    if (backlogRow.dependencies) {
      assertCondition(dependencyPattern.test(backlogRow.dependencies), `${backlogRow.id} dependencies should be id-only semicolon values`);
      for (const dependency of backlogRow.dependencies.split(';')) {
        assertCondition(ids.has(dependency), `${backlogRow.id} dependency ${dependency} should exist in the audited slice`);
        assertCondition(dependency !== backlogRow.id, `${backlogRow.id} should not depend on itself`);
      }
    }
  }

  assertCondition(rowById('BK-534').dependencies === 'BK-512;BK-533', 'BK-534 should close the implemented companion mapping range');
  assertCondition(rowById('BK-535').dependencies === 'BK-512;BK-534', 'BK-535 should depend only on implemented audit anchors');
}

function assertCommitRules(): void {
  for (const backlogRow of rows) {
    if (backlogRow.status === 'done' && backlogRow.commitHash === '') {
      assertCondition(backlogRow.title.includes('Server reachability checkpoint'), `${backlogRow.id} blank commit_hash should be sheet-only checkpoint`);
      assertCondition(/sheet-only|no file changes/.test(backlogRow.notes), `${backlogRow.id} sheet-only checkpoint should explain blank commit_hash`);
    }

    if (backlogRow.status !== 'done') {
      assertCondition(backlogRow.commitHash === '', `${backlogRow.id} active/todo row should keep commit_hash blank`);
      assertCondition(backlogRow.completedAt === '', `${backlogRow.id} active/todo row should keep completed_at blank`);
    }
  }
}

function assertServerCheckpointRules(): void {
  for (const backlogRow of rows) {
    const number = Number(backlogRow.id.replace('BK-', ''));
    if (number % 10 === 0) {
      assertCondition(backlogRow.title.includes('Server reachability checkpoint'), `${backlogRow.id} should be a server checkpoint`);
      assertIncludes(backlogRow.notes, 'localhost', `${backlogRow.id} notes`);
      assertIncludes(backlogRow.notes, 'LAN', `${backlogRow.id} notes`);
      assertIncludes(backlogRow.issueIds, 'IS-008', `${backlogRow.id} issue_ids`);
      assertCondition(backlogRow.commitHash === '', `${backlogRow.id} should stay sheet-only when no files changed`);
    }
  }
}

function assertCompanionChains(): void {
  const chains = [
    ['BK-512', 'BK-513', 'BK-514', 'BK-515'],
    ['BK-516', 'BK-517', 'BK-518', 'BK-519'],
    ['BK-521', 'BK-522', 'BK-523', 'BK-524'],
    ['BK-525', 'BK-526', 'BK-527', 'BK-528'],
    ['BK-529', 'BK-531', 'BK-532', 'BK-533'],
  ];

  for (const [databaseId, apiId, uiId, smokeId] of chains) {
    assertCondition(rowById(databaseId).requiredHarness.includes('database'), `${databaseId} should cover database/read-model work`);
    assertCondition(rowById(apiId).requiredHarness.includes('backend'), `${apiId} should cover backend/API guard work`);
    assertCondition(rowById(uiId).requiredHarness.includes('frontend'), `${uiId} should cover UI work`);
    assertCondition(rowById(smokeId).requiredHarness.includes('automation'), `${smokeId} should cover smoke work`);
    assertCondition(rowById(apiId).dependencies.includes(databaseId), `${apiId} should depend on its database row`);
    assertCondition(rowById(uiId).dependencies.includes(databaseId) && rowById(uiId).dependencies.includes(apiId), `${uiId} should depend on data and API rows`);
    assertCondition(rowById(smokeId).dependencies.includes(uiId), `${smokeId} should depend on its UI row`);
  }
}

function assertDocsAndPackageScript(): void {
  const packageJson = projectFile('package.json');
  const designPatterns = projectFile('docs', 'design-sample-ui-patterns.md');

  assertIncludes(packageJson, '"test:backlog-schema-audit"', 'package.json scripts');
  assertIncludes(packageJson, 'scripts/qa/backlog-dependency-schema-audit-smoke.ts', 'package.json scripts');
  assertIncludes(designPatterns, 'Implemented Companion Mapping BK-512-BK-533', 'design sample patterns');
  assertIncludes(designPatterns, 'Signal explainer', 'design sample patterns');
  assertIncludes(designPatterns, 'Search suggestion chips', 'design sample patterns');
  assertIncludes(designPatterns, 'future rows do not become frontend-only tasks', 'design sample planning rules');
  assertIncludes(designPatterns, 'dependencies with id-only semicolon values', 'design sample planning rules');
}

function rowById(id: string): BacklogRow {
  const backlogRow = rows.find((candidate) => candidate.id === id);
  assertCondition(backlogRow, `${id} should exist`);
  return backlogRow;
}

assertSchemaShape();
assertDependencyRules();
assertCommitRules();
assertServerCheckpointRules();
assertCompanionChains();
assertDocsAndPackageScript();

console.log('PASS backlog dependency/schema audit smoke');
