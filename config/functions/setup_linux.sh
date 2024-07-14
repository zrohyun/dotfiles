#!/bin/bash

setup_linux(){
    export DEBIAN_FRONTEND="noninteractive"
    
    # update and upgrade
    install_cli_tools -u -g

    install_cli_tools software-properties-common

    # INSTALL MUST HAVE TOOLS
    run_command ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    
    tools=(tzdata curl wget vim tmux trash-cli tldr jq fzf fd-find ripgrep neofetch btop git lsd bsdmainutils)
    install_cli_tools ${tools[@]}

    # LSP
    install_cli_tools gopls 
    #! (NOT WORKING) 
    #TODO: install_cli_tools bash-language-server pyright

    # ZSH
    install_cli_tools zsh
    echo "git clone https://github.com/asdf-vm/asdf.git ~/.asdf" && git clone https://github.com/asdf-vm/asdf.git ~/.asdf

    # INSTALL NEOVIM
    # TODO: (2024.07 기준 neovim v0.9 확인 - lazyvim 사용 가능) ~~apt-get은 nvim 버전이 낮아서 lazyvim을 쓸 수가 없음.~~
    # (일단 nvim 설치는 apt-get으로만. ppa는 보류) 
    # exec_with_auto_privilege add-apt-repository -y ppa:neovim-ppa/unstable
    install_cli_tools neovim

    # neovim config
    #! 낮은 버전 nvim(apt-get)은 lazyvim을 사용할 수 없음
    # source ./nvim/lazyvim_starter_setup.sh
    
    # INSTALL HELIX
    # exec_with_auto_privilege add-apt-repository -y ppa:maveonair/helix-editor
    # install_cli_tools helix

    #! copy fonts
    # backup_file_to_bak $HOME/.fonts
    # echo "ln -s -f $DOTFILES/fonts $HOME/.fonts" &&  ln -s -f $DOTFILES/fonts $HOME/.fonts
}
