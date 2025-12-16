#!/bin/bash
set -euo pipefail

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

# ============================================
# 0. 공통 유틸리티 함수 (모든 모드에서 사용)
# ============================================
# 운영체제 감지 함수 - curl 모드와 로컬 모드 모두에서 사용
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Mac"
    else
        echo "Unknown"
    fi
}

# ============================================
# 1. 초기 설정 및 모드 감지
# ============================================
INSTALL_OMZ=${INSTALL_OMZ:-1}

# 모드 감지 (최소한의 로직만 사용)
if [[ -n "${DOTFILES_INTERNAL_SOURCE:-}" ]] || [[ -e "./.git" ]]; then
    INSTALL_MODE="local"
else
    INSTALL_MODE="curl"
fi
export INSTALL_MODE

# ============================================
# 2. curl 모드 처리 (조기 종료)
# ============================================
if [[ "$INSTALL_MODE" == "curl" ]]; then
    # curl 모드 전용: 최소 fallback 로깅 시스템
    # (로컬 모드의 logging.sh를 사용할 수 없으므로 인라인으로 정의)
    export TZ=${TZ:-Asia/Seoul}
    
    # curl 모드 전용 로깅 함수들
    init_logging_fallback() {
        local log_dir="$HOME/.dotfiles_temp_logs_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$log_dir"
        LOGFILE="${log_dir}/install_log_$(date +%Y%m%d_%H%M%S).log"
        echo "로그 파일: $LOGFILE"
        exec > >(tee -a "$LOGFILE") 2>&1
    }
    log() { echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"; }
    log_success() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ $1"; }
    log_error() { echo "$(date +"%Y-%m-%d %H:%M:%S") - ❌ $1"; }
    
    # curl 모드 전용: sudo 세션 확인 함수
    # (로컬 모드의 logging.sh의 ensure_sudo_session과 동일한 로직)
    ensure_sudo_session() {
        if command -v sudo &>/dev/null; then
            log "sudo 권한 확인 중..."
            if sudo -n true 2>/dev/null; then
                sudo -v
                log_success "sudo 권한 확인 완료"
                export HAS_SUDO=1
            else
                log "sudo 권한이 없습니다. sudo 없이 계속 진행합니다."
                export HAS_SUDO=0
            fi
        else
            log "sudo 명령어를 찾을 수 없습니다. sudo 없이 계속 진행합니다."
            export HAS_SUDO=0
        fi
    }
    
    # curl 모드 초기화
    init_logging_fallback
    ensure_sudo_session
    
    # curl 모드 전용: Homebrew 설치 함수
    # (로컬 모드의 install_dependencies.sh의 install_homebrew와 동일한 로직)
    install_homebrew() {
        local machine
        machine=$(detect_os)
        
        if [[ "$machine" != "Mac" ]]; then
            return 0
        fi
        
        if command -v brew &>/dev/null; then
            log_success "Homebrew가 이미 설치되어 있습니다"
            return 0
        fi
        
        log "Homebrew 설치 중..."
        if ! /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
            log_error "Homebrew 설치 실패"
            exit 1
        fi
        
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        if command -v brew &>/dev/null; then
            log_success "Homebrew 설치 완료"
        else
            log_error "Homebrew 설치 후 PATH 설정 실패"
            exit 1
        fi
    }
    
    # curl 모드 전용: Git 설치 함수
    # (로컬 모드의 install_dependencies.sh의 install_git와 동일 로직)
    install_git() {
        local machine
        machine=$(detect_os)
        
        if [[ $machine == "Mac" ]]; then
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
    
    # curl 모드 전용: dotfiles 저장소 클론 함수
    curl_install_dotfiles() {
        local dotfiles_dir="$HOME/.dotfiles"
        log "curl 모드: dotfiles 저장소 설치 시작"

        if [[ "$PWD" == "$dotfiles_dir" ]]; then
            local remote_url
            remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url 2>/dev/null || true)
            if [[ "$remote_url" == *"github.com/zrohyun/dotfiles"* ]]; then
                log_success "이미 올바른 dotfiles 디렉토리에 있습니다"
                return 0
            fi
        fi

        local machine
        machine=$(detect_os)

        if [[ $machine == "Mac" ]]; then
            install_homebrew
            if ! command -v git &>/dev/null; then
                log "Git이 설치되어 있지 않습니다. Homebrew를 통해 설치합니다."
                install_git
            fi
        elif [[ $machine == "Linux" ]]; then
            if ! command -v git &>/dev/null; then
                log "Git이 설치되어 있지 않습니다. 운영체제에 맞는 설치를 진행합니다."
                install_git
            fi
        else
            log_error "지원되지 않는 운영체제입니다: $machine"
            exit 1
        fi

        if [[ -d $dotfiles_dir ]]; then
            local remote_url
            remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url 2>/dev/null || true)
            if [[ "$remote_url" == *"github.com/zrohyun/dotfiles"* ]]; then
                log_success "dotfiles 디렉토리가 이미 존재합니다"
                cd "$dotfiles_dir" || exit 1
                return 0
            else
                local backup_dir="${dotfiles_dir}.bak.$(TZ=Asia/Seoul date +%Y%m%d%H%M%S)"
                log "기존 dotfiles 디렉토리를 백업합니다: $backup_dir"
                mv "$dotfiles_dir" "$backup_dir" || {
                    log_error "기존 dotfiles 디렉토리 백업 실패"
                    exit 1
                }
            fi
        fi

        log "dotfiles 저장소를 클론합니다..."
        if ! git clone --depth=1 -b main https://github.com/zrohyun/dotfiles.git "$dotfiles_dir"; then
            log_error "dotfiles 저장소 클론 실패"
            exit 1
        fi
        
        cd "$dotfiles_dir" || {
            log_error "dotfiles 디렉토리로 이동 실패"
            exit 1
        }

        local temp_logs_dir
        temp_logs_dir=$(find "$HOME" -maxdepth 1 -type d -name ".dotfiles_temp_logs_*" 2>/dev/null | sort -r | head -n 1)
        if [[ -n "$temp_logs_dir" && -d "$temp_logs_dir" ]]; then
            mkdir -p "$dotfiles_dir/.log"
            cp -R "$temp_logs_dir/"* "$dotfiles_dir/.log/" 2>/dev/null || true
            log "임시 로그 파일을 .log 디렉토리로 복사했습니다."
            rm -rf "$temp_logs_dir"
            log "임시 로그 디렉토리를 정리했습니다."
        fi

        log_success "dotfiles 저장소 클론 완료"
    }
    
    # 저장소 클론
    if ! curl_install_dotfiles; then
        log_error "dotfiles 저장소 클론 실패"
        exit 1
    fi
    
    # 로컬 install.sh 스크립트 실행
    log "로컬 install.sh 스크립트를 실행합니다..."
    export DOTFILES_INTERNAL_SOURCE=1
    if ! source ./install.sh; then
        log_error "로컬 install.sh 실행 실패"
        exit 1
    fi
    exit 0
fi

# ============================================
# 3. 로컬 모드 - 로깅 초기화
# ============================================
# 로컬 모드: 전체 로깅 시스템
if [[ -f "./config/functions/logging.sh" ]]; then
    source ./config/functions/logging.sh
    
    # Phase 5: 로그 마이그레이션 (curl 모드 → 로컬 모드)
    # init_logging 이전에 실행하여 무한 루프 방지
    migrate_temp_logs_silent() {
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
        local target_log_dir="${script_dir}/.log"
        local temp_logs_array=()
        
        # 임시 로그 디렉토리 찾기 (배열에 먼저 저장)
        while IFS= read -r -d '' temp_log_dir; do
            temp_logs_array+=("$temp_log_dir")
        done < <(find "$HOME" -maxdepth 1 -type d -name ".dotfiles_temp_logs_*" -print0 2>/dev/null)
        
        if [[ ${#temp_logs_array[@]} -eq 0 ]]; then
            return 0
        fi
        
        # 고정된 배열로 마이그레이션 (무한 루프 방지)
        mkdir -p "$target_log_dir"
        for temp_log_dir in "${temp_logs_array[@]}"; do
            if [[ -d "$temp_log_dir" ]]; then
                # 파일 목록을 먼저 배열에 저장 (무한 루프 방지)
                local files_array=()
                while IFS= read -r -d '' file; do
                    files_array+=("$file")
                done < <(find "$temp_log_dir" -type f -print0 2>/dev/null)
                
                # 저장된 파일 배열로 복사 (안전)
                for file in "${files_array[@]}"; do
                    [[ -f "$file" ]] && cp "$file" "$target_log_dir/" 2>/dev/null || true
                done
                
                # 임시 디렉토리 제거
                rm -rf "$temp_log_dir" 2>/dev/null || true
            fi
        done
    }
    migrate_temp_logs_silent
    
    init_logging
    
    # Phase 5: 로그 로테이션 (오래된 로그 정리)
    rotate_logs
    
    ensure_sudo_session
else
    echo "❌ logging.sh를 찾을 수 없습니다."
    exit 1
fi

# ============================================
# 4. 로컬 모드 - 함수 로드
# ============================================

# 기본 함수 로드
source ./config/functions/entry.sh
source ./config/functions/install_mode.sh

# 의존성 설치 함수
source ./config/functions/install_dependencies.sh

# 설정 함수
source ./config/functions/setup_config.sh

# 백업 함수
source ./config/functions/backup.sh

# 스냅샷 함수 (Phase 4: 에러 처리 개선)
source ./config/functions/snapshot.sh

# 기타 함수들
source ./config/functions/functions.sh

# OS별 설정
machine=$(detect_os)
if [[ $machine == "Linux" ]]; then
    source ./config/functions/setup_linux.sh
elif [[ $machine == "Mac" ]]; then
    if [[ -f "./config/functions/setup_mac.sh" ]]; then
        source ./config/functions/setup_mac.sh
    fi
fi

# ============================================
# 5. 유틸리티 함수
# ============================================
# 임시 로그 디렉토리 정리 함수
cleanup_temp_logs() {
    local temp_logs_dir
    temp_logs_dir=$(find "$HOME" -maxdepth 1 -type d -name ".dotfiles_temp_logs_*" 2>/dev/null | sort -r | head -n 1)
    if [[ -n "$temp_logs_dir" && -d "$temp_logs_dir" ]]; then
        rm -rf "$temp_logs_dir"
        log "임시 로그 디렉토리를 정리했습니다."
    fi
}

# ============================================
# 6. 메인 설치 로직
# ============================================
main() {
    log "설치 스크립트 시작 (로컬 모드)"
    
    # 현재 디렉토리 저장
    DOTFILES="$PWD"
    export DOTFILES
    
    # Phase 4: $HOME 스냅샷 생성 (설치 전 상태 기록)
    log "Phase 4: $HOME 스냅샷 생성 중..."
    create_home_snapshot
    cleanup_old_snapshots
    log_success "스냅샷 생성 완료"
    
    # 운영체제 감지
    local machine
    machine=$(detect_os)
    log "감지된 운영체제: $machine"
    
    # 의존성 확인 및 설치
    ensure_dependencies
    
    # 운영체제별 초기 설정
    if [[ $machine == "Linux" ]]; then
        setup_linux
        install_system_locales
    elif [[ $machine == "Mac" ]]; then
        if command -v setup_mac &>/dev/null; then
            setup_mac
        fi
    else
        log_error "지원되지 않는 운영체제입니다: $machine"
        exit 1
    fi
    
    # 백업 생성 (Phase 1: 백업 범위 명확화 완료)
    # - create_original_backup(): 실제로 덮어쓸 것만 백업 (5-20MB)
    # - backup() 호출 제거: backup_and_symlink()가 이미 백업하므로 중복
    # - 멱등성 보장: 반복 설치 시 original 백업이 있으면 스킵
    create_original_backup
    # backup  # Phase 1에서 제거 (backup_and_symlink가 이미 백업)
    
    # 설정 파일 생성
    create_secrets_local
    setup_local_config
    
    # 심볼릭 링크 생성
    symlink_dotfiles
    
    # IDE 편의성: .dotfiles 안에 $HOME 주요 디렉토리 참조 링크 생성
    create_dotfiles_references
    
    # Phase 3: 스마트 백업 정리 (오래된 백업 자동 삭제)
    # SKIP_BACKUP_CLEANUP=1로 스킵 가능 (테스트용)
    if [[ "${SKIP_BACKUP_CLEANUP:-0}" != "1" ]]; then
        cleanup_old_backups "$DOTFILES/.bak"
    fi
    
    # 환경 변수 설정 (.path 등 심볼릭 링크가 준비된 이후)
    # .zshenv에서도 로드하지만, install.sh 실행 시점에는 심볼릭 링크가 생성된 직후이므로
    # 여기서도 로드하여 설치 과정에서 필요한 환경 변수를 사용할 수 있도록 함
    if [[ -f "./config/.env" ]]; then
        fpath=${fpath:-()}
        source ./config/.env
    fi
    
    # Oh-My-Zsh 설치 (옵션)
    if [[ "${INSTALL_OMZ}" -eq 1 ]]; then
        source ./config/functions/install_omz.sh
        install_omz
    else
        log "Skipping Oh-My-Zsh install (INSTALL_OMZ=0)"
    fi
    
    # 임시 로그 디렉토리 정리
    cleanup_temp_logs
    
    # Phase 5: 로그 종료 헤더
    log_info "=========================================="
    log_info "Installation Completed Successfully"
    log_info "End Time: $(date -Iseconds)"
    log_info "=========================================="
    
    log_success "설치 완료!"
    
    # Shell 초기화 (interactive shell 한 번 실행)
    # .bashrc와 .zshenv가 로드되면서 필요한 디렉토리 자동 생성
    log_info "Shell 초기화 중..."
    
    # Bash 초기화 (interactive shell 실행하여 .bashrc 로드)
    if command -v bash &>/dev/null; then
        bash -i -c "exit 0" 2>/dev/null || true
        log_success "Bash 초기화 완료"
    fi
    
    # Zsh 초기화 (interactive shell 실행하여 .zshenv 로드)
    if command -v zsh &>/dev/null; then
        zsh -i -c "exit 0" 2>/dev/null || true
        log_success "Zsh 초기화 완료"
    fi
}

# 스크립트 실행
main
