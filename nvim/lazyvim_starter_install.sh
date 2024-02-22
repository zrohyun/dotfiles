#!/bin/bash

if [[ $machine == "Linux" ]]; then
    if check_sudo; then
        add-apt-repository -y ppa:neovim-ppa/unstable && apt-get update && apt-get install -y neovim
    elif [ $? -eq 1 ]; then
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