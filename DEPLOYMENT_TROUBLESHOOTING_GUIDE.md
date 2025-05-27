# Deployment Troubleshooting Guide for Phase 7.1 API

This guide provides solutions for common deployment issues with the Phase 7.1 API on Render.

## NPM Dependency Resolution Errors

If you encounter `ERESOLVE unable to resolve dependency tree` errors during deployment, follow these steps:

### 1. Update Build Command in Render

Change your build command to include the `--legacy-peer-deps` flag:

```
npm install --legacy-peer-deps
```

### 2. Update Files in Your Repository

I've created updated versions of these files to fix dependency issues:

1. **Updated package.json**:
   - Downgraded mongoose to a more stable version (6.9.0)
   - Added Node.js engine specification
   - Added resolutions field for React dependencies
   - Specified compatible versions for all dependencies

2. **Added .npmrc file**:
   - Configured npm to use legacy peer dependencies
   - Disabled strict peer dependency checking
   - Relaxed engine requirements

### 3. Commit and Push These Changes

```bash
git add phase_7_1_prototype/promethios-api/package.json phase_7_1_prototype/promethios-api/.npmrc
git commit -m "Fix: Update package.json and add .npmrc to resolve dependency issues"
git push origin feature/phase-7-1-backend-api
```

### 4. Redeploy on Render

After pushing these changes:
1. Go to your Render dashboard
2. Navigate to the API service
3. Click "Manual Deploy" > "Deploy latest commit"
4. Monitor the logs for successful installation

## Node.js Version Issues

If you encounter Node.js version compatibility issues:

1. Add an `.nvmrc` file to your repository with content: `16.20.0`
2. Specify the Node.js version in package.json:
   ```json
   "engines": {
     "node": "16.x"
   }
   ```

## CORS Issues

If you encounter CORS errors after deployment:

1. Ensure the `CORS_ORIGIN` environment variable is set correctly in Render
2. For testing, you can temporarily allow all origins by modifying src/index.js:
   ```javascript
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

## Monitoring Deployment

Always check the logs in Render for detailed error information. The health check endpoint at `/health` is useful for verifying successful deployment.
