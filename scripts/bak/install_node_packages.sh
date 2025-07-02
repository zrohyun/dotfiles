#!/bin/bash

# Node.js ecosystem installation functions for both Mac and Linux

install_node_ecosystem_mac() {
    echo "Installing Node.js ecosystem for Mac..."
    
    # Check if Homebrew is available
    if ! command -v brew &> /dev/null; then
        echo "Error: Homebrew is not installed. Please install Homebrew first."
        return 1
    fi
    
    # Install Node.js and NVM via Homebrew (should already be in Brewfile)
    echo "Installing Node.js and NVM via Homebrew..."
    brew install node nvm || echo "Node.js/NVM installation via brew failed or already installed"
    
    # Setup NVM environment
    export NVM_DIR="$HOME/.nvm"
    [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # Apple Silicon
    [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh"        # Intel Mac
    [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # Apple Silicon
    [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"        # Intel Mac
    
    # npm global packages to install
    npm_packages=(
        "@anthropic-ai/claude-code"
        "typescript"
        "ts-node"
        "nodemon"
        "pm2"
        "http-server"
        "live-server"
        "prettier"
        "eslint"
        "@vue/cli"
        "create-react-app"
        "vite"
        "yarn"
        "pnpm"
    )
    
    # npx commands to run
    npx_commands=(
        "https://github.com/google-gemini/gemini-cli"
    )
    
    # Install npm global packages
    echo "Installing npm global packages..."
    for package in "${npm_packages[@]}"; do
        echo "Installing $package..."
        npm install -g "$package" || echo "Failed to install $package"
    done
    
    # Run npx commands
    echo "Running npx commands..."
    for cmd in "${npx_commands[@]}"; do
        echo "Running npx $cmd..."
        npx "$cmd" --help || echo "Failed to run npx $cmd"
    done
    
    echo "Node.js ecosystem installation completed for Mac!"
}

install_node_ecosystem_linux() {
    echo "Installing Node.js ecosystem for Linux..."
    
    # Install NVM first
    install_nvm_linux
    
    # npm global packages to install
    npm_packages=(
        "@anthropic-ai/claude-code"
        "typescript"
        "ts-node"
        "nodemon"
        "pm2"
        "http-server"
        "live-server"
        "prettier"
        "eslint"
        "@vue/cli"
        "create-react-app"
        "vite"
        "yarn"
        "pnpm"
    )
    
    # npx commands to run
    npx_commands=(
        "https://github.com/google-gemini/gemini-cli"
    )
    
    # Install npm global packages
    echo "Installing npm global packages..."
    for package in "${npm_packages[@]}"; do
        echo "Installing $package..."
        npm install -g "$package" || echo "Failed to install $package"
    done
    
    # Run npx commands
    echo "Running npx commands..."
    for cmd in "${npx_commands[@]}"; do
        echo "Running npx $cmd..."
        npx "$cmd" --help || echo "Failed to run npx $cmd"
    done
    
    echo "Node.js ecosystem installation completed for Linux!"
}

install_nvm_linux() {
    # Install NVM (Node Version Manager) for Linux
    if [ -d "$HOME/.nvm" ]; then
        echo "NVM is already installed"
        return 0
    fi
    
    echo "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Source nvm to make it available in current session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo "NVM installed successfully. Please restart your terminal or run 'source ~/.bashrc' to use nvm."
}

# Universal function that detects OS and calls appropriate function
install_node_ecosystem() {
    local machine=$(uname -s)
    
    case "${machine}" in
        Linux*)
            install_node_ecosystem_linux
            ;;
        Darwin*)
            install_node_ecosystem_mac
            ;;
        *)
            echo "Unsupported operating system: ${machine}"
            return 1
            ;;
    esac
}
