#!/bin/bash

source ./functions.sh

install_cli_tool # for update

cli_tools=(
    "tmux"
    "vim"
    "curl"
    "tree"
    "telnet"
    "wget"
    "bat"
    "git"
    "tldr"
    "neofetch"
    "ripgrep"
    "btop"
    "exa"
    "fd-find"
    "fzf"
    "jq"
    "trash-cli"

    # "neovim"
    # "tig"
    # "fasd"
    # "lazygit"
    # "htop"
    # "zsh"

    # "dust" #https://github.com/bootandy/dust
    # "duf" #https://github.com/muesli/duf
    
    # CONTAINER
    # "docker"
    # "docker-compose"
    # "lazydocker"
    # "minikube"
    # "k9s"
    # "kubectx"
    # "kubectl"
    # "krew"
    # "helm"

    # "code-server"

)

for tool in "${cli_tools[@]}"; do
    # echo "Installing $tool..."
    install_cli_tool $tool
    # echo "$tool installed successfully."
done

# python
# pyenv install
# install_pyenv() {
#     # from 
#     # 1. https://jinmay.github.io/2019/03/16/linux/ubuntu-install-pyenv-1/
#     # 2. https://www.dedicatedcore.com/blog/install-pyenv-ubuntu/
#     sudo apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
#         libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
#         xz-utils tk-dev
    
#     git clone https://github.com/pyenv/pyenv.git ~/.pyenv

#     # vi ~/.zshrc
#     export PYENV_ROOT="$HOME/.pyenv"
#     export PATH="$PYENV_ROOT/bin:$PATH"
#     eval "$(pyenv init -)"

#     source ~/.zshrc


#     git clone https://github.com/yyuu/pyenv-virtualenv.git ~/.pyenv/plugins/pyenv-virtualenv
#     eval "$(pyenv virtualenv-init -)"
#     source ~/.zshrc
# }
# install_zellij(){
#     bash <(curl -L zellij.dev/launch)
# }

install_nix() {
    sh <(curl -L https://nixos.org/nix/install) --daemon # linux version
    # sh <(curl -L https://nixos.org/nix/install) # mac version
}
# container
#TODO: automation -> shell or ansible
install_docker() {
    # from
    # https://docs.docker.com/engine/install/ubuntu/
    #TODO: automation docker install 
    # -> when creating workstation instance dynamically
}
intall_minikube() {
    # from
    # https://minikube.sigs.k8s.io/docs/start/
    #TODO: minikube install automation
}
