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

# TODO
- [ ] downlaod나 특정 폴더를 주기적으로 정리해주는 cronjob

# Reference
Inspired and Forked From [thoughtbot/dotfiles](https://github.com/thoughtbot/dotfiles)

