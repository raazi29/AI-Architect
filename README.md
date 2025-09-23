# Archi - AI-Powered Interior Design Platform

Archi is an innovative platform that leverages AI to transform interior design. It allows users to upload room photos and receive AI-generated design suggestions, including dynamic video walkthroughs.

## New Feature: LLaMA 3.1 Vision Integration

We've integrated LLaMA 3.1 Vision from Groq to provide image analysis capabilities in the AI Assistant chat interface. Users can now upload images of their rooms and receive detailed analysis including:

- Room type identification
- Design style recognition
- Furniture and object detection
- Color palette analysis
- Design improvement suggestions

See [README_IMAGE_ANALYSIS.md](README_IMAGE_ANALYSIS.md) for detailed documentation on this feature.

## Features

- **AI Interior Generation**: Upload room photos and get AI-powered design suggestions.
- **Image and Video Output**: Generate both static images and dynamic video walkthroughs of redesigned spaces.
- **Customizable Options**: Select room type, design style, budget, and add specific preferences.
- **AI Design Assistant**: Chat with an AI assistant for design advice and recommendations.
- **Image Analysis with LLaMA 3.1 Vision**: Analyze room photos for detailed design insights.
- **Project Management & Cost Estimation**: (Coming Soon) Tools to manage projects and estimate costs.
- **Vastu Features**: (Coming Soon) Integrate Vastu principles into designs.
- **Regional Design Styles**: (Coming Soon) Explore country-specific interior and building designs.
- **Contractor Network**: (Coming Soon) Connect with a network of contractors for project execution.

## Technologies Used

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Lucide React Icons

### Backend
- FastAPI
- Python 3.9+
- SQLite Database
- Groq API for LLaMA 3.1 Vision
- Multiple Image Provider APIs (Pexels, Unsplash, Pixabay)

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Make sure you have Node.js (version 18 or higher) and npm or pnpm installed.

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables in `Backend/.env`:
   ```
   GROQ_API_KEY=your_groq_api_key
   PEXELS_API_KEY=your_pexels_api_key
   UNSPLASH_API_KEY=your_unsplash_api_key
   PIXABAY_API_KEY=your_pixabay_api_key
   ```

4. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```bash
   pnpm install
   # or npm install
   ```

2. Run the frontend development server:
   ```bash
   pnpm run dev
   # or npm run dev
   ```

### Accessing the Application

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001`
- API Documentation: `http://localhost:8001/docs`

## Deployment Preparation

Before deploying the application to production, it's important to clean up test, debug, and temporary files to reduce the application size and improve security.

### Files and Directories to Remove

For deployment, the following files and directories should be removed:
- All test files (files with `test` or `Test` in their names)
- Debug files (files with `debug` or `Debug` in their names)
- Cache directories (`.pytest_cache`, `.kombai`, `.qoder`, `.roo`, `.trae`)
- Temporary files and directories

### Automated Cleanup Scripts

Two scripts are provided to automate the cleanup process:
1. `cleanup_for_deployment.bat` - For Windows systems
2. `cleanup_for_deployment.sh` - For Unix/Linux/macOS systems

Simply run the appropriate script for your operating system to remove all unnecessary files.

### Manual Cleanup

If you prefer to manually remove files, refer to `DEPLOYMENT_CLEANUP.md` for a complete list of files and directories to remove.

### Environment Files

Ensure that `.env` files do not contain actual keys when deploying. Use environment variables in your deployment platform instead.

### Git Ignore

The `.gitignore` file has been updated to prevent test and debug files from being committed in the future.