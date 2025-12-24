# Milestone 1: Foundation

## Objective

Set up the project structure, install dependencies, configure the design system tokens, and establish the global data model types. This milestone creates the foundation for all subsequent implementation work.

## Tasks

### 1. Project Setup

Initialize a new React + TypeScript project with your preferred build tool (Vite, Next.js, Create React App, etc.):

```bash
# Example with Vite
npm create vite@latest training-certify -- --template react-ts
cd training-certify
npm install
```

### 2. Install Dependencies

Install Tailwind CSS and other required dependencies:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional dependencies
npm install date-fns lucide-react
```

### 3. Configure Tailwind CSS

Update your Tailwind configuration to enable dark mode and configure content paths:

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add Tailwind directives to your CSS:

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Set Up Design Tokens

Copy the design system files from `design-system/` to understand the color palette and typography:

- **Colors**: Blue (primary), Emerald (secondary), Slate (neutral)
- **Typography**: Inter for headings/body, JetBrains Mono for monospaced

Import fonts in your HTML or CSS:

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
/* src/index.css */
body {
  font-family: 'Inter', sans-serif;
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

### 5. Create Global Data Model Types

Copy `data-model/types.ts` into your project at `src/types/` or `src/lib/types.ts`.

This file contains TypeScript interfaces for:
- User
- Certification
- UserCertification
- Team
- Vendor
- AuditLog
- Notification

### 6. Set Up Sample Data (Optional)

Copy `data-model/sample-data.json` for development and testing purposes. You can import this data in your components during development.

### 7. Verify Setup

Run the development server to verify everything is working:

```bash
npm run dev
```

You should see a blank page with no errors. Open the browser console to ensure there are no TypeScript or build errors.

## Deliverables

- ✅ React + TypeScript project initialized
- ✅ Tailwind CSS installed and configured
- ✅ Design tokens (colors, fonts) applied
- ✅ Global data model types available at `src/types/`
- ✅ Development server running without errors

## Next Steps

Proceed to Milestone 2: Application Shell to implement the navigation and layout.
