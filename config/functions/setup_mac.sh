#!/bin/bash

#TODO: 나중에 mac을 다시 세팅할 날이 오면 다시 확인해야 함
setup_mac() {
    ####################################################
    # PREREQUISITE
    ####################################################
    # xcode-select --install
    # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && \\
    # eval $(/opt/homebrew/bin/brew shellenv)
    ####################################################

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
}