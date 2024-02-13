#!/bin/bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

install_basic_linux_cli_tools() {
    sudo apt-get update && sudo apt-get -y upgrade;
    sudo apt-get install -y trash-cli tmux
}

[[ $machine == "Linux" ]] && install_basic_linux_cli_tools

backup_file() {
    # Usage
    # backup_file $HOME/.aliases
    if [[ -f "$1" ]]; then
        mv "$1" "$1.bak"
        echo "Backup created for $1"
    fi
}

backup_and_link() {
    # Usage
    # backup_and_link "$HOME/.aliases" "$PWD/.aliases" "$HOME/"
    backup_file "$1"
    ln -s -f "$2" "$3"
}


# copy base config
backup_file $HOME/.aliases
backup_file $HOME/.export
backup_file $HOME/.extra
ln -s -f $PWD/.{aliases,export,extra} $HOME/

# copy tmux config
backup_file $HOME/.tmux.conf
backup_file $HOME/.tmux.conf.local
ln -s -f $PWD/tmux/.tmux.conf{,.local} $HOME/
if (( +command[tmux] )); then # activate tmux config
    tmux source $HOME/.tmux.conf
    # Optional
    # tmux new -ds main
fi


# copy vim config
backup_file $HOME/.vimrc
ln -s -f  $PWD/vim/.vimrc $HOME/

# copy git config
backup_file $HOME/.gitconfig
backup_file $HOME/.gitignore
ln -s -f  $PWD/git/.{gitconfig,gitignore} $HOME/

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
    # sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
    git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    git submodule update --init --recursive
    ln -s -f $PWD/zsh/plugins/* ${ZSH:-~/.oh-my-zsh}/plugins/
    ln -s -f $PWD/zsh/themes/* ${ZSH:-~/.oh-my-zsh}/themes/
}

install_omz

backup_file $HOME/.zshrc
backup_file $HOME/.p10k.zsh
ln -s -f  $PWD/zsh/{.zshrc,.p10k.zsh} $HOME/