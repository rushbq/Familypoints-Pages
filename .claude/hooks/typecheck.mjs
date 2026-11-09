/**
 * 兩段式 hook：PostToolUse 只留記號、Stop 才跑一次 tsc --noEmit。
 *
 *   node <此檔> mark       # PostToolUse: Edit|Write|MultiEdit
 *   node <此檔> typecheck  # Stop
 *
 * 本專案沒有 linter / test runner，Tailwind 走 CDN 也沒有 build 產出物要進版控，
 * 所以唯一值得自動化的就是型別檢查（約 5 秒、無副作用、可重複執行）。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER_NAME = 'familypoints-typecheck-dirty';
const COMMAND = 'npx';
const ARGS = ['tsc', '--noEmit'];
const OK_MESSAGE = 'tsc --noEmit 通過，無型別錯誤';

/**
 * 異動的檔案會不會被 tsc 檢查？
 * tsconfig.json 沒有 include，預設為專案根目錄以下全部；node_modules 預設排除，
 * dist 是 build 產出物（已 gitignore），改到它不需要重跑檢查。
 */
function affectsTypecheck(relPath) {
  if (relPath.startsWith('node_modules/') || relPath.startsWith('dist/')) return false;
  return /\.(ts|tsx|js|jsx|mts|cts)$/.test(relPath) || relPath === 'tsconfig.json';
}

// --- 以下通常不用改 ---------------------------------------------------------

/** 專案根目錄：此檔位於 <root>/.claude/hooks/，故往上兩層 */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const marker = path.join(tmpdir(), MARKER_NAME);

function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8')); // hook 事件 JSON 由 stdin 傳入
  } catch {
    return null;
  }
}

function isTarget(file) {
  const rel = path.relative(projectRoot, file).split(path.sep).join('/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false; // 專案外的檔案不算
  return affectsTypecheck(rel);
}

if (process.argv[2] === 'mark') {
  const input = readHookInput()?.tool_input ?? {};
  const files = [input.file_path, ...(input.edits?.map((e) => e.file_path) ?? [])].filter(Boolean);
  if (files.some(isTarget)) writeFileSync(marker, '');
  process.exit(0);
}

if (process.argv[2] === 'typecheck') {
  if (!existsSync(marker)) process.exit(0);
  rmSync(marker, { force: true }); // 先清記號：指令失敗也不會讓 Stop 無限重試
  try {
    execFileSync(COMMAND, ARGS, { cwd: projectRoot, stdio: 'pipe', shell: true });
    console.log(OK_MESSAGE);
    process.exit(0);
  } catch (err) {
    const log = [err.stdout?.toString(), err.stderr?.toString()].filter(Boolean).join('\n').trim();
    console.error(`tsc --noEmit 發現型別錯誤：\n${log}`);
    process.exit(2); // exit 2 才會把訊息回饋給 Claude 去修
  }
}

process.exit(0);
