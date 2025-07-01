#!/bin/bash
# Complete setup script for Smart Student Tracking AI features

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Smart Student Tracking - Setup Script ${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}✗ Supabase CLI not found${NC}"
        echo -e "${YELLOW}Please install the Supabase CLI:${NC}"
        echo -e "npm install -g supabase"
        return 1
    else
        echo -e "${GREEN}✓ Supabase CLI found: $(supabase --version)${NC}"
        return 0
    fi
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"
        return 0
    fi
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm not found${NC}"
        echo -e "${YELLOW}Please install npm (should come with Node.js)${NC}"
        return 1
    else
        echo -e "${GREEN}✓ npm found: $(npm -v)${NC}"
        return 0
    fi
}

# Check for .env file
check_env_file() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating sample .env file...${NC}"
        cat > .env << EOL
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API Key (for Edge Functions)
OPENAI_API_KEY=your_openai_api_key_here
EOL
        echo -e "${GREEN}✓ Sample .env file created${NC}"
        echo -e "${YELLOW}Please edit the .env file with your Supabase credentials${NC}"
        return 1
    else
        echo -e "${GREEN}✓ .env file found${NC}"
        return 0
    fi
}

# Deploy Edge Functions
deploy_edge_functions() {
    echo -e "${CYAN}Deploying Edge Functions...${NC}"
    bash deploy_edge_functions.sh
    
    # Ask for OpenAI API key
    echo ""
    read -p "Enter your OpenAI API Key (or press Enter to skip): " api_key
    
    if [ ! -z "$api_key" ]; then
        echo -e "${CYAN}Setting OpenAI API Key...${NC}"
        supabase secrets set OPENAI_API_KEY="$api_key"
        echo -e "${GREEN}✓ OpenAI API Key set successfully${NC}"
    fi
}

# Install dependencies
install_dependencies() {
    echo -e "${CYAN}Installing npm dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Run development server
run_dev_server() {
    echo -e "${CYAN}Starting development server...${NC}"
    npm run dev
}

# Main script
echo -e "${CYAN}Checking prerequisites...${NC}"
check_nodejs
check_npm
check_supabase_cli
check_env_file

echo ""
echo -e "${CYAN}Ready to set up AI features${NC}"
echo ""
echo "1. Install dependencies"
echo "2. Deploy Edge Functions"
echo "3. Start development server"
echo "q. Quit"
echo ""

read -p "Would you like to perform all steps automatically? (y/n/q): " auto_choice

case $auto_choice in
    y|Y)
        install_dependencies
        deploy_edge_functions
        run_dev_server
        ;;
    n|N)
        while true; do
            echo ""
            read -p "Select an option (1-3, q to quit): " choice
            
            case $choice in
                1) install_dependencies ;;
                2) deploy_edge_functions ;;
                3) run_dev_server ;;
                q|Q) echo -e "${CYAN}Exiting...${NC}"; break ;;
                *) echo -e "${RED}Invalid option${NC}" ;;
            esac
        done
        ;;
    q|Q|*)
        echo -e "${CYAN}Exiting...${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}Setup script completed${NC}"
echo -e "${YELLOW}For more information, see AI_FEATURES_SETUP.md${NC}" 