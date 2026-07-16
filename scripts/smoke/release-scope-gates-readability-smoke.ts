import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const scopeGatePath = 'docs/product/release-scope-gates.md';
const source = fs.readFileSync(path.join(projectRoot, scopeGatePath), 'utf8');

const requiredReadableTerms = [
  '이 문서는 investModel을',
  'Readability And Scope Invariants',
  'Universal Blockers',
  'Prototype Gate',
  'Internal Alpha Gate',
  'Closed Beta Gate',
  'Public Launch Gate',
  '실제 입금',
  '실제 주문',
  '계좌 연결',
  '법률 판단',
  '비밀값',
  '외부 유료 API 키',
  'financial_operation',
  '모바일/Capacitor-first',
  'MockDeposit',
  'TradeIntent',
];

const mojibakePatterns = [
  /�/,
  /臾몄꽌/,
  /湲곕뒫/,
  /紐⑤뜽/,
  /寃/,
  /湲덉/,
  /\?\?[가-힣A-Za-z]/,
];

for (const term of requiredReadableTerms) {
  assert(
    source.includes(term),
    `${scopeGatePath} is missing readable policy term: ${term}`
  );
}

for (const pattern of mojibakePatterns) {
  assert(
    !pattern.test(source),
    `${scopeGatePath} contains likely mojibake pattern: ${pattern}`
  );
}

const stageOrder = [
  '## Prototype Gate',
  '## Internal Alpha Gate',
  '## Closed Beta Gate',
  '## Public Launch Gate',
];

let previousIndex = -1;
for (const heading of stageOrder) {
  const currentIndex = source.indexOf(heading);
  assert(currentIndex > previousIndex, `${heading} is out of order or missing`);
  previousIndex = currentIndex;
}

console.log(
  'Release scope gates readability smoke passed: UTF-8 Korean policy text and stage boundaries are readable.'
);

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
