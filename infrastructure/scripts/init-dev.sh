#!/usr/bin/env bash
set -e

echo "=============================================="
echo "Initializing Med24Plus Development Environment"
echo "=============================================="

# Copy root .env
if [ ! -f .env ]; then
    echo "Creating root .env from .env.example..."
    cp .env.example .env
fi

# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
fi

# Customer Web .env
if [ ! -f frontend/med24plus-web/.env.local ]; then
    echo "Creating frontend/med24plus-web/.env.local..."
    cp frontend/med24plus-web/.env.example frontend/med24plus-web/.env.local
fi

# Admin Panel .env
if [ ! -f frontend/admin-panel/.env.local ]; then
    echo "Creating frontend/admin-panel/.env.local..."
    cp frontend/admin-panel/.env.example frontend/admin-panel/.env.local
fi

echo "Environment files configured successfully."

