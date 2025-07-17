# Soundboard Application

A full-stack Next.js soundboard application with TypeScript, shadcn/ui components, and Tailwind CSS. The app provides both a public soundboard interface and a password-protected admin interface for content management.

## Features

- 🎵 **Interactive Soundboard**: Play audio clips organized by categories
- 🔒 **Admin Interface**: Password-protected admin panel for managing sounds
- 📁 **File Management**: Upload and organize audio files through the admin interface
- 🎨 **Customizable Theming**: Environment-based color customization
- 🔐 **Secure Authentication**: JWT-based session management with HTTP-only cookies
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🐳 **Docker Support**: Easy deployment with Docker and Docker Compose

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Authentication**: JWT with HTTP-only cookies
- **Database**: Filesystem-based (sounds.yaml)
- **Audio Storage**: Local file system

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Clone the repository
git clone <your-repo-url>
cd soundboard

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the application
docker-compose up -d

# Access the application
# Public soundboard: http://localhost:3000
# Admin interface: http://localhost:3000/admin
```

## Manual Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file with the following variables:
   ```bash
   PORT=3000
   ADMIN_PASSWORD="your-secret-password"
   NEXT_PUBLIC_PRIMARY_COLOR="hsl(222.2 47.4% 11.2%)"
   NEXT_PUBLIC_BACKGROUND_COLOR="hsl(0 0% 100%)"
   NEXT_PUBLIC_CARD_COLOR="hsl(240 5.9% 90%)"
   NEXT_PUBLIC_TEXT_COLOR="hsl(222.2 84% 4.9%)"
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Public soundboard: [http://localhost:3000](http://localhost:3000)
   - Admin interface: [http://localhost:3000/admin](http://localhost:3000/admin)

## Production Deployment

### Docker Deployment (Recommended)

The application is designed for deployment with persistent filesystem support:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t soundboard .
docker run -p 3000:3000 \
  -v $(pwd)/sounds.yaml:/app/sounds.yaml \
  -v $(pwd)/public/audio:/app/public/audio \
  -e ADMIN_PASSWORD="your-password" \
  soundboard
```

### Important Deployment Notes

⚠️ **Critical**: This application requires persistent filesystem support. Standard Vercel deployments will NOT work due to the ephemeral filesystem. The app needs to persist:
- `sounds.yaml` configuration file
- Audio files in `/public/audio/`

Consider using:
- Docker on VPS/dedicated servers
- Railway, Render, or similar platforms with persistent storage
- Self-hosted solutions

### Manual Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ADMIN_PASSWORD` | Admin login password | Required |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Primary theme color | `hsl(222.2 47.4% 11.2%)` |
| `NEXT_PUBLIC_BACKGROUND_COLOR` | Background color | `hsl(0 0% 100%)` |
| `NEXT_PUBLIC_CARD_COLOR` | Card background color | `hsl(240 5.9% 90%)` |
| `NEXT_PUBLIC_TEXT_COLOR` | Text color | `hsl(222.2 84% 4.9%)` |

### Sounds Configuration

Audio files and categories are managed through the `sounds.yaml` file:

```yaml
categories:
  - name: Sound Effects
    sounds:
      - name: Button Click
        file: click.wav
      - name: Bell Ring
        file: bell.mp3
  - name: Music
    sounds:
      - name: Background Theme
        file: theme.mp3
```

## Usage

### Public Interface

1. Visit the main page to access the soundboard
2. Click on any sound button to play audio
3. Sounds are organized by categories in an accordion layout

### Admin Interface

1. Navigate to `/admin` (no direct link from public interface for security)
2. Log in with your admin password
3. **Manage Sounds**: Add, edit, or remove sound entries
4. **Upload Files**: Upload new audio files (.flac, .mp3, .wav)
5. **Organize Categories**: Create and manage sound categories
6. **Session Management**: Sessions expire after 24 hours

### Supported Audio Formats

- FLAC (.flac)
- MP3 (.mp3) 
- WAV (.wav)
- Maximum file size: 2MB per file

## API Endpoints

### Public Endpoints
- `GET /api/config` - Get sounds configuration

### Admin Endpoints (Require Authentication)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify session
- `POST /api/config` - Update sounds configuration
- `GET /api/audio-files` - List audio files
- `POST /api/upload` - Upload audio files
- `DELETE /api/audio-files` - Delete audio files

## Security Features

- **JWT Authentication**: Secure session management with HTTP-only cookies
- **Password Protection**: Environment-based admin password
- **File Upload Security**: Restricted file types and size limits
- **Input Sanitization**: Filename sanitization for uploads
- **Session Expiration**: 24-hour automatic session timeout

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
/app
  /api              # Backend API routes
    /auth           # Authentication endpoints
    /config         # Configuration management
    /upload         # File upload handling
    /audio-files    # Audio file management
  /admin            # Admin interface page
  /components       # Shared React components
  layout.tsx        # Root layout with theming
  page.tsx          # Public soundboard page
/components
  /ui               # shadcn/ui components
/lib                # Utilities and types
/public
  /audio            # Audio file storage
sounds.yaml         # Configuration file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**Audio files not playing**:
- Check file format (must be .flac, .mp3, or .wav)
- Verify files exist in `/public/audio/`
- Check browser console for errors

**Admin login failing**:
- Verify `ADMIN_PASSWORD` environment variable is set
- Check for typos in password
- Clear browser cookies and try again

**Docker issues**:
- Ensure volumes are properly mounted
- Check file permissions on mounted directories
- Verify environment variables are passed correctly

### File Permissions

When using Docker, ensure proper permissions:
```bash
# Make sure audio directory is writable
chmod 755 public/audio
chmod 644 sounds.yaml
```

## License

This project is private and proprietary. All rights reserved.