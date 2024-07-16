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
    files=(.config .local .cache .zshenv .zshrc .bashrc .gitconfig .gitignore .vimrc .ideavimrc)
    for file in "${files[@]}"; do
        backup_file_to_bak $HOME/$file "$backup_dir"
    done

    # backup default files
    files=(.oh-my-zsh .bash_history .zsh_history .zsh_sessions .zcompdump .zcompdump-$HOSTNAME .zcompdump-$HOSTNAME.zwc )
    for file in "${files[@]}"; do
        backup_file_to_bak "$HOME/$file" "$backup_dir"
    done
}

symlink_dotfiles() {
    # Create symlinks for .config, .local, .cache
    ln -snfbS .bak $DOTFILES/config $HOME/.config
    ln -snfbS .bak $DOTFILES/local $HOME/.local
    ln -snfbS .bak $DOTFILES/cache $HOME/.cache

    ln -snfbS .bak $DOTFILES/config/zsh/.zshenv $HOME/
    ln -snfbS .bak $DOTFILES/config/zsh/.zshrc $HOME/

    ln -snfbS .bak $DOTFILES/config/bash/.bashrc $HOME/

    ln -snfbS .bak $DOTFILES/config/git/.gitconfig $HOME/
    ln -snfbS .bak $DOTFILES/config/git/.gitignore $HOME/

    # ln -snfbS .bak $DOTFILES/config/ideavim/.ideavimrc $HOME/
    # ln -snfbS .bak $DOTFILES/config/vim/.vimrc $HOME
}
