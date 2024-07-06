#!/bin/bash


check_sudo() {
    if [[ "$(id -u)" -eq 0 ]]; then
        return 0  # true (root user)
    elif command -v sudo &>/dev/null && sudo -v 2>/dev/null; then
        return 1  # true (non-root user with sudo privileges)
    else
        echo "Warn: User does not have necessary privileges or sudo command not found."
        return 2  # false (sudo command not found, and not a root user)
    fi
}
run_command_with_logging(){
    echo "[Command Log]: $@"
    eval "$@"
    # $@ | tee -a $HOME/dotfiles.log
}

run_command() {
    if check_sudo; then
        # run all the parameter
        $@
    elif [ $? -eq 1 ]; then
        # run all the parameter with sudo
        sudo $@
    # else
    #     exit 1
    fi
}

is_pkg_installed() {
    local package_name="$1"

    # if dpkg -l | grep -q "^ii  $package_name "; then # 패키지가 설치된 경우 'ii'로 시작하는 행이 dpkg -l 결과에 존재
    if command -v dpkg &>/dev/null; then
        if dpkg -s $package_name &>/dev/null || command -v $package_name &>/dev/null; then
            return 0  # true
        else
            return 1  # false
        fi
    elif command -v $pakcage_name &>/dev/null; then
        return 0  # true
    elif which $pakcage_name &>/dev/null; then
        return 0  # true
    else
        echo "Error: dpkg command not found."
        # exit 1
        return 1
    fi
}

get_sudo_command() {
    check_sudo
    sudo_status=$?

    # sudo privilege check
    if [ $sudo_status -eq 1 ]; then
        sudo_cmd="sudo "
    else
        # exit 1
        # when $sudo_status is 0 or 2
        sudo_cmd=""
    fi

    echo "$sudo_cmd"
}

install_cli_tool() {
    # Usage: install_cli_tool [-u] [-g] [tools...]
    # install_cli_tool tmux zsh
    # install_cli_tool -u -g

    # option parsing
    update_flag=false
    upgrade_flag=false

    answer_yes=true

    unset OPTIND
    while getopts ":ugy:" opt; do
        case $opt in
            u) update_flag=true ;;  # -u option set update_flag true
            g) upgrade_flag=true ;;  # -g option set upgrade_flag true
            y) answer_yes=true ;; #TODO: -y option set answer_yes true/false
            *) echo "Usage: $0 [-u] [-g] [tools...]" >&2
            return 1 ;;
        esac
    done
    shift $((OPTIND -1))

    # set package manager
    # TODO: not yet supported linux package manager(centos, fedora, pacman)
    if is_pkg_installed apt; then
        pm="apt"
        install_pkg="install"
    elif is_pkg_installed apt-get; then
        pm="apt-get"
        install_pkg="install"
    elif is_pkg_installed brew; then
        pm="brew"
        install_pkg="install"
    else
        echo "Error: Package manager not found."
        exit 1
    fi

    tools=("$@")
    tools_not_exist=()
    # remove already installed tool in tools
    for tool in "${tools[@]}"; do
        if ! is_pkg_installed $tool ; then
            echo "$tool is not installed"
            tools_not_exist+=("$tool")
        fi
    done

    # Check if the tool is already installed
    local install_cmd=""
    local update_cmd=""
    local upgrade_cmd=""

    sudo_cmd=$(get_sudo_command)

    # 명령어 기본 설정
    install_cmd="${sudo_cmd}${pm} ${install_pkg}"
    update_cmd="${sudo_cmd}${pm} update"
    upgrade_cmd="${sudo_cmd}${pm} upgrade"

    # -y 옵션 추가
    if [ "$answer_yes" = true ]; then
        install_cmd="${install_cmd} -y"
        upgrade_cmd="${upgrade_cmd} -y"
    fi

    cmd="" #? run_command 1 layer?
    if [[ $update_flag == true ]]; then
        echo "$update_cmd" && $update_cmd
    fi
    if [[ $upgrade_flag == true ]]; then
        echo "$upgrade_cmd" && $upgrade_cmd
    fi
    if [ ${#tools_not_exist[@]} -gt 0 ]; then
        $install_cmd ${tools_not_exist[@]}
    fi
}

backup_file_to_bak() {
    # Usage: backup_file_to_home $HOME/.aliases [backup_target_directory]
    echo "backup_file_bak $1"
    if [[ -e "$1" ]]; then
        mkdir -p "${2:-$HOME/.bak}" # make the directory if it doesn't exist
        mv "$1" "${1:-$HOME/.bak/}" # copy the file to the backup directory 
    fi 
} 

# brew update every monday
brew_update(){
    if [[ $(date +%u) -eq 1 ]]; then # Check if today is Monday (1 = Monday)
        read -p "Do you want to run 'brew update'? (Y/N): " answer
        if [[ $answer == [Yy] ]]; then
            echo "Running 'brew update'..."
            echo "brew update && brew upgrade" && brew update && brew upgrade
            # brewfile update
            # echo "brew bundle --file=$HOME/Brewfile" && brew bundle --file=$HOME/Brewfile
            # echo "brew update --greedy" && brew update --greedy # update formula and cask 
        # else
        #     echo "Update skipped."
        fi
    fi
}