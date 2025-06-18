#!/bin/bash
# Description: 시스템 정보 조회 유틸리티
# Author: zrohyun
# Created: 2025-01-19
# Category: utils

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 아이콘 정의
ICON_OS="🖥️ "
ICON_CPU="🔧"
ICON_MEM="💾"
ICON_DISK="💿"
ICON_NET="🌐"
ICON_TIME="⏰"
ICON_USER="👤"

# 출력 함수들
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}       SYSTEM INFORMATION       ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
}

print_section() {
    echo -e "${CYAN}$1${NC}"
    echo "------------------------"
}

# OS 정보
show_os_info() {
    print_section "${ICON_OS}Operating System"
    
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

# CPU 정보
show_cpu_info() {
    print_section "${ICON_CPU} CPU Information"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Model: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo 'N/A')"
        echo "Cores: $(sysctl -n hw.ncpu 2>/dev/null || echo 'N/A')"
        echo "Architecture: $(uname -m)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /proc/cpuinfo ]]; then
            local cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^ *//')
            local cpu_cores=$(nproc 2>/dev/null || echo 'N/A')
            echo "Model: ${cpu_model:-N/A}"
            echo "Cores: $cpu_cores"
        fi
    fi
    
    # Load average
    if command -v uptime &>/dev/null; then
        echo "Load Average: $(uptime | awk -F'load average:' '{print $2}' | sed 's/^ *//')"
    fi
    echo
}

# 메모리 정보
show_memory_info() {
    print_section "${ICON_MEM} Memory Information"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local total_mem=$(sysctl -n hw.memsize 2>/dev/null)
        if [[ -n "$total_mem" ]]; then
            local total_gb=$((total_mem / 1024 / 1024 / 1024))
            echo "Total Memory: ${total_gb}GB"
        fi
        
        # macOS 메모리 사용량 (vm_stat 사용)
        if command -v vm_stat &>/dev/null; then
            local vm_info=$(vm_stat)
            local page_size=$(vm_stat | grep "page size" | awk '{print $8}' || echo 4096)
            local free_pages=$(echo "$vm_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
            local used_pages=$(echo "$vm_info" | grep "Pages active\|Pages inactive\|Pages speculative\|Pages wired down" | awk '{sum += $3} END {print sum}')
            
            if [[ -n "$free_pages" && -n "$used_pages" ]]; then
                local free_mb=$((free_pages * page_size / 1024 / 1024))
                local used_mb=$((used_pages * page_size / 1024 / 1024))
                echo "Used Memory: ${used_mb}MB"
                echo "Free Memory: ${free_mb}MB"
            fi
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

# 디스크 정보
show_disk_info() {
    print_section "${ICON_DISK} Disk Information"
    
    if command -v df &>/dev/null; then
        echo "Disk Usage:"
        df -h | grep -E '^/dev|^tmpfs' | awk '{
            printf "%-20s %8s %8s %8s %6s %s\n", $1, $2, $3, $4, $5, $6
        }' | head -10
    fi
    echo
}

# 네트워크 정보
show_network_info() {
    print_section "${ICON_NET} Network Information"
    
    # IP 주소들
    echo "Network Interfaces:"
    if command -v ip &>/dev/null; then
        ip addr show | grep -E "inet " | grep -v "127.0.0.1" | awk '{print "  " $NF ": " $2}' | head -5
    elif command -v ifconfig &>/dev/null; then
        ifconfig | grep -E "inet " | grep -v "127.0.0.1" | awk '{print "  Interface: " $2}' | head -5
    fi
    
    # 외부 IP (선택적)
    if command -v curl &>/dev/null; then
        local external_ip=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo "N/A")
        echo "External IP: $external_ip"
    fi
    echo
}

# 시간 정보
show_time_info() {
    print_section "${ICON_TIME} Time Information"
    
    echo "Current Time: $(date)"
    echo "Timezone: $(date +%Z)"
    echo "Unix Timestamp: $(date +%s)"
    
    if command -v uptime &>/dev/null; then
        echo "System Uptime: $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
    fi
    echo
}

# 사용자 정보
show_user_info() {
    print_section "${ICON_USER} User Information"
    
    echo "Current User: $(whoami)"
    echo "User ID: $(id -u)"
    echo "Group ID: $(id -g)"
    echo "Home Directory: $HOME"
    echo "Shell: $SHELL"
    
    if command -v who &>/dev/null; then
        echo "Logged in Users:"
        who | awk '{print "  " $1 " (" $2 ")"}' | sort -u
    fi
    echo
}

# 프로세스 정보 (간단히)
show_process_info() {
    print_section "🔄 Process Information"
    
    echo "Total Processes: $(ps aux | wc -l)"
    
    if command -v ps &>/dev/null; then
        echo "Top 5 CPU consuming processes:"
        ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "  %-20s %6s %6s\n", $11, $3"%", $4"%"}'
    fi
    echo
}

# 도움말
show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

시스템 정보를 조회하는 유틸리티 스크립트

Options:
    -a, --all       모든 정보 표시 (기본값)
    -o, --os        OS 정보만 표시
    -c, --cpu       CPU 정보만 표시
    -m, --memory    메모리 정보만 표시
    -d, --disk      디스크 정보만 표시
    -n, --network   네트워크 정보만 표시
    -t, --time      시간 정보만 표시
    -u, --user      사용자 정보만 표시
    -p, --process   프로세스 정보만 표시
    --no-color      색상 없이 출력
    -h, --help      이 도움말 표시

Examples:
    $(basename "$0")              # 모든 정보 표시
    $(basename "$0") -o           # OS 정보만 표시
    $(basename "$0") -m -d        # 메모리와 디스크 정보만 표시
    $(basename "$0") --no-color   # 색상 없이 출력
EOF
}

# 메인 함수
main() {
    local show_all=true
    local show_os=false
    local show_cpu=false
    local show_memory=false
    local show_disk=false
    local show_network=false
    local show_time=false
    local show_user=false
    local show_process=false
    local use_color=true
    
    # 인자가 있으면 show_all을 false로 설정
    if [[ $# -gt 0 ]]; then
        show_all=false
    fi
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                show_all=true
                shift
                ;;
            -o|--os)
                show_os=true
                shift
                ;;
            -c|--cpu)
                show_cpu=true
                shift
                ;;
            -m|--memory)
                show_memory=true
                shift
                ;;
            -d|--disk)
                show_disk=true
                shift
                ;;
            -n|--network)
                show_network=true
                shift
                ;;
            -t|--time)
                show_time=true
                shift
                ;;
            -u|--user)
                show_user=true
                shift
                ;;
            -p|--process)
                show_process=true
                shift
                ;;
            --no-color)
                use_color=false
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
    
    # 색상 비활성화
    if [[ "$use_color" == false ]]; then
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        PURPLE=''
        CYAN=''
        NC=''
    fi
    
    print_header
    
    # 정보 표시
    if [[ "$show_all" == true ]]; then
        show_os_info
        show_cpu_info
        show_memory_info
        show_disk_info
        show_network_info
        show_time_info
        show_user_info
        show_process_info
    else
        [[ "$show_os" == true ]] && show_os_info
        [[ "$show_cpu" == true ]] && show_cpu_info
        [[ "$show_memory" == true ]] && show_memory_info
        [[ "$show_disk" == true ]] && show_disk_info
        [[ "$show_network" == true ]] && show_network_info
        [[ "$show_time" == true ]] && show_time_info
        [[ "$show_user" == true ]] && show_user_info
        [[ "$show_process" == true ]] && show_process_info
    fi
    
    echo -e "${GREEN}System information collection completed! ✅${NC}"
}

# 스크립트가 직접 실행될 때만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
