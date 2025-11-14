# Mini Social Network

A simple social network application built with HTML, CSS, and JavaScript.

## Features
- User management
- Friendship connections
- Post creation and interaction
- Trending posts based on likes and shares
- Friend suggestions based on mutual connections

## Deployment

This project is now configured for deployment to Vercel using the standard directory structure with a vercel.json configuration file.

### Configuration Details

The project now follows Vercel's standard convention with a vercel.json configuration:
- All HTML files are in the root directory
- All CSS files are in the root directory
- All JavaScript files are in the root directory
- The root `package.json` specifies the entry point and build scripts
- The `vercel.json` file configures Vercel to serve static files from the root directory

### To deploy to Vercel:
1. Push this repository to GitHub
2. Connect the repository to Vercel
3. Vercel will automatically detect the configuration and deploy the site

### Manual deployment:
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

## Technology Stack
- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage for data persistence

## Data
The application generates a social network with:
- 20,000 users
- 60,000 posts (3 per user)
- 200,000 friendships

Data is persisted in the browser's LocalStorage when users make changes.