#!/bin/bash
# Description: Docker context별 컨테이너 조회 도구
# Author: zrohyun
# Created: 2025-01-19

set -euo pipefail

show_help() {
    cat << EOF
Usage: $(basename "$0") [CONTEXT] [OPTIONS]

Docker context별 컨테이너를 조회하여 테이블 형태로 출력

Arguments:
    CONTEXT             특정 context만 조회 (생략시 모든 context)

Options:
    -j, --json          JSON 형태로 출력
    -h, --help          이 도움말 표시

Examples:
    $(basename "$0")                    # 모든 context의 컨테이너 표시
    $(basename "$0") colima             # colima context만 표시
    $(basename "$0") scv04 --json       # scv04 context를 JSON으로 출력
    $(basename "$0") --json             # 모든 context를 JSON으로 출력

Tab 자동완성:
    $(basename "$0") [TAB]              # 사용 가능한 context 목록
    $(basename "$0") co[TAB]            # colima 자동완성
EOF
}

collect_containers_json() {
    local target_context="$1"
    local json_output="["
    local first=true
    local contexts
    
    if [[ -n "$target_context" ]]; then
        # 특정 context만 처리
        if ! docker context ls --format '{{.Name}}' | grep -q "^${target_context}$"; then
            echo "❌ Context '$target_context' not found" >&2
            echo "Available contexts:" >&2
            docker context ls --format '{{.Name}}' >&2
            exit 1
        fi
        contexts="$target_context"
    else
        # 모든 context 처리
        contexts=$(docker context ls --format '{{.Name}}')
    fi
    
    for ctx in $contexts; do
        if ! docker --context "$ctx" ps > /dev/null 2>&1; then
            if [[ -n "$target_context" ]]; then
                echo "❌ Context '$ctx' is unreachable or invalid" >&2
                exit 1
            else
                echo "[SKIP] context '$ctx' is unreachable or invalid" >&2
                continue
            fi
        fi
        
        while read -r line; do
            if [[ -n "$line" ]]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    json_output+=","
                fi
                
                json_output+=$(echo "$line" | jq --arg context "$ctx" '. + {Context: $context}')
            fi
        done < <(docker --context "$ctx" ps --format '{{json .}}')
    done
    
    json_output+="]"
    echo "$json_output"
}

output_table() {
    local target_context="$1"
    local json_data
    
    json_data=$(collect_containers_json "$target_context")
    
    if [[ "$json_data" == "[]" ]]; then
        if [[ -n "$target_context" ]]; then
            echo "No containers found in context '$target_context'"
        else
            echo "No containers found in any accessible context"
        fi
        return
    fi
    
    echo "$json_data" | jq -r '
        ["CONTEXT", "CONTAINER ID", "IMAGE", "NAME", "STATUS", "PORTS"],
        (.[] | [ 
            .Context, 
            .ID, 
            (.Image | if length > 40 then .[0:37] + "..." else . end), 
            .Names, 
            .Status, 
            (.Ports // "") 
        ])
        | @tsv' | column -t -s $'\t'
}

output_json() {
    local target_context="$1"
    collect_containers_json "$target_context" | jq .
}

main() {
    local target_context=""
    local output_format="table"
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -j|--json)
                output_format="json"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                echo "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$target_context" ]]; then
                    target_context="$1"
                else
                    echo "❌ 너무 많은 인자입니다: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 출력 형태에 따라 실행
    if [[ "$output_format" == "json" ]]; then
        output_json "$target_context"
    else
        output_table "$target_context"
    fi
}

main "$@"
