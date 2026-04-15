#Requires -Version 5.1
<#
.SYNOPSIS
  Adds open issues whose titles start with "[Roadmap" to a GitHub Project.

.DESCRIPTION
  Requires GitHub CLI scopes: read:project, project
  Run once:
    gh auth refresh -s read:project,project -h github.com

.EXAMPLE
  .\scripts\add-open-roadmap-issues-to-project.ps1 -ProjectNumber 1 -ProjectOwner "@me"

  # Project NUMBER is the integer in the URL: github.com/users/YOU/projects/3 -> use 3
  # (Not the GraphQL id like PVT_kw... — run: gh project list --owner @me)
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({
      if ($_ -match '^\s*PVT_') {
        throw "ProjectNumber must be the integer project number (e.g. 1), not a node id like PVT_.... Use the number in your project URL, or run: gh project list --owner @me"
      }
      if ($_ -notmatch '^\s*\d+\s*$') {
        throw "ProjectNumber must be a positive integer (e.g. 1). Got: '$_'"
      }
      $true
    })]
  [string] $ProjectNumber,

  [Parameter(Mandatory = $false)]
  [string] $ProjectOwner = "@me",

  [Parameter(Mandatory = $false)]
  [string] $Repo = "aaron-howard/training-certify"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "Install GitHub CLI and ensure gh is on PATH."
}

$json = gh issue list --repo $Repo --search "[Roadmap" --state open --limit 50 --json url,title
if ($LASTEXITCODE -ne 0) { throw "gh issue list failed" }

$items = $json | ConvertFrom-Json
if ($items.Count -eq 0) {
  Write-Warning "No open issues matched search '[Roadmap'. Nothing to add."
  exit 0
}

$projectNum = [int]($ProjectNumber.Trim())
foreach ($item in $items) {
  gh project item-add $projectNum --owner $ProjectOwner --url $item.url
  if ($LASTEXITCODE -ne 0) {
    throw "gh project item-add failed for $($item.url)"
  }
  Write-Host "Added to project: $($item.title)"
}

Write-Host "Done. Added $($items.Count) item(s) to project $projectNum."
