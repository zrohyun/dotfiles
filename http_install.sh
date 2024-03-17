#!/bin/bash

#[[ -d $HOME/.dotfiles ]] && mv $HOME/.dotfiles
if command -v git &>/dev/null; then
    git clone https://github.com/zrohyun/dotfiles.git $HOME/.dotfiles
    cd $HOME/.dotfiles
    source ./install.sh
else
    echo "git is not installed"
fi