#!/bin/bash

# ============================================
# 추가 도구 설치 스크립트
# ============================================
# Python 관련은 install_python.sh로 분리됨

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/functions.sh"

# log 함수 fallback
if ! declare -F log >/dev/null 2>&1; then
    log() { echo "[INFO] $*"; }
fi
if ! declare -F log_success >/dev/null 2>&1; then
    log_success() { echo "[SUCCESS] $*"; }
fi
if ! declare -F log_error >/dev/null 2>&1; then
    log_error() { echo "[ERROR] $*" >&2; }
fi

# ============================================
# 도구 설치 함수들
# ============================================

# Homebrew만 설치
install_brew_only() {
    echo "Installing Homebrew..."
    
    if command -v brew &>/dev/null; then
        echo "✅ Homebrew가 이미 설치되어 있습니다."
        return 0
    fi
    
    install_homebrew
    
    if command -v brew &>/dev/null; then
        echo "✅ Homebrew 설치 완료!"
    else
        echo "❌ Homebrew 설치 실패"
        return 1
    fi
}

# 개발 도구들 설치 (apt-get 사용)
install_dev_tools() {
    echo "Installing development tools with apt-get..."
    
    if command -v apt-get &>/dev/null; then
        echo "Installing apt-utils and debconf for better package configuration..."
        install_cli_tools apt-utils debconf
    fi
    
    dev_tools=(trash-cli tldr jq fd-find ripgrep unison)
    install_cli_tools "${dev_tools[@]}"
    echo "✅ 개발 도구 설치 완료!"
}

# locale 설치
install_locale() {
    echo "Installing system locales..."
    install_system_locales
}

# brew 도구들 설치 (helix, Language Servers 등)
install_brew_tools() {
    echo "Installing tools with brew..."
    
    if ! command -v brew &>/dev/null; then
        echo "Homebrew가 없습니다. 먼저 설치합니다..."
        install_homebrew
        
        if ! command -v brew &>/dev/null; then
            echo "❌ Homebrew 설치 실패"
            return 1
        fi
    fi
    
    # TODO: linux brewfile?
    brew_tools=(btop bpython lsd helix neovim pyright gopls vscode-langservers-extracted yaml-language-server 
                bash-language-server dockerfile-language-server marksman
                typescript-language-server kotlin-language-server jdtls taplo)
    
    brew_install "${brew_tools[@]}"
    echo "✅ brew 도구 설치 완료!"
}

# ============================================
# 사용법 출력
# ============================================
show_usage() {
    echo "Usage: $0 [OPTION] [ARGS...]"
    echo ""
    echo "General Options:"
    echo "  --brew             Install Homebrew only"
    echo "  --dev-tools        Install development tools (apt-get)"
    echo "  --brew-tools       Install brew tools (helix, language servers)"
    echo "  --locale           Install system locales (ko_KR.UTF-8, en_US.UTF-8)"
    echo "  --all              Install all additional tools"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Python Options (delegated to install_python.sh):"
    echo "  --python [ARGS]    Run install_python.sh with given args"
    echo ""
    echo "  Shortcuts:"
    echo "    --python --uv-manager    Install UV only"
    echo "    --python --apt [VER]     Install Python via apt"
    echo "    --python --full          Install all Python tools"
    echo "    --python --list          List Python versions"
    echo "    --python --help          Show Python options"
    echo ""
    echo "Examples:"
    echo "  $0 --brew"
    echo "  $0 --dev-tools"
    echo "  $0 --python --full"
    echo "  $0 --python --list"
    echo ""
    echo "Python 단독 실행:"
    echo "  ./config/functions/install_python.sh --help"
}

# ============================================
# 메인 로직
# ============================================
main() {
    case "${1:-}" in
        # General Options
        --brew)
            install_brew_only
            ;;
        --dev-tools)
            install_dev_tools
            ;;
        --brew-tools)
            install_brew_tools
            ;;
        --locale)
            install_locale
            ;;
        --all)
            echo "Installing all additional tools..."
            install_dev_tools
            echo ""
            install_brew_tools
            ;;
        
        # Python Options - install_python.sh로 위임
        --python)
            shift  # --python 제거
            if [[ $# -eq 0 ]]; then
                # --python만 입력하면 UV 설치 (하위 호환성)
                "$SCRIPT_DIR/install_python.sh" --uv-manager
            else
                # 나머지 인자를 install_python.sh에 전달
                "$SCRIPT_DIR/install_python.sh" "$@"
            fi
            ;;
        
        # Help
        --help|-h)
            show_usage
            ;;
        "")
            echo "❌ 옵션을 지정해주세요."
            echo ""
            show_usage
            exit 1
            ;;
        *)
            echo "❌ 알 수 없는 옵션: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
