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
    if ! command -v git &>/dev/null; then
        echo "git is not installed"
        exit 1
    fi

    # 현재 디렉토리가 git 프로젝트인지 확인
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        remote_url=$(git config --get remote.origin.url)
        if [[ "$remote_url" == "https://github.com/zrohyun/dotfiles.git" ]]; then
            echo "Already in dotfiles directory"
            return 0
        fi
    fi

    dotfiles_dir="$HOME/.dotfiles" # $HOME/dotfiles
    if [[ -d $dotfiles_dir ]]; then
        echo "backup $dotfiles_dir to ${dotfiles_dir}.bak"
        mv $dotfiles_dir "${dotfiles_dir}.bak"
    fi
    git clone  --depth=1 -b main https://github.com/zrohyun/dotfiles.git $dotfiles_dir
    cd $dotfiles_dir
    source ./install.sh
    exit 0
}
curl_install_dotfiles

# PWD
DOTFILES=$PWD

#TODO: backup 로직에 합치기
# if [[ "$DOTFILES" != "$HOME/.dotfiles" ]]; then
#     backup_and_symlink "$DOTFILES" "$HOME/.dotfiles"
# fi
if [[ "$DOTFILES" != "$HOME/.dotfiles" ]]; then
    if [[ -d "$HOME/.dotfiles" ]]; then
        echo "backup $HOME/.dotfiles to $HOME/.dotfiles.bak"
        mv "$HOME/.dotfiles" "$HOME/.dotfiles.bak"
    fi
    ln -sfn "$DOTFILES" "$HOME/.dotfiles"
    DOTFILES="$HOME/.dotfiles"
fi

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