#!/bin/bash
# Description: 시스템 정보 조회 스크립트
# Author: zrohyun
# Created: 2025-01-19

set -euo pipefail

show_os_info() {
    echo "🖥️  Operating System"
    echo "------------------------"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "OS: macOS"
        if command -v sw_vers &>/dev/null; then
            echo "Version: $(sw_vers -productVersion)"
            echo "Build: $(sw_vers -buildVersion)"
        fi
        echo "Kernel: $(uname -r)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "OS: Linux"
        if [[ -f /etc/os-release ]]; then
            source /etc/os-release
            echo "Distribution: $PRETTY_NAME"
            echo "Version: ${VERSION:-N/A}"
        fi
        echo "Kernel: $(uname -r)"
    else
        echo "OS: $(uname -s)"
        echo "Kernel: $(uname -r)"
    fi
    
    echo "Architecture: $(uname -m)"
    echo "Hostname: $(hostname)"
    echo
}

show_memory_info() {
    echo "💾 Memory Information"
    echo "------------------------"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local total_mem=$(sysctl -n hw.memsize 2>/dev/null)
        if [[ -n "$total_mem" ]]; then
            local total_gb=$((total_mem / 1024 / 1024 / 1024))
            echo "Total Memory: ${total_gb}GB"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /proc/meminfo ]]; then
            local total_mem=$(grep "MemTotal" /proc/meminfo | awk '{print $2}')
            local free_mem=$(grep "MemAvailable" /proc/meminfo | awk '{print $2}')
            local used_mem=$((total_mem - free_mem))
            
            echo "Total Memory: $((total_mem / 1024))MB"
            echo "Used Memory: $((used_mem / 1024))MB"
            echo "Free Memory: $((free_mem / 1024))MB"
            echo "Usage: $(((used_mem * 100) / total_mem))%"
        fi
    fi
    echo
}

show_disk_info() {
    echo "💿 Disk Information"
    echo "------------------------"
    
    if command -v df &>/dev/null; then
        echo "Disk Usage:"
        df -h | grep -E '^/dev|^tmpfs' | awk '{
            printf "%-20s %8s %8s %8s %6s\n", $1, $2, $3, $4, $5
        }' | head -5
    fi
    echo
}

show_network_info() {
    echo "🌐 Network Information"
    echo "------------------------"
    
    echo "Network Interfaces:"
    if command -v ip &>/dev/null; then
        ip addr show | grep -E "inet " | grep -v "127.0.0.1" | awk '{print "  " $NF ": " $2}' | head -3
    elif command -v ifconfig &>/dev/null; then
        ifconfig | grep -E "inet " | grep -v "127.0.0.1" | awk '{print "  Interface: " $2}' | head -3
    fi
    
    if command -v curl &>/dev/null; then
        local external_ip=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo "N/A")
        echo "External IP: $external_ip"
    fi
    echo
}

show_all() {
    echo "================================"
    echo "       SYSTEM INFORMATION       "
    echo "================================"
    echo
    
    show_os_info
    show_memory_info
    show_disk_info
    show_network_info
    
    echo "✅ System information collection completed!"
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

시스템 정보를 조회하는 스크립트

Options:
    -a, --all       모든 정보 표시 (기본값)
    -o, --os        OS 정보만 표시
    -m, --memory    메모리 정보만 표시
    -d, --disk      디스크 정보만 표시
    -n, --network   네트워크 정보만 표시
    -h, --help      이 도움말 표시

Examples:
    $(basename "$0")              # 모든 정보 표시
    $(basename "$0") -o           # OS 정보만 표시
    $(basename "$0") -m -d        # 메모리와 디스크 정보만 표시
EOF
}

main() {
    local show_all_info=true
    
    # 인자가 있으면 show_all_info를 false로 설정
    if [[ $# -gt 0 ]]; then
        show_all_info=false
    fi
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                show_all_info=true
                shift
                ;;
            -o|--os)
                show_os_info
                shift
                ;;
            -m|--memory)
                show_memory_info
                shift
                ;;
            -d|--disk)
                show_disk_info
                shift
                ;;
            -n|--network)
                show_network_info
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ "$show_all_info" == true ]]; then
        show_all
    fi
}

main "$@"
