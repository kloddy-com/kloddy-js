# Publishing Instructions for @kloddy/kloddy-js

Since you have an npm organization **@kloddy** and a GitHub repository **kloddy-com/kloddy-js**, here are the exact steps to publish.

### 1. Repository Setup
Ensure your local code is linked to the correct repository.

```bash
git init
git remote add origin https://github.com/kloddy-com/kloddy-js.git
git add .
git commit -m "Initial release"
git push -u origin main
```

### 2. Prepare the build
Run the build process to generate the `dist` folder.

```bash
npm run build
```

### 3. Login to npm
Before publishing, ensure you are logged in to npm with an account that has permissions to the `@kloddy` organization.

```bash
npm login
```

### 4. Publish to npm
Since scoped packages are private by default, you must specify `--access public` to make it a public package under your organization.

```bash
npm publish --access public
```

### 5. Installation
Once published, users can install it using:

```bash
npm install @kloddy/kloddy-js
```

### Summary of configurations
- **Package Name**: `@kloddy/kloddy-js`
- **npm Organization**: `kloddy`
- **GitHub Repo**: `kloddy-com/kloddy-js`
