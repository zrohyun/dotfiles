#!/bin/bash

create_original_backup() {
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # Original backup 디렉토리 설정
    local original_backup_dir="${dotfiles_dir}/.bak/original"
    
    # Original backup이 이미 존재하는지 확인
    if [[ -d "$original_backup_dir" ]]; then
        echo "Original backup already exists: $original_backup_dir"
        return 0
    fi
    
    echo "Creating original backup..."
    mkdir -p "$original_backup_dir"
    
    # 백업할 파일 목록 (기존 backup() 함수와 동일)
    files=(
        .zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc
        .oh-my-zsh .bash_history .zsh_history .zsh_sessions 
        .zcompdump .zcompdump-$HOSTNAME .zcompdump-$HOSTNAME.zwc
    )
    
    # 파일 복사
    for file in "${files[@]}"; do
        if [[ -e "$HOME/$file" ]]; then
            if [[ -d "$HOME/$file" && ! -L "$HOME/$file" ]]; then
                cp -R "$HOME/$file" "$original_backup_dir/"
                echo "Original backup - directory: $file"
            elif [[ -f "$HOME/$file" && ! -L "$HOME/$file" ]]; then
                cp "$HOME/$file" "$original_backup_dir/"
                echo "Original backup - file: $file"
            elif [[ -L "$HOME/$file" ]]; then
                target=$(readlink "$HOME/$file")
                echo "$file -> $target" >> "$original_backup_dir/symlinks.log"
                echo "Original backup - symlink: $file -> $target"
            fi
        fi
    done
    
    # .config, .local, .cache 디렉토리의 선택적 백업
    config_dirs=(.config .local .cache)
    for dir in "${config_dirs[@]}"; do
        if [[ -d "$HOME/$dir" && ! -L "$HOME/$dir" ]]; then
            mkdir -p "$original_backup_dir/$dir"
            cp -R "$HOME/$dir/"* "$original_backup_dir/$dir/" 2>/dev/null || true
            echo "Original backup - directory: $dir"
        elif [[ -L "$HOME/$dir" ]]; then
            target=$(readlink "$HOME/$dir")
            echo "$dir -> $target" >> "$original_backup_dir/symlinks.log"
            echo "Original backup - symlink: $dir -> $target"
        fi
    done
    
    # Original backup 완료 마커 파일 생성
    echo "$(date)" > "$original_backup_dir/.original_backup_created"
    echo "Original backup completed: $original_backup_dir"
}

backup_file_to_bak() {
    # Usage: backup_file_to_bak $HOME/.aliases [backup_target_directory]
    echo "backup_file_bak $1 to $2"
    
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # 기본 백업 디렉토리를 dotfiles 저장소 내의 .bak 디렉토리로 설정
    local default_backup_dir="${dotfiles_dir}/.bak/$(date +%Y%m%d)"
    
    if [[ -e "$1" ]]; then
        mkdir -p "${2:-$default_backup_dir}" # make the directory if it doesn't exist
        
        # 파일인지 디렉토리인지 확인하여 적절한 복사 명령 사용
        if [[ -d "$1" && ! -L "$1" ]]; then
            # 디렉토리인 경우 (심볼릭 링크가 아닌 경우만)
            cp -R "$1" "${2:-$default_backup_dir/}"
            echo "Backed up directory: $1"
        elif [[ -f "$1" && ! -L "$1" ]]; then
            # 일반 파일인 경우 (심볼릭 링크가 아닌 경우만)
            cp "$1" "${2:-$default_backup_dir/}"
            echo "Backed up file: $1"
        elif [[ -L "$1" ]]; then
            # 심볼릭 링크인 경우 링크 정보 저장
            target=$(readlink "$1")
            echo "$1 -> $target" >> "${2:-$default_backup_dir/symlinks.log}"
            echo "Logged symlink: $1 -> $target"
        fi
    fi 
} 

backup() {
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # 1. dotfiles 저장소 내의 .bak 디렉토리 사용
    backup_root="${dotfiles_dir}/.bak"
    mkdir -p "$backup_root"
    
    # 2. 이번 백업의 타임스탬프 디렉토리 생성
    timestamp=$(date +%Y%m%d.%H%M%S)
    backup_dir="$backup_root/$timestamp"
    mkdir -p "$backup_dir"
    
    # 3. 타임스탬프로 구분된 백업 디렉토리를 생성하고 최신 링크 업데이트
    ln -sfn "$backup_dir" "$backup_root/latest"
    
    # 4. 백업할 파일 목록
    files=(
        .zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc
        .oh-my-zsh .bash_history .zsh_history .zsh_sessions 
        .zcompdump .zcompdump-$HOSTNAME .zcompdump-$HOSTNAME.zwc
    )
    
    # 5. 파일 복사 (이동이 아님!)
    for file in "${files[@]}"; do
        if [[ -e "$HOME/$file" ]]; then
            # 기존 파일이 있으면 디렉토리 구조 유지하며 복사
            if [[ -d "$HOME/$file" && ! -L "$HOME/$file" ]]; then
                # 디렉토리인 경우 (심볼릭 링크가 아닌 경우만)
                cp -R "$HOME/$file" "$backup_dir/"
                echo "Backed up directory: $file"
            elif [[ -f "$HOME/$file" && ! -L "$HOME/$file" ]]; then
                # 일반 파일인 경우 (심볼릭 링크가 아닌 경우만)
                cp "$HOME/$file" "$backup_dir/"
                echo "Backed up file: $file"
            elif [[ -L "$HOME/$file" ]]; then
                # 심볼릭 링크인 경우 링크 정보 저장
                target=$(readlink "$HOME/$file")
                echo "$file -> $target" >> "$backup_dir/symlinks.log"
                echo "Logged symlink: $file -> $target"
            fi
        fi
    done
    
    # 6. .config, .local, .cache 디렉토리의 선택적 백업
    config_dirs=(.config .local .cache)
    for dir in "${config_dirs[@]}"; do
        if [[ -d "$HOME/$dir" && ! -L "$HOME/$dir" ]]; then
            # 심볼릭 링크가 아닌 실제 디렉토리인 경우만 백업
            mkdir -p "$backup_dir/$dir"
            
            # 전체를 복사하는 대신 중요 설정 파일만 선택적으로 복사
            # 에러 메시지 무시 (일부 파일 접근 권한 문제 등)
            cp -R "$HOME/$dir/"* "$backup_dir/$dir/" 2>/dev/null || true
            echo "Backed up directory: $dir"
        elif [[ -L "$HOME/$dir" ]]; then
            # 심볼릭 링크인 경우 링크 정보 저장
            target=$(readlink "$HOME/$dir")
            echo "$dir -> $target" >> "$backup_dir/symlinks.log"
            echo "Logged symlink: $dir -> $target"
        fi
    done
    
    echo "Backup completed: $backup_dir"
    echo "Latest backup linked: $backup_root/latest"
    
    # 7. 옵션: 오래된 백업 정리 (original 백업 제외, 5개 이상 백업 시 가장 오래된 것 삭제)
    backup_count=$(find "$backup_root" -maxdepth 1 -type d -not -name "latest" -not -name "original" -not -name "$(basename "$backup_root")" | wc -l)
    if [ "$backup_count" -gt 5 ]; then
        oldest_backup=$(find "$backup_root" -maxdepth 1 -type d -not -name "latest" -not -name "original" -not -name "$(basename "$backup_root")" | sort | head -1)
        if [ -n "$oldest_backup" ]; then
            rm -rf "$oldest_backup"
            echo "Removed old backup: $oldest_backup"
        fi
    fi
}

backup_and_symlink() {
    local src=$1
    local dest=$2
    local timestamp=$(date +%Y%m%d%H%M%S)
    local backup_suffix=".bak.${timestamp}"
    
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$(cd "$script_dir/../.." && pwd)"
    
    # 백업 디렉토리 설정
    local backup_dir="${dotfiles_dir}/.bak/symlinks.$(date +%Y%m%d)"
    mkdir -p "$backup_dir"

    # Check if the destination exists and is not a symlink
    if [[ -e "$dest" && ! -L "$dest" ]]; then
        # 파일 또는 디렉토리를 .bak 디렉토리로 백업
        local dest_basename=$(basename "$dest")
        local dest_dirname=$(dirname "$dest")
        local backup_path="${backup_dir}/${dest_basename}.${timestamp}"
        
        # 백업 수행
        if [[ -d "$dest" ]]; then
            cp -R "$dest" "$backup_path"
            echo "Backed up directory to: $backup_path"
        else
            cp "$dest" "$backup_path"
            echo "Backed up file to: $backup_path"
        fi
        
        # 원래 위치에서 파일 이동 (타임스탬프 사용)
        if [[ "$dest" == */ ]]; then
            # 끝의 /를 제거하고 백업 접미사 추가
            mv "${dest%/}" "${dest%/}$backup_suffix"
        else
            mv "$dest" "$dest$backup_suffix"
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

# Legacy symlink function - replaced by improved symlink_dotfiles
# This function is kept for reference but should not be used
symlink_dotfiles_v1() {
    echo "Warning: symlink_dotfiles_v1 is deprecated. Using symlink_dotfiles instead."
    symlink_dotfiles
}
