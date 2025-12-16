#!/bin/bash

# ============================================
# 백업 대상 정의 (Phase 1: 백업 범위 명확화)
# ============================================
# NOTE: 실제로 symlink_dotfiles()에서 덮어쓸 것만 백업
# 보존 대상 (.bash_history, .zsh_history, .gitconfig 등)은 제외

# $HOME 루트 파일들 (실제로 덮어쓸 것만)
readonly BACKUP_ROOT_FILES=(
    .zshenv .zshrc .bashrc .gitignore
)

# $HOME/.config/ 내 앱 디렉토리들 (symlink_dotfiles에서 덮어쓸 것만)
readonly BACKUP_CONFIG_APPS=(
    zsh bash git helix tmux vim aliases functions
)

# $HOME/.config/ 내 설정 파일들 (symlink_dotfiles에서 덮어쓸 것만)
readonly BACKUP_CONFIG_FILES=(
    .aliases .env .export .path .secrets
)

# ============================================
# Phase 5: 핵심 백업 함수 (리팩토링)
# ============================================
# _backup_file_core() - 모든 백업 함수의 공통 로직
#
# Parameters:
#   $1: source_path - 백업할 파일/디렉토리 경로
#   $2: backup_dir  - 백업 저장 디렉토리
#   $3: dest_name   - 백업 파일명 (선택, 기본값: basename)
#
_backup_file_core() {
    local source_path=$1
    local backup_dir=$2
    local dest_name=${3:-$(basename "$source_path")}
    
    # 소스가 존재하지 않으면 스킵
    [[ ! -e "$source_path" ]] && return 0
    
    # 백업 디렉토리 생성
    mkdir -p "$backup_dir"
    
    # 타입별 백업 수행
    if [[ -L "$source_path" ]]; then
        # 심볼릭 링크: 로그만 기록
        local target=$(readlink "$source_path")
        echo "$source_path -> $target" >> "$backup_dir/symlinks.log"
        echo "Logged symlink: $source_path -> $target"
        
    elif [[ -d "$source_path" ]]; then
        # 디렉토리: 재귀 복사
        local dest_path="$backup_dir/$dest_name"
        mkdir -p "$(dirname "$dest_path")"
        cp -R "$source_path" "$dest_path"
        echo "Backed up directory: $source_path -> $dest_path"
        
    elif [[ -f "$source_path" ]]; then
        # 일반 파일: 복사
        local dest_path="$backup_dir/$dest_name"
        mkdir -p "$(dirname "$dest_path")"
        cp "$source_path" "$dest_path"
        echo "Backed up file: $source_path -> $dest_path"
    fi
    
    return 0
}

# ============================================
# 단일 파일 백업 함수 (간소화)
# ============================================
backup_single_file() {
    local relative_path=$1  # 예: .zshrc, .config/zsh
    local backup_dir=$2
    
    local full_path="$HOME/$relative_path"
    
    # 심볼릭 링크면 백업하지 않음 (스킵)
    if [[ -L "$full_path" ]]; then
        echo "Skipped symlink: $relative_path"
        return 0
    fi
    
    # 핵심 백업 로직 호출
    _backup_file_core "$full_path" "$backup_dir" "$relative_path"
}

# ============================================
# Original Backup 생성 (개선된 버전)
# ============================================
create_original_backup() {
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # Original backup 디렉토리 설정
    local original_backup_dir="${dotfiles_dir}/.bak/original"
    
    # Original backup이 이미 존재하는지 확인 (멱등성 보장)
    if [[ -d "$original_backup_dir" ]]; then
        echo "Original backup already exists: $original_backup_dir"
        echo "Skipping backup (idempotent operation)"
        return 0
    fi
    
    echo "Creating original backup..."
    echo "NOTE: Only backing up files that will be overwritten by symlinks"
    mkdir -p "$original_backup_dir"
    
    # 1. $HOME 루트 파일들 백업 (실제로 덮어쓸 것만)
    echo "Backing up root files..."
    for file in "${BACKUP_ROOT_FILES[@]}"; do
        if [[ -e "$HOME/$file" && ! -L "$HOME/$file" ]]; then
            backup_single_file "$file" "$original_backup_dir"
        fi
    done
    
    # 2. .config 앱 디렉토리들 백업 (실제로 덮어쓸 것만)
    echo "Backing up .config app directories..."
    for app in "${BACKUP_CONFIG_APPS[@]}"; do
        if [[ -e "$HOME/.config/$app" && ! -L "$HOME/.config/$app" ]]; then
            backup_single_file ".config/$app" "$original_backup_dir"
        fi
    done
    
    # 3. .config 설정 파일들 백업 (실제로 덮어쓸 것만)
    echo "Backing up .config files..."
    for config in "${BACKUP_CONFIG_FILES[@]}"; do
        if [[ -e "$HOME/.config/$config" && ! -L "$HOME/.config/$config" ]]; then
            backup_single_file ".config/$config" "$original_backup_dir"
        fi
    done
    
    # 4. .bin 디렉토리 백업 (symlink_personal_bin에서 덮어씀)
    if [[ -e "$HOME/.bin" && ! -L "$HOME/.bin" ]]; then
        backup_single_file ".bin" "$original_backup_dir"
    fi
    
    # ========================================
    # 제외된 항목들 (백업하지 않음)
    # ========================================
    # .gitconfig       → 보존 (symlink_dotfiles 258줄 주석 처리, 건드리지 않음)
    # .bash_history    → 보존 (사용자 히스토리, 건드리지 않음)
    # .zsh_history     → 보존 (사용자 히스토리, 건드리지 않음)
    # .zsh_sessions    → 보존 (세션 정보, 건드리지 않음)
    # .oh-my-zsh       → 제외 (install_omz.sh가 알아서 설치/관리)
    # .vimrc           → 제외 (symlink_dotfiles 263줄 주석, 사용 안 함)
    # .ideavimrc       → 제외 (symlink_dotfiles 262줄 주석, 사용 안 함)
    # .zcompdump*      → 제외 (자동 재생성)
    # .local/          → 제외 (symlink_dotfiles 239줄 주석, 건드리지 않음)
    # .cache/          → 제외 (symlink_dotfiles 240줄 주석, 건드리지 않음)
    # .config/* (나머지) → 제외 (위에 명시한 것 외 모든 것, VSCode/Chrome 등)
    
    # Original backup 완료 마커 파일 생성
    echo "$(date)" > "$original_backup_dir/.original_backup_created"
    echo "Original backup completed: $original_backup_dir"
}

# ============================================
# Phase 5: 중복 함수 제거 완료
# ============================================
# 제거된 함수:
# - backup_file_to_bak() → backup_single_file()로 통합
# - backup_deprecated() → 완전 제거 (backup_and_symlink가 대체)

# Phase 2: 파일 변경 감지 함수
file_changed() {
    local file1=$1
    local file2=$2
    
    # 파일이 존재하지 않으면 변경된 것으로 간주
    [[ ! -f "$file1" ]] || [[ ! -f "$file2" ]] && return 0
    
    # 크기가 다르면 변경된 것
    local size1=$(stat -f%z "$file1" 2>/dev/null || stat -c%s "$file1" 2>/dev/null)
    local size2=$(stat -f%z "$file2" 2>/dev/null || stat -c%s "$file2" 2>/dev/null)
    [[ "$size1" != "$size2" ]] && return 0
    
    # checksum 비교 (빠른 비교)
    if command -v md5sum &>/dev/null; then
        local hash1=$(md5sum "$file1" | cut -d' ' -f1)
        local hash2=$(md5sum "$file2" | cut -d' ' -f1)
    elif command -v md5 &>/dev/null; then
        local hash1=$(md5 -q "$file1")
        local hash2=$(md5 -q "$file2")
    else
        # checksum 도구 없으면 항상 변경된 것으로 간주 (안전)
        return 0
    fi
    
    [[ "$hash1" != "$hash2" ]] && return 0
    
    # 같으면 변경 안 됨
    return 1
}

# Phase 2: 증분 백업 수행 함수
incremental_backup_file() {
    local source_file=$1
    local backup_dir=$2
    local prev_backup_dir=$3
    local dest_basename=$4
    local timestamp=$5
    
    local backup_path="${backup_dir}/${dest_basename}.${timestamp}"
    local prev_backup_path="${prev_backup_dir}/${dest_basename}".*
    
    # 이전 백업 파일 찾기 (타임스탬프 포함)
    local prev_file=$(ls -t ${prev_backup_path} 2>/dev/null | head -1)
    
    if [[ -n "$prev_file" ]] && ! file_changed "$source_file" "$prev_file"; then
        # 변경 안 됨: 하드링크 생성
        ln "$prev_file" "$backup_path" 2>/dev/null && {
            echo "Hardlinked (unchanged): $backup_path -> $prev_file"
            return 0
        }
        # 하드링크 실패 시 복사로 fallback
    fi
    
    # 변경됨 또는 하드링크 실패: 복사
    if [[ -d "$source_file" ]]; then
        cp -R "$source_file" "$backup_path"
        echo "Copied directory (changed): $backup_path"
    else
        cp "$source_file" "$backup_path"
        echo "Copied file (changed): $backup_path"
    fi
}

backup_and_symlink() {
    local src=$1
    local dest=$2
    local timestamp=$(date +%Y%m%d%H%M%S)
    
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # Phase 2: 백업 디렉토리 설정 (시간 포함 - 증분 백업용)
    local backup_dir="${dotfiles_dir}/.bak/symlinks.${timestamp}"
    mkdir -p "$backup_dir"
    
    # Phase 2: 이전 백업 디렉토리 찾기 (증분 백업용)
    local prev_backup_dir=$(find "${dotfiles_dir}/.bak" -maxdepth 1 -type d -name "symlinks.*" | sort -r | sed -n '2p')

    # Check if the destination exists and is not a symlink
    if [[ -e "$dest" && ! -L "$dest" ]]; then
        local dest_basename=$(basename "$dest")
        local dest_name="${dest_basename}.${timestamp}"
        
        # Phase 2: 증분 백업 수행 (이전 백업이 있으면)
        if [[ -n "$prev_backup_dir" ]] && [[ "$prev_backup_dir" != "$backup_dir" ]]; then
            incremental_backup_file "$dest" "$backup_dir" "$prev_backup_dir" "$dest_basename" "$timestamp"
            # 증분 백업 완료 후 원본 파일 삭제 (symlink 생성을 위해)
            rm -rf "$dest"
        else
            # 최초 백업: 핵심 함수 사용 (Phase 5: 리팩토링)
            _backup_file_core "$dest" "$backup_dir" "$dest_name"
            # 백업 후 원본 제거 (symlink 생성을 위해)
            rm -rf "$dest"
        fi
    elif [[ -L "$dest" ]]; then
        # 이미 심볼릭 링크인 경우 로그만 남기고 넘어감
        echo "Destination already exists as a symlink: $dest -> $(readlink "$dest")"
    fi

    # 대상 디렉토리가 존재하는지 확인하고 없으면 생성
    local dest_dir=$(dirname "$dest")
    mkdir -p "$dest_dir"
    
    # Create the symlink (only if it doesn't exist or points to a different location)
    if [[ ! -L "$dest" ]] || [[ "$(readlink "$dest")" != "$src" ]]; then
        ln -snf "$src" "$dest"
        echo "Created/Updated symlink: $dest -> $src"
    else
        echo "Symlink already correctly set: $dest -> $src"
    fi
}

symlink_personal_bin() {
    # 개인 스크립트 bin 폴더 심볼릭 링크
    backup_and_symlink "$DOTFILES/bin" "$HOME/.bin"
}

symlink_dotfiles() {
    # 필요한 디렉토리가 존재하는지 확인하고 없으면 생성
    mkdir -p "$HOME/.config" "$HOME/.local" "$HOME/.cache"
    
    # Create symlinks for .config, .local, .cache
    # backup_and_symlink "$DOTFILES/config" "$HOME/.config"
    # backup_and_symlink "$DOTFILES/local" "$HOME/.local"
    # backup_and_symlink "$DOTFILES/cache" "$HOME/.cache"

    app_dirs=(zsh bash git helix tmux vim aliases functions)
    for app in "${app_dirs[@]}"; do
        backup_and_symlink "$DOTFILES/config/$app" "$HOME/.config/$app"
    done

    dot_configs=(.aliases .env .export .path .secrets)
    for configs in "${dot_configs[@]}"; do
        backup_and_symlink "$DOTFILES/config/$configs" "$HOME/.config/$configs"
    done

    backup_and_symlink "$DOTFILES/config/zsh/.zshenv" "$HOME/.zshenv"
    backup_and_symlink "$DOTFILES/config/zsh/.zshrc" "$HOME/.zshrc"

    backup_and_symlink "$DOTFILES/config/bash/.bashrc" "$HOME/.bashrc"
    # backup_and_symlink "$DOTFILES/config/bash/.bash_profile" "$HOME/.bash_profile"

    # backup_and_symlink "$DOTFILES/config/git/.gitconfig" "$HOME/.gitconfig"
    backup_and_symlink "$DOTFILES/config/git/.gitignore" "$HOME/.gitignore"

    # Uncomment if needed
    # backup_and_symlink "$DOTFILES/config/ideavim/.ideavimrc" "$HOME/.ideavimrc"
    # backup_and_symlink "$DOTFILES/config/vim/.vimrc" "$HOME/.vimrc"

    # 개인 스크립트 bin 폴더 심볼릭 링크
    symlink_personal_bin

    # 폴더 모니터링 용 symlink
    # !NOTE: or config에 있는 사용하는 app config만 symlink를 걸까..?
    # 이 부분은 문제가 될 수 있으므로 주석 처리하고 대신 디렉토리 생성만 함
    # 이미 $HOME/.config가 심볼릭 링크인 경우 순환 참조가 발생할 수 있음
    # TODO:
    mkdir -p "$DOTFILES/monitoring/config" "$DOTFILES/monitoring/local" "$DOTFILES/monitoring/cache"
    echo "Created monitoring directories. Manual monitoring setup may be required."
}

# Create reference symlinks in .dotfiles for IDE convenience
# This allows viewing $HOME/.local, .cache, .config directly from .dotfiles directory
create_dotfiles_references() {
    local dotfiles_dir="${DOTFILES:-$HOME/.dotfiles}"
    
    # Create symlinks to parent directories for IDE convenience
    # These links are excluded from git via .gitignore
    for dir in .local .cache .config; do
        local link_path="$dotfiles_dir/$dir"
        
        # Only create if it doesn't exist and target exists
        if [[ ! -e "$link_path" ]] && [[ -d "$HOME/$dir" ]]; then
            ln -s "../$dir" "$link_path"
            log "Created IDE reference: .dotfiles/$dir -> ../$dir"
        elif [[ -L "$link_path" ]]; then
            log "Reference link already exists: .dotfiles/$dir"
        fi
    done
}

# Phase 3: 스마트 백업 정리 함수
cleanup_old_backups() {
    local backup_root="${1:-$HOME/.dotfiles/.bak}"
    
    # 환경 변수 기본값 설정
    local keep_days=${BACKUP_KEEP_DAYS:-30}
    local max_backups=${BACKUP_MAX_COUNT:-10}
    local max_size_mb=${BACKUP_MAX_SIZE_MB:-1000}
    
    # .bak 디렉토리가 없으면 스킵
    [[ ! -d "$backup_root" ]] && return 0
    
    log "백업 정리 시작 (정책: ${keep_days}일, 최대 ${max_backups}개, ${max_size_mb}MB)"
    
    # 1. 보관 기간 기반 정리 (N일 이상된 백업 삭제)
    local deleted_by_age=0
    local age_threshold_seconds=$((keep_days * 24 * 3600))
    local current_time=$(date +%s)
    
    find "$backup_root" -maxdepth 1 -type d -name "symlinks.*" | while read -r backup_dir; do
        local backup_time=$(stat -f%m "$backup_dir" 2>/dev/null || stat -c%Y "$backup_dir" 2>/dev/null)
        local age_seconds=$((current_time - backup_time))
        
        if [[ $age_seconds -gt $age_threshold_seconds ]]; then
            rm -rf "$backup_dir"
            log "보관 기간 초과로 삭제: $(basename "$backup_dir") ($(($age_seconds / 86400))일 경과)"
            ((deleted_by_age++))
        fi
    done
    
    [[ $deleted_by_age -gt 0 ]] && log_success "보관 기간 기준 정리: ${deleted_by_age}개 삭제"
    
    # 2. 개수 기반 정리 (최대 개수 초과 시 오래된 것부터 삭제)
    local backup_count=$(find "$backup_root" -maxdepth 1 -type d -name "symlinks.*" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $backup_count -gt $max_backups ]]; then
        local excess=$((backup_count - max_backups))
        log "백업 개수 초과 (${backup_count}/${max_backups}), ${excess}개 삭제 예정..."
        
        # 가장 오래된 것부터 삭제
        find "$backup_root" -maxdepth 1 -type d -name "symlinks.*" -print0 | \
            xargs -0 ls -dt | tail -n $excess | while read -r old_backup; do
            rm -rf "$old_backup"
            log "개수 초과로 삭제: $(basename "$old_backup")"
        done
        
        log_success "개수 기준 정리: ${excess}개 삭제"
    else
        log "백업 개수 OK: ${backup_count}/${max_backups}"
    fi
    
    # 3. 디스크 사용량 기반 정리 (최대 크기 초과 시 오래된 것부터 삭제)
    local total_size=$(du -sm "$backup_root" 2>/dev/null | cut -f1)
    
    if [[ $total_size -gt $max_size_mb ]]; then
        log "백업 크기 초과 (${total_size}MB/${max_size_mb}MB), 정리 시작..."
        local deleted_by_size=0
        
        while [[ $total_size -gt $max_size_mb ]]; do
            # 가장 오래된 백업 찾기
            local oldest=$(find "$backup_root" -maxdepth 1 -type d -name "symlinks.*" -print0 | \
                xargs -0 ls -dt | tail -n 1)
            
            if [[ -z "$oldest" ]]; then
                log "더 이상 삭제할 백업이 없습니다."
                break
            fi
            
            rm -rf "$oldest"
            log "디스크 사용량 초과로 삭제: $(basename "$oldest")"
            ((deleted_by_size++))
            
            total_size=$(du -sm "$backup_root" 2>/dev/null | cut -f1)
        done
        
        [[ $deleted_by_size -gt 0 ]] && log_success "디스크 사용량 기준 정리: ${deleted_by_size}개 삭제 (현재: ${total_size}MB)"
    else
        log "백업 크기 OK: ${total_size}MB/${max_size_mb}MB"
    fi
    
    log_success "백업 정리 완료"
}
