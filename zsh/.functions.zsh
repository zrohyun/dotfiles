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
        local arg="${1:-default}"

        if [[ "$arg" == "sudo" ]]; then
            if command -v sudo &>/dev/null; then
                if sudo -v &>/dev/null; then
                    sudo_cmd="sudo"
                    arg="${2:-default}"
                    # shift  # Remove "sudo" from the arguments
                else
                    echo "Error: sudo permission is required to run this command."
                    exit 1
                fi
            else
                echo "Error: sudo command not found. Please install sudo."
                exit 1
            fi
        fi
        local commands=("netstat" "lsof" "ss" "nmap")

        for cmd in "${commands[@]}"; do
            if [[ $arg == "default" ]] || [[ $cmd == $arg ]]; then
                if command -v "$cmd" &>/dev/null; then
                    echo "Checking open ports using $cmd..."
                    case "$cmd" in
                        "lsof")
                            echo "$sudo_cmd lsof -i -P -n | grep LISTEN"
                            $sudo_cmd lsof -i -P -n | grep LISTEN
                            ;;
                        "netstat")
                            echo "$sudo_cmd netstat -tuln"
                            $sudo_cmd netstat -tuln
                            ;;
                        "ss")
                            echo "$sudo_cmd ss -tuln"
                            $sudo ss -tuln
                            ;;
                        "nmap")
                            echo "$sudo_cmd nmap -p 1-65535 localhost"
                            $sudo_cmd nmap -p 1-65535 localhost
                            ;;
                    esac
                    return 0
                else
                    echo "$cmd is not installed"
                fi
            # else
            #     echo "$cmd is not your command($arg)"
            fi
        done

        echo "No suitable command found for checking open ports."
        return 1
    }
elif [[ $machine == "Mac" ]]; then
    check_open_port() {
        local sudo_cmd=""
        local arg="${1:-default}"

        if [[ "$arg" == "sudo" ]]; then
            if command -v sudo &>/dev/null; then
                if sudo -v &>/dev/null; then
                    sudo_cmd="sudo"
                    arg="${2:-default}"
                    # shift  # Remove "sudo" from the arguments
                else
                    echo "Error: sudo permission is required to run this command."
                    exit 1
                fi
            else
                echo "Error: sudo command not found. Please install sudo."
                exit 1
            fi
        fi

        local commands=("ss" "lsof" "nmap" "netstat")

        #TODO: if commands안에 $cmd가 없다면 
        #TODO: open된 port의 PID 출력

        for cmd in "${commands[@]}"; do
            if [[ $arg == "default" ]] || [[ $cmd == $arg ]]; then
                if command -v "$cmd" &>/dev/null; then
                    echo "Checking open ports using $cmd..."
                    case "$cmd" in
                        "lsof")
                            echo "$sudo_cmd lsof -i -P -n | grep LISTEN"
                            $sudo_cmd lsof -i -P -n | grep LISTEN
                            ;;
                        "netstat")
                            echo "$sudo_cmd netstat -an | grep LISTEN"
                            $sudo_cmd netstat -an | grep LISTEN
                            ;;
                        "ss")
                            echo "$sudo_cmd ss -tuln | grep LISTEN"
                            $sudo_cmd ss -tuln | grep LISTEN
                            ;;
                        "nmap")
                            echo "$sudo_cmd nmap -p 1-65535 localhost"
                            if ! $sudo_cmd nmap -p 1-65535 localhost; then
                                echo ""
                            fi
                            ;;
                    esac
                    return 0
                else
                    echo "$cmd is not installed"
                fi
            # else
            #     echo "$cmd is not your command($arg)"
            fi
        done

        echo "No suitable command found for checking open ports."
        return 1
    }
fi

