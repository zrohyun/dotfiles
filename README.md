# Install

## clone
```bash
git clone  --depth=1 -b main https://github.com/zrohyun/dotfiles.git $HOME/.dotfiles
cd $HOME/.dotfiles
./install.sh
```
## curl
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)
```

## Docker
```bash
docker run -idt --name dotfiles --rm ubuntu:24.04 && docker exec -it dotfiles bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/zrohyun/dotfiles/main/install.sh)
```

# Requirements

# Reference
Inspired and Forked From [thoughtbot/dotfiles](https://github.com/thoughtbot/dotfiles)