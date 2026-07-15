/**
 * Verifies investModel client screens do not send userPublicId to protected
 * user-scoped APIs. The server owns user scope resolution through session or
 * prototype fallback helpers.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

type Violation = {
  file: string;
  line: number;
  snippet: string;
};

const projectRoot = process.cwd();
const scanRoots = ['app/invest-model', 'components/invest-model'];
const apiScanRoots = ['app/api'];
const protectedApiPattern =
  /\/api\/(?:my|portfolio|notifications|model-selections|feed)\b/;

function listSourceFiles(root: string): string[] {
  const absoluteRoot = path.join(projectRoot, root);
  const entries = readdirSync(absoluteRoot);
  const files: string[] = [];

  for (const entry of entries) {
    const absoluteEntry = path.join(absoluteRoot, entry);
    const relativeEntry = path.relative(projectRoot, absoluteEntry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      files.push(...listSourceFiles(relativeEntry));
      continue;
    }

    if (/\.(?:ts|tsx)$/.test(entry)) {
      files.push(relativeEntry);
    }
  }

  return files;
}

function lineForIndex(source: string, index: number) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function findFetchCallEnd(source: string, start: number) {
  let depth = 0;
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '(') {
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return source.length;
}

function findProtectedApiCallViolations(file: string): Violation[] {
  const source = readFileSync(path.join(projectRoot, file), 'utf8');
  const violations: Violation[] = [];
  const protectedApiCallPatterns = [
    /\bfetch\s*\(/g,
    /\bnew\s+NextRequest\s*\(/g
  ];
  let match: RegExpExecArray | null;

  for (const callPattern of protectedApiCallPatterns) {
    while ((match = callPattern.exec(source)) !== null) {
      const callStart = match.index;
      const callEnd = findFetchCallEnd(source, callStart + match[0].length - 1);
      const callSource = source.slice(callStart, callEnd);

      if (
        protectedApiPattern.test(callSource) &&
        /\buserPublicId\b/.test(callSource)
      ) {
        violations.push({
          file,
          line: lineForIndex(source, callStart),
          snippet: callSource.replace(/\s+/g, ' ').slice(0, 240)
        });
      }
    }
  }

  return violations;
}

function findApiMetaExposure(file: string): Violation[] {
  const source = readFileSync(path.join(projectRoot, file), 'utf8');
  const exposurePattern = /\bclientUserPublicIdIgnored\b/g;
  const violations: Violation[] = [];
  let match: RegExpExecArray | null;

  while ((match = exposurePattern.exec(source)) !== null) {
    violations.push({
      file,
      line: lineForIndex(source, match.index),
      snippet: source
        .slice(Math.max(0, match.index - 80), match.index + 120)
        .replace(/\s+/g, ' ')
        .trim()
    });
  }

  return violations;
}

const sourceFiles = scanRoots.flatMap(listSourceFiles);
const apiSourceFiles = apiScanRoots.flatMap(listSourceFiles);
const violations = sourceFiles.flatMap(findProtectedApiCallViolations);
const apiMetaExposure = apiSourceFiles.flatMap(findApiMetaExposure);

if (violations.length > 0 || apiMetaExposure.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'fail',
        scope: 'investModel client user scope contract',
        message:
          'Client screen code must not send userPublicId to protected user-scoped APIs, and API routes must not expose client userPublicId compatibility meta.',
        violations,
        apiMetaExposure
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'investModel client user scope contract',
      scannedRoots: scanRoots,
      scannedFiles: sourceFiles.length,
      apiScannedRoots: apiScanRoots,
      apiScannedFiles: apiSourceFiles.length,
      protectedApis: [
        '/api/my',
        '/api/portfolio',
        '/api/notifications',
        '/api/model-selections',
        '/api/feed'
      ],
      clientUserPublicIdForwarding: false,
      clientUserPublicIdCompatibilityMetaExposed: false
    },
    null,
    2
  )
);
