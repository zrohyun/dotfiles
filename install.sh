#!/bin/bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

# copy base config
if [[ -f ~/.aliases ]]; then
    mv $HOME/.aliases $HOME/.aliases.bak
fi 
if [[ -f ~/.export ]]; then
    mv $HOME/.export $HOME/.export.bak
fi 
if [[ -f ~/.extra ]]; then
    mv $HOME/.extra $HOME/.extra.bak
fi 
ln -s -f $PWD/.{aliases,export,extra} $HOME/

# copy tmux config
if [[ -f ~/.tmux.conf ]]; then
    mv $HOME/.tmux.conf $HOME/.tmux.conf.bak
fi 
if [[ -f ~/.tmux.conf.local ]]; then
    mv $HOME/.tmux.conf.local $HOME/.tmux.conf.local.bak
fi
ln -s -f $PWD/tmux/.tmux.conf $HOME/
ln -s -f $PWD/tmux/.tmux.conf.local $HOME/

# copy vim config
if [[ -f ~/.vimrc ]]; then
    mv $HOME/.vimrc $HOME/.vimrc.bak
fi 
ln -s -f  $PWD/vim/.vimrc $HOME/

# copy git config
if [[ -f ~/.gitconfig ]]; then
    mv $HOME/.gitconfig $HOME/.gitconfig.bak
fi 
if [[ -f ~/.gitignore ]]; then
    mv $HOME/.gitignore $HOME/.gitignore.bak
fi
ln -s -f  $PWD/git/.gitconfig $HOME/
ln -s -f  $PWD/git/.gitignore $HOME/

# copy zsh config
if [ "$machine" = "Linux" ]; then
    # Install zsh using apt
    sudo apt update
    sudo apt install -y zsh

    # Change the default login shell to zsh
    sudo chsh -s $(which zsh)
    echo "Zsh installed and set as the default login shell. Please restart your terminal to apply changes."
fi

install_omz() {
    # omz install and link plugins and themes
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ln -s -f $PWD/zsh/plugins/* ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/
    ln -s -f $PWD/zsh/themes/* ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/
}

install_omz

if [[ -f ~/.zshrc ]]; then
    mv $HOME/.zshrc $HOME/.zshrc.bak
fi
if [[ -f ~/.p10k.zsh ]]; then
    mv $HOME/.p10k.zsh $HOME/.p10k.zsh.bak
fi
ln -s -f  $PWD/zsh/.zshrc $HOME/
ln -s -f  $PWD/zsh/.p10k.zsh $HOME/