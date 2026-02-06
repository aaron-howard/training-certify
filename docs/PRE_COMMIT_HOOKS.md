# Pre-commit Hooks Documentation

This project uses [Husky](https://typicode.github.io/husky/) to run automated checks before commits are made.

## Setup

Pre-commit hooks are automatically installed when you run `npm install` (via the `prepare` script).

To manually set up hooks:

```bash
npm run prepare
```

## Hooks

### Pre-commit Hook (`.husky/pre-commit`)

Runs automatically before each commit. Performs the following checks:

1. **Code Formatting** - Checks if code is formatted with Prettier
   - Command: `npm run format:check`
   - If failed: Run `npm run format` to auto-fix

2. **Linting** - Runs ESLint to check for code quality issues
   - Command: `npm run lint`
   - If failed: Fix the errors shown in the output

3. **Type Checking** - Validates TypeScript types
   - Command: `npm run type-check`
   - If failed: Fix the TypeScript errors shown

**Note:** If any check fails, the commit will be aborted. Fix the issues and try committing again.

### Commit Message Hook (`.husky/commit-msg`)

Validates commit messages:

- **Minimum Length**: Commit messages must be at least 10 characters (excluding merge/revert commits)
- **Non-empty**: Commit messages cannot be empty
- **Warnings**: Warns (but doesn't block) if message contains WIP/TODO/FIXME/HACK

## Bypassing Hooks

In rare cases, you may need to bypass hooks (not recommended):

```bash
# Skip all hooks
git commit --no-verify -m "message"

# Or set environment variable
HUSKY=0 git commit -m "message"
```

## Troubleshooting

### Hooks not running

1. Ensure Husky is installed: `npm install`
2. Ensure Git hooks path is configured: `git config core.hooksPath .husky`
3. Ensure hooks are executable (Unix/Mac): `chmod +x .husky/pre-commit`
4. Check Git version: Husky requires Git >= 2.9

### Hook fails but code looks fine

- Run checks manually to see detailed output:
  ```bash
  npm run format:check
  npm run lint
  npm run type-check
  ```

### Performance

Pre-commit hooks are designed to be fast:

- Formatting check: ~1-2 seconds
- Linting: ~2-5 seconds
- Type checking: ~3-10 seconds

Total hook time: ~6-17 seconds (acceptable for pre-commit)

## Scripts Reference

- `npm run format` - Auto-format all files with Prettier
- `npm run format:check` - Check formatting without modifying files
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and auto-fix issues
- `npm run type-check` - Run TypeScript compiler in check mode
