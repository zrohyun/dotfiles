#!/bin/bash

#   _           _        _ _       _     
#  (_)         | |      | | |     | |    
#   _ _ __  ___| |_ __ _| | |  ___| |__  
#  | | '_ \/ __| __/ _` | | | / __| '_ \ 
#  | | | | \__ \ || (_| | | |_\__ \ | | |
#  |_|_| |_|___/\__\__,_|_|_(_)___/_| |_|

# TODO: 한번 예외처리 로깅 정리하기
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)
curl_install_dotfiles() {
    dotfiles_dir="$HOME/.dotfiles" # $HOME/dotfiles

    # Check if the current directory is dotfiles_dir and is the zrohyun/dotfiles project
    if [[ "$PWD" == "$dotfiles_dir" ]]; then
        remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url)
        if [[ "$remote_url" == "https://github.com/zrohyun/dotfiles.git" ]]; then
            echo "Already in zrohyun's dotfiles directory"
            return 0
        fi
    fi

    if ! command -v git &>/dev/null; then
        echo "git is not installed"
        exit 1
    fi

    # 현재 디렉토리가 git 프로젝트인지 확인
    if [[ -d $dotfiles_dir ]]; then
        remote_url=$(git -C "$dotfiles_dir" config --get remote.origin.url)
        if [[ "$remote_url" == "https://github.com/zrohyun/dotfiles.git" ]]; then
            echo "Already in dotfiles directory"
            cd "$dotfiles_dir" || exit 1
            return 0
        else
            backup_dir="${dotfiles_dir}.bak.$(date +%Y%m%d%H%M%S)"
            echo "Backing up existing dotfiles to $backup_dir"
            mv "$dotfiles_dir" "$backup_dir"
        fi
    fi

    git clone --depth=1 -b main https://github.com/zrohyun/dotfiles.git $dotfiles_dir
    cd $dotfiles_dir || exit 1

    source ./install.sh || exit 1
    exit 0
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

# INSTALL Oh-My-Zsh
source ./config/functions/install_omz.sh
install_omz