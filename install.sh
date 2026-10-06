#!/usr/bin/env bash
# install.sh — install the cinewright skill for Codex, Claude Code and other agents that read SKILL.md.
#
#   curl -fsSL https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.sh | bash
#   curl -fsSL …/install.sh | bash -s -- codex            # only ~/.agents/skills (+ ~/.codex/skills if it exists)
#   curl -fsSL …/install.sh | bash -s -- claude           # only ~/.claude/skills
#   ./install.sh [all|codex|claude]                       # from a clone
#
# Environment: PCV_SKIP_CHECK=1 (skip the machine check) · PCV_REF=<branch|tag> (default main) · PCV_SOURCE=<repo dir | .zip file | URL> · DEST=<custom skills folder> · PROJECT=1 (install into ./.agents/skills and ./.claude/skills)
set -euo pipefail
REPO="msmahdinejad/cinewright"; NAME="cinewright"; target="${1:-all}"; ref="${PCV_REF:-main}"; src="${PCV_SOURCE:-}"
tmp=""; cleanup() { if [ -n "$tmp" ]; then rm -rf "$tmp"; fi; }; trap cleanup EXIT

find_skill() { # $1 = folder to search
  if [ -f "$1/skills/$NAME/SKILL.md" ]; then echo "$1/skills/$NAME"; return; fi
  find "$1" -type f -name SKILL.md -path "*/$NAME/SKILL.md" 2>/dev/null | head -n1 | xargs -r dirname
}
fetch_zip() { # $1 = url or file → extracts into $tmp
  tmp="$(mktemp -d)"
  if [[ "$1" =~ ^https?:// ]]; then curl -fsSL "$1" -o "$tmp/src.zip"; else cp "$1" "$tmp/src.zip"; fi
  if command -v unzip >/dev/null 2>&1; then unzip -q "$tmp/src.zip" -d "$tmp"; else (cd "$tmp" && python3 -c "import zipfile,sys; zipfile.ZipFile('src.zip').extractall('.')"); fi
}

here="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$src" ] && [ -d "$src" ]; then skill="$(find_skill "$src")"
elif [ -n "$src" ]; then fetch_zip "$src"; skill="$(find_skill "$tmp")"
elif [ -n "$here" ] && [ -f "$here/skills/$NAME/SKILL.md" ]; then skill="$here/skills/$NAME"
else
  kind=heads; [[ "$ref" =~ ^v?[0-9]+\.[0-9]+ ]] && kind=tags
  echo "downloading https://github.com/$REPO/archive/refs/$kind/$ref.zip"; fetch_zip "https://github.com/$REPO/archive/refs/$kind/$ref.zip"; skill="$(find_skill "$tmp")"
fi
[ -n "${skill:-}" ] || { echo "could not find skills/$NAME/SKILL.md in the source" >&2; exit 1; }

dests=()
if [ -n "${DEST:-}" ]; then dests+=("$DEST")
elif [ -n "${PROJECT:-}" ]; then dests+=("$PWD/.agents/skills" "$PWD/.claude/skills")
else
  if [ "$target" = all ] || [ "$target" = codex ]; then dests+=("$HOME/.agents/skills"); [ -d "$HOME/.codex/skills" ] && dests+=("$HOME/.codex/skills"); fi
  if [ "$target" = all ] || [ "$target" = claude ]; then dests+=("$HOME/.claude/skills"); fi
fi
for d in "${dests[@]}"; do
  mkdir -p "$d"; rm -rf "$d/$NAME"; cp -R "$skill" "$d/$NAME"; echo "installed -> $d/$NAME"
  legacy="$d/pure-code-video"   # the name before 2.1: remove our own old install so the agent does not see two copies
  if [ -f "$legacy/SKILL.md" ] && grep -q '^name: pure-code-video' "$legacy/SKILL.md" && [ -d "$legacy/references/atlas" ]; then rm -rf "$legacy"; echo "removed the old install $legacy (this skill is now called $NAME)"; fi
done

doctor="${dests[0]}/$NAME/scripts/doctor.mjs"; [ -n "${PCV_SKIP_CHECK:-}" ] && { echo "Done (check skipped)."; exit 0; }
if command -v node >/dev/null 2>&1; then echo; echo "checking this machine (node, Chrome, ffmpeg, WebGL) …"; node "$doctor" || echo "Something is missing — the lines above say what to install (macOS: brew install node ffmpeg; Debian/Ubuntu: apt install nodejs ffmpeg chromium)."
else echo; echo "Node.js is not installed (needed: Node >= 18, Chrome/Chromium/Edge, ffmpeg)."; fi
echo; echo "Done. Restart your agent so it rescans skills, then try:  \$cinewright make a 15-second motion-graphics showreel. Go all out."
