# LSAT Study Tool - Deployment Instructions

## Project Overview
This is a complete React-based PWA for LSAT practice questions with TypeScript and Tailwind CSS.

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment to Netlify

### Option 1: Drag and Drop
1. Run `npm run build` to create the build folder
2. Go to [Netlify](https://netlify.com)
3. Drag the `build` folder to the deploy area

### Option 2: Git Integration
1. Push this code to GitHub
2. Connect your GitHub repository to Netlify
3. Netlify will automatically build and deploy using the `netlify.toml` configuration

### Configuration
- Build command: `npm run build`
- Publish directory: `build`
- Node version: 18
- Redirects are configured for SPA routing

## Features Included
- ✅ TypeScript support
- ✅ Tailwind CSS for styling
- ✅ Lucide React icons
- ✅ PWA-ready with manifest and meta tags
- ✅ Responsive design
- ✅ Question navigation
- ✅ Progress tracking
- ✅ Timer functionality
- ✅ Explanations for answers
- ✅ Production build optimized

## Tech Stack
- React 19+ with TypeScript
- Tailwind CSS 3.4+
- Lucide React for icons
- Create React App build system