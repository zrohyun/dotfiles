#!/bin/bash
# Description: 프로젝트 배포 스크립트 템플릿
# Author: zrohyun
# Created: 2025-01-19
# Category: work

set -euo pipefail

# 설정 변수들
PROJECT_NAME="${PROJECT_NAME:-my-project}"
DEPLOY_ENV="${DEPLOY_ENV:-staging}"
BUILD_DIR="${BUILD_DIR:-./build}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# 로깅 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1"
}

log_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >&2
}

log_success() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1"
}

# 배포 전 체크
pre_deploy_check() {
    log "배포 전 체크 시작..."
    
    # Git 상태 확인
    if git status --porcelain | grep -q .; then
        log_error "Git working directory가 깨끗하지 않습니다. 커밋하지 않은 변경사항이 있습니다."
        return 1
    fi
    
    # 빌드 디렉토리 확인
    if [[ ! -d "$BUILD_DIR" ]]; then
        log "빌드 디렉토리가 없습니다. 빌드를 먼저 실행합니다..."
        build_project
    fi
    
    log_success "배포 전 체크 완료"
}

# 프로젝트 빌드
build_project() {
    log "프로젝트 빌드 시작..."
    
    # 예시: Node.js 프로젝트
    if [[ -f "package.json" ]]; then
        npm run build
    # 예시: Python 프로젝트
    elif [[ -f "requirements.txt" ]]; then
        pip install -r requirements.txt
    # 예시: Go 프로젝트
    elif [[ -f "go.mod" ]]; then
        go build -o "$BUILD_DIR/app" .
    else
        log "빌드 방법을 찾을 수 없습니다. 수동으로 빌드해주세요."
        return 1
    fi
    
    log_success "프로젝트 빌드 완료"
}

# 백업 생성
create_backup() {
    log "백업 생성 중..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="${PROJECT_NAME}_${DEPLOY_ENV}_${timestamp}"
    
    mkdir -p "$BACKUP_DIR"
    
    # 현재 배포된 버전 백업 (예시)
    if [[ -d "/var/www/$PROJECT_NAME" ]]; then
        tar -czf "$BACKUP_DIR/${backup_name}.tar.gz" -C "/var/www" "$PROJECT_NAME"
        log_success "백업 생성 완료: $BACKUP_DIR/${backup_name}.tar.gz"
    else
        log "백업할 기존 배포가 없습니다."
    fi
}

# 배포 실행
deploy() {
    log "배포 시작: $PROJECT_NAME to $DEPLOY_ENV"
    
    # 예시 배포 로직
    case "$DEPLOY_ENV" in
        "staging")
            log "스테이징 환경에 배포 중..."
            # rsync -av "$BUILD_DIR/" user@staging-server:/var/www/$PROJECT_NAME/
            echo "스테이징 배포 로직을 여기에 구현하세요"
            ;;
        "production")
            log "프로덕션 환경에 배포 중..."
            # rsync -av "$BUILD_DIR/" user@prod-server:/var/www/$PROJECT_NAME/
            echo "프로덕션 배포 로직을 여기에 구현하세요"
            ;;
        *)
            log_error "알 수 없는 배포 환경: $DEPLOY_ENV"
            return 1
            ;;
    esac
    
    log_success "배포 완료!"
}

# 배포 후 검증
post_deploy_check() {
    log "배포 후 검증 시작..."
    
    # 예시: 헬스체크
    local health_url="https://${PROJECT_NAME}-${DEPLOY_ENV}.example.com/health"
    
    if command -v curl &>/dev/null; then
        if curl -f -s "$health_url" > /dev/null; then
            log_success "헬스체크 통과: $health_url"
        else
            log_error "헬스체크 실패: $health_url"
            return 1
        fi
    else
        log "curl이 없어서 헬스체크를 건너뜁니다."
    fi
    
    log_success "배포 후 검증 완료"
}

# 도움말
show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

프로젝트 배포 스크립트

Options:
    -e, --env ENV       배포 환경 (staging|production) [default: staging]
    -p, --project NAME  프로젝트 이름 [default: my-project]
    -b, --build-only    빌드만 실행
    -h, --help          이 도움말 표시

Environment Variables:
    PROJECT_NAME        프로젝트 이름
    DEPLOY_ENV          배포 환경
    BUILD_DIR           빌드 디렉토리
    BACKUP_DIR          백업 디렉토리

Examples:
    $(basename "$0")                           # 기본 스테이징 배포
    $(basename "$0") -e production             # 프로덕션 배포
    $(basename "$0") -p myapp -e staging       # 특정 프로젝트 스테이징 배포
    $(basename "$0") --build-only              # 빌드만 실행
EOF
}

# 메인 함수
main() {
    local build_only=false
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                DEPLOY_ENV="$2"
                shift 2
                ;;
            -p|--project)
                PROJECT_NAME="$2"
                shift 2
                ;;
            -b|--build-only)
                build_only=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "배포 시작: $PROJECT_NAME ($DEPLOY_ENV)"
    
    # 빌드만 실행하는 경우
    if [[ "$build_only" == true ]]; then
        build_project
        exit 0
    fi
    
    # 전체 배포 프로세스
    pre_deploy_check
    create_backup
    deploy
    post_deploy_check
    
    log_success "모든 배포 과정이 완료되었습니다! 🚀"
}

# 스크립트가 직접 실행될 때만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
