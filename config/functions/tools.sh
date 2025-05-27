#!/bin/bash

# 현재 스크립트의 디렉토리에서 functions.sh 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/functions.sh"

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
    
    # Homebrew가 없으면 먼저 설치
    if ! command -v brew &>/dev/null; then
        echo "Homebrew가 없습니다. 먼저 설치합니다..."
        install_homebrew
        
        # 설치 후 다시 확인
        if ! command -v brew &>/dev/null; then
            echo "❌ Homebrew 설치 실패"
            return 1
        fi
    fi
    
    # brew로 설치할 도구들
	# TODO: linux brewfile?
    brew_tools=(btop lsd helix neovim pyright gopls vscode-langservers-extracted yaml-language-server 
                bash-language-server dockerfile-language-server marksman
                typescript-language-server kotlin-language-server jdtls taplo)
    
    brew_install "${brew_tools[@]}"
    echo "✅ brew 도구 설치 완료!"
}

# 사용법 출력
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --brew             Install Homebrew only"
    echo "  --dev-tools        Install development tools (apt-get)"
    echo "  --brew-tools       Install brew tools (helix, language servers)"
    echo "  --locale           Install system locales (ko_KR.UTF-8, en_US.UTF-8)"
    echo "  --all              Install all additional tools"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --brew"
    echo "  $0 --dev-tools"
    echo "  $0 --brew-tools"
    echo "  $0 --locale"
    echo "  $0 --all"
}

# 메인 로직
main() {
    case $1 in
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
