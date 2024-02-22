#!/bin/bash

source ./functions.sh

install_cli_tool "zsh" true

cli_tools=(
    "tmux"
    "vim"
    "curl"
    "tree"
    "telnet"
    "wget"
    "neovim"
    "bat"
    "tig"
    "lazygit"
    "git"
    "tldr"
    "neofetch"
    "ripgrep"
    "btop"
    "exa"
    "fasd"
    "fd-find"
    "fzf"
    "htop"
    "jq"
    "trash-cli"

    # "dust" #https://github.com/bootandy/dust
    # "duf" #https://github.com/muesli/duf
    
    # "docker"
    # "docker-compose"
    # "lazydocker"

    # "code-server"
    # "minikube"

    # "k9s"
    # "kubectx"
    # "kubectl"
    # "krew"
    # "helm"
)

for tool in "${cli_tools[@]}"; do
    # echo "Installing $tool..."
    install_cli_tool $tool
    # echo "$tool installed successfully."
done