# Typography Guide

Training-Certify uses Google Fonts for all typography.

## Font Families

### Inter (Headings and Body)

**Use for**: All headings (h1-h6), body text, UI labels, buttons, navigation

- **Family**: Inter
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)
- **Google Fonts**: https://fonts.google.com/specimen/Inter

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

```css
body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
```

### JetBrains Mono (Monospace)

**Use for**: Code blocks, certification numbers, IDs, technical data

- **Family**: JetBrains Mono
- **Weights**: 400 (Regular), 500 (Medium)
- **Google Fonts**: https://fonts.google.com/specimen/JetBrains+Mono

```html
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

```css
code,
pre,
.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}
```

## Import Both Fonts

To import both fonts in a single request:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

## Tailwind Configuration

If using Tailwind CSS, extend the theme to include these fonts:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

With this configuration, you can use Tailwind's font utilities:

```html
<h1 class="font-sans">Heading (Inter)</h1>
<p class="font-sans">Body text (Inter)</p>
<code class="font-mono">ABC-123-XYZ</code>
```

## Typography Scale

Use Tailwind's typography utilities for consistent sizing:

### Headings

```html
<h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
  Page Title
</h1>

<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
  Section Title
</h2>

<h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
  Subsection Title
</h3>

<h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
  Card Title
</h4>
```

### Body Text

```html
<p class="text-base text-slate-600 dark:text-slate-400">Regular body text</p>

<p class="text-sm text-slate-600 dark:text-slate-400">
  Small text (descriptions, captions)
</p>

<p class="text-xs text-slate-500 dark:text-slate-400">
  Extra small text (metadata, timestamps)
</p>
```

### Monospace

```html
<code
  class="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded"
>
  certification-id-123
</code>

<pre class="font-mono text-sm bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
  Multi-line
  code block
</pre>
```

## Font Weights

```html
<!-- Regular (400) -->
<p class="font-normal">Regular text</p>

<!-- Medium (500) -->
<p class="font-medium">Medium weight (labels, nav items)</p>

<!-- Semi-bold (600) -->
<p class="font-semibold">Semi-bold (subheadings)</p>

<!-- Bold (700) -->
<p class="font-bold">Bold (headings, emphasis)</p>
```

## Usage Guidelines

### When to use Inter

- Page titles and headings
- Navigation labels
- Button text
- Form labels and inputs
- Body text and paragraphs
- Table headers and cells
- Card content
- Notifications and alerts

### When to use JetBrains Mono

- Certification numbers (e.g., "AWS-123-XYZ")
- User IDs and entity IDs
- API endpoints or technical references
- Code snippets
- JSON data display
- Log entries
- Any technical or fixed-width data

## Examples

### Navigation Item

```html
<a href="/dashboard" class="font-medium text-slate-700 dark:text-slate-300">
  Dashboard
</a>
```

### Page Header

```html
<div>
  <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
    Certification Management
  </h1>
  <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
    Track and manage your professional certifications
  </p>
</div>
```

### Certification Number

```html
<div>
  <span class="text-sm text-slate-600 dark:text-slate-400">
    Certification ID
  </span>
  <code class="font-mono text-sm text-slate-900 dark:text-slate-100">
    AWS-SAA-C03-12345
  </code>
</div>
```

### Button

```html
<button
  class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
>
  Add Certification
</button>
```

### Table Header

```html
<th
  class="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
>
  Certification Name
</th>
```

### Status Badge

```html
<span
  class="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded"
>
  Active
</span>
```

## Performance Tips

1. **Preconnect** to Google Fonts for faster loading:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   ```

2. **Load only needed weights**: Only include 400, 500, 600, 700 for Inter and 400, 500 for JetBrains Mono

3. **Use `&display=swap`**: Prevents invisible text during font loading

4. **Consider self-hosting**: For production, consider downloading and self-hosting fonts for better performance and privacy
