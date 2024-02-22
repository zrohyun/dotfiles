#!/bin/bash

# from ../functions.sh
check_sudo() {
    if [[ "$(id -u)" -eq 0 ]]; then
        return 0  # true (root user)
    elif command -v sudo &>/dev/null && sudo -v 2>/dev/null; then
        return 1  # true (non-root user with sudo privileges)
    else
        return 2  # false (sudo command not found, and not a root user)
    fi
}

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

if [[ $machine == "Linux" ]]; then
    if check_sudo; then
        echo "add-apt-repository -y ppa:neovim-ppa/unstable && apt-get update && apt-get install -y neovim"
        add-apt-repository -y ppa:neovim-ppa/unstable && apt-get update && apt-get install -y neovim
    elif [ $? -eq 1 ]; then
        echo "sudo add-apt-repository -y ppa:neovim-ppa/unstable && sudo apt-get update && sudo apt-get install -y neovim"
        sudo add-apt-repository -y ppa:neovim-ppa/unstable && sudo apt-get update && sudo apt-get install -y neovim
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi
    # install_cli_tool neovim
fi

# 기존에 사용하던 설정이 있었다면 백업
mv $HOME/.config/nvim $HOME/.config/nvim.bak
mv $HOME/.local/share/nvim $HOME/.local/share/nvim.bak
mv $HOME/.local/state/nvim $HOME/.local/state/nvim.bak
mv $HOME/.cache/nvim $HOME/.cache/nvim.bak

# 설치 실행
# TODO: 아직 neovim을 많이 사용하지 않아 그냥 lazyvim starter clone하여 사용. 나중에 여러 설정 적용시 nvim config도 dotfiles에 저장하여 사용.
git clone https://github.com/LazyVim/starter $HOME/.config/nvim
rm -rf $HOME/.config/nvim/.git