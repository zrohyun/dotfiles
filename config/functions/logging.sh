#!/usr/bin/env bash

# ============================================
# Phase 5: 로깅 개선
# ============================================
# - 로그 레벨 추가 (DEBUG, INFO, WARNING, ERROR)
# - 로그 경로 통일 (~/.dotfiles/.log/)
# - 로그 마이그레이션 로직 개선
# - 로그 로테이션 추가

# ============================================
# 로그 설정
# ============================================
LOGFILE="${LOGFILE:-}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"  # DEBUG, INFO, WARNING, ERROR

# Timezone 설정 (KST)
export TZ=${TZ:-Asia/Seoul}

# 로그 레벨 우선순위 (숫자가 낮을수록 높은 우선순위)
declare -A LOG_LEVEL_PRIORITY=(
    [DEBUG]=0
    [INFO]=1
    [WARNING]=2
    [ERROR]=3
)

# ============================================
# 로그 레벨 비교
# ============================================
_should_log() {
    local msg_level=$1
    local current_priority=${LOG_LEVEL_PRIORITY[$LOG_LEVEL]:-1}
    local msg_priority=${LOG_LEVEL_PRIORITY[$msg_level]:-0}
    
    [[ $msg_priority -ge $current_priority ]]
}

# ============================================
# 로깅 초기화
# ============================================
init_logging() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    local log_dir=""

    if [[ "${INSTALL_MODE:-}" == "curl" ]]; then
        # curl 모드: install.sh만 다운로드되어 실행되므로 임시 로그 디렉토리 사용
        local timestamp
        timestamp=$(date +%Y%m%d_%H%M%S)
        log_dir="$HOME/.dotfiles_temp_logs_${timestamp}"
    else
        # 로컬 모드: 정식 로그 디렉토리
        log_dir="${script_dir}/.log"
    fi

    mkdir -p "$log_dir"
    
    # 타임스탬프 로그 파일
    LOGFILE="${log_dir}/install_log_$(date +%Y%m%d_%H%M%S).log"
    
    # 메인 로그 파일 (누적)
    MAIN_LOGFILE="${log_dir}/install.log"
    
    echo "로그 파일: $LOGFILE"
    echo "메인 로그: $MAIN_LOGFILE"

    # 타임스탬프 로그와 메인 로그에 모두 기록
    exec > >(tee -a "$LOGFILE" "$MAIN_LOGFILE") 2>&1
    
    # 로그 시작 헤더
    log_info "=========================================="
    log_info "Dotfiles Installation Log"
    log_info "Date: $(date -Iseconds)"
    log_info "User: ${USER:-None}"
    log_info "Home: $HOME"
    log_info "PWD: $PWD"
    log_info "Log Level: $LOG_LEVEL"
    log_info "=========================================="
}

# ============================================
# 로그 함수들
# ============================================
log_debug() {
    _should_log "DEBUG" || return 0
    echo "[DEBUG] $(date -Iseconds) - 🔍 $1"
}

log_info() {
    _should_log "INFO" || return 0
    echo "[INFO] $(date -Iseconds) - ℹ️  $1"
}

log_warning() {
    _should_log "WARNING" || return 0
    echo "[WARNING] $(date -Iseconds) - ⚠️  $1"
}

log_error() {
    _should_log "ERROR" || return 0
    echo "[ERROR] $(date -Iseconds) - ❌ $1" >&2
}

# ============================================
# 하위 호환성을 위한 기존 함수 유지
# ============================================
log() {
    log_info "$1"
}

log_success() {
    echo "[SUCCESS] $(date -Iseconds) - ✅ $1"
}

ensure_sudo_session() {
    if command -v sudo &>/dev/null; then
        log_info "sudo 권한 확인 중..."
        if sudo -n true 2>/dev/null; then
            sudo -v
            log_success "sudo 권한 확인 완료"
            export HAS_SUDO=1
        else
            log_warning "sudo 권한이 없습니다. sudo 없이 계속 진행합니다."
            export HAS_SUDO=0
        fi
    else
        log_warning "sudo 명령어를 찾을 수 없습니다. sudo 없이 계속 진행합니다."
        export HAS_SUDO=0
    fi
}

# ============================================
# 안전한 source 헬퍼 함수
# ============================================
# 파일 존재 여부를 확인하고 source
# Usage: safe_source <file_path> [required=true]
safe_source() {
    local file=$1
    local required=${2:-true}  # 기본값: 필수 파일
    
    if [[ -f "$file" ]]; then
        source "$file"
        log_debug "Loaded: $file"
    elif [[ "$required" == "true" ]]; then
        log_error "필수 파일을 찾을 수 없습니다: $file"
        exit 1
    else
        log_warning "선택 파일을 찾을 수 없습니다 (스킵): $file"
    fi
}

# ============================================
# 로그 마이그레이션
# ============================================
# curl 모드의 임시 로그를 로컬 모드 로그로 이동
migrate_temp_logs() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    local target_log_dir="${script_dir}/.log"
    local migrated_count=0
    
    # 임시 로그 디렉토리 찾기 (배열을 먼저 생성하여 고정)
    local temp_logs_array=()
    while IFS= read -r -d '' temp_log_dir; do
        temp_logs_array+=("$temp_log_dir")
    done < <(find "$HOME" -maxdepth 1 -type d -name ".dotfiles_temp_logs_*" -print0 2>/dev/null)
    
    # 임시 로그 디렉토리가 없으면 스킵
    if [[ ${#temp_logs_array[@]} -eq 0 ]]; then
        return 0
    fi
    
    # 로그 출력 없이 조용히 마이그레이션 (무한 루프 방지)
    mkdir -p "$target_log_dir"
    
    # 고정된 배열로 루프 실행 (새로운 디렉토리 생성 방지)
    for temp_log_dir in "${temp_logs_array[@]}"; do
        if [[ -d "$temp_log_dir" ]]; then
            # 로그 파일들 복사
            cp -R "$temp_log_dir"/* "$target_log_dir/" 2>/dev/null || true
            
            # 임시 디렉토리 제거
            rm -rf "$temp_log_dir"
            
            ((migrated_count++))
        fi
    done
    
    # 마이그레이션 완료 후에만 로그 출력 (한 번만)
    if [[ $migrated_count -gt 0 ]]; then
        log_info "임시 로그 마이그레이션 완료: ${migrated_count}개 디렉토리"
    fi
    
    return 0
}

# ============================================
# 로그 로테이션
# ============================================
# 오래된 로그 파일 정리
rotate_logs() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    local log_dir="${script_dir}/.log"
    local keep_days=${LOG_KEEP_DAYS:-30}
    local max_logs=${LOG_MAX_COUNT:-50}
    local deleted_count=0
    
    # 로그 디렉토리가 없으면 스킵
    [[ ! -d "$log_dir" ]] && return 0
    
    log_debug "로그 로테이션 시작 (보관 기간: ${keep_days}일, 최대 개수: ${max_logs}개)"
    
    # 1. 보관 기간 기반 정리
    while IFS= read -r -d '' old_log; do
        rm -f "$old_log"
        log_debug "오래된 로그 삭제: $(basename "$old_log")"
        ((deleted_count++))
    done < <(find "$log_dir" -maxdepth 1 -type f -name "install_log_*.log" -mtime +$keep_days -print0 2>/dev/null)
    
    # 2. 개수 기반 정리
    local log_count=$(find "$log_dir" -maxdepth 1 -type f -name "install_log_*.log" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $log_count -gt $max_logs ]]; then
        local excess=$((log_count - max_logs))
        log_debug "로그 개수 초과 (${log_count}개), ${excess}개 삭제 예정"
        
        find "$log_dir" -maxdepth 1 -type f -name "install_log_*.log" \
            -printf '%T+ %p\n' 2>/dev/null | sort | head -n $excess | cut -d' ' -f2- | \
            while IFS= read -r old_log; do
                rm -f "$old_log"
                log_debug "개수 초과 로그 삭제: $(basename "$old_log")"
                ((deleted_count++))
            done
    fi
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "로그 로테이션 완료: ${deleted_count}개 삭제"
    else
        log_debug "로그 로테이션: 삭제할 로그 없음"
    fi
    
    return 0
}

