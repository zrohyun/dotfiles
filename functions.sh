#!/bin/bash

install_cli_tool() {
    # Usage 1: do update
    # install_cli_tool "vim" true
    # Usage 2: do not update
    # install_cli_tool "tmux"

    local tool_name="$1"
    local update_flag="$2"


    # Check if the tool is already installed
    if command -v "$tool_name" &>/dev/null; then
        echo "$tool_name already installed"
    else
        local install_command=""
        local update_command=""
        local upgrade_command=""

        if command -v sudo &> /dev/null; then
            sudo -v 2>/dev/null && install_command="sudo apt install -y" && update_command="sudo apt update" && upgrade_command="sudo apt upgrade -y"
        else
            install_command="apt install -y" && update_command="apt update" && upgrade_command="apt upgrade -y"
        fi

        if [ -n "$install_command" ]; then

            if [ "$update_flag" = true ]; then
                $update_command || { echo "Error: Unable to run $update_command. Please check your sudo privileges."; exit 1; }
                $upgrade_command
            fi

            $install_command "$tool_name"

            echo "$tool_name installed. Please restart your terminal to apply changes."
        else
            echo "Error: User does not have necessary privileges or sudo command not found."
            exit 1
        fi
    fi
}

backup_file() {
    # Usage
    # backup_file $HOME/.aliases
    if [[ -f "$1" ]]; then
        mv "$1" "$1.bak"
        echo "Backup created for $1"
    fi
}

backup_and_link() {
    # Usage: backup_and_link "$HOME/.aliases" "$PWD/.aliases" "$HOME/"
    backup_file "$1"
    ln -s -f "$2" "$3"
}

check_sudo() {
    if [ "$(id -u)" -eq 0 ]; then
        return 0  # true (root user)
    elif command -v sudo &>/dev/null && sudo -v 2>/dev/null; then
        return 1  # true (non-root user with sudo privileges)
    else
        return 2  # false (sudo command not found, and not a root user)
    fi
}