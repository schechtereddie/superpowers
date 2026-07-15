#!/usr/bin/env bash
# inject-bootstrap.sh — generates the system prompt content for Cline's Custom System Prompt setting
# Usage: bash .cline/inject-bootstrap.sh
# Copy the output into Cline → Settings → Custom System Prompt

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

USING_SUPERPOWERS="${REPO_ROOT}/skills/using-superpowers/SKILL.md"
AI_WORKS_BOOTSTRAP="${REPO_ROOT}/skills/ai-works-bootstrap/SKILL.md"

if [ ! -f "${USING_SUPERPOWERS}" ]; then
  echo "ERROR: Cannot find ${USING_SUPERPOWERS}" >&2
  exit 1
fi

echo "<EXTREMELY_IMPORTANT>"
echo "You have superpowers."
echo ""
echo "**Below is the full content of your 'superpowers:using-superpowers' skill:**"
echo ""
cat "${USING_SUPERPOWERS}"

if [ -f "${AI_WORKS_BOOTSTRAP}" ]; then
  echo ""
  echo "**AI Works System — additional skill namespaces and adaptive workflows:**"
  echo ""
  cat "${AI_WORKS_BOOTSTRAP}"
fi

echo ""
echo "**Tool mapping for Cline:** see skills/using-superpowers/references/cline-tools.md"
echo "</EXTREMELY_IMPORTANT>"
