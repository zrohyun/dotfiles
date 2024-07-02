#!/bin/bash

source ./functions.sh

macServiceStart=false

#PWD
DOTFILES=$PWD
echo "PWD(DOTFILES): $DOTFILES"

osType="$(uname -s)"
case "${osType}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${osType}";exit 1
esac

install_omz() {
    echo "install_omz"
    # omz install and link plugins and themes
    # sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
    if [[ $machine == "Linux" ]]; then
        if check_sudo; then
            echo "chsh -s $(which zsh)" && chsh -s $(which zsh)
        elif [ $? -eq 1 ]; then
            echo "sudo chsh -s $(which zsh)" && sudo chsh -s $(which zsh)
        else
            echo "User does not have necessary privileges or sudo command not found."
        fi
    fi

    # git clone version
    # backup_file_to_bak $HOME/.oh-my-zsh
    echo "[[ ! -d $HOME/.oh-my-zsh ]] && git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh"
    [[ ! -d $HOME/.oh-my-zsh ]] && git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    # zsh-syntax-highlighting
    echo "[[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting ]] && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
    [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting ]] && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
    # zsh-autosuggestions
    echo "[[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions ]] && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
    [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions ]] && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
    # powerlevel10k
    echo "[[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k ]] && git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k"
    [[ ! -d ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k ]] && git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k

    #! submodule 사용시 (deprecated)
    # mkdir -p $PWD/zsh/{plugins,themes}
    # git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $PWD/zsh/plugins/zsh-syntax-highlighting
    # git clone https://github.com/zsh-users/zsh-autosuggestions $PWD/zsh/plugins/zsh-autosuggestions
    # git clone --depth=1 https://github.com/romkatv/powerlevel10k.git $PWD/zsh/themes/powerlevel10k
    # git submodule update --init --recursive
    # ln -s -f $PWD/zsh/plugins/* ${ZSH:-~/.oh-my-zsh}/plugins/
    # ln -s -f $PWD/zsh/themes/* ${ZSH:-~/.oh-my-zsh}/themes/
}

if [[ $machine == "Linux" ]]; then

    # first install_cli_tool은 update를 수행해야한다.
    echo install_cli_tool && install_cli_tool # for just update

    if check_sudo; then
        echo install_cli_tool software-properties-common && install_cli_tool software-properties-common true && install_cli_tool
    elif [[ $? -eq 1 ]]; then
        echo install_cli_tool software-properties-common && install_cli_tool software-properties-common true && install_cli_tool
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi

    # INSTALL MUST HAVE TOOLS

    #TODO: async???
    #TODO: Optimize install logic
    # install_cli_tool tmux & install_cli_tool trash-cli & disown
    if check_sudo; then
        echo "ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    elif [ $? -eq 1 ]; then
        echo "sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi
    
    install_cli_tool tzdata true
    install_cli_tool exa # 추후 혹은 다른 linux배판의 경우 lsd로 교체할 수 있음
    tools=("curl" "vim" "tmux" "trash-cli" "tldr" "jq" "fzf" "thefuck" "fd-find" "ripgrep" "neofetch" "btop" "git" "nvim")

    for tool in "${tools[@]}"; do
        install_cli_tool "$tool"
    done
    
    # LSP
    install_cli_tool pyright
    install_cli_tool gopls
    #! (NOT WORKING) 
    # TODO: install_cli_tool bash-language-server

    # ZSH
    install_cli_tool zsh
    echo "git clone https://github.com/asdf-vm/asdf.git ~/.asdf" && git clone https://github.com/asdf-vm/asdf.git ~/.asdf

    # INSTALL NEOVIM # install_cli_tool neovim
    # TODO apt-get은 nvim 버전이 낮아서 lazyvim을 쓸 수가 없음.
    # brew로 패키지매니저를 바꿔야하나.. 아니면 nvim만..?? (회사에서는 neovim-ppa 통신이 안되는 것 같음...)
    # 일단 nvim 설치는 apt-get으로만. ppa는 보류
    # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # if check_sudo; then
    #     echo "add-apt-repository -y ppa:neovim-ppa/unstable && install_cli_tool neovim true" 
    #     add-apt-repository -y ppa:neovim-ppa/unstable && install_cli_tool neovim true
    #     # brew install neovim
    # elif [ $? -eq 1 ]; then
    #     echo "sudo add-apt-repository -y ppa:neovim-ppa/unstable && install_cli_tool -y neovim true" 
    #     sudo add-apt-repository -y ppa:neovim-ppa/unstable && install_cli_tool neovim true
    #     # sudo brew install neovim
    # else
    #     echo "User does not have necessary privileges or sudo command not found."
    # fi
    # neovim config
    #! 낮은 버전 nvim(apt-get)은 lazyvim을 사용할 수 없음
    # source ./nvim/lazyvim_starter_setup.sh
    
    # INSTALL HELIX
    if check_sudo; then
        echo "add-apt-repository ppa:maveonair/helix-editor && install_cli_tool helix true" 
        add-apt-repository -y ppa:maveonair/helix-editor && install_cli_tool helix true 
    elif [ $? -eq 1 ]; then 
        echo "sudo add-apt-repository ppa:maveonair/helix-editor && install_cli_tool helix true" 
        sudo add-apt-repository -y ppa:maveonair/helix-editor && install_cli_tool helix true
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi


    #! Deprecated install tools
    # curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash # install zoxide
    #? 음.. 우선 command로 하지 말고 alias에 curl 사용하는 함수 alias로 등록해둠
    # if check_sudo; then
    #     # https://github.com/chubin/cheat.sh
    #     echo "curl -s https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh" && curl -s https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh
    # elif [ $? -eq 1 ]; then
    #     echo "curl -s https://cht.sh/:cht.sh | sudo tee /usr/local/bin/cht.sh && sudo chmod +x /usr/local/bin/cht.sh" && curl -s https://cht.sh/:cht.sh | sudo tee /usr/local/bin/cht.sh && sudo chmod +x /usr/local/bin/cht.sh
    # else
    #     echo "User does not have necessary privileges or sudo command not found."
    # fi

    # copy fonts
    echo "backup_file_to_bak $HOME/.fonts" &&  backup_file_to_bak $HOME/.fonts
    echo "ln -s -f $DOTFILES/fonts $HOME/.fonts" &&  ln -s -f $DOTFILES/fonts $HOME/.fonts
    
    #! (Deprecated) vscode의 설정은 mackup의 간헐적 동작으로 백업을 수행한다.
    #? 아래처럼 할 수도 있지만 생각보다 고려해야할 게 좀 있으니 나중에. 아니면 설정 자체를 모든 프로파일마다 적용할 수 있으면서 백업할 수 있는 방법을 생각해봐야겠다.
    # 일단 자동화하지 않고 그냥 vscode setting으로 설정하는 게 나을듯
    # if [[ $machine == "Linux" ]]; then
    #     mkdir -p $HOME/.vscode-server/data/Machine && touch $HOME/.vscode-server/data/Machine/settings.json
    #     jq '. + {"editor.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
    #     jq '. + {"terminal.integrated.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
    #     rm tmp.json
    # fi

elif [[ $machine == "Mac" ]]; then

    # PREREQUISITE
    # xcode-select --install
    # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && eval $(/opt/homebrew/bin/brew shellenv)
    BREW_BUNDLE=./osx/Brewfile

    # copy Brewfile
    backup_file_to_bak $HOME/Brewfile
    echo "ln -s -f $DOTFILES/osx/Brewfile $HOME/" && ln -s -f $DOTFILES/osx/Brewfile $HOME/
    BREW_BUNDLE=$HOME/Brewfile
    # echo "ln -s -f $DOTFILES/osx/Brewfile{,.lock.json} $HOME/" && ln -s -f $DOTFILES/osx/Brewfile{,.lock.json} $HOME/

    # Update Homebrew recipes
    echo "brew update && brew upgrade" && brew update && brew upgrade
    echo "brew bundle --file=$BREW_BUNDLE" && brew bundle --file=$BREW_BUNDLE # lock.json 파일은 BREW_BUNDLE 위치에 생성됨

    if [[ $macServiceStart == true ]]; then 
        # 서비스 시작 원할 시 service_start
        service_start() {
            # List of commands
            commands=("colima" "code-server")

            # Loop through the commands
            for cmd in "${commands[@]}"
            do
                # Check if the command is installed
                if which "$cmd" &>/dev/null; then # if command -v "$cmd" &> /dev/null
                    echo "$cmd is installed. Starting the service..."
                    echo "brew services start $cmd" && brew services start $cmd
                    sleep 5
                else
                    echo "$cmd is not installed. Please install $cmd first."
                fi
            done
        }
        service_start
    fi

    # 시스템 단축키, iterm2, raycast
    system_files=(
        "com.apple.symbolichotkeys.plist"
        "com.googlecode.iterm2.plist"
        "com.raycast.macos"
    )
    for file in "${system_files[@]}"
    do 
        if [[ -f "$HOME/Library/Preferences/$file" ]]; then
            backup_file_to_bak "$HOME/Library/Preferences/$file"
            echo "cp $DOTFILES/osx/$file $HOME/Library/Preferences/$file" && cp $DOTFILES/osx/$file $HOME/Library/Preferences/$file
            # putil --convert xml1 symbolichotkeys.plist
        fi
    done
    
fi

# copy base config
# files array
files=(.aliases .export .extra .path .env .bashrc .envrc)
# loop over files array
for file in "${files[@]}"; do
    # backup file
    echo "backup_file_to_bak $HOME/$file" && backup_file_to_bak $HOME/$file
    # create symbolic link
    echo "ln -s -f $DOTFILES/$file $HOME/" && ln -s -f $DOTFILES/$file $HOME/
done

# copy tmux config
echo "backup_file_to_bak $HOME/.tmux.conf" && backup_file_to_bak $HOME/.tmux.conf
echo "backup_file_to_bak $HOME/.tmux.conf.local" && backup_file_to_bak $HOME/.tmux.conf.local
echo "ln -s -f $DOTFILES/tmux/.tmux.conf{,.local} $HOME/" && ln -s -f $DOTFILES/tmux/.tmux.conf{,.local} $HOME/
if command -v tmux &>/dev/null; then
    echo "tmux source $HOME/.tmux.conf" && tmux source $HOME/.tmux.conf
    # Optional
    # tmux new -ds main
fi

# copy vim config
echo "backup_file_to_bak $HOME/.vimrc" && backup_file_to_bak $HOME/.vimrc
echo "backup_file_to_bak $HOME/.ideavimrc" &&  backup_file_to_bak $HOME/.ideavimrc
echo "ln -s -f $DOTFILES/vim/.{vimrc,ideavimrc} $HOME/" && ln -s -f $DOTFILES/vim/.{vimrc,ideavimrc} $HOME/

# copy zsh config
backup_file_to_bak $HOME/.zshrc
backup_file_to_bak $HOME/.p10k.zsh
backup_file_to_bak $HOME/.zprofile
echo "ln -s -f $DOTFILES/zsh/.{zshrc,p10k.zsh,zprofile} $HOME/" && ln -s -f $DOTFILES/zsh/.{zshrc,p10k.zsh,zprofile} $HOME/

# copy mackup config
backup_file_to_bak $HOME/.mackup.cfg
echo "ln -s -f $DOTFILES/osx/.mackup.cfg $HOME/" && ln -s -f $DOTFILES/osx/.mackup.cfg $HOME/

#!(Deprecated) copy git config - devcontianer 사용시 host git config 자동 마운트(setting 옵션에 있음), 
# backup_file_to_bak $HOME/.gitignore
# backup_file_to_bak $HOME/.gitconig
# echo "ln -s -f $DOTFILES/git/.{gitignore,gitconfig} $HOME/" && ln -s -f $DOTFILES/git/.{gitignore,gitconfig} $HOME/

# copy helix config
backup_file_to_bak $HOME/.config/helix/config.toml
backup_file_to_bak $HOME/.config/helix/languages.toml
echo "[[ ! -d $HOME/.config/helix ]] && mkdir -p $HOME/.config/helix" && [[ ! -d $HOME/.config/helix ]] && mkdir -p $HOME/.config/helix
echo "ln -s -f $DOTFILES/helix/{config,languages}.toml $HOME/.config/helix" && ln -s -f $DOTFILES/helix/{config,languages}.toml $HOME/.config/helix

# copy k9s config
if [[ $machine == "Linux" ]]; then
    OUT="${XDG_CONFIG_HOME:-$HOME/.config}/k9s"
elif [[ $machine == "Mac" ]]; then
    OUT="${XDG_CONFIG_HOME:-$HOME/Library/Application Support}/k9s"
fi
backup_file_to_bak "$OUT"
echo 'mkdir -p $OUT' && mkdir -p "$OUT"
echo "ln -s -f $DOTFILES/k9s/{config.yaml,skins} $OUT" && ln -s -f $DOTFILES/k9s/{config.yaml,skins} "$OUT"

# copy karabiner config
if [[ $machine == "Mac" ]]; then
    backup_file_to_bak $HOME/.config/karabiner/karabiner.json
    echo "mkdir -p $HOME/.config/karabiner" && mkdir -p $HOME/.config/karabiner
    echo "ln -s -f $DOTFILES/karabiner/karabiner.json $HOME/.config/karabiner/" && ln -s -f $DOTFILES/karabiner/karabiner.json $HOME/.config/karabiner/
fi

# INSTALL Oh-My-Zsh
install_omz 

#?
# terminal
# alacritty
# kitty