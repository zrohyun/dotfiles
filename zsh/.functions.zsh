#!/bin/bash
unameOut="$(uname -s)"

case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          echo "NOT SUPPORTED:${unameOut}";exit 1
esac

if [[ $machine == "Linux" ]]; then
    check_open_port() {
        local sudo_cmd=""
        if [[ "$1" == "sudo" ]] && command -v sudo &>/dev/null; then
            sudo_cmd="sudo"
            # shift  # Remove "sudo" from the arguments
        fi
        local commands=("netstat" "lsof" "ss" "nmap")

        for cmd in "${commands[@]}"; do
            if command -v "$cmd" &>/dev/null; then
                echo "Checking open ports using $cmd..."
                case "$cmd" in
                    "netstat")
                        $sudo_cmd netstat -tuln
                        ;;
                    "lsof")
                        $sudo_cmd lsof -i -P -n | grep LISTEN
                        ;;
                    "ss")
                        $sudo_cmd ss -tuln
                        ;;
                    "nmap")
                        $sudo_cmd nmap -p 1-65535 localhost
                        ;;
                esac
                return 0
            fi
        done

        echo "No suitable command found for checking open ports."
        return 1
    }
elif [[ $machine == "Mac" ]]; then
    check_open_port() {
        local sudo_cmd=""
        if [[ "$1" == "sudo" ]] && command -v sudo &>/dev/null; then
            sudo_cmd="sudo"
            shift  # Remove "sudo" from the arguments
        fi

        local commands=("netstat" "lsof" "ss" "nmap")

        for cmd in "${commands[@]}"; do
            if command -v "$cmd" &>/dev/null; then
                echo "Checking open ports using $cmd..."
                case "$cmd" in
                    "netstat")
                        echo "$sudo_cmd netstat -an | grep LISTEN"
                        $sudo_cmd netstat -an | grep LISTEN
                        # eval $sudo_cmd netstat -an | grep LISTEN
                        ;;
                    "lsof")
                        $sudo_cmd lsof -i -P -n | grep LISTEN
                        ;;
                    "ss")
                        $sudo_cmd ss -tuln
                        ;;
                    "nmap")
                        $sudo_cmd nmap -p 1-65535 localhost
                        ;;
                esac
                return 0
            fi
        done

        echo "No suitable command found for checking open ports."
        return 1
    }
fi

