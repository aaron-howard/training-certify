# Releases

How we version and publish Training Certify.

## Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** — incompatible API or behavior changes
- **MINOR** — new features, backward compatible
- **PATCH** — bug fixes, backward compatible

Pre-release versions may use a suffix (e.g. `0.2.0-beta.1`).

## Release process

1. **Update CHANGELOG.md** — Move “Unreleased” items into a new version section with date.
2. **Bump version** — Update `version` in `package.json` to match the new release (e.g. `0.2.0`).
3. **Commit** — e.g. `chore: release v0.2.0`.
4. **Tag** — `git tag v0.2.0` (optionally signed).
5. **Push** — `git push origin main --tags`.
6. **GitHub Release** (optional) — Create a release from the tag and paste the CHANGELOG section.

## Before releasing

- [ ] All tests pass: `pnpm run test:coverage` and `pnpm run check:api-coverage`
- [ ] Lint and type-check: `pnpm run lint` and `pnpm run type-check`
- [ ] Build succeeds: `pnpm run build`
- [ ] E2E pass: `pnpm run test:e2e`
- [ ] CHANGELOG and version updated

## Tags

Tags follow `v*` (e.g. `v0.2.0`). CI can be configured to run on tags for deployment or publishing.

See [CHANGELOG.md](./CHANGELOG.md) for version history.
