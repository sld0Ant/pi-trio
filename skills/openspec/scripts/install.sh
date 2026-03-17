#!/usr/bin/env bash
set -euo pipefail

MIN_NODE_MAJOR=20
MIN_NODE_MINOR=19

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log()   { echo -e "${GREEN}[openspec]${NC} $*"; }
error() { echo -e "${RED}[openspec]${NC} $*" >&2; }

check_node() {
    if ! command -v node &>/dev/null; then
        error "Node.js not found. Install version >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0"
        error "https://nodejs.org or: nvm install ${MIN_NODE_MAJOR}"
        exit 1
    fi

    local version
    version=$(node --version | sed 's/^v//')
    local major minor
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)

    if (( major < MIN_NODE_MAJOR )) || (( major == MIN_NODE_MAJOR && minor < MIN_NODE_MINOR )); then
        error "Node.js $version — required >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0"
        error "Upgrade: nvm install ${MIN_NODE_MAJOR} && nvm use ${MIN_NODE_MAJOR}"
        exit 1
    fi

    log "Node.js $version ✓"
}

install_openspec() {
    if command -v bun &>/dev/null; then
        log "Installing via bun..."
        bun add -g @fission-ai/openspec@latest
    elif command -v npm &>/dev/null; then
        log "Installing via npm..."
        npm install -g @fission-ai/openspec@latest
    else
        error "Neither bun nor npm found. Install one of them."
        exit 1
    fi

    if ! command -v openspec &>/dev/null; then
        error "openspec not found after installation. Check your PATH."
        exit 1
    fi

    log "OpenSpec $(openspec --version) installed ✓"
}

init_project() {
    local target="${1:-.}"

    if [[ ! -d "$target" ]]; then
        error "Directory $target does not exist"
        exit 1
    fi

    log "Initializing OpenSpec in $target..."
    log "(openspec init may ask interactive questions about profile and configuration)"
    cd "$target"
    openspec init --tools pi
    log "Project initialized ✓"
    log ""
    log "Generated files:"
    find .pi/skills -name '*.md' -type f 2>/dev/null | while read -r f; do
        log "  $f"
    done
    find .pi/prompts -name '*.md' -type f 2>/dev/null | while read -r f; do
        log "  $f"
    done
}

main() {
    log "=== OpenSpec Installation for Pi ==="
    log ""

    check_node
    install_openspec

    if [[ "${1:-}" == "--init" ]]; then
        init_project "${2:-.}"
    else
        log ""
        log "To initialize in a project:"
        log "  cd your-project && openspec init --tools pi"
        log ""
        log "Or run this script with --init:"
        log "  bash install.sh --init /path/to/project"
    fi

    log ""
    log "Done! Use /opsx:propose for your first change."
}

main "$@"
