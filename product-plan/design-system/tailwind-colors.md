# Tailwind Color Mappings

Training-Certify uses Tailwind CSS with the following color palette:

## Color Roles

- **Primary**: Blue
- **Secondary**: Emerald
- **Neutral**: Slate

## Tailwind Class Usage

### Primary Color (Blue)

Use for:

- Primary actions and buttons
- Active navigation items
- Links
- Focus states
- Brand accents

```html
<!-- Backgrounds -->
<div class="bg-blue-500">Primary background</div>
<div class="bg-blue-600 hover:bg-blue-700">Hover state</div>

<!-- Text -->
<span class="text-blue-600">Primary text</span>

<!-- Borders -->
<div class="border-blue-500">Primary border</div>

<!-- Dark mode -->
<div class="bg-blue-600 dark:bg-blue-700">Dark mode aware</div>
```

Common shades:

- `blue-50` — Very light backgrounds, subtle highlights
- `blue-100` — Light backgrounds, disabled states
- `blue-500` — Standard primary color
- `blue-600` — Primary buttons, active states
- `blue-700` — Hover states for primary buttons
- `blue-900` — Dark text on light backgrounds

### Secondary Color (Emerald)

Use for:

- Success states
- Positive indicators (e.g., "Active" status)
- Secondary CTAs
- Accents and highlights

```html
<!-- Success states -->
<div class="bg-emerald-100 text-emerald-700">Success message</div>

<!-- Status badges -->
<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Active</span>

<!-- Dark mode -->
<div class="bg-emerald-600 dark:bg-emerald-700">Secondary action</div>
```

Common shades:

- `emerald-100` — Light backgrounds for success states
- `emerald-500` — Standard secondary color
- `emerald-600` — Secondary buttons
- `emerald-700` — Text for success messages

### Neutral Color (Slate)

Use for:

- Text (body, headings, labels)
- Backgrounds
- Borders
- Cards and containers
- Gray UI elements

```html
<!-- Backgrounds -->
<div class="bg-slate-50 dark:bg-slate-900">Page background</div>
<div class="bg-slate-100 dark:bg-slate-800">Card background</div>

<!-- Text -->
<p class="text-slate-900 dark:text-slate-100">Heading</p>
<p class="text-slate-600 dark:text-slate-400">Body text</p>
<p class="text-slate-500 dark:text-slate-400">Muted text</p>

<!-- Borders -->
<div class="border border-slate-200 dark:border-slate-800">Card border</div>

<!-- Hover states -->
<button
  class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
>
  Button
</button>
```

Common shades:

- `slate-50` — Lightest background (light mode)
- `slate-100` — Light background (light mode cards)
- `slate-200` — Borders, dividers (light mode)
- `slate-600` — Body text (light mode)
- `slate-700` — Headings (light mode)
- `slate-800` — Card backgrounds (dark mode)
- `slate-900` — Page background (dark mode)
- `slate-950` — Darkest background (dark mode)

## Status Colors

While not part of the core palette, these Tailwind colors are used for status indicators:

### Red (Error/Danger)

```html
<span class="text-red-600 dark:text-red-400">Error message</span>
<div class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
  Expired status
</div>
```

### Amber (Warning)

```html
<span class="text-amber-600 dark:text-amber-400">Warning message</span>
<div
  class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
>
  Expiring soon
</div>
```

### Green (Success - Alternative to Emerald)

```html
<div
  class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
>
  Success
</div>
```

## Dark Mode Pattern

All components use Tailwind's `dark:` variant for dark mode support:

```html
<div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  Content that adapts to dark mode
</div>
```

Enable dark mode by adding the `dark` class to the root HTML element:

```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

## Opacity Modifiers

Use Tailwind's opacity modifiers for semi-transparent colors:

```html
<!-- 30% opacity -->
<div class="bg-blue-500/30">Semi-transparent blue</div>

<!-- Dark mode with opacity -->
<div class="bg-slate-900/80 dark:bg-slate-950/90">Overlay</div>
```

## Gradients

Use gradients for headers and hero sections:

```html
<div class="bg-gradient-to-r from-blue-600 to-blue-700">Gradient header</div>

<div class="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
  Subtle page gradient
</div>
```

## Reference

For the complete Tailwind color palette, see:
https://tailwindcss.com/docs/customizing-colors
