# Contributing to Training Certify

Thank you for considering a contribution. Training Certify is open source; we use a simple workflow to keep things manageable.

## Where to put things

- **Bugs:** Open an issue with steps to reproduce, expected vs actual behavior, and environment details. Check [existing issues](https://github.com/aaron-howard/training-certify/issues) first.
- **Features / ideas:** Open an issue or start a [Discussion](https://github.com/aaron-howard/training-certify/discussions). For larger changes, an issue or discussion first helps align on approach before a PR.
- **Questions:** Use [GitHub Discussions](https://github.com/aaron-howard/training-certify/discussions) (e.g. Q&A).

## Pull requests

- **Bug fixes:** Use a title like `[bug fix] …` and describe how to verify the fix.
- **Features:** Prefer opening an issue or discussion first so we can agree on scope. PRs are evaluated for roadmap fit and maintainability; “not now” doesn’t mean “never.”
- **Docs / typos:** Very welcome; no need to open an issue first.

## Proposing a feature

Open an issue with the `enhancement` label and include:

- Problem and motivation
- Proposed change and alternatives
- Impact on users
- Compatibility and upgrade notes

If a maintainer labels it **`approved`**, you can open a PR.

## Code of conduct

By participating, you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful and constructive.

## Development setup

See [SETUP.md](./SETUP.md) for local setup and [TESTING.md](./TESTING.md) for running tests. Ensure `pnpm run type-check` and `pnpm run lint` pass before submitting a PR.

## Dependency updates

Dependabot opens grouped **minor/patch** PRs on a weekly schedule. Maintainers follow **[docs/dependency-minor-patch-workflow.md](./docs/dependency-minor-patch-workflow.md)** for triage cadence and merge criteria; majors and overrides are covered in [docs/dependabot-majors.md](./docs/dependabot-majors.md) and [docs/dependency-overrides.md](./docs/dependency-overrides.md).
