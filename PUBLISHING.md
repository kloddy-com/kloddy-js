# Publishing Guide for @kloddy/kloddy-js

This guide provides the exact steps to release `@kloddy/kloddy-js` to npm.

## 🚀 One-Step Release (Recommended)

If you have already configured your `.npmrc` with an **Automation** token (bypassing 2FA), you can release with:

```bash
npm run build && npm publish --access public
```

---

## 🛠 Manual Release Steps

### 1. Preparation
Ensure the build is fresh and error-free:

```bash
npm run lint
npm run build
```

### 2. Versioning
Decide on the version change (e.g., `0.1.0` if it's the first time). For subsequent releases:

```bash
# For a small fix
npm version patch

# For a new feature
npm version minor

# For a breaking change
npm version major
```

### 3. Registry Authentication
If you are not using an automation token in `.npmrc`, log in manually:

```bash
npm login
```

### 4. Publication
Publish the package to the `@kloddy` organization as a public package:

```bash
# If you have 2FA enabled, you will be prompted for an OTP
npm publish --access public
```

---

## 📋 Verification Checklist

1. **Check npm Presence**: Run `npm view @kloddy/kloddy-js` to see the latest version on the registry.
2. **Review Package Contents**: Run `npm pack --dry-run` to see exactly what files are being uploaded (only `dist` and meta-files should be included).
3. **Verify Organization Ownership**: Ensure you are an owner or have publishing rights for the `kloddy` organization.

---

### Key Information
- **Package Name**: `@kloddy/kloddy-js`
- **Current Version**: `0.1.0`
- **User Account**: `joaoguilherme` (Owner of `kloddy` org)
