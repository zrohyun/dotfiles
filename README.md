# Install

## Installation Methods

### Clone Repository
```bash
git clone --depth=1 -b main https://github.com/zrohyun/dotfiles.git $HOME/.dotfiles
cd $HOME/.dotfiles
./install.sh
```

### Using curl
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)"
```

### Using Docker
```bash
docker run -idt --name dotfiles --rm ubuntu:24.04 && docker exec -it dotfiles bash
apt update && apt install -y curl
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)"
```

## OS-Specific Instructions

### macOS
Mac 사용자는 dotfiles 설치 후 `init_setup_mac_apps.sh` 스크립트로 추가 앱 설치:

```bash
# 1. dotfiles 설치
./install.sh

# 2. Homebrew 앱 설치
./init_setup_mac_apps.sh
```

`init_setup_mac_apps.sh`: config/osx/Brewfile의 앱 설치

#### 내장 함수

설치 후 사용 가능한 함수:

1. **앱 목록 백업**:
   ```bash
   dump_brewfile
   ```
   현재 앱 목록을 `.bak` 디렉토리에 타임스탬프와 함께 백업

# Reference
Inspired and Forked From [thoughtbot/dotfiles](https://github.com/thoughtbot/dotfiles)
