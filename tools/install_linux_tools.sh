#!/bin/bash

source ./config/function/functions.sh

install_cli_tool # for update

cli_tools=(
    "tree"
    "telnet"
    "wget"
    "bat"
    "netcat-openbsd"

    # ESSENTIAL
    # "tmux"
    # "vim"
    # "curl"
    # "git"
    # "tldr"
    # "btop"
    # "neofetch"
    # "ripgrep"
    # "exa"
    # "lsd"
    # "fd-find"
    # "fzf"
    # "jq"
    # "trash-cli"
    # "python3-pip"

    # "neovim"
    # "tig"
    # "fasd"
    # "lazygit"
    # "htop"
    # "zsh"
    # "thefuck"

    # "dust" #https://github.com/bootandy/dust
    # "duf" #https://github.com/muesli/duf

    # GPU MONITORING
    # nvtop
    # gpustat
    # pip install nvitop
    
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

# PYTHON
# pyenv install
#! Deprecated
install_pyenv() {
    # from 
    # 1. https://jinmay.github.io/2019/03/16/linux/ubuntu-install-pyenv-1/
    # 2. https://www.dedicatedcore.com/blog/install-pyenv-ubuntu/
    sudo apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
        libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
        xz-utils tk-dev
    
    git clone https://github.com/pyenv/pyenv.git ~/.pyenv

    # vi ~/.zshrc
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"

    source ~/.zshrc

    git clone https://github.com/yyuu/pyenv-virtualenv.git ~/.pyenv/plugins/pyenv-virtualenv
    eval "$(pyenv virtualenv-init -)"
    source ~/.zshrc
}
# ZELLIJ
install_zellij(){
    bash <(curl -L zellij.dev/launch)
}
# NIX
install_nix() {
    sh <(curl -L https://nixos.org/nix/install) --daemon # linux version
    # sh <(curl -L https://nixos.org/nix/install) # mac version
}

# CONTAINER
# TODO: automation -> shell or ansible
install_docker() {
    # from
    # https://docs.docker.com/engine/install/ubuntu/
    # TODO: automation docker install 
    # -> when creating workstation instance dynamically
    return
}

intall_minikube() {
    # from
    # https://minikube.sigs.k8s.io/docs/start/
    # TODO: minikube install automation
    return
}
# TODO: install nfs
install_nfs() {
    # sudo apt-get install -y nfs-common
    return 
}

install_krew() {
    # FROM
    # https://krew.sigs.k8s.io/docs/user-guide/setup/install/
    set -x; cd "$(mktemp -d)" &&
    OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
    ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
    KREW="krew-${OS}_${ARCH}" &&
    curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
    tar zxvf "${KREW}.tar.gz" &&
    ./"${KREW}" install krew
}
