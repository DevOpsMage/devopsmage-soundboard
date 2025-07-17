### **Technical Specification: Dynamic Soundboard Application**

**Project:** Soundboard Web App  
**Version:** 5.1 (Final Handoff)  
**Date:** July 16, 2025

#### **1. Project Overview & Core Objective**

The objective is to build a modern, full-stack soundboard application using the Next.js framework. The application will serve two primary frontends: a public-facing soundboard for playing audio clips and a password-protected administration interface for content management. The application's theme colors and server port will be configurable via environment variables. The final product is intended for online hosting and embedding within a Notion page.

#### **2. Important Architectural & Deployment Notes**

  * **Full-Stack Next.js:** The application will be a monolithic Next.js project. The backend logic will be implemented as API Routes, and the frontend will be built with React components.
  * **Filesystem as Database:** The application will use a `sounds.yaml` file on the server's filesystem as its "database." All content changes will be written directly to this file.
  * **Deployment & Persistent Storage:** The choice of hosting environment is critical. The platform **must support a persistent filesystem** for the API routes to save uploaded audio files and `sounds.yaml` modifications. Standard Vercel deployments have an ephemeral filesystem, which is **incompatible** with this requirement. The development team must plan for a hosting solution that provides persistence (e.g., a Docker container on a VPS, or a service with persistent volume mounts).

-----

#### **3. Technical Stack**

  * **Framework:** Next.js (using the App Router)
  * **Language:** TypeScript
  * **UI Components:** **shadcn/ui**
  * **Styling:** Tailwind CSS
  * **Configuration Parsing:** `yaml` (for server-side parsing of `sounds.yaml`)
  * **Environment Variables:** `.env.local`

-----

#### **4. Key Features & Requirements**

##### **4.1. Backend (Next.js API Routes)**

All backend logic will reside in API Route Handlers within the `/app/api/` directory.

  * **API Endpoints:**
      * `GET /api/config`: Reads `sounds.yaml`, parses it, and returns the configuration as a JSON object.
      * `POST /api/config`: An admin-protected route that receives a JSON object. **Action:** Creates a backup of the current `sounds.yaml` (e.g., `sounds.yaml.bak`), converts the received JSON to YAML, and overwrites the `sounds.yaml` file.
      * `GET /api/audio-files`: Returns a JSON list of all filenames in the `/public/audio/` directory.
      * `POST /api/upload`: An admin-protected route that handles `multipart/form-data` for `.flac` file uploads. It should sanitize filenames and save them to the `/public/audio/` directory.
      * `DELETE /api/audio-files`: An admin-protected route that accepts a filename in the request body and deletes the corresponding file from the `/public/audio/` directory.
  * **Security:** Admin-related API routes must be protected. This can be implemented in a middleware or directly within each route handler by validating a password sent in the request headers against a server-side `ADMIN_PASSWORD` environment variable.

##### **4.2. Frontend: Public Soundboard UI (React Page)**

This is the main, user-facing interface, built as a React page component.

  * **Component Structure:** The UI will be composed using **shadcn/ui** components (e.g., `Card` for categories, `Button` for sounds, `Slider` for volume).
  * **Dynamic Layout:** The page will fetch data from `GET /api/config` using a client-side hook (e.g., `useEffect` or a data-fetching library like SWR/TanStack Query) to dynamically render the categories and sound buttons.
  * **Playback Controls:**
      * **Global Volume:** A single `Slider` component controls the volume for all sounds. Its state will be managed in a parent component or a React Context.
      * **Global Stop:** A `Button` component that, when clicked, stops all active audio playback.

##### **4.3. Frontend: Administration UI (React Page)**

A separate, protected page for managing the soundboard's content.

  * **Authentication:** Access to this page will be controlled. A simple approach is a client-side modal that prompts for the admin password, which is then stored in memory for subsequent API requests.
  * **Dashboard Layout:** The UI will be built with **shadcn/ui** components, featuring `Tabs` to switch between "Manage Layout" and "Manage Audio Files."
  * **File Management (`TabsContent`):**
      * Displays a list of available audio files.
      * Provides a "Delete" button next to each file, which triggers a `Dialog` for confirmation before calling the `DELETE` API route.
      * Includes a file upload component using `Input type="file"` that posts to the `/api/upload` route.
  * **Layout Management (`TabsContent`):**
      * Visually renders the current layout.
      * Uses components like `Accordion` for categories and `dnd-kit` (or similar) for drag-and-drop reordering of categories and sounds.
      * Provides `Dialog` or `Sheet` components for adding/editing categories and sounds. The form within should use a `Select` component (populated with available audio files) to assign a sound to a button.
      * A primary "Save Layout" `Button` that sends the updated configuration to the `POST /api/config` route.

##### **4.4. Configurable Environment**

The application's core settings will be configurable via environment variables.

  * **Environment Variables (`.env.local`):**
    ```
    # Server Configuration
    PORT=3000
    ADMIN_PASSWORD="your-secret-password"

    # Public Theme Variables
    NEXT_PUBLIC_PRIMARY_COLOR="hsl(222.2 47.4% 11.2%)"
    NEXT_PUBLIC_BACKGROUND_COLOR="hsl(0 0% 100%)"
    NEXT_PUBLIC_CARD_COLOR="hsl(240 5.9% 90%)"
    NEXT_PUBLIC_TEXT_COLOR="hsl(222.2 84% 4.9%)"
    ```
  * **Port Configuration:** The `package.json` `dev` script should be updated to respect the `PORT` variable: `"dev": "next dev -p $PORT"`. The production `start` script (`next start`) will respect the `PORT` variable automatically.
  * **Theming Implementation:** In the root layout (`/app/layout.tsx`), the public theme variables will be used to define CSS variables on the `:root` element. Tailwind CSS's configuration (`tailwind.config.js`) will then be set up to use these CSS variables, allowing the entire shadcn/ui component set to adopt the theme.

-----

#### **5. Suggested Project Structure (Next.js App Router)**

```
/soundboard-app
|-- /app
|   |-- /api                  // Backend API Routes
|   |   |-- /config
|   |   |-- /upload
|   |   |-- ...
|   |-- /admin                // Admin page route
|   |   |-- page.tsx
|   |-- /components           // Reusable React components
|   |   |-- /ui               // shadcn/ui components live here
|   |-- layout.tsx            // Root layout (for theming)
|   |-- page.tsx              // Public soundboard page
|-- /public
|   |-- /audio                // Uploaded .flac files
|-- sounds.yaml               // The configuration file
|-- .env.local                // For passwords, ports, and theme colors
|-- .gitignore
|-- next.config.mjs
|-- package.json
|-- tailwind.config.ts
|-- tsconfig.json
```

-----

#### **6. Error Codes & Troubleshooting**

The application uses a structured error code system to help with debugging and issue tracking. All API responses follow a consistent format with numerical error codes for precise error identification.

##### **6.1. Error Response Format**

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "Invalid admin password"
  }
}
```

##### **6.2. Error Code Categories**

**Authentication Errors (1000-1099)**

| Code | Error | Description | Resolution |
|------|-------|-------------|------------|
| 1001 | `INVALID_PASSWORD` | The provided admin password is incorrect | Verify the password matches the `ADMIN_PASSWORD` environment variable |
| 1002 | `MISSING_PASSWORD` | No password was provided in the request | Include the password in the request body or headers |

**File Errors (1100-1199)**

| Code | Error | Description | Resolution |
|------|-------|-------------|------------|
| 1101 | `FILE_NOT_FOUND` | The requested file does not exist | Verify the file exists in the `/public/audio/` directory |
| 1102 | `FILE_TOO_LARGE` | The uploaded file exceeds the size limit | Reduce file size or increase `MAX_FILE_SIZE` in environment variables |
| 1103 | `INVALID_FILE_TYPE` | The uploaded file is not a supported audio format | Use supported formats: MP3, WAV, FLAC, OGG, M4A, AAC |
| 1104 | `UPLOAD_FAILED` | The file upload process failed | Check disk space, permissions, and file integrity |
| 1105 | `DELETE_FAILED` | The file deletion process failed | Verify file exists and check filesystem permissions |

**Configuration Errors (1200-1299)**

| Code | Error | Description | Resolution |
|------|-------|-------------|------------|
| 1201 | `CONFIG_READ_ERROR` | Failed to read the `sounds.yaml` file | Check if `sounds.yaml` exists and is readable |
| 1202 | `CONFIG_WRITE_ERROR` | Failed to write to the `sounds.yaml` file | Verify filesystem permissions and disk space |
| 1203 | `CONFIG_PARSE_ERROR` | The `sounds.yaml` file contains invalid YAML | Fix YAML syntax errors in the configuration file |
| 1204 | `CONFIG_VALIDATION_ERROR` | The configuration structure is invalid | Ensure the config follows the required schema |

**General Errors (1300-1399)**

| Code | Error | Description | Resolution |
|------|-------|-------------|------------|
| 1301 | `INTERNAL_SERVER_ERROR` | An unexpected server error occurred | Check server logs for detailed error information |
| 1302 | `METHOD_NOT_ALLOWED` | The HTTP method is not supported for this endpoint | Use the correct HTTP method (GET, POST, DELETE) |
| 1303 | `BAD_REQUEST` | The request format or parameters are invalid | Verify request body, headers, and parameters |

##### **6.3. Common Issues & Solutions**

**Session/Authentication Issues**
- **Problem**: Getting 401 errors after login
- **Solution**: Check if cookies are enabled and `JWT_SECRET` is set in environment variables

**File Upload Issues**
- **Problem**: Upload fails with no clear error
- **Solution**: Verify the `/public/audio/` directory exists and is writable

**Configuration Issues**
- **Problem**: Changes not persisting
- **Solution**: Ensure the application has write permissions to the `sounds.yaml` file

**Deployment Issues**
- **Problem**: Application works locally but fails in production
- **Solution**: Verify persistent filesystem support and environment variables are set

##### **6.4. Debugging Tips**

1. **Check Environment Variables**: Ensure all required environment variables are properly set
2. **Verify File Permissions**: The application needs read/write access to `sounds.yaml` and `/public/audio/`
3. **Monitor Browser Console**: Check for client-side errors and authentication issues
4. **Review Server Logs**: Look for detailed error information in the server console
5. **Test API Endpoints**: Use tools like Postman or curl to test API endpoints directly
