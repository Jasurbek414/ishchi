#!/usr/bin/env node
/**
 * Writes the brand palette from design-tokens.json into each surface.
 *
 * The same colours were defined independently in the Flutter theme, the admin stylesheet and the
 * landing stylesheet, and had started to drift. Generating them keeps one source of truth without
 * adding a runtime build step: the output is committed, and CI re-runs this and fails on a diff.
 *
 * Usage: node tools/generate-design-tokens.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design-tokens.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');

const BANNER = 'GENERATED FROM design-tokens.json — do not edit by hand.';
const REGENERATE = 'Run: node tools/generate-design-tokens.mjs';

/** Skips the `$comment` keys used to document the JSON. */
const entries = (group) => Object.entries(group).filter(([key]) => !key.startsWith('$'));

function cssBlock(prefix, group) {
  return entries(group)
    .map(([key, value]) => `  --color-${prefix}${key === 'DEFAULT' ? '' : `-${kebab(key)}`}: ${value};`)
    .join('\n');
}

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Emits the token names the admin panel's utilities already use (bg-primary, bg-bg, …) rather than a
 * new scheme, so nothing in the markup has to change to pick the shared palette up.
 */
function adminCss() {
  return `/* ${BANNER}
   ${REGENERATE} */
@theme {
  --color-primary: ${tokens.brand['500']};
  --color-primary-light: ${tokens.brand['300']};
  /* For brand-coloured small text, where the fill colour itself is only 3.4:1. */
  --color-primary-text: ${tokens.brand.text};
  --color-surface: ${tokens.neutral.surface};
  --color-bg: ${tokens.neutral.background};
  --color-line: ${tokens.neutral.line};
  --color-text: ${tokens.neutral.text};
  --color-text-secondary: ${tokens.neutral.textSecondary};
  --color-success: ${tokens.status.success};
  --color-danger: ${tokens.status.danger};
  --color-warning: ${tokens.status.warning};
}

/*
 * Dark mode. Set by [data-theme="dark"] on <html> from the panel's theme toggle, which also honours
 * the operating system's preference on first visit. Only the surfaces move: the brand and status
 * colours stay put, and the ones that need it are lightened for contrast against a dark background.
 */
:root[data-theme='dark'] {
  --color-surface: ${tokens.darkNeutral.surface};
  --color-bg: ${tokens.darkNeutral.background};
  --color-line: ${tokens.darkNeutral.line};
  --color-text: ${tokens.darkNeutral.text};
  --color-text-secondary: ${tokens.darkNeutral.textSecondary};
  --color-success: ${tokens.status.successDark};
  --color-danger: ${tokens.status.dangerDark};
  --color-warning: ${tokens.status.warningDark};
  /* On a dark surface the brand colour clears 4.5:1 on its own. */
  --color-primary-text: ${tokens.brand['500']};
}
`;
}

function landingCss() {
  return `/* ${BANNER}
   ${REGENERATE} */
@theme {
${cssBlock('brand', tokens.brand)}
${cssBlock('navy', tokens.navy)}
  --color-success: ${tokens.status.success};
  --color-danger: ${tokens.status.danger};
}
`;
}

const toArgb = (hex) => `0xFF${hex.replace('#', '').toUpperCase()}`;

function mobileDart() {
  const line = (name, hex) => `  static const ${name} = Color(${toArgb(hex)});`;
  return `// ${BANNER}
// ${REGENERATE}
import 'package:flutter/material.dart';

/// The brand palette. Dark-mode surfaces are derived by Material 3 from [primary] rather than
/// listed here, which is why only the light neutrals appear.
class DesignTokens {
${line('primary', tokens.brand['500'])}
${line('primaryStrong', tokens.brand['400'])}
${line('primaryLight', tokens.brand['300'])}
${line('primarySoft', tokens.brand['100'])}
${line('primaryText', tokens.brand.text)}
${entries(tokens.neutral).map(([k, v]) => line(k, v)).join('\n')}
${entries(tokens.status).map(([k, v]) => line(k, v)).join('\n')}
}
`;
}

const outputs = [
  ['admin-web/src/tokens.generated.css', adminCss()],
  ['landing-web/src/tokens.generated.css', landingCss()],
  ['mobile/lib/core/design_tokens.dart', mobileDart()],
];

let stale = false;
for (const [relative, content] of outputs) {
  const path = join(root, relative);
  let existing = null;
  try {
    existing = readFileSync(path, 'utf8');
  } catch {
    // not generated yet
  }
  if (existing === content) continue;
  if (checkOnly) {
    console.error(`stale: ${relative}`);
    stale = true;
  } else {
    writeFileSync(path, content);
    console.log(`wrote ${relative}`);
  }
}

if (checkOnly && stale) {
  console.error('\nDesign tokens are out of date. Run: node tools/generate-design-tokens.mjs');
  process.exit(1);
}
if (checkOnly) console.log('design tokens up to date');
