#!/bin/bash

backup_file_to_bak() {
    # Usage: backup_file_to_home $HOME/.aliases [backup_target_directory]
    echo "backup_file_bak $1 to $2"
    if [[ -e "$1" ]]; then
        mkdir -p "${2:-$HOME/.bak.$(date +%Y%m%d)}" # make the directory if it doesn't exist
        
        # 파일인지 디렉토리인지 확인하여 적절한 복사 명령 사용
        if [[ -d "$1" && ! -L "$1" ]]; then
            # 디렉토리인 경우 (심볼릭 링크가 아닌 경우만)
            cp -R "$1" "${2:-$HOME/.bak.$(date +%Y%m%d)/}"
            echo "Backed up directory: $1"
        elif [[ -f "$1" && ! -L "$1" ]]; then
            # 일반 파일인 경우 (심볼릭 링크가 아닌 경우만)
            cp "$1" "${2:-$HOME/.bak.$(date +%Y%m%d)/}"
            echo "Backed up file: $1"
        elif [[ -L "$1" ]]; then
            # 심볼릭 링크인 경우 링크 정보 저장
            target=$(readlink "$1")
            echo "$1 -> $target" >> "${2:-$HOME/.bak.$(date +%Y%m%d)/symlinks.log}"
            echo "Logged symlink: $1 -> $target"
        fi
    fi 
} 

backup() {
    # 1. 고정 백업 루트 디렉토리 생성 (HOME 내에 위치하여 지속성 보장)
    backup_root="$HOME/.dotfiles_backups"
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
    
    # 7. 옵션: 오래된 백업 정리 (예: 5개 이상 백업 시 가장 오래된 것 삭제)
    backup_count=$(find "$backup_root" -maxdepth 1 -type d -not -name "latest" -not -name "$(basename "$backup_root")" | wc -l)
    if [ "$backup_count" -gt 5 ]; then
        oldest_backup=$(find "$backup_root" -maxdepth 1 -type d -not -name "latest" -not -name "$(basename "$backup_root")" | sort | head -1)
        if [ -n "$oldest_backup" ]; then
            rm -rf "$oldest_backup"
            echo "Removed old backup: $oldest_backup"
        fi
    fi
}

backup_and_symlink() {
    local src=$1
    local dest=$2
    local backup_suffix=${3:-"~"}

    # Check if the destination exists and is not a symlink
    if [[ -e "$dest" && ! -L "$dest" ]]; then
        mv "$dest" "$dest$backup_suffix"
    fi

    # Create the symlink
    ln -snf "$src" "$dest"
}

symlink_dotfiles() {
    local backup_suffix=".bak"

    # Create symlinks for .config, .local, .cache
    # backup_and_symlink "$DOTFILES/config" "$HOME/.config" "$backup_suffix"
    # backup_and_symlink "$DOTFILES/local" "$HOME/.local" "$backup_suffix"
    # backup_and_symlink "$DOTFILES/cache" "$HOME/.cache" "$backup_suffix"

    app_dirs=(zsh bash git helix tmux vim aliases functions)
    for app in "${app_dirs[@]}"; do
        backup_and_symlink "$DOTFILES/config/$app" "$HOME/.config/" "$backup_suffix"
    done

    dot_configs=(.aliases .env .export .path .secrets)
    for configs in "${dot_configs[@]}"; do
        backup_and_symlink "$DOTFILES/config/$configs" "$HOME/.config/" "$backup_suffix"
    done

    backup_and_symlink "$DOTFILES/config/zsh/.zshenv" "$HOME/.zshenv" "$backup_suffix"
    backup_and_symlink "$DOTFILES/config/zsh/.zshrc" "$HOME/.zshrc" "$backup_suffix"

    backup_and_symlink "$DOTFILES/config/bash/.bashrc" "$HOME/.bashrc" "$backup_suffix"

    # backup_and_symlink "$DOTFILES/config/git/.gitconfig" "$HOME/.gitconfig" "$backup_suffix"
    backup_and_symlink "$DOTFILES/config/git/.gitignore" "$HOME/.gitignore" "$backup_suffix"

    # Uncomment if needed
    # backup_and_symlink "$DOTFILES/config/ideavim/.ideavimrc" "$HOME/.ideavimrc" "$backup_suffix"
    # backup_and_symlink "$DOTFILES/config/vim/.vimrc" "$HOME/.vimrc" "$backup_suffix"

    # 폴더 모니터링 용 symlink
    # !NOTE: or config에 있는 사용하는 app config만 symlink를 걸까..?
    backup_and_symlink "$HOME/.config" "$DOTFILES/monitoring/config"
    backup_and_symlink "$HOME/.local" "$DOTFILES/monitoring/local"
    backup_and_symlink "$HOME/.cache" "$DOTFILES/monitoring/cache"
}

symlink_dotfiles_v1() {
    # Create symlinks for .config, .local, .cache
    # TODO: 기존에 .config .local .cache에 있던 파일 처리 및 backup directory 코드 분리
    if [[ -d "$HOME/.config" && ! -L "$HOME/.config" ]]; then
        mv "$HOME/.config" "$HOME/.config.origin.bak"
    fi
    ln -snfbS "$DOTFILES/config" "$HOME/.config"
    
    if [[ -d "$HOME/.local" && ! -L "$HOME/.local" ]]; then
        mv "$HOME/.local" "$HOME/.local.origin.bak"
    fi
    ln -snfbS .bak $DOTFILES/local $HOME/.local

    if [[ -d "$HOME/.cache" && ! -L "$HOME/.cache" ]]; then
        mv "$HOME/.cache" "$HOME/.cache.origin.bak"
    fi
    ln -snfbS .bak $DOTFILES/cache $HOME/.cache

    ln -snfbS .bak $DOTFILES/config/zsh/.zshenv $HOME/
    ln -snfbS .bak $DOTFILES/config/zsh/.zshrc $HOME/

    ln -snfbS .bak $DOTFILES/config/bash/.bashrc $HOME/

    ln -snfbS .bak $DOTFILES/config/git/.gitconfig $HOME/
    ln -snfbS .bak $DOTFILES/config/git/.gitignore $HOME/

    # ln -snfbS .bak $DOTFILES/config/ideavim/.ideavimrc $HOME/
    # ln -snfbS .bak $DOTFILES/config/vim/.vimrc $HOME
}
