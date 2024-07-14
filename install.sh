#!/bin/bash

# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)
curl_install_dotfiles() {
    # CASE dowloaded with curl
    # Check if current directory is not .dotfiles, then clone the repository
    if [[ ! "$(basename $PWD)" == ".dotfiles" ]]; then
        dotfiles_dir="$HOME/.dotfiles"
        if command -v git &>/dev/null; then
            if [[ -d $dotfiles_dir ]]; then
                echo "backup $dotfiles_dir to ${dotfiles_dir}.bak"
                mv $dotfiles_dir "${dotfiles_dir}.bak"
            fi
            git clone  --depth=1 -b main https://github.com/zrohyun/dotfiles.git $dotfiles_dir
            cd $dotfiles_dir
            source ./install.sh
        else
            echo "git is not installed"
            exit 1
        fi
    fi
    PWD=$dotfiles_dir
}
curl_install_dotfiles

# PWD
DOTFILES=$PWD

#LOGGING
source ./tools/logging.sh
set_for_logging

macServiceStart=false

echo "PWD(DOTFILES): $DOTFILES"

source ./config/.env
source ./config/functions/functions.sh

if [[ $machine == "Linux" ]]; then
    source ./config/functions/setup_linux.sh
    setup_linux
elif [[ $machine == "Mac" ]]; then
    source ./config/functions/setup_mac.sh
    setup_mac
fi

source ./config/functions/backup.sh
backup # backup dotfiles to /tmp/dotfiles.bak
symlink_dotfiles

# copy k9s config
# if [[ $machine == "Mac" ]]; then
#     OUT="${XDG_CONFIG_HOME:-$HOME/Library/Application Support}/k9s"
# fi
# backup_file_to_bak "$OUT"
# mkdir -p "$OUT"
# ln -snfbS $DOTFILES/k9s "$OUT"

# INSTALL Oh-My-Zsh
source ./config/functions/install_omz.sh
install_omz