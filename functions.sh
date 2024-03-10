#!/bin/bash


check_sudo() {
    if [[ "$(id -u)" -eq 0 ]]; then
        return 0  # true (root user)
    elif command -v sudo &>/dev/null && sudo -v 2>/dev/null; then
        return 1  # true (non-root user with sudo privileges)
    else
        return 2  # false (sudo command not found, and not a root user)
    fi
}

install_cli_tool() {
    # Usage 1: install and do update
    # install_cli_tool "vim" true
    # Usage 2: install and do not update
    # install_cli_tool "tmux"
    # Usage 3: only do update
    # install_cli_tool

    local tool_name="${1:-}"
    local update_flag="${2:-false}"  # 기본값을 false로 설정

    echo "install_cli_tool $1 $2"


    # Check if the tool is already installed
    if command -v "$tool_name" &>/dev/null; then
        echo "$tool_name already installed"
    else
        local install_command=""
        local update_command=""
        local upgrade_command=""

        if check_sudo; then
            install_command="apt-get install -y" && update_command="apt-get update" && upgrade_command="apt-get upgrade -y"
        elif [[ $? -eq 1 ]]; then
            sudo -v 2>/dev/null && install_command="sudo apt-get install -y" && update_command="sudo apt-get update" && upgrade_command="sudo apt-get upgrade -y"
        # else
        #     echo "User does not have necessary privileges or sudo command not found."           
        fi

        #TODO: 위의 로직 정상동작 확인되면 삭제
        # if command -v sudo &> /dev/null; then
        #     sudo -v 2>/dev/null && install_command="sudo apt-get install -y" && update_command="sudo apt-get update" && upgrade_command="sudo apt-get upgrade -y"
        # else
        #     install_command="apt-get install -y" && update_command="apt-get update" && upgrade_command="apt-get upgrade -y"
        # fi

        # DO UPDATE
        if ( [ -z "$tool_name" ] && [[ "$update_flag" == false ]] ) || [[ $update_flag == true ]]; then
            echo "$update_command" && $update_command || { echo "Error: Unable to run $update_command. Please check your sudo privileges."; exit 1; }
            echo "$upgrade_command" && $upgrade_command
        fi
        
        # DO INSTALL
        if [ -n "$install_command" ] && [ -n "$tool_name" ]; then
            echo "$install_command $tool_name" && $install_command "$tool_name"
            echo "$tool_name installed. Please restart your terminal to apply changes."
        elif [ -z "$tool_name" ]; then
            echo "Do Only Update"
        else
            echo "Error: User can't install $tool_name."
            exit 1
        fi
    fi
}

backup_file_to_bak() {
    # Usage: backup_file_to_home $HOME/.aliases
    echo "backup_file_bak $1"
    if [[ -f "$1" ]] || [[ -d "$1" ]]; then
        echo "mkdir -p $HOME/.bak" && mkdir -p $HOME/.bak # make the directory if it doesn't exist
        echo "mv $1 $HOME/.bak/" && mv "$1" "$HOME/.bak/" # copy the file to the backup directory 
        # echo "Backup of $1 created at $HOME/.back" 
    fi 
} 

#! Deprecated
# backup_file() {
#     # Usage
#     # backup_file $HOME/.aliases
#     if [[ -f "$1" ]]; then
#         echo "mv $1 $1.bak" && mv "$1" "$1.bak"
#         echo "Backup created for $1"
#     fi
# }

# backup_and_link() {
#     # Usage: backup_and_link "$HOME/.aliases" "$PWD/.aliases" "$HOME/"
#     backup_file "$1"
#     echo "ln -s -f $2 $3" && ln -s -f "$2" "$3"
# }

# backup_and_link_to_home() {
#     # Usage: backup_and_link_to_home "$HOME/.aliases" "$PWD/.aliases" "$HOME/"
#     backup_file_to_home "$1" 
#     echo "ln -s -f $2 $3" && ln -s -f "$2" "$3" 
# }
