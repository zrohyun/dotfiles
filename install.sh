#!/bin/bash

#   _           _        _ _       _     
#  (_)         | |      | | |     | |    
#   _ _ __  ___| |_ __ _| | |  ___| |__  
#  | | '_ \/ __| __/ _` | | | / __| '_ \ 
#  | | | | \__ \ || (_| | | |_\__ \ | | |
#  |_|_| |_|___/\__\__,_|_|_(_)___/_| |_|
#
# 통합 설치 스크립트 (Linux 및 Mac 지원)
# 
# 실행 방법:
# 1. curl 실행: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)"
# 2. 로컬 실행: ./install.sh

# 로깅 설정
LOGFILE=""

init_logging() {
    # 로그 디렉토리 설정 - 항상 홈 디렉토리에 저장
    local log_dir="$HOME/.dotfiles_logs"
    
    # 로그 디렉토리가 없으면 생성
    mkdir -p "$log_dir"
    
    # 로그 파일 설정
    LOGFILE="${log_dir}/install_log_$(date +%Y%m%d_%H%M%S).log"
    echo "로그 파일: $LOGFILE"
    
    # 모든 출력을 로그 파일과 터미널에 동시에 기록
    exec > >(tee -a "$LOGFILE") 2>&1
}

log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

log_success() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ $1"
}

log_error() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ❌ $1"
}

# 운영체제 감지
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac"
    else
        echo "Unknown"
    fi
}

# curl로 실행된 경우 dotfiles 저장소 클론 후 로컬 스크립트 실행
curl_install_dotfiles() {
    dotfiles_dir="$HOME/.dotfiles" # $HOME/dotfiles

    # 현재 디렉토리가 이미 dotfiles 디렉토리인지 확인
    if [[ "$PWD" == "$dotfiles_dir" ]]; then
        remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url)
        if [[ "$remote_url" == *"github.com/zrohyun/dotfiles"* ]]; then
            log_success "이미 zrohyun의 dotfiles 디렉토리에 있습니다"
            return 0
        fi
    fi

    # Git이 설치되어 있는지 확인
    machine=$(detect_os)
    
    if [[ $machine == "Mac" ]]; then
        # Mac에서는 Homebrew를 먼저 확인하고 설치
        install_homebrew
        
        # Homebrew로 Git 설치 여부 확인
        if ! brew list git &>/dev/null; then
            log "Git이 설치되어 있지 않습니다. Homebrew를 통해 설치합니다."
            install_git
        fi
    elif [[ $machine == "Linux" ]]; then
        # Linux에서 Git 설치 여부 확인
        if ! command -v git &>/dev/null; then
            log "Git이 설치되어 있지 않습니다. 운영체제에 맞는 설치를 진행합니다."
            install_git
        fi
    else
        log_error "지원되지 않는 운영체제입니다."
        exit 1
    fi

    # dotfiles 디렉토리가 이미 존재하는지 확인
    if [[ -d $dotfiles_dir ]]; then
        remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url)
        if [[ "$remote_url" == *"github.com/zrohyun/dotfiles"* ]]; then
            log_success "dotfiles 디렉토리가 이미 존재합니다"
            cd "$dotfiles_dir" || exit 1
            return 0
        else
            backup_dir="${dotfiles_dir}.bak.$(date +%Y%m%d%H%M%S)"
            log "기존 dotfiles 디렉토리를 백업합니다: $backup_dir"
            mv "$dotfiles_dir" "$backup_dir"
        fi
    fi

    log "dotfiles 저장소를 클론합니다..."
    git clone --depth=1 -b main https://github.com/zrohyun/dotfiles.git "$dotfiles_dir"
    cd "$dotfiles_dir" || exit 1

    log_success "dotfiles 저장소 클론 완료"
    
    # 로컬 스크립트 실행
    log "로컬 install.sh 스크립트를 실행합니다..."
    export DOTFILES_INTERNAL_SOURCE=1
    source ./install.sh || exit 1
    exit 0
}

# Mac 전용: Homebrew 설치 확인/설치
install_homebrew() {
    if command -v brew &>/dev/null; then
        log_success "Homebrew 이미 설치됨"
    else
        log "Homebrew 설치 중..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Homebrew 환경변수 설정
        if [[ -f /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            
            # 쉘 프로필에 Homebrew 환경변수 추가
            if [[ -f "$HOME/.zshrc" ]]; then
                echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zshrc"
            elif [[ -f "$HOME/.bash_profile" ]]; then
                echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.bash_profile"
            fi
        fi
        
        if command -v brew &>/dev/null; then
            log_success "Homebrew 설치 완료"
        else
            log_error "Homebrew 설치 실패"
            exit 1
        fi
    fi
}

# Git 설치 확인/설치 (Mac 및 Linux)
install_git() {
    machine=$(detect_os)
    
    if [[ $machine == "Mac" ]]; then
        # Mac에서는 Homebrew로 Git 설치 여부 확인
        if brew list git &>/dev/null; then
            log_success "Git 이미 설치됨"
        else
            log "Git 설치 중 (Mac)..."
            brew install git
        fi
    elif [[ $machine == "Linux" ]]; then
        log "Git 설치 중 (Linux)..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get update && sudo apt-get install -y git
        else
            log_error "지원되지 않는 Linux 배포판입니다."
            exit 1
        fi
    else
        log_error "지원되지 않는 운영체제입니다."
        exit 1
    fi
    
    if command -v git &>/dev/null; then
        log_success "Git 설치 완료"
    else
        log_error "Git 설치 실패"
        exit 1
    fi
}

# 메인 함수
main() {
    # 로깅 초기화
    init_logging
    
    # 스크립트가 curl로 실행되었는지 확인
    if [[ "${BASH_SOURCE[0]}" != "${0}" && -z "${DOTFILES_INTERNAL_SOURCE}" ]]; then
        # 소스로 실행된 경우 (curl로 실행) 그리고 내부 소스가 아닌 경우
        curl_install_dotfiles
        return
    fi
    
    # 내부 소스 플래그 초기화
    unset DOTFILES_INTERNAL_SOURCE
    
    # 로컬에서 직접 실행된 경우
    log "설치 스크립트 시작"
    
    # 현재 디렉토리 저장
    DOTFILES="$PWD"
    
    # 운영체제 감지
    machine=$(detect_os)
    log "감지된 운영체제: $machine"
    
    # 운영체제별 초기 설정
    if [[ $machine == "Mac" ]]; then
        # Mac 초기 설정 확인
        install_homebrew
        # Homebrew로 Git 설치 여부 확인
        if ! brew list git &>/dev/null; then
            install_git
        fi
    elif [[ $machine == "Linux" ]]; then
        # Linux 초기 설정 확인
        if ! command -v git &>/dev/null; then
            install_git
        fi
    fi
    
    # 환경 변수 설정
    source ./config/.env
    source ./config/functions/functions.sh
    
    # 운영체제별 설정
    if [[ $machine == "Linux" ]]; then
        source ./config/functions/setup_linux.sh
        setup_linux
    elif [[ $machine == "Mac" ]]; then
        source ./config/functions/setup_mac.sh
        setup_mac
    fi
    
    # 공통 설정
    source ./config/functions/backup.sh
    backup # backup dotfiles to /tmp/dotfiles.bak
    symlink_dotfiles
    
    # Oh-My-Zsh 설치
    source ./config/functions/install_omz.sh
    install_omz
    
    log_success "설치 완료!"
}

# 스크립트 실행
main
