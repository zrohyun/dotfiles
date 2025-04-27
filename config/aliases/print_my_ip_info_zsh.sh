#!/usr/bin/env zsh
# TODO: zsh용 print_my_ip_info_bash.sh 변환??

# # IP 정보를 출력하는 함수
# function print_my_ip_info() {
#     local format=""
#     local only_private=0
#     local only_public=0
#     local only_ipv6=0
#     local include_ipv6=0
#     local debug_mode=0
#     local -a target_nics=()
#     local -a up_interfaces=()
#     local -a nic_entries=()
#     local public_ip=""

#     # 헬퍼 함수들
#     has_up_iface() {
#         local want=$1
#         for f in "${up_interfaces[@]}"; do
#             [[ $f == "$want" ]] && return 0
#         done
#         return 1
#     }
#     add_nic_entry() {
#         # $1: iface, $2: ver, $3: addr
#         nic_entries+=("$1|$2|$3")
#     }

#     # 0) 옵션 파싱
#     while [[ $# -gt 0 ]]; do
#         case "$1" in
#             --format)        shift; format="$1"          ;;
#             --json)          format="json"               ;;
#             --yaml)          format="yaml"               ;;
#             --md|--markdown) format="markdown"           ;;
#             --only-private)  only_private=1              ;;
#             --only-public)   only_public=1               ;;
#             --only-ipv6)     only_ipv6=1; include_ipv6=1 ;;
#             --include-ipv6)  include_ipv6=1              ;;
#             --all)           include_ipv6=1              ;;
#             --debug)         debug_mode=1                ;;
#             --nic)           shift IFS=',' read -ra target_nics <<< "$1" ;;
#             *) ;;  # 무시
#         esac
#         shift
#     done

#     ###
#     # 1) UP 인터페이스 수집 (ip 우선, 없으면 ifconfig)
#     ###
#     if command -v ip >/dev/null 2>&1; then
#         # ip -o link show | awk -F': ' '{print $2, $3}'
#         while read -r iface flags; do
#             if [[ "$flags" =~ UP ]]; then
#                 up_interfaces+=("$iface")
#                 [[ $debug_mode -eq 1 ]] && echo "[DEBUG] UP: $iface" >&2
#             fi
#         done < <(ip -o link show | awk -F': ' '{print $2, $3}')
#     else
#         # fallback: ifconfig
#         while IFS= read -r line; do
#             if [[ "$line" =~ ^([A-Za-z0-9_-]+):\ flags=.*\<([^>]*)\> ]]; then
#                 iface=${BASH_REMATCH[1]}
#                 flags=${BASH_REMATCH[2]}
#                 if [[ "$flags" =~ UP ]]; then
#                     up_interfaces+=("$iface")
#                     [[ $debug_mode -eq 1 ]] && echo "[DEBUG] UP: $iface" >&2
#                 fi
#             fi
#         done < <(ifconfig)
#     fi

#     ###
#     # 2) IP 수집 (ip addr 우선, 없으면 ifconfig)
#     ###
#     if command -v ip >/dev/null 2>&1; then
#         # IPv4
#         while read -r iface cidr; do
#             ipaddr=${cidr%%/*}
#             if has_up_iface "$iface"; then
#                 add_nic_entry "$iface" "ipv4" "$ipaddr"
#                 [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv4 $iface=$ipaddr" >&2
#             fi
#         done < <(ip -o -4 addr show scope global | awk '{print $2, $4}')

#         # IPv6 (옵션 있을 때만)
#         if [[ $include_ipv6 -eq 1 ]]; then
#             while read -r iface cidr; do
#                 ipaddr=${cidr%%/*}
#                 if has_up_iface "$iface"; then
#                     add_nic_entry "$iface" "ipv6" "$ipaddr"
#                     [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv6 $iface=$ipaddr" >&2
#                 fi
#             done < <(ip -o -6 addr show scope global | awk '{print $2, $4}')
#         fi

#     else
#         # ifconfig 폴백
#         local current_iface=""
#         while IFS= read -r line; do
#             if [[ "$line" =~ ^([A-Za-z0-9_-]+): ]]; then
#                 current_iface=${BASH_REMATCH[1]}
#             elif [[ "$line" =~ inet\ ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+) ]]; then
#                 ipaddr=${BASH_REMATCH[1]}
#                 if has_up_iface "$current_iface"; then
#                     add_nic_entry "$current_iface" "ipv4" "$ipaddr"
#                     [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv4 $current_iface=$ipaddr" >&2
#                 fi
#             elif [[ $include_ipv6 -eq 1 && "$line" =~ inet6\ ([0-9a-fA-F:]+) ]]; then
#                 ipaddr=${BASH_REMATCH[1]}
#                 if has_up_iface "$current_iface"; then
#                     add_nic_entry "$current_iface" "ipv6" "$ipaddr"
#                     [[ $debug_mode -eq 1 ]] && echo "[DEBUG] IPv6 $current_iface=$ipaddr" >&2
#                 fi
#             fi
#         done < <(ifconfig)
#     fi

#     ###
#     # 3) Public IP 조회 (fallback 리스트)
#     ###
#     for svc in ifconfig.me icanhazip.com ipinfo.io/ip api64.ipify.org; do
#         public_ip=$(curl -s --max-time 2 "$svc" || true)
#         if [[ -n "$public_ip" ]]; then
#             add_nic_entry "public" "ipv4" "$public_ip"
#             break
#         fi
#     done

#     ###
#     # 4) 필터링
#     ###
#     local -a filtered=()
#     for e in "${nic_entries[@]}"; do
#         IFS='|' read -r iface ver ipaddr <<< "$e"
#         [[ $only_private -eq 1 && $iface == public ]]     && continue
#         [[ $only_public -eq 1  && $iface != public ]]     && continue
#         if (( ${#target_nics[@]} > 0 )); then
#             keep=0
#             for tgt in "${target_nics[@]}"; do
#                 [[ $iface == "$tgt" ]] && { keep=1; break; }
#             done
#             [[ $keep -eq 0 ]] && continue
#         fi
#         [[ $only_ipv6 -eq 1 && $ver != ipv6 ]]            && continue
#         filtered+=("$e")
#     done

#     ###
#     # 5) 정렬 & 출력
#     ###
#     IFS=$'\n' sorted=($(printf "%s\n" "${filtered[@]}" | sort))
#     unset IFS

#     case "$format" in
#         json)
#             json="{"; first=1
#             for e in "${sorted[@]}"; do
#                 IFS='|' read -r iface ver ipaddr <<< "$e"
#                 (( first==0 )) && json+=", "
#                 json+="\"$iface/$ver\": \"$ipaddr\""
#                 first=0
#             done
#             json+="}"
#             command -v jq >/dev/null 2>&1 && echo "$json" | jq . || echo "$json"
#             ;;
#         yaml)
#             echo "---"
#             for e in "${sorted[@]}"; do
#                 IFS='|' read -r iface ver ipaddr <<< "$e"
#                 echo "$iface/$ver: $ipaddr"
#             done
#             ;;
#         markdown)
#             echo "| Interface | IP Ver | Address |"
#             echo "|-----------|--------:|---------|"
#             for e in "${sorted[@]}"; do
#                 IFS='|' read -r iface ver ipaddr <<< "$e"
#                 echo "| $iface | $ver | $ipaddr |"
#             done
#             ;;
#         *)
#             echo "=== Private & Public IPs ==="
#             for e in "${sorted[@]}"; do
#                 IFS='|' read -r iface ver ipaddr <<< "$e"
#                 echo "$iface ($ver): $ipaddr"
#             done
#             ;;
#     esac
# }

# # 스크립트가 직접 실행될 때 함수 호출
# if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
#     print_my_ip_info "$@"
# fi
