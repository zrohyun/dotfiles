#!/bin/bash

source ./functions.sh

macServiceStart=false

osType="$(uname -s)"
case "${osType}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${osType}";exit 1
esac

install_omz() {
    # omz install and link plugins and themes
    # sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
    if [[ $machine == "Linux" ]]; then
        install_cli_tool "zsh"

        if check_sudo; then
            chsh -s $(which zsh)
        elif [ $? -eq 1 ]; then
            sudo chsh -s $(which zsh) 
        else
            echo "User does not have necessary privileges or sudo command not found."
        fi
    fi

    backup_file_to_bak $HOME/.oh-my-zsh
    # git clone version
    git clone https://github.com/ohmyzsh/ohmyzsh.git $HOME/.oh-my-zsh
    # zsh-syntax-highlighting
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
    # zsh-autosuggestions
    git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
    # powerlevel10k
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k

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
    print install_cli_tool && install_cli_tool # for just update

    if check_sudo; then
        print install_cli_tool software-properties-common && install_cli_tool software-properties-common true && install_cli_tool
    elif [[ $? -eq 1 ]]; then
        print install_cli_tool software-properties-common && install_cli_tool software-properties-common true && install_cli_tool
    else
        print User does not have necessary privileges or sudo command not found.
    fi

    # INSTALL MUST HAVE TOOLS

    #TODO: async???
    # install_cli_tool tmux & install_cli_tool trash-cli & disown

    if check_sudo; then
        echo "ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    elif [ $? -eq 1 ]; then
        echo "sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime" && sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi
    
    install_cli_tool tzdata true
    install_cli_tool vim
    install_cli_tool tmux
    install_cli_tool trash-cli
    install_cli_tool tldr
    install_cli_tool jq
    install_cli_tool fzf
    install_cli_tool thefuck
    install_cli_tool fd-find
    install_cli_tool exa # 추후 혹은 다른 linux배판의 경우 lsd로 교체할 수 있음
    install_cli_tool ripgrep
    install_cli_tool git
    install_cli_tool zsh && install_omz

    # INSTALL NEOVIM # install_cli_tool neovim
    if check_sudo; then
        echo "add-apt-repository -y ppa:neovim-ppa/unstable && apt-get update && apt-get install -y neovim" \
        && add-apt-repository -y ppa:neovim-ppa/unstable && apt-get update && apt-get install -y neovim
    elif [ $? -eq 1 ]; then
        echo "sudo add-apt-repository -y ppa:neovim-ppa/unstable && sudo apt-get update && sudo apt-get install -y neovim" \ 
        && sudo add-apt-repository -y ppa:neovim-ppa/unstable && sudo apt-get update && sudo apt-get install -y neovim
    else
        echo "User does not have necessary privileges or sudo command not found."
    fi

    # neovim config
    source ./nvim/lazyvim_starter_setup.sh

    #! Deprecated install tools
    # curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash # install zoxide
    #? 음.. 우선 command로 하지 말고 alias에 curl 사용하는 함수 alias로 등록해둠
    # if check_sudo; then
    #     # https://github.com/chubin/cheat.sh
    #     echo "curl -s https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh" \
    #     && curl -s https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh
    # elif [ $? -eq 1 ]; then
    #     echo "curl -s https://cht.sh/:cht.sh | sudo tee /usr/local/bin/cht.sh && sudo chmod +x /usr/local/bin/cht.sh" \
    #     && curl -s https://cht.sh/:cht.sh | sudo tee /usr/local/bin/cht.sh && sudo chmod +x /usr/local/bin/cht.sh
    # else
    #     echo "User does not have necessary privileges or sudo command not found."
    # fi

elif [[ $machine == "Mac" ]]; then

    # PREREQUISITE
    # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # xcode-select --install
    BREW_BUNDLE=./osx/Brewfile

    # Update Homebrew recipes
    print 'brew upadte && brew upgrade' && brew update && brew upgrade
    echo "brew bundle --file=$BREW_BUNDLE"  && brew bundle --file=$BREW_BUNDLE

    if [[ macServiceStart == true]]; then 
        # 서비스 시작 원할 시 service_start
        service_start(){
            # List of commands
            commands=("colima" "code-server")

            # Loop through the commands
            for cmd in "${commands[@]}"
            do
                # Check if the command is installed
                if which "$cmd" &> /dev/null # if command -v "$cmd" &> /dev/null
                then
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
    
fi

# copy base config
# files array
files=(.aliases .export .extra .env .bashrc .gitconfig .gitignore)
# loop over files array
for file in "${files[@]}"; do
    # backup file
    backup_file_to_bak $HOME/$file
    # create symbolic link
    ln -s -f $PWD/$file $HOME/
done

# copy tmux config
backup_file_to_bak $HOME/.tmux.conf
backup_file_to_bak $HOME/.tmux.conf.local
ln -s -f $PWD/tmux/.tmux.conf{,.local} $HOME/
if (( +command[tmux] )); then # activate tmux config
    tmux source $HOME/.tmux.conf
    # Optional
    # tmux new -ds main
fi

# copy vim config
backup_file_to_bak $HOME/.vimrc
backup_file_to_bak $HOME/.ideavimrc
ln -s -f  $PWD/vim/{.vimrc,ideavimrc} $HOME/

# copy fonts
backup_file_to_bak $HOME/.fonts
ln -s -f $PWD/fonts $HOME/.fonts
#? 아래처럼 할 수도 있지만 생각보다 고려해야할 게 좀 있으니 나중에. 아니면 설정 자체를 모든 프로파일마다 적용할 수 있으면서 백업할 수 있는 방법을 생각해봐야겠다.
# 일단 자동화하지 않고 그냥 vscode setting으로 설정하는 게 나을듯
# if [[ $machine == "Linux" ]]; then
#     mkdir -p $HOME/.vscode-server/data/Machine && touch $HOME/.vscode-server/data/Machine/settings.json
#     jq '. + {"editor.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
#     jq '. + {"terminal.integrated.fontFamily": "JetBrainsMono Nerd Font"}' $HOME/.vscode-server/data/Machine/settings.json > temp.json && mv temp.json $HOME/.vscode-server/data/Machine/settings.json
#     rm tmp.json
# fi

# copy zsh config
backup_file_to_bak $HOME/.zshrc
backup_file_to_bak $HOME/.p10k.zsh
backup_file_to_bak $HOME/.zprofile
ln -s -f  $PWD/zsh/.* $HOME/

#?
# terminal
# alacritty
# kitty