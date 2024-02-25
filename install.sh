#!/bin/bash

source ./functions.sh

install_cli_tool

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

# first install_cli_tool은 update를 수행해야한다.
if [[ $machine == "Linux" ]]; then
    if check_sudo; then
        install_cli_tool software-properties-common true
        apt-get update && apt-get -y upgrade;
    elif [[ $? -eq 1 ]]; then
        install_cli_tool software-properties-common true
        sudo apt-get update && sudo apt-get -y upgrade;
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi

fi

if [[ $machine == "Linux" ]]; then
    # must have tools
    # install_cli_tool tmux & install_cli_tool trash-cli & disown

    if check_sudo; then
        ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    elif [ $? -eq 1 ]; then
        sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi
    
    install_cli_tool tzdata true
    install_cli_tool vim
    install_cli_tool tmux
    install_cli_tool trash-cli
    install_cli_tool tldr
    install_cli_tool jq
    install_cli_tool fzf
    install_cli_tool thefuck
    install_cli_tool fd-find
    install_cli_tool exa # 추후 혹은 다른 linux배판의 경우 lsd로 교체할 수 있음
    install_cli_tool ripgrep
    # curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash # install zoxide

    if check_sudo; then
        # https://github.com/chubin/cheat.sh
        curl -s https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh
    elif [ $? -eq 1 ]; then
        curl -s https://cht.sh/:cht.sh | sudo tee /usr/local/bin/cht.sh && sudo chmod +x /usr/local/bin/cht.sh
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi
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

# copy fonts
backup_file $HOME/.fonts
ln -s -f $PWD/fonts $HOME/.fonts
# 아래처럼 할 수도 있지만 생각보다 고려해야할 게 좀 있다.
# 일단 자동화하지 않고 그냥 vscode setting으로 설정하는 게 나을듯
# if [[ $machine == "Linux" ]]; then
#     mkdir -p $HOME/.vscode-server/data/Machine && touch $HOME/.vscode-server/data/Machine/settings.json
#     jq '. + {"editor.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
#     jq '. + {"terminal.integrated.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
#     rm tmp.json
# fi

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

    backup_file $HOME/.oh-my-zsh
    # git clone version
    git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    # zsh-syntax-highlighting
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
    # zsh-autosuggestions
    git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
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

# symbolic link dotfiles
backup_file $HOME/.zshrc
backup_file $HOME/.p10k.zsh
backup_file $HOME/.functions.zsh
ln -s -f  $PWD/zsh/{.zshrc,.p10k.zsh,.functions.zsh} $HOME/

# bashrc
backup_file $HOME/.bashrc
ln -s -f $PWD/.bashrc $HOME/

# neovim
source ./nvim/lazyvim_starter_install.sh