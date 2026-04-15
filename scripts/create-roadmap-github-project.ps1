#Requires -Version 5.1
<#
.SYNOPSIS
  Creates GitHub issues from the training-certify implementation roadmap and adds each to a GitHub Project.

.DESCRIPTION
  Requires GitHub CLI (gh): https://cli.github.com/
  Run once:  gh auth login

  Find your project number:
    gh project list --owner "@me"
    gh project list --owner YOUR_ORG

.EXAMPLE
  .\scripts\create-roadmap-github-project.ps1 -ProjectNumber 1 -ProjectOwner "@me"

.EXAMPLE
  Create issues only (add to Project manually in the UI):
    .\scripts\create-roadmap-github-project.ps1 -SkipProjectAdd
#>
param(
  [Parameter(Mandatory = $false)]
  [int] $ProjectNumber = 0,

  [Parameter(Mandatory = $false)]
  [string] $ProjectOwner = "@me",

  [Parameter(Mandatory = $false)]
  [string] $Repo = "aaron-howard/training-certify",

  [switch] $SkipProjectAdd
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) not found. Install from https://cli.github.com/ and run: gh auth login"
}

if ($ProjectNumber -le 0 -and -not $SkipProjectAdd) {
  Write-Error "Set -ProjectNumber to your GitHub Project number (see gh project list), or use -SkipProjectAdd to only create issues."
}

$issues = @(
  @{
    Title = "[Roadmap P1] Apply security headers to all responses"
    Body  = @"
## Summary
Wire ``applySecurityHeaders`` / ``createSecureResponse`` (``src/lib/securityHeaders.server.ts``) so CSP, HSTS (production), ``X-Frame-Options``, and related headers are sent on HTML and API responses.

## Acceptance criteria
- Representative HTML and API responses include the intended headers (DevTools / ``curl``).
- Clerk, fonts, and required third-party origins still work.

## Phase
**1 - Security & correctness**
"@
  }
  @{
    Title = "[Roadmap P1] Protect /metrics and /health (or split public vs internal)"
    Body  = @"
## Summary
``/metrics`` (Prometheus) and ``/health`` (detailed JSON) should not be anonymously scrapable in production unless intentional.

## Acceptance criteria
- Chosen model documented: internal network, bearer token, IP allowlist, or platform-only access.
- Optional: minimal public liveness (200/503 only) separate from deep health.

## Phase
**1 - Security & correctness**
"@
  }
  @{
    Title = "[Roadmap P1] Call validateEnv() at server startup (fail-fast)"
    Body  = @"
## Summary
``validateEnv()`` in ``src/lib/env.ts`` is not invoked from ``src/entry-server.tsx``. Call it once after logging init so misconfiguration fails immediately.

## Acceptance criteria
- Bad/missing required env vars prevent serving traffic with a clear Zod error in logs.

## Phase
**1 - Security & correctness**
"@
  }
  @{
    Title = "[Roadmap P1] Make CI security / audit policy enforceable"
    Body  = @"
## Summary
``pnpm audit`` uses ``continue-on-error: true`` and ``all-checks`` does not require ``security-scan``. Align policy with team expectations.

## Acceptance criteria
- Documented rule: fail on severity X, or track waivers with expiry.
- CI reflects that rule (no silent ignore unless intentional).

## Phase
**1 - Security & correctness**
"@
  }
  @{
    Title = "[Roadmap P2] Single package manager - keep pnpm only"
    Body  = @"
## Summary
Both ``pnpm-lock.yaml`` and ``package-lock.json`` are tracked; CI uses pnpm only. Remove npm lockfile and document ``pnpm`` in README.

## Acceptance criteria
- Only one lockfile committed; fresh ``pnpm install`` works.

## Phase
**2 - Repository hygiene**
"@
  }
  @{
    Title = "[Roadmap P2] Rename package.json name from temp-start"
    Body  = @"
## Summary
``package.json`` ``name`` is still ``temp-start``. Rename to the product slug (e.g. ``training-certify``) and fix any references.

## Phase
**2 - Repository hygiene**
"@
  }
  @{
    Title = "[Roadmap P2] Move vercel CLI to devDependencies if not needed at runtime"
    Body  = @"
## Summary
``vercel`` is under ``dependencies``. If only used for deploy CLI, move to ``devDependencies``.

## Phase
**2 - Repository hygiene**
"@
  }
  @{
    Title = "[Roadmap P2] Document each package.json override (tar, esbuild, undici, ...)"
    Body  = @"
## Summary
``overrides`` are technical debt unless explained. Add a short comment in ``package.json`` or ``docs/`` per override with upstream issue/link.

## Phase
**2 - Repository hygiene**
"@
  }
  @{
    Title = "[Roadmap P2] Dependabot - majors policy or quarterly upgrade pass"
    Body  = @"
## Summary
``.github/dependabot.yml`` ignores all semver-major updates. Decide: allowlist majors for low-risk packages, or calendar a quarterly manual major-upgrade review.

## Phase
**2 - Repository hygiene**
"@
  }
  @{
    Title = "[Roadmap P3] Nitro alpha / TanStack Start upgrade path"
    Body  = @"
## Summary
``nitro`` is prerelease (e.g. ``3.0.1-alpha.2``). Track releases; upgrade in a dedicated branch with full CI + smoke.

## Acceptance criteria
- Documented target versions or deferral reason.

## Phase
**3 - Stack upgradeability**
"@
  }
  @{
    Title = "[Roadmap P3] Routine minor/patch dependency workflow"
    Body  = @"
## Summary
Use Dependabot grouped PRs for patch/minor; establish weekly or biweekly review habit.

## Phase
**3 - Stack upgradeability**
"@
  }
  @{
    Title = "[Roadmap P4] QueryClient default options (staleTime, refetch, retry)"
    Body  = @"
## Summary
``src/router.tsx`` creates ``QueryClient()`` with defaults. Set global defaults; remove redundant per-query options where possible.

## Phase
**4 - UX consistency**
"@
  }
  @{
    Title = "[Roadmap P4] Single source of truth for user roles (schema / shared module)"
    Body  = @"
## Summary
Role strings are duplicated (e.g. ``setupApiHandler``, UI hooks). Export unions/constants from one place (e.g. DB schema + ``roles.ts``).

## Phase
**4 - UX consistency**
"@
  }
  @{
    Title = "[Roadmap P5] Production rate limiting across serverless instances"
    Body  = @"
## Summary
In-memory rate limits do not coordinate across instances. Prefer DB-backed or shared store for APIs that matter in production.

## Acceptance criteria
- Documented behavior under multiple Vercel/serverless instances.

## Phase
**5 - Performance**
"@
  }
  @{
    Title = "[Roadmap P5] Bundle analysis and route-level code splitting review"
    Body  = @"
## Summary
Periodically analyze client bundle; route-split heavy admin/catalog code if default users load unnecessary JS.

## Phase
**5 - Performance**
"@
  }
  @{
    Title = "[Roadmap P5] Extend caching pattern to other hot API routes"
    Body  = @"
## Summary
Mirror teams-style caching (TTL + invalidation) for dashboard, compliance lists, or other hot endpoints as appropriate.

## Phase
**5 - Performance**
"@
  }
  @{
    Title = "[Roadmap P6] E2E: signed-in flows with Clerk (CI secrets)"
    Body  = @"
## Summary
Extend Playwright beyond smoke: at least one authenticated path per critical area (catalog, teams, compliance).

## Acceptance criteria
- CI can run with test user / Clerk test configuration (document required secrets).

## Phase
**6 - Testing depth**
"@
  }
  @{
    Title = "[Roadmap P6] Optional: Playwright visual regression for key pages"
    Body  = @"
## Summary
Only if the team wants it - scoped screenshots for a few stable pages.

## Phase
**6 - Testing depth**
"@
  }
  @{
    Title = "[Roadmap P7] Tighten CSP (reduce unsafe-inline / unsafe-eval)"
    Body  = @"
## Summary
After global headers work: research Clerk + Vite requirements; move toward nonces/hashes where feasible.

## Phase
**7 - CSP hardening** (after P1 headers)
"@
  }
)

$created = [System.Collections.Generic.List[string]]::new()

foreach ($item in $issues) {
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tmp, $item.Body.Trim(), $utf8)

    $out = gh issue create --repo $Repo --title $item.Title --body-file $tmp 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "gh issue create failed: $out"
    }

    $url = ($out | Out-String).Trim()
    if ($url -notmatch '^https://github\.com/') {
      throw "Unexpected gh output (expected issue URL): $url"
    }

    $created.Add($url)
    Write-Host "Created: $url"

    if (-not $SkipProjectAdd) {
      gh project item-add $ProjectNumber --owner $ProjectOwner --url $url
      if ($LASTEXITCODE -ne 0) {
        throw "gh project item-add failed for $url"
      }
      Write-Host "  -> added to project $ProjectNumber ($ProjectOwner)"
    }
  }
  finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "Done. Created $($created.Count) issue(s)."
if ($SkipProjectAdd) {
  Write-Host "Add them in GitHub: Project -> + Add item -> search issues, or bulk-select on Issues and add to Project."
}
