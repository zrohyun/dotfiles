#!/usr/bin/env python3

import os
import subprocess
import shutil
import sys

def run_command(command):
    return subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

def curl_install_dotfiles():
    try:
        run_command("git --version")
    except subprocess.CalledProcessError:
        print("git is not installed")
        sys.exit(1)

    try:
        remote_url = run_command("git config --get remote.origin.url").stdout.strip()
        if remote_url == "https://github.com/zrohyun/dotfiles":
            return
    except subprocess.CalledProcessError:
        pass

    dotfiles_dir = os.path.expanduser("~/.dotfiles")
    if os.path.exists(dotfiles_dir):
        print(f"backup {dotfiles_dir} to {dotfiles_dir}.bak")
        shutil.move(dotfiles_dir, f"{dotfiles_dir}.bak")

    run_command(f"git clone --depth=1 -b main https://github.com/zrohyun/dotfiles.git {dotfiles_dir}")
    os.chdir(dotfiles_dir)
    os.execv(sys.executable, ['python', './install.py'])

if __name__ == "__main__":
    curl_install_dotfiles()

    DOTFILES = os.getcwd()

    if DOTFILES != os.path.expanduser("~/.dotfiles"):
        home_dotfiles = os.path.expanduser("~/.dotfiles")
        if os.path.exists(home_dotfiles):
            print(f"backup {home_dotfiles} to {home_dotfiles}.bak")
            shutil.move(home_dotfiles, f"{home_dotfiles}.bak")
        os.symlink(DOTFILES, home_dotfiles)
        DOTFILES = home_dotfiles

    print(f"PWD(DOTFILES): {DOTFILES}")

    # TODO: Implement logging functionality
    # set_for_logging()

    mac_service_start = False

    # Load environment variables
    with open(os.path.join(DOTFILES, "config", ".env")) as env_file:
        for line in env_file:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

    # Import and run setup functions
    sys.path.append(os.path.join(DOTFILES, "config", "functions"))
    
    if os.environ.get('machine') == "Linux":
        from setup_linux import setup_linux
        setup_linux()
    elif os.environ.get('machine') == "Mac":
        from setup_mac import setup_mac
        setup_mac()

    from backup import backup, symlink_dotfiles
    backup()  # backup dotfiles to /tmp/dotfiles.bak
    symlink_dotfiles()

    from install_omz import install_omz
    install_omz()