#!/bin/bash

#   ____           _                 
#  |  _ \ ___  ___| |_ ___  _ __ ___ 
#  | |_) / _ \/ __| __/ _ \| '__/ _ \
#  |  _ <  __/\__ \ || (_) | | |  __/
#  |_| \_\___||___/\__\___/|_|  \___|
#
# Dotfiles 복원 스크립트
# 
# 실행 방법:
# 1. Original backup으로 복원: ./restore.sh --original
# 2. 특정 백업으로 복원: ./restore.sh --backup YYYYMMDD.HHMMSS
# 3. 최신 백업으로 복원: ./restore.sh --latest

# 현재 스크립트의 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="$SCRIPT_DIR"
BACKUP_ROOT="${DOTFILES_DIR}/.bak"

log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

log_success() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ $1"
}

log_error() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ❌ $1"
}

show_usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  --original          Original backup으로 복원 (최초 설치 전 상태)"
    echo "  --backup TIMESTAMP  특정 백업으로 복원 (예: 20241225.143022)"
    echo "  --latest            최신 백업으로 복원"
    echo "  --list              사용 가능한 백업 목록 표시"
    echo "  --help              이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 --original"
    echo "  $0 --backup 20241225.143022"
    echo "  $0 --latest"
}

list_backups() {
    echo "사용 가능한 백업 목록:"
    echo ""
    
    if [[ -d "$BACKUP_ROOT/original" ]]; then
        echo "📦 original - Original backup (최초 설치 전 상태)"
        if [[ -f "$BACKUP_ROOT/original/.original_backup_created" ]]; then
            created_date=$(cat "$BACKUP_ROOT/original/.original_backup_created")
            echo "   생성일: $created_date"
        fi
        echo ""
    fi
    
    echo "📅 타임스탬프 백업들:"
    find "$BACKUP_ROOT" -maxdepth 1 -type d -not -name "original" -not -name "latest" -not -name "$(basename "$BACKUP_ROOT")" | sort -r | while read -r backup_dir; do
        if [[ -d "$backup_dir" ]]; then
            backup_name=$(basename "$backup_dir")
            echo "   $backup_name"
        fi
    done
    
    if [[ -L "$BACKUP_ROOT/latest" ]]; then
        latest_target=$(readlink "$BACKUP_ROOT/latest")
        echo ""
        echo "🔗 latest -> $(basename "$latest_target")"
    fi
}

backup_current_state() {
    log "현재 상태를 백업 중..."
    
    # backup.sh 함수 로드
    source "$DOTFILES_DIR/config/functions/backup.sh"
    
    # 현재 상태 백업
    backup
    
    log_success "현재 상태 백업 완료"
}

restore_from_backup() {
    local backup_dir="$1"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "백업 디렉토리를 찾을 수 없습니다: $backup_dir"
        exit 1
    fi
    
    log "백업에서 복원 중: $backup_dir"
    
    # 복원할 파일 목록
    files=(
        .zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc
        .oh-my-zsh .bash_history .zsh_history .zsh_sessions 
        .zcompdump .zcompdump-$HOSTNAME .zcompdump-$HOSTNAME.zwc
    )
    
    # 파일 복원
    for file in "${files[@]}"; do
        if [[ -e "$backup_dir/$file" ]]; then
            # 현재 파일이 심볼릭 링크인 경우 제거
            if [[ -L "$HOME/$file" ]]; then
                rm "$HOME/$file"
                log "심볼릭 링크 제거: $file"
            fi
            
            if [[ -d "$backup_dir/$file" ]]; then
                cp -R "$backup_dir/$file" "$HOME/"
                log "디렉토리 복원: $file"
            else
                cp "$backup_dir/$file" "$HOME/"
                log "파일 복원: $file"
            fi
        fi
    done
    
    # .config, .local, .cache 디렉토리 복원
    config_dirs=(.config .local .cache)
    for dir in "${config_dirs[@]}"; do
        if [[ -d "$backup_dir/$dir" ]]; then
            # 현재 디렉토리가 심볼릭 링크인 경우 제거
            if [[ -L "$HOME/$dir" ]]; then
                rm "$HOME/$dir"
                log "심볼릭 링크 제거: $dir"
            fi
            
            mkdir -p "$HOME/$dir"
            cp -R "$backup_dir/$dir/"* "$HOME/$dir/" 2>/dev/null || true
            log "디렉토리 복원: $dir"
        fi
    done
    
    # 심볼릭 링크 복원
    if [[ -f "$backup_dir/symlinks.log" ]]; then
        log "심볼릭 링크 복원 중..."
        while IFS=' -> ' read -r link_path target_path; do
            if [[ -n "$link_path" && -n "$target_path" ]]; then
                # 기존 파일/디렉토리 제거
                if [[ -e "$HOME/$link_path" ]]; then
                    rm -rf "$HOME/$link_path"
                fi
                
                # 심볼릭 링크 생성 (타겟이 존재하는 경우에만)
                if [[ -e "$target_path" ]]; then
                    ln -sf "$target_path" "$HOME/$link_path"
                    log "심볼릭 링크 복원: $link_path -> $target_path"
                fi
            fi
        done < "$backup_dir/symlinks.log"
    fi
    
    log_success "복원 완료: $backup_dir"
}

confirm_restore() {
    local backup_type="$1"
    
    echo ""
    echo "⚠️  경고: 이 작업은 현재 dotfiles 설정을 $backup_type(으)로 덮어씁니다."
    echo "현재 상태는 자동으로 백업됩니다."
    echo ""
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "복원이 취소되었습니다."
        exit 0
    fi
}

main() {
    case "${1:-}" in
        --original)
            if [[ ! -d "$BACKUP_ROOT/original" ]]; then
                log_error "Original backup을 찾을 수 없습니다."
                log "먼저 install.sh를 실행하여 original backup을 생성하세요."
                exit 1
            fi
            
            confirm_restore "original backup"
            backup_current_state
            restore_from_backup "$BACKUP_ROOT/original"
            ;;
            
        --backup)
            if [[ -z "$2" ]]; then
                log_error "백업 타임스탬프를 지정해주세요."
                show_usage
                exit 1
            fi
            
            backup_dir="$BACKUP_ROOT/$2"
            if [[ ! -d "$backup_dir" ]]; then
                log_error "백업을 찾을 수 없습니다: $2"
                list_backups
                exit 1
            fi
            
            confirm_restore "백업 $2"
            backup_current_state
            restore_from_backup "$backup_dir"
            ;;
            
        --latest)
            if [[ ! -L "$BACKUP_ROOT/latest" ]]; then
                log_error "최신 백업을 찾을 수 없습니다."
                exit 1
            fi
            
            latest_backup=$(readlink "$BACKUP_ROOT/latest")
            confirm_restore "최신 백업"
            backup_current_state
            restore_from_backup "$latest_backup"
            ;;
            
        --list)
            list_backups
            ;;
            
        --help|"")
            show_usage
            ;;
            
        *)
            log_error "알 수 없는 옵션: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
