# 개인 스크립트 관리 시스템

이 디렉토리는 개인적으로 자주 사용하는 스크립트들을 저장하고, 선택적으로 명령어로 실행할 수 있도록 하는 간단한 시스템입니다.

## 📁 디렉토리 구조

```
~/.dotfiles/
├── scripts/                    # 스크립트 저장 공간
│   ├── hello.sh               # 예시: 인사말 스크립트
│   ├── sysinfo.sh             # 예시: 시스템 정보 조회
│   └── README.md              # 이 파일
├── bin/                       # 명령어로 사용할 스크립트들의 심볼릭 링크
│   ├── hello -> ../scripts/hello.sh
│   └── sysinfo -> ../scripts/sysinfo.sh
└── config/.path               # PATH 설정 (이미 ~/.bin 포함됨)

~/
└── .bin/                      # ~/.dotfiles/bin의 심볼릭 링크 (install.sh에서 자동 생성)
```

## 🚀 사용법

### 1. 새 스크립트 작성

```bash
# scripts/ 디렉토리에 스크립트 작성
vim ~/.dotfiles/scripts/my_script.sh

# 실행 권한 부여
chmod +x ~/.dotfiles/scripts/my_script.sh
```

### 2. 명령어로 등록 (선택사항)

명령어로 사용하고 싶은 스크립트만 bin/ 디렉토리에 심볼릭 링크를 생성:

```bash
# 심볼릭 링크 생성
ln -s ../scripts/my_script.sh ~/.dotfiles/bin/my-command

# 또는 스크립트 이름 그대로 사용
ln -s ../scripts/my_script.sh ~/.dotfiles/bin/my_script
```

### 3. 어디서든 실행

```bash
# 명령어로 등록한 스크립트는 어디서든 실행 가능
my-command

# 또는 직접 실행
~/.dotfiles/scripts/my_script.sh
```

## 📝 예시 스크립트들

### hello.sh
간단한 인사말과 시스템 정보를 출력하는 스크립트

```bash
# 명령어로 실행
hello

# 이름 지정
hello John

# 도움말
hello --help
```

### sysinfo.sh
상세한 시스템 정보를 조회하는 스크립트

```bash
# 모든 정보 표시
sysinfo

# OS 정보만
sysinfo -o

# 메모리 정보만
sysinfo -m

# 도움말
sysinfo --help
```

## 🔧 설치 및 설정

dotfiles 설치 시 자동으로 설정됩니다:

1. `~/.dotfiles/bin` → `~/.bin` 심볼릭 링크 생성
2. `~/.bin`이 PATH에 자동 추가
3. 등록된 스크립트들이 명령어로 사용 가능

## 💡 팁

### 스크립트 작성 가이드라인

1. **Shebang 사용**: `#!/bin/bash`로 시작
2. **안전한 설정**: `set -euo pipefail` 추가
3. **도움말 구현**: `--help` 옵션 제공
4. **에러 처리**: 적절한 에러 메시지와 종료 코드
5. **주석 작성**: 스크립트 목적과 사용법 명시

### 명명 규칙

- **스크립트 파일**: `script_name.sh` (언더스코어 사용)
- **명령어 이름**: `script-name` (하이픈 사용, 확장자 제거)

### 예시 템플릿

```bash
#!/bin/bash
# Description: 스크립트 설명
# Author: zrohyun
# Created: $(date +%Y-%m-%d)

set -euo pipefail

main() {
    echo "Hello from my script!"
    # 스크립트 로직 구현
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

스크립트 설명

Options:
    -h, --help    Show this help message

Examples:
    $(basename "$0")        # 기본 실행
EOF
}

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
```

## 🔍 관리 명령어

```bash
# 등록된 명령어 확인
ls -la ~/.bin/

# 스크립트 원본 확인
ls -la ~/.dotfiles/scripts/

# 심볼릭 링크 상태 확인
ls -la ~/.dotfiles/bin/

# 새 스크립트 등록
ln -s ../scripts/new_script.sh ~/.dotfiles/bin/new-command

# 명령어 제거 (스크립트 원본은 유지됨)
rm ~/.dotfiles/bin/old-command
```

## 🔄 기존 bin/ 디렉토리와의 차이점

- **scripts/**: 모든 스크립트 저장 (백업 및 버전 관리)
- **bin/**: 명령어로 사용할 스크립트만 선택적으로 링크
- **~/.bin**: 실제 PATH에 포함되는 디렉토리 (자동 생성)

이 구조를 통해 스크립트는 안전하게 보관하면서, 필요한 것만 명령어로 사용할 수 있습니다.

---

더 자세한 정보는 각 스크립트의 `--help` 옵션을 확인하세요.
