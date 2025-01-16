#!/bin/bash

backup_file_to_bak() {
    # Usage: backup_file_to_home $HOME/.aliases [backup_target_directory]
    echo "backup_file_bak $1 to $2"
    if [[ -e "$1" ]]; then
        mkdir -p "${2:-$HOME/.bak.$(date +%Y%m%d)}" # make the directory if it doesn't exist
        mv "$1" "${2:-$HOME/.bak.$(date +%Y%m%d)/}" # copy the file to the backup directory 
    fi 
} 

backup() {
    # Create backup directory with today's date
    backup_dir="/tmp/dotfiles.bak/.bak.$(date +%Y%m%d.%H%M%S)/"
    mkdir -p "$backup_dir"

    # # Create symlink to backup directory in home
    ln -snfbS .bak /tmp/dotfiles.bak $HOME/.bak

    # Move .config, .local, .cache to backup directory
    # files=(.config .local .cache .zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc)
    files=(.zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc)
    for file in "${files[@]}"; do
        backup_file_to_bak $HOME/$file "$backup_dir"
    done

    # backup default files
    #TODO: zcompdump를 prefix로 갖는 모든 파일 옮기기.
    files=(.oh-my-zsh .bash_history .zsh_history .zsh_sessions .zcompdump .zcompdump-$HOSTNAME .zcompdump-$HOSTNAME.zwc )
    for file in "${files[@]}"; do
        backup_file_to_bak "$HOME/$file" "$backup_dir"
    done

    # backup 후에 zip하기
    # zip -r $backup_dir.zip $backup_dir
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

    backup_and_symlink "$DOTFILES/config/git/.gitconfig" "$HOME/.gitconfig" "$backup_suffix"
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
