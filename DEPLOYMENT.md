# Deployment Guide

## Vercel Deployment

This project is now configured for deployment to Vercel using the standard directory structure with a vercel.json configuration file.

### Configuration Details

The project now follows Vercel's standard convention with a vercel.json configuration:
- All HTML files are in the root directory
- All CSS files are in the root directory
- All JavaScript files are in the root directory
- The root `package.json` specifies the entry point and build scripts
- The `vercel.json` file configures Vercel to serve static files from the root directory

### Deployment Steps

1. Push this repository to GitHub
2. Connect the repository to Vercel
3. Vercel will automatically detect the configuration and deploy the site

### Manual Deployment

If you prefer to deploy manually:

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel` in the project directory
3. Follow the prompts to deploy

## Local Development

To run the project locally:

1. Ensure you have Node.js installed
2. Run `npx serve .` in the project directory
3. Visit http://localhost:3000 in your browser

## Project Structure

```
/
├── index.html (Admin panel)
├── user_login.html (User login page)
├── user_panel.html (User panel)
├── script.js (Admin panel functionality)
├── user_panel.js (User panel functionality)
├── styles.css (Main styles)
├── admin_styles.css (Admin panel styles)
├── user_styles.css (User panel styles)
├── package.json (Project configuration)
├── vercel.json (Vercel deployment configuration)
├── README.md (Project documentation)
├── DEPLOYMENT.md (Deployment guide)
└── .gitignore (Git ignore file)
```

## Data Storage

The application uses the browser's localStorage for data persistence:
- Friendships are saved to localStorage
- User-generated posts are saved to localStorage
- Data persists between browser sessions