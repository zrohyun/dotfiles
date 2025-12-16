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

exec_with_auto_privilege() {
    # run command with sudo if necessary
    # Usage: exec_with_auto_privilege command [arg1 arg2 ...]
    # Example: exec_with_auto_privilege apt-get install -y neovim

    # echo "exec_with_auto_privilege: $@"

    # 인자가 하나만 있는지 확인
    if [ "$#" -eq 1 ]; then
        # [DON'T PASS STRING] Like exec_with_auto_privilege "sudo apt-get install -y neovim"
        echo "Error EXEC_WITH_AUTO_PRIVILEGE: Do not pass commands as a single string."
        return 1
    fi

    if check_sudo; then
        # run all the parameter
        echo "EXEC_WITH_AUTO_PRIVILEGE: \`$@\`"
        "$@"
    elif [ $? -eq 1 ]; then
        # run all the parameter with sudo
        echo "EXEC_WITH_AUTO_PRIVILEGE: \`sudo $@\`"
        sudo "$@"
    else
        return 1
        # "$@" || return 1
        # exit 1
    fi
}

is_pkg_installed() {
    # Check if the package is installed
    # Usage: is_pkg_installed package_name
    local package_name="$1"

    # if dpkg -l | grep -q "^ii  $package_name "; then # 패키지가 설치된 경우 'ii'로 시작하는 행이 dpkg -l 결과에 존재
    if command -v dpkg &>/dev/null; then
        if dpkg -s "${package_name}" &>/dev/null || command -v "${package_name}" &>/dev/null; then
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

install_cli_tools() {
    # Usage: install_cli_tools [-u] [-g] [-p package_manager] [tools...]
    # install_cli_tools tmux zsh
    # install_cli_tools -u -g
    # install_cli_tools -p brew tmux zsh
    # install_cli_tools -p apt-get tmux zsh

    # option parsing
    update_flag=false
    upgrade_flag=false
    package_manager="auto"
    answer_yes=true

    unset OPTIND
    while getopts ":ugp:y:" opt; do
        case $opt in
            u) update_flag=true ;;  # -u option set update_flag true
            g) upgrade_flag=true ;;  # -g option set upgrade_flag true
            p) package_manager="$OPTARG" ;;  # -p option set package_manager
            y) answer_yes=true ;; #TODO: -y option set answer_yes true/false
            *) echo "Usage: install_cli_tools [-u] [-g] [-p package_manager] [tools...]" >&2
               echo "  -u: update package list"
               echo "  -g: upgrade packages"
               echo "  -p: specify package manager (brew, apt-get, auto)"
               echo "  -y: answer yes to prompts"
               return 1 ;;
        esac
    done
    shift $((OPTIND -1))

    # set package manager
    if [[ "$package_manager" == "auto" ]]; then

        # TODO: not yet supported linux package manager(centos, fedora, pacman)
        # if is_pkg_installed apt; then
        #     pm="apt"
        #     install_pkg="install"

        # Auto-detect package manager (prefer apt-get over brew)
        if is_pkg_installed apt-get; then
            #! apt는 interative에서만 쓰는 게 좋을 것.
            #! Deprecated apt로 apt-get 완전 대체 가능 : https://aws.amazon.com/ko/compare/the-difference-between-apt-and-apt-get/
            pm="apt-get"
            install_pkg="install"
        elif is_pkg_installed brew; then
            pm="brew"
            install_pkg="install"
        else
            echo "Error: No package manager found (brew, apt-get)."
            return 1
        fi
    elif [[ "$package_manager" == "brew" ]]; then
        if is_pkg_installed brew; then
            pm="brew"
            install_pkg="install"
        else
            echo "Error: brew is not installed or not available."
            return 1
        fi
    elif [[ "$package_manager" == "apt-get" ]]; then
        if is_pkg_installed apt-get; then
            pm="apt-get"
            install_pkg="install"
        else
            echo "Error: apt-get is not installed or not available."
            return 1
        fi
    else
        echo "Error: Unsupported package manager '$package_manager'. Supported: brew, apt-get, auto"
        return 1
    fi

    echo "Using package manager: $pm"

    tools=("$@")
    echo "tools: ${tools[@]}"
    tools_not_exist=()
    # remove already installed tool in tools
    for tool in "${tools[@]}"; do
        if ! is_pkg_installed $tool ; then
            echo "$tool is not installed"
            tools_not_exist+=("$tool")
        fi
    done
    echo "tools_not_exist: ${tools_not_exist[@]}"

    # Check if the tool is already installed
    local install_cmd=""
    local update_cmd=""
    local upgrade_cmd=""

    # 명령어 기본 설정
    install_cmd="${pm} ${install_pkg}"
    update_cmd="${pm} update"
    upgrade_cmd="${pm} upgrade"

    # -y 옵션 추가
    if [ "$answer_yes" = true ]; then
        install_cmd="${install_cmd} -y"
        upgrade_cmd="${upgrade_cmd} -y"
    fi

    cmd="" #? exec_with_auto_privilege 1 layer?
    if [[ $update_flag == true ]]; then
        exec_with_auto_privilege ${update_cmd}
    fi
    if [[ $upgrade_flag == true ]]; then
        exec_with_auto_privilege ${upgrade_cmd}
    fi
    if [ ${#tools_not_exist[@]} -gt 0 ]; then
        exec_with_auto_privilege $install_cmd ${tools_not_exist[@]}
    fi
}

# NOTE: install_homebrew()는 install_dependencies.sh로 이동됨
# 사용: source ./config/functions/install_dependencies.sh

# brew install function - install multiple packages efficiently
brew_install() {
    # Usage: brew_install [tools...]
    # brew_install helix pyright vscode-langservers-extracted
    
    if ! command -v brew &>/dev/null; then
        echo "Error: brew is not installed."
        return 1
    fi
    
    local tools=("$@")
    local tools_to_install=()
    
    echo "Checking brew packages: ${tools[@]}"
    
    # 설치되지 않은 도구들만 수집
    for tool in "${tools[@]}"; do
        if ! brew list "$tool" &>/dev/null; then
            echo "$tool is not installed"
            tools_to_install+=("$tool")
        else
            echo "$tool is already installed"
        fi
    done
    
    # 설치할 도구가 있으면 한 번에 설치
    if [ ${#tools_to_install[@]} -gt 0 ]; then
        echo "Installing with brew: ${tools_to_install[@]}"
        brew install "${tools_to_install[@]}"
    else
        echo "All tools are already installed."
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

# brew bundle dump로 현재 설치된 앱 목록을 Brewfile로 생성하고 .bak 폴더에 백업하는 함수
dump_brewfile() {
    # dotfiles 경로 확인
    local dotfiles_dir="${DOTFILES:-$HOME/.dotfiles}"
    
    # 백업 디렉토리 설정 (.bak 폴더 사용)
    local backup_dir="$dotfiles_dir/.bak"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/Brewfile_$timestamp"
    
    # 백업 디렉토리가 없으면 생성
    if [[ ! -d "$backup_dir" ]]; then
        mkdir -p "$backup_dir"
        echo "백업 디렉토리 생성: $backup_dir"
    fi
    
    # brew bundle dump로 현재 설치된 앱 목록 Brewfile 생성
    echo "현재 설치된 앱 목록을 덤프하여 Brewfile 백업 생성 중..."
    brew bundle dump --force --file="$backup_file"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Brewfile 백업 완료: $backup_file"
    else
        echo "❌ Brewfile 백업 실패"
        return 1
    fi
}

# 시스템 locale 설치 (시간대 변경 없음)
install_system_locales() {
    echo "Installing system locales..."
    
    exec_with_auto_privilege apt update
    exec_with_auto_privilege apt install -y locales
    
    # 한국어, 영어 locale 생성
    exec_with_auto_privilege locale-gen ko_KR.UTF-8
    exec_with_auto_privilege locale-gen en_US.UTF-8
    
    echo "✅ System locales 설치 완료!"
}

# locale 전환 함수 (사용자가 필요시 사용)
switch_locale() {
    local target_locale="$1"
    case "$target_locale" in
        "ko"|"korean")
            export LANG=ko_KR.UTF-8
            export LANGUAGE=ko_KR:ko
            export LC_ALL=ko_KR.UTF-8
            echo "✅ Locale을 한국어로 전환"
            ;;
        "en"|"english")
            export LANG=en_US.UTF-8
            export LANGUAGE=en_US:en
            export LC_ALL=en_US.UTF-8
            echo "✅ Locale을 영어로 전환"
            ;;
        *)
            echo "Usage: switch_locale [ko|korean|en|english]"
            return 1
            ;;
    esac
}
