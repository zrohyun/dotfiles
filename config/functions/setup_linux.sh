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
    
    # 기본 필수 도구들만 설치 (빠른 설치)
    echo "Installing essential tools with apt-get..."
    essential_tools=(tzdata git curl wget vim zsh tmux neofetch bsdmainutils netcat-openbsd)
    install_cli_tools "${essential_tools[@]}"
    
    echo "✅ 기본 설치 완료!"
    echo ""
    echo "추가 도구 설치 (선택사항):"
    echo "  ./config/functions/tools.sh --brew             # Homebrew만 설치"
    echo "  ./config/functions/tools.sh --dev-tools        # 개발 도구들"
    echo "  ./config/functions/tools.sh --brew-tools       # brew 도구들 (Homebrew 자동 설치)"
    echo "  ./config/functions/tools.sh --all              # 모든 추가 도구"
    
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


    # INSTALL DEVBOX
    # curl -fsSL https://get.jetify.com/devbox | bash

    # set_default_shell_zsh
}

