#!/bin/bash
# INSTALL Oh-My-Zsh
install_omz() {
    echo "install_omz"
    # omz install and link plugins and themes
    # sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
    if [[ $machine == "Linux" ]]; then
        run_command chsh -s $(which zsh)
    fi

    if [[ ! -d ${XDG_CONFIG_HOME:-$HOME}/.oh-my-zsh ]]; then 
        git clone https://github.com/ohmyzsh/ohmyzsh.git ${XDG_CONFIG_HOME:-$HOME}/.oh-my-zsh
    fi

    ZSH_CUSTOM=${XDG_CONFIG_HOME:-$HOME}/.oh-my-zsh/custom

    if [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting ]]; then
        # zsh-syntax-highlighting
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
    fi
    if [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions ]]; then
        # zsh-autosuggestions
        git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
    fi
    if [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k ]]; then
        # powerlevel10k
        git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k
    fi
}