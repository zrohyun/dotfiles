#!/bin/bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

# copy tmux config
if [[ -f ~/.tmux.conf ]]; then
    mv $HOME/.tmux.conf $HOME/.tmux.conf.bak
if 
if [[ -f ~/.tmux.conf.local ]]; then
    mv $HOME/.tmux.conf.local $HOME/.tmux.conf.local.bak
if 
ln -s -f ./tmux/.tmux.conf $HOME/
ln -s -f ./tmux/.tmux.conf.local $HOME/

# copy vim config
if [[ -f ~/.vimrc ]]; then
    mv $HOME/.vimrc $HOME/.vimrc.bak
if 
ln -s -f  ./vim/.vimrc $HOME/

# copy git config
if [[ -f ~/.gitconfig ]]; then
    mv $HOME/.gitconfig $HOME/.gitconfig.bak
if 
if [[ -f ~/.gitignore ]]; then
    mv $HOME/.gitignore $HOME/.gitignore.bak
if 
ln -s -f  ./git/.gitconfig $HOME/
ln -s -f  ./git/.gitignore $HOME/

# copy zsh config
if [ "$machine" = "Linux" ]; then
    # Install zsh using apt
    sudo apt update
    sudo apt install -y zsh

    # Change the default login shell to zsh
    sudo chsh -s $(which zsh)
    echo "Zsh installed and set as the default login shell. Please restart your terminal to apply changes."
fi

sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

if [[ -f ~/.zshrc ]]; then
    mv $HOME/.zshrc $HOME/.zshrc.bak
fi
if [[ -f ~/.p10k.zsh ]]; then
    mv $HOME/.p10k.zsh $HOME/.p10k.zsh.bak
fi
ln -s -f  ./zsh/.zshrc $HOME/
ln -s -f  ./zsh/.p10k.zsh $HOME/
