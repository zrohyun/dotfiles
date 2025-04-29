#!/usr/bin/env bash

function print_my_ip_info() {
    local format=""
    local only_private=0
    local only_public=0
    local only_ipv6=0
    local include_ipv6=0
    local debug_mode=0
    local show_ifname_peer=0
    local -a target_nics=()
    local -a up_interfaces=()
    local -a nic_entries=()
    local public_ip=""
    local cmdname="$(basename "$0")"  # 실행 명령어 이름 추출

    # 헬퍼 함수
    has_up_iface() {
        local want=$1
        for f in "${up_interfaces[@]}"; do
            [[ $f == "$want" ]] && return 0
        done
        return 1
    }
    add_nic_entry() {
        nic_entries+=("$1|$2|$3")
    }

    # 옵션 파싱
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -o|--output)
                shift
                case "$1" in
                    json) format="json" ;;
                    yaml|yml) format="yaml" ;;
                    markdown|md) format="markdown" ;;
                    *)
                        echo "[ERROR] 알 수 없는 출력 포맷: $1" >&2
                        exit 1
                        ;;
                esac
                ;;
            --only-private) only_private=1 ;;
            --only-public)  only_public=1 ;;
            --only-ipv6)    only_ipv6=1; include_ipv6=1 ;;
            --include-ipv6) include_ipv6=1 ;;
            --all)          include_ipv6=1 ;;
            --debug)        debug_mode=1 ;;
            --show-ifname-peer) show_ifname_peer=1 ;;
            --nic)
                shift
                IFS=',' read -ra target_nics <<< "$1"
                ;;
            --help|-h)
                cat <<EOF
Usage: $cmdname [OPTIONS]

Options:
  -o, --output [json|yaml|yml|markdown|md] 출력 포맷을 지정합니다.
  --only-private                 Private IP만 출력합니다.
  --only-public                  Public IP만 출력합니다.
  --only-ipv6                    IPv6 주소만 출력합니다.
  --include-ipv6                 IPv6 주소도 포함해서 출력합니다.
  --all                          IPv4 + IPv6 모두 출력합니다. (alias for --include-ipv6)
  --nic <iface1,iface2>           특정 NIC만 필터링해서 출력합니다.
  --show-ifname-peer              인터페이스 이름에 @peer 정보를 포함해서 출력합니다.
  --debug                         디버깅 정보를 추가 출력합니다.
  --help, -h                      이 도움말을 출력합니다.

Examples:
  $cmdname -o json
  $cmdname --only-private
  $cmdname --nic eth0 -o yaml
  $cmdname --show-ifname-peer -o markdown

EOF
                exit 0
                ;;
            *) ;; # 무시
        esac
        shift
    done

    # 1) UP 인터페이스 수집
    if ! command -v ip >/dev/null 2>&1 && ! command -v ifconfig >/dev/null 2>&1; then
        echo "[ERROR] 'ip' 또는 'ifconfig' 명령어가 필요합니다." >&2
        exit 1
    fi

    if command -v ip >/dev/null 2>&1; then
        [[ $debug_mode -eq 1 ]] && echo "[DEBUG] Using 'ip' command for interface UP detection." >&2
        while read -r iface_raw flags; do
            iface_match="${iface_raw%%@*}"
            if [[ "$flags" =~ UP ]]; then
                up_interfaces+=("$iface_match")
                [[ $debug_mode -eq 1 ]] && echo "[DEBUG] UP: $iface_raw" >&2
            fi
        done < <(ip -o link show | awk -F': ' '{print $2, $3}')
    else
        [[ $debug_mode -eq 1 ]] && echo "[DEBUG] Using 'ifconfig' command for interface UP detection." >&2
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Za-z0-9_-]+):\ flags=.*\<([^>]*)\> ]]; then
                iface=${BASH_REMATCH[1]}
                flags=${BASH_REMATCH[2]}
                if [[ "$flags" =~ UP ]]; then
                    up_interfaces+=("$iface")
                    [[ $debug_mode -eq 1 ]] && echo "[DEBUG] UP: $iface" >&2
                fi
            fi
        done < <(ifconfig)
    fi

    # 2) IP 수집
    if command -v ip >/dev/null 2>&1; then
        [[ $debug_mode -eq 1 ]] && echo "[DEBUG] Using 'ip' command for IP address collection." >&2
        while read -r iface_raw cidr; do
            iface_match="${iface_raw%%@*}"
            iface_display="$iface_match"
            [[ $show_ifname_peer -eq 1 ]] && iface_display="$iface_raw"
            ipaddr=${cidr%%/*}
            if has_up_iface "$iface_match"; then
                add_nic_entry "$iface_display" "ipv4" "$ipaddr"
                [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv4 $iface_display=$ipaddr" >&2
            fi
        done < <(ip -o -4 addr show scope global | awk '{print $2, $4}')

        if [[ $include_ipv6 -eq 1 ]]; then
            while read -r iface_raw cidr; do
                iface_match="${iface_raw%%@*}"
                iface_display="$iface_match"
                [[ $show_ifname_peer -eq 1 ]] && iface_display="$iface_raw"
                ipaddr=${cidr%%/*}
                if has_up_iface "$iface_match"; then
                    add_nic_entry "$iface_display" "ipv6" "$ipaddr"
                    [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv6 $iface_display=$ipaddr" >&2
                fi
            done < <(ip -o -6 addr show scope global | awk '{print $2, $4}')
        fi
    else
        [[ $debug_mode -eq 1 ]] && echo "[DEBUG] Using 'ifconfig' command for IP address collection." >&2
        local current_iface=""
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Za-z0-9_-]+): ]]; then
                current_iface=${BASH_REMATCH[1]}
            elif [[ "$line" =~ inet\ ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) ]]; then
                ipaddr=${BASH_REMATCH[1]}
                if has_up_iface "$current_iface"; then
                    add_nic_entry "$current_iface" "ipv4" "$ipaddr"
                    [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv4 $current_iface=$ipaddr" >&2
                fi
            elif [[ $include_ipv6 -eq 1 && "$line" =~ inet6\ ([0-9a-fA-F:]+) ]]; then
                ipaddr=${BASH_REMATCH[1]}
                if has_up_iface "$current_iface"; then
                    add_nic_entry "$current_iface" "ipv6" "$ipaddr"
                    [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv6 $current_iface=$ipaddr" >&2
                fi
            fi
        done < <(ifconfig)
    fi

    # 3) Public IP 조회
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        echo "[ERROR] 'curl' 또는 'wget' 명령어가 필요합니다." >&2
        exit 1
    fi

    for svc in ifconfig.me icanhazip.com ipinfo.io/ip api64.ipify.org; do
        if command -v curl >/dev/null 2>&1; then
            public_ip=$(curl -s --max-time 2 "$svc" || true)
        else
            public_ip=$(wget -qO- --timeout=2 "$svc" || true)
        fi
        if [[ -n "$public_ip" ]]; then
            add_nic_entry "public" "ipv4" "$public_ip"
            break
        fi
    done

    # 4) 필터링
    local -a filtered=()
    for e in "${nic_entries[@]}"; do
        IFS='|' read -r iface ver ipaddr <<< "$e"
        [[ $only_private -eq 1 && $iface == public ]] && continue
        [[ $only_public -eq 1 && $iface != public ]] && continue
        if (( ${#target_nics[@]} > 0 )); then
            local keep=0
            for tgt in "${target_nics[@]}"; do
                [[ $iface == "$tgt" ]] && { keep=1; break; }
            done
            [[ $keep -eq 0 ]] && continue
        fi
        [[ $only_ipv6 -eq 1 && $ver != ipv6 ]] && continue
        filtered+=("$e")
    done

    # 5) 출력
    IFS=$'\n' sorted=($(printf "%s\n" "${filtered[@]}" | sort))
    unset IFS

    case "$format" in
        json)
            json="{"; first=1
            for e in "${sorted[@]}"; do
                IFS='|' read -r iface ver ipaddr <<< "$e"
                (( first==0 )) && json+=", "
                json+="\"$iface/$ver\": \"$ipaddr\""
                first=0
            done
            json+="}"
            command -v jq >/dev/null 2>&1 && echo "$json" | jq . || echo "$json"
            ;;
        yaml)
            echo "---"
            for e in "${sorted[@]}"; do
                IFS='|' read -r iface ver ipaddr <<< "$e"
                echo "$iface/$ver: $ipaddr"
            done
            ;;
        markdown)
            echo "| Interface | IP Ver | Address |"
            echo "|-----------|--------:|---------|"
            for e in "${sorted[@]}"; do
                IFS='|' read -r iface ver ipaddr <<< "$e"
                echo "| $iface | $ver | $ipaddr |"
            done
            ;;
        *)
            echo "=== Private & Public IPs ==="
            for e in "${sorted[@]}"; do
                IFS='|' read -r iface ver ipaddr <<< "$e"
                echo "$iface ($ver): $ipaddr"
            done
            ;;
    esac
}

# 직접 실행된 경우
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    print_my_ip_info "$@"
fi
