#!/bin/bash

source ./config/functions/functions.sh

# set_default_shell_zsh(){
#     if command -v zsh &> /dev/null; then
#         if ! exec_with_auto_privilege chsh -s $(which zsh); then
#             echo "Error: Failed to set zsh as default shell"
#         fi
#     fi
# }

setup_linux(){
    export DEBIAN_FRONTEND="noninteractive"
    
    # update and upgrade
    install_cli_tools -u -g

    install_cli_tools software-properties-common

    # INSTALL MUST HAVE TOOLS
    exec_with_auto_privilege ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    

    tools=(tzdata curl wget vim tmux trash-cli tldr jq fd-find ripgrep neofetch btop git lsd bsdmainutils)
    # additional tools
    # tools+=(termshark sshs gh)
    install_cli_tools "${tools[@]}"

    # LSP
    install_cli_tools gopls 
    #! (NOT WORKING) 
    #TODO: install_cli_tools bash-language-server pyright

    # ZSH
    install_cli_tools zsh
    
    # ASDF - Check if directory exists before cloning
    if [ ! -d "$HOME/.asdf" ]; then
        echo "git clone https://github.com/asdf-vm/asdf.git ~/.asdf" && git clone https://github.com/asdf-vm/asdf.git ~/.asdf
    else
        echo "ASDF already installed at ~/.asdf, skipping clone"
    fi

    # FZF
    # NOTE: apt install로 하지 않음 (fzf-에러,git install)
    # TODO: fzf 다운로드 위치에 대해 고민해보기
    if [ ! -d "$HOME/.fzf" ]; then
        git clone --depth 1 https://github.com/junegunn/fzf.git $HOME/.fzf
    else
        echo "FZF already installed at ~/.fzf, skipping clone"
    fi
    # TODO: input(yes) 받지 않아도 설정할 수 있도록 설정
    # yes | $HOME/.fzf/install --key-bindings --completion --xdg --bin --all

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

    # INSTALL DEVBOX
    # curl -fsSL https://get.jetify.com/devbox | bash

    # set_default_shell_zsh
}
