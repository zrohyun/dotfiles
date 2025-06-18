#!/bin/bash
# Description: 간단한 인사말 스크립트
# Author: zrohyun
# Created: 2025-01-19

set -euo pipefail

main() {
    local name="${1:-World}"
    local time=$(date +"%Y-%m-%d %H:%M:%S")
    
    echo "🌟 Hello, $name!"
    echo "📅 Current time: $time"
    echo "💻 Running on: $(uname -s)"
    echo "🏠 Home directory: $HOME"
    
    if command -v uptime &>/dev/null; then
        echo "⏰ System uptime: $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
    fi
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [NAME]

Simple greeting script with system info.

Arguments:
    NAME    Name to greet (default: World)

Options:
    -h, --help    Show this help message

Examples:
    $(basename "$0")              # Hello, World!
    $(basename "$0") John         # Hello, John!
EOF
}

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
