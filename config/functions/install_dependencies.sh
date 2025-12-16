#!/usr/bin/env bash

# Homebrew 설치 함수 (Mac용)
install_homebrew() {
    local machine
    machine=$(detect_os)
    
    if [[ "$machine" != "Mac" ]]; then
        return 0
    fi
    
    # Homebrew가 이미 설치되어 있는지 확인
    if command -v brew &>/dev/null; then
        log_success "Homebrew가 이미 설치되어 있습니다"
        return 0
    fi
    
    log "Homebrew 설치 중..."
    if ! /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
        log_error "Homebrew 설치 실패"
        exit 1
    fi
    
    # Homebrew PATH 설정
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        # Apple Silicon Mac
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        # Intel Mac
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    if command -v brew &>/dev/null; then
        log_success "Homebrew 설치 완료"
    else
        log_error "Homebrew 설치 후 PATH 설정 실패"
        exit 1
    fi
}

# Git 설치 확인/설치 (Mac 및 Linux)
install_git() {
    local machine
    machine=$(detect_os)
    
    if [[ $machine == "Mac" ]]; then
        # Mac에서는 Homebrew로 Git 설치 여부 확인
        if command -v brew &>/dev/null && brew list git &>/dev/null 2>&1; then
            log_success "Git 이미 설치됨"
            return 0
        fi
        
        log "Git 설치 중 (Mac)..."
        if ! brew install git; then
            log_error "Git 설치 실패 (Mac)"
            exit 1
        fi
    elif [[ $machine == "Linux" ]]; then
        log "Git 설치 중 (Linux)..."
        if command -v apt-get &>/dev/null; then
            # sudo 권한 확인
            if [[ "${HAS_SUDO:-0}" == "1" ]]; then
                log "sudo로 apt-get을 사용하여 Git 설치 중..."
                if ! sudo apt-get update || ! sudo apt-get install -y git; then
                    log_error "sudo로 Git 설치 실패"
                    exit 1
                fi
            else
                log "sudo 없이 apt-get으로 Git 설치 시도 중..."
                if ! apt-get update || ! apt-get install -y git; then
                    log_error "sudo 없이 apt-get 실행 실패. sudo 권한이 필요할 수 있습니다."
                    exit 1
                fi
            fi
        else
            log_error "지원되지 않는 Linux 배포판입니다. (apt-get을 찾을 수 없음)"
            exit 1
        fi
    else
        log_error "지원되지 않는 운영체제입니다: $machine"
        exit 1
    fi
    
    if command -v git &>/dev/null; then
        log_success "Git 설치 완료"
    else
        log_error "Git 설치 후 검증 실패"
        exit 1
    fi
}

# 모든 의존성 확인 및 설치
ensure_dependencies() {
    local machine
    machine=$(detect_os)
    
    log "의존성 확인 중..."
    
    if [[ $machine == "Mac" ]]; then
        # Mac: Homebrew 설치 확인
        install_homebrew
        
        # Git 설치 확인
        if ! command -v git &>/dev/null; then
            install_git
        elif command -v brew &>/dev/null && ! brew list git &>/dev/null 2>&1; then
            # Homebrew가 있지만 Git이 Homebrew로 설치되지 않은 경우
            log "Git이 Homebrew로 설치되지 않았습니다. Homebrew로 재설치합니다."
            install_git
        else
            log_success "Git이 이미 설치되어 있습니다"
        fi
    elif [[ $machine == "Linux" ]]; then
        # Linux: Git 설치 확인
        if ! command -v git &>/dev/null; then
            install_git
        else
            log_success "Git이 이미 설치되어 있습니다"
        fi
    else
        log_error "지원되지 않는 운영체제입니다: $machine"
        exit 1
    fi
    
    log_success "의존성 확인 완료"
}
