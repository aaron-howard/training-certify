# Design OS

A UI screen design prototyping workspace using Tailwind CSS, Shadcn/ui components, and Lucide icons.

## Setup Your Own Instance

To create your own instance of this repository:

1. **Clone with a custom name:**
```bash
git clone https://github.com/buildermethods/design-os.git my-design-os
cd my-design-os
```

_Replace `my-design-os` with whatever you want to name your project._

2. **Remove the original remote:**
```bash
git remote remove origin
```

Now you have a clean local instance ready to use.

## Use as a Template for Future Projects

If you want to save this as your own template and create new projects from it:

1. **Push to your own GitHub repository:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

2. **Set as a template repository:**
   - Go to your repository on GitHub
   - Click **Settings**
   - Check the box **Template repository** near the top
   - Now you can easily create new instances from your own template using GitHub's "Use this template" button

## Useage

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Workflow

1. **Discuss** - Describe your feature/product concept to the AI agent. The agent will ask clarifying questions to shape the scope.

2. **Spec** - After discussion, the AI generates `spec.md` documenting the features and decisions.

3. **Data** - The AI creates `data.json` with sample data based on the spec.

4. **Screen Design** - The AI builds `Page.tsx` using Shadcn components, following the spec exactly.

## Project Structure

```
src/
├── components/ui/     # Shadcn components
├── sections/          # Your screen design pages
│   └── [name]/
│       ├── spec.md    # Feature spec from discussion
│       ├── data.json  # Sample data for the screen design
│       └── Page.tsx   # The screen design component
├── App.tsx            # Index page / navigation
└── index.css          # Tailwind + theme config
```

## Available Shadcn Components

Pre-installed: Button, Card, Input, Label, Badge, Avatar, Dropdown Menu, Table, Tabs, Dialog, Sheet, Separator, Skeleton

Add more with:
```bash
npx shadcn@latest add [component-name]
```
urn
## Fonts

- **Display/Headings:** Sora
- **Body:** Outfit

## Design Guidelines

See `agents.md` for AI agent directives including:
- Mobile responsive design
- Light & dark mode support
- Using Tailwind's built-in color palette
# design-os-internal
