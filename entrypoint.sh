#!/bin/sh

# Fix permissions for volume-mounted directories
if [ -d "/app/public/audio" ]; then
    echo "Setting permissions for /app/public/audio..."
    chown -R nextjs:nodejs /app/public/audio
    chmod -R 755 /app/public/audio
fi

if [ -d "/app/data" ]; then
    echo "Setting permissions for /app/data..."
    chown -R nextjs:nodejs /app/data
    chmod -R 755 /app/data
fi

# Switch to nextjs user and run the application
exec su-exec nextjs "$@"