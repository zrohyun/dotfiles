#!/bin/bash

curl_install_dotfiles() {
    # CASE dowloaded with curl
    # Check if current directory is not .dotfiles, then clone the repository
    if [[ ! "$(basename $PWD)" == ".dotfiles" ]]; then
        if command -v git &>/dev/null; then
            git clone https://github.com/zrohyun/dotfiles.git $HOME/.dotfiles
            cd $HOME/.dotfiles
            source ./install.sh
        else
            echo "git is not installed"
            exit 1
        fi
    fi
}
curl_install_dotfiles

# PWD
DOTFILES=$PWD

set_for_logging() {
    # LOGFILE
    #? TODO: set log level like LOGLEVEL=[DEBUG|INFO|WARN|ERROR]
    LOGFILE="./log.log.$(date +%Y%m%d.%H%M%S)" # "${TEMPDIR:-/tmp}/log.log.$(date +%Y%m%d.%H%M%S)"

    # exec 3>&-
    exec > >(tee -a "$LOGFILE") 2>&1

    verbose=true
    xtrace=true

    if $verbose; then
        set -v
    fi
    if $xtrace; then
        set -x
    fi
}
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

#?
# terminal
# alacritty
# kitty