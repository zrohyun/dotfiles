#!/bin/bash

BREW_BUNDLE=./osx/Brewfile

# Update Homebrew recipes
brew update && brew upgrade

brew bundle --file=$BREW_BUNDLE

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
            brew services start colima
            sleep 5
        else
            echo "$cmd is not installed. Please install $cmd first."
        fi
    done
}

# 서비스 시작 원할 시
# service_start