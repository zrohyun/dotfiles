#!/bin/bash
# TODO: debugging mode로 shell script 변경하기
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
        run_command chsh -s $(which zsh)
    fi

    if [[ ! -d $HOME/.oh-my-zsh ]]; then 
        git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    fi
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

if [[ $machine == "Linux" ]]; then
    export DEBIAN_FRONTEND="noninteractive"
    
    # update and upgrade
    install_cli_tool -u -g

    install_cli_tool software-properties-common

    # INSTALL MUST HAVE TOOLS
    #TODO: Optimize install logic
    if check_sudo; then
        echo "ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    elif [ $? -eq 1 ]; then
        echo "sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    fi
    
    #TODO: exa -> lsd
    tools=(tzdata curl vim tmux trash-cli tldr jq fzf thefuck fd-find ripgrep neofetch btop git exa)
    install_cli_tool ${tools[@]}

    # LSP
    install_cli_tool pyright gopls
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
    # if check_sudo; then
    #     echo "add-apt-repository ppa:maveonair/helix-editor && install_cli_tool helix true" 
    #     add-apt-repository -y ppa:maveonair/helix-editor && install_cli_tool helix true 
    # elif [ $? -eq 1 ]; then 
    #     echo "sudo add-apt-repository ppa:maveonair/helix-editor && install_cli_tool helix true" 
    #     sudo add-apt-repository -y ppa:maveonair/helix-editor && install_cli_tool helix true
    # else
    #     echo "User does not have necessary privileges or sudo command not found."
    # fi


    # copy fonts
    backup_file_to_bak $HOME/.fonts
    echo "ln -s -f $DOTFILES/fonts $HOME/.fonts" &&  ln -s -f $DOTFILES/fonts $HOME/.fonts
    
elif [[ $machine == "Mac" ]]; then

    # PREREQUISITE
    # xcode-select --install
    # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && eval $(/opt/homebrew/bin/brew shellenv)
    BREW_BUNDLE=./osx/Brewfile

    # copy Brewfile
    backup_file_to_bak "$HOME/Brewfile"
    echo "ln -s -f $DOTFILES/osx/Brewfile $HOME/" && ln -s -f "$DOTFILES/osx/Brewfile" "$HOME/"
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
#TODO: symlink, file backup 함수 정리
files=(.aliases .export .extra .path .env .bashrc .envrc)
# loop over files array
for file in "${files[@]}"; do
    # backup file
    backup_file_to_bak $HOME/$file
    # create symbolic link
    echo "ln -s -f $DOTFILES/$file $HOME/" && ln -s -f $DOTFILES/$file $HOME/
done

# copy tmux config
backup_file_to_bak $HOME/.tmux.conf
backup_file_to_bak $HOME/.tmux.conf.local
echo "ln -s -f $DOTFILES/tmux/.tmux.conf{,.local} $HOME/" && ln -s -f $DOTFILES/tmux/.tmux.conf{,.local} $HOME/
if command -v tmux &>/dev/null; then
    echo "tmux source $HOME/.tmux.conf" && tmux source $HOME/.tmux.conf
    # Optional
    # tmux new -ds main
fi

# copy vim config
backup_file_to_bak $HOME/.vimrc
backup_file_to_bak $HOME/.ideavimrc
echo "ln -s -f $DOTFILES/vim/.{vimrc,ideavimrc} $HOME/" && ln -s -f $DOTFILES/vim/.{vimrc,ideavimrc} $HOME/

# copy zsh config
backup_file_to_bak $HOME/.zshrc
backup_file_to_bak $HOME/.p10k.zsh
backup_file_to_bak $HOME/.zprofile
backup_file_to_bak $HOME/.zshenv
echo "ln -s -f $DOTFILES/zsh/.{zshrc,zshenv,zlogin,p10k.zsh,zprofile} $HOME/" && ln -s -f $DOTFILES/zsh/.{zshrc,zshenv,zlogin,p10k.zsh,zprofile} $HOME/

# copy mackup config
backup_file_to_bak $HOME/.mackup.cfg
echo "ln -s -f $DOTFILES/osx/.mackup.cfg $HOME/" && ln -s -f $DOTFILES/osx/.mackup.cfg $HOME/

if [[ $machine == "Mac" ]]; then
    #!(Deprecated in linux[devconatiner]) copy git config - devcontianer 사용시 host git config 자동 마운트(setting 옵션에 있음), 
    backup_file_to_bak $HOME/.gitignore
    backup_file_to_bak $HOME/.gitconig
    echo "ln -s -f $DOTFILES/git/.{gitignore,gitconfig} $HOME/" && ln -s -f $DOTFILES/git/.{gitignore,gitconfig} $HOME/
fi

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