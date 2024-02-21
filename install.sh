#!/bin/bash

source ./functions.sh

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

if check_sudo; then
    apt-get update && apt-get -y upgrade;
elif [[ $? -eq 1 ]]; then
    sudo apt-get update && sudo apt-get -y upgrade;
else
    echo "User does not have necessary privileges or sudo command not found."
fi

if [[ $machine == "Linux" ]]; then
    # install_cli_tool tmux & install_cli_tool trash-cli & disown
    install_cli_tool tmux
    install_cli_tool trash-cli
fi

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

install_omz() {
    # omz install and link plugins and themes
    # sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
    install_cli_tool "zsh"

    if check_sudo; then
        chsh -s $(which zsh)
    elif [ $? -eq 1 ]; then
        sudo chsh -s $(which zsh) 
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi

    # git clone version
    git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    # zsh-syntax-highlighting
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
    # zsh-autosuggestions
    git clone git://github.com/zsh-users/zsh-autosuggestions $ZSH_CUSTOM/plugins/zsh-autosuggestions
    # powerlevel10k
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k

    # submodule 사용시 (deprecated)
    # mkdir -p $PWD/zsh/{plugins,themes}
    # git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $PWD/zsh/plugins/zsh-syntax-highlighting
    # git clone https://github.com/zsh-users/zsh-autosuggestions $PWD/zsh/plugins/zsh-autosuggestions
    # git clone --depth=1 https://github.com/romkatv/powerlevel10k.git $PWD/zsh/themes/powerlevel10k
    # git submodule update --init --recursive
    # ln -s -f $PWD/zsh/plugins/* ${ZSH:-~/.oh-my-zsh}/plugins/
    # ln -s -f $PWD/zsh/themes/* ${ZSH:-~/.oh-my-zsh}/themes/
}

install_omz

backup_file $HOME/.zshrc
backup_file $HOME/.p10k.zsh
backup_file $HOME/.functions.zsh
ln -s -f  $PWD/zsh/{.zshrc,.p10k.zsh,.functions.zsh} $HOME/