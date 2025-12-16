#!/bin/bash

# ============================================
# $HOME 스냅샷 기능
# ============================================
# 설치 전 $HOME 디렉토리의 상태를 기록하여
# 문제 발생 시 참조할 수 있도록 함
#
# Phase 4: 에러 처리 개선 - 스냅샷 기능

# ============================================
# $HOME 스냅샷 생성
# ============================================
create_home_snapshot() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    local snapshot_dir="${dotfiles_dir}/.bak/snapshots"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local snapshot_file="${snapshot_dir}/home_snapshot_${timestamp}.txt"
    
    echo "Creating $HOME snapshot..."
    mkdir -p "$snapshot_dir"
    
    # 스냅샷 헤더
    {
        echo "=========================================="
        echo "HOME Directory Snapshot"
        echo "=========================================="
        echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "User: ${USER:-root}"
        echo "Home: $HOME"
        echo "Hostname: $(hostname)"
        echo "OS: $(uname -s)"
        echo "=========================================="
        echo ""
    } > "$snapshot_file"
    
    # Method 1: tree 명령어가 있으면 사용 (가장 가독성 좋음)
    if command -v tree &>/dev/null; then
        echo "Using tree command for snapshot..."
        {
            echo "=== Tree View (Level 2) ==="
            tree -L 2 -a -h --du "$HOME" 2>/dev/null || echo "Tree command failed"
            echo ""
        } >> "$snapshot_file"
    fi
    
    # Method 2: ls -lah 재귀 (tree가 없을 경우)
    echo "Creating detailed file listing..."
    {
        echo "=== Detailed File Listing (ls -lah) ==="
        echo ""
        
        # 루트 레벨
        echo "--- $HOME ---"
        ls -lah "$HOME" 2>/dev/null | grep -v "^total" || echo "Failed to list $HOME"
        echo ""
        
        # .config 디렉토리 (중요)
        if [[ -d "$HOME/.config" ]]; then
            echo "--- $HOME/.config ---"
            ls -lah "$HOME/.config" 2>/dev/null | grep -v "^total" || true
            echo ""
        fi
        
        # .local 디렉토리
        if [[ -d "$HOME/.local" ]]; then
            echo "--- $HOME/.local ---"
            ls -lah "$HOME/.local" 2>/dev/null | grep -v "^total" || true
            echo ""
        fi
        
        # dotfiles 관련 파일들
        echo "--- Dotfiles (existing) ---"
        for file in .zshrc .zshenv .bashrc .bash_profile .gitconfig .gitignore .vimrc; do
            if [[ -e "$HOME/$file" ]]; then
                ls -lah "$HOME/$file" 2>/dev/null || true
            fi
        done
        echo ""
        
    } >> "$snapshot_file"
    
    # Method 3: 파일 개수 및 디스크 사용량 통계
    {
        echo "=== Statistics ==="
        echo ""
        echo "Total files in HOME:"
        find "$HOME" -maxdepth 1 -type f 2>/dev/null | wc -l || echo "0"
        echo ""
        echo "Total directories in HOME:"
        find "$HOME" -maxdepth 1 -type d 2>/dev/null | wc -l || echo "0"
        echo ""
        echo "Disk usage (HOME):"
        du -sh "$HOME" 2>/dev/null || echo "Unknown"
        echo ""
        
        # .config 디렉토리 크기
        if [[ -d "$HOME/.config" ]]; then
            echo "Disk usage (.config):"
            du -sh "$HOME/.config" 2>/dev/null || echo "Unknown"
            echo ""
        fi
        
    } >> "$snapshot_file"
    
    # 심볼릭 링크 목록
    {
        echo "=== Existing Symlinks in HOME ==="
        echo ""
        find "$HOME" -maxdepth 1 -type l -ls 2>/dev/null | \
            awk '{print $11, "->", $13}' || echo "No symlinks found"
        echo ""
        
        # .config 내 심볼릭 링크
        if [[ -d "$HOME/.config" ]]; then
            echo "=== Existing Symlinks in .config ==="
            echo ""
            find "$HOME/.config" -maxdepth 1 -type l -ls 2>/dev/null | \
                awk '{print $11, "->", $13}' || echo "No symlinks found"
            echo ""
        fi
        
    } >> "$snapshot_file"
    
    # 스냅샷 푸터
    {
        echo "=========================================="
        echo "Snapshot completed: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Snapshot file: $snapshot_file"
        echo "=========================================="
    } >> "$snapshot_file"
    
    echo "Snapshot saved to: $snapshot_file"
    
    # 최신 스냅샷 심볼릭 링크 생성
    ln -sfn "$snapshot_file" "${snapshot_dir}/latest_snapshot.txt"
    echo "Latest snapshot link: ${snapshot_dir}/latest_snapshot.txt"
    
    return 0
}

# ============================================
# 스냅샷 정리 (오래된 스냅샷 삭제)
# ============================================
cleanup_old_snapshots() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    local snapshot_dir="${dotfiles_dir}/.bak/snapshots"
    
    # 스냅샷이 없으면 스킵
    [[ ! -d "$snapshot_dir" ]] && return 0
    
    # 30일 이상된 스냅샷 삭제
    local keep_days=30
    local deleted_count=0
    
    while IFS= read -r -d '' old_snapshot; do
        rm -f "$old_snapshot"
        echo "Removed old snapshot: $(basename "$old_snapshot")"
        ((deleted_count++))
    done < <(find "$snapshot_dir" -maxdepth 1 -type f -name "home_snapshot_*.txt" -mtime +$keep_days -print0 2>/dev/null)
    
    if [[ $deleted_count -gt 0 ]]; then
        echo "Cleaned up $deleted_count old snapshot(s)"
    fi
    
    return 0
}

# ============================================
# 스냅샷 목록 표시
# ============================================
list_snapshots() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    local snapshot_dir="${dotfiles_dir}/.bak/snapshots"
    
    echo "=== Available Snapshots ==="
    echo ""
    
    if [[ ! -d "$snapshot_dir" ]]; then
        echo "No snapshots directory found"
        return 0
    fi
    
    local snapshot_count=0
    while IFS= read -r snapshot; do
        local size=$(du -sh "$snapshot" 2>/dev/null | cut -f1)
        local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$snapshot" 2>/dev/null || stat -c "%y" "$snapshot" 2>/dev/null | cut -d'.' -f1)
        echo "📸 $(basename "$snapshot")"
        echo "   Date: $date"
        echo "   Size: $size"
        echo ""
        ((snapshot_count++))
    done < <(find "$snapshot_dir" -maxdepth 1 -type f -name "home_snapshot_*.txt" 2>/dev/null | sort -r)
    
    if [[ $snapshot_count -eq 0 ]]; then
        echo "No snapshots found"
    else
        echo "Total: $snapshot_count snapshot(s)"
    fi
    
    return 0
}
