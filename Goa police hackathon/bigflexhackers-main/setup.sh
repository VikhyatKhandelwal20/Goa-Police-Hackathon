#!/bin/bash

echo "🚔 Police Management System Setup Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

print_status "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm $(npm -v) is installed"

echo ""
print_info "Setting up Police Management System..."
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f "package.json" ]; then
    print_error "package.json not found in backend directory"
    exit 1
fi

print_info "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Backend dependencies installed"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_info "Creating .env.local file..."
    cat > .env.local << EOF
# MongoDB Connection String
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Development mode
NODE_ENV=development
EOF
    print_warning "Created .env.local file. Please update with your MongoDB credentials."
else
    print_status ".env.local already exists"
fi

# Frontend setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend directory"
    exit 1
fi

print_info "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Frontend dependencies installed"

# Go back to root directory
cd ..

echo ""
print_status "Setup completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Update backend/.env.local with your MongoDB Atlas connection string"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Create demo data: cd backend && node create-demo-data.js"
echo ""
print_info "For detailed instructions, see README.md"
echo ""
print_warning "Don't forget to:"
echo "- Create a MongoDB Atlas account"
echo "- Whitelist your IP address"
echo "- Update the connection string in .env.local"
echo ""
print_status "Happy coding! 🚔✨"
