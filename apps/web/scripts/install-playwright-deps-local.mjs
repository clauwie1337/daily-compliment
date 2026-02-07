import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readOsRelease() {
  try {
    const raw = fs.readFileSync('/etc/os-release', 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^"|"$/g, '');
    }
    return out;
  } catch {
    return {};
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listDebs(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.deb'))
    .map((f) => path.join(dir, f));
}

function findChromeHeadlessShell() {
  const home = process.env.HOME;
  if (!home) return null;
  const root = path.join(home, '.cache/ms-playwright');
  if (!fs.existsSync(root)) return null;

  const dirs = fs
    .readdirSync(root)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort();

  const latest = dirs.at(-1);
  if (!latest) return null;

  const bin = path.join(root, latest, 'chrome-headless-shell-linux64/chrome-headless-shell');
  return fs.existsSync(bin) ? bin : null;
}

function missingLibs(binaryPath, env) {
  const out = execFileSync('ldd', [binaryPath], { encoding: 'utf8', env });
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('=> not found'))
    .map((l) => l.split('=>')[0].trim());
}

function computeLdPath(outDir) {
  const libDirs = [
    path.join(outDir, 'usr/lib/x86_64-linux-gnu'),
    path.join(outDir, 'lib/x86_64-linux-gnu'),
    path.join(outDir, 'usr/lib'),
    path.join(outDir, 'lib'),
  ].filter((p) => fs.existsSync(p));

  return libDirs.join(':');
}

function downloadPkgs(aptDir, pkgs) {
  for (const pkg of pkgs) {
    const already = fs
      .readdirSync(aptDir)
      .some((f) => f.startsWith(`${pkg}_`) && f.endsWith('.deb'));
    if (already) {
      console.log(`[pw-deps] already downloaded: ${pkg}`);
      continue;
    }
    console.log(`[pw-deps] apt-get download ${pkg}`);
    execFileSync('apt-get', ['download', pkg], { cwd: aptDir, stdio: 'inherit' });
  }
}

function extractAllDebs(aptDir, outDir) {
  for (const deb of listDebs(aptDir)) {
    console.log(`[pw-deps] extracting ${path.basename(deb)}`);
    execFileSync('dpkg-deb', ['-x', deb, outDir], { stdio: 'inherit' });
  }
}

const repoRoot = path.resolve(__dirname, '../../..');
const cacheRoot = path.join(repoRoot, '.cache');
const aptDir = path.join(cacheRoot, 'apt');
const outDir = path.join(cacheRoot, 'playwright-deps');
const envFile = path.join(cacheRoot, 'playwright-deps.env');
const fontConfigFile = path.join(cacheRoot, 'fonts.conf');
const fontCacheDir = path.join(cacheRoot, 'fontcache');

ensureDir(aptDir);
ensureDir(outDir);
ensureDir(fontCacheDir);

const os = readOsRelease();
const version = os.VERSION_ID ?? '';
const platformKey = version.startsWith('24.04') ? 'ubuntu24.04-x64' : 'ubuntu20.04-x64';

const pwCoreEntry = require.resolve('playwright-core');
const pwCoreDir = path.dirname(pwCoreEntry);
const nativeDepsPath = path.join(pwCoreDir, 'lib/server/registry/nativeDeps.js');
const nativeDeps = require(nativeDepsPath);

const platform = nativeDeps.deps?.[platformKey];
const basePkgs = platform?.chromium;
const toolsPkgs = Array.from(
  new Set([
    ...(platform?.tools ?? []).filter((p) => p !== 'xvfb'),
    // Extra fonts to match GitHub Actions (visual baseline stability)
    'fonts-dejavu-core',
    'fonts-liberation',
  ]),
);
const lib2pkg = platform?.lib2package;

// Some libs are not present in Playwright's lib2package map for this distro.
// Add targeted fallbacks when we encounter them.
const fallbackLib2Pkg = {
  'libXau.so.6': 'libxau6',
  'libXdmcp.so.6': 'libxdmcp6',
};
if (!Array.isArray(basePkgs) || basePkgs.length === 0 || !lib2pkg) {
  throw new Error(`Could not determine Playwright chromium deps for ${platformKey}`);
}

console.log(`[pw-deps] OS: ${os.PRETTY_NAME ?? 'unknown'} -> ${platformKey}`);

const chromeBin = findChromeHeadlessShell();
if (!chromeBin) {
  console.log('[pw-deps] Could not find chrome-headless-shell. Run `pnpm exec playwright install chromium` first.');
}

// 1) Start with Playwright's recommended packages.
// Include both runtime libraries (chromium) and font/tool packages (tools)
// so headless rendering actually shows text on minimal servers.
const pkgs = new Set([...basePkgs, ...toolsPkgs]);

// 2) Iteratively add packages needed for any still-missing .so dependencies under LD_LIBRARY_PATH.
for (let round = 0; round < 5; round++) {
  console.log(`[pw-deps] round ${round + 1}: packages=${pkgs.size}`);

  downloadPkgs(aptDir, pkgs);
  extractAllDebs(aptDir, outDir);

  if (!chromeBin) break;

  const ld = computeLdPath(outDir);
  const env = { ...process.env, LD_LIBRARY_PATH: `${ld}:${process.env.LD_LIBRARY_PATH ?? ''}` };
  const libs = missingLibs(chromeBin, env);

  if (!libs.length) {
    console.log('[pw-deps] Chromium dependencies look satisfied (no missing libs under LD_LIBRARY_PATH).');
    break;
  }

  const mapped = libs
    .map((lib) => lib2pkg[lib] ?? fallbackLib2Pkg[lib])
    .filter(Boolean);
  const newPkgs = mapped.filter((p) => !pkgs.has(p));

  console.log(`[pw-deps] missing libs: ${libs.join(', ')}`);
  if (!newPkgs.length) {
    console.log('[pw-deps] no additional packages mapped for missing libs; stopping.');
    break;
  }
  console.log(`[pw-deps] adding packages: ${newPkgs.join(', ')}`);
  newPkgs.forEach((p) => pkgs.add(p));
}

const ld = computeLdPath(outDir);

// Minimal fontconfig config that points to extracted fonts.
const fontsDir = path.join(outDir, 'usr/share/fonts');
const fontsDir2 = path.join(outDir, 'usr/share/fonts/truetype');
const fontsDir3 = path.join(outDir, 'usr/share/fonts/opentype');
const fontsDir4 = path.join(outDir, 'usr/share/X11/fonts');

fs.writeFileSync(
  fontConfigFile,
  `<?xml version="1.0"?>\n` +
    `<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n` +
    `<fontconfig>\n` +
    `  <dir>${fontsDir}</dir>\n` +
    `  <dir>${fontsDir2}</dir>\n` +
    `  <dir>${fontsDir3}</dir>\n` +
    `  <dir>${fontsDir4}</dir>\n` +
    `  <cachedir>${fontCacheDir}</cachedir>\n` +
    `</fontconfig>\n`,
);

fs.writeFileSync(
  envFile,
  `# Auto-generated by install-playwright-deps-local.mjs\n` +
    `LD_LIBRARY_PATH=${ld}\n` +
    `FONTCONFIG_FILE=${fontConfigFile}\n`,
);

console.log(`[pw-deps] wrote ${envFile}`);
console.log('[pw-deps] Use locally:');
console.log(`  export LD_LIBRARY_PATH="${ld}:$LD_LIBRARY_PATH"`);
console.log(`  export FONTCONFIG_FILE="${fontConfigFile}"`);
