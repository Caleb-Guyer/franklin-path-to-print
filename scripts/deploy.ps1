# Creates the requested public repository, pushes the committed game, and enables Pages.
# Run from PowerShell after installing GitHub CLI and running `gh auth login`.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
function Assert-NativeSuccess([string]$Action) {
  if ($LASTEXITCODE -ne 0) { throw "$Action failed (exit $LASTEXITCODE)." }
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI is missing. Run: winget install --id GitHub.cli --exact; then open a new terminal and run gh auth login.'
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required.' }
$projectDirectory = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectDirectory
try {
  gh auth status
  Assert-NativeSuccess 'GitHub authentication'
  $account = (gh api user --jq .login).Trim()
  Assert-NativeSuccess 'Reading the authenticated account'
  if (-not (Test-Path -LiteralPath '.git')) {
    git init -b main
    Assert-NativeSuccess 'Initializing Git'
    git add .
    Assert-NativeSuccess 'Staging the game'
    git commit -m 'Build the complete source-linked Franklin learning adventure'
    Assert-NativeSuccess 'Creating the initial commit'
  }
  $branch = (git branch --show-current).Trim()
  if ($branch -ne 'main') { throw 'Switch to the main branch before publishing.' }
  $pending = git status --porcelain
  if ($pending) { throw 'Commit your local changes before publishing.' }
  $remoteNames = @(git remote)
  $repository = $null
  if ($remoteNames -contains 'origin') {
    $origin = (git remote get-url origin).Trim()
    if ($origin -notmatch '^(?:https://github\.com/|git@github\.com:)([^/]+)/([^/]+?)(?:\.git)?$') {
      throw 'The existing origin is not a recognized GitHub repository URL.'
    }
    $owner = $Matches[1]
    $repository = $Matches[2]
    if ($owner -ne $account -or $repository -notin @('franklin-path-to-print','franklin-part-one-game')) {
      throw 'The existing origin does not match the authenticated account and requested repository names.'
    }
  } else {
    foreach ($candidate in @('franklin-path-to-print','franklin-part-one-game')) {
      $existing = $null
      try { $existing = gh repo view "$account/$candidate" --json name --jq .name 2>$null } catch { $existing = $null }
      if (-not $existing) { $repository = $candidate; break }
    }
    if (-not $repository) { throw 'Both requested repository names already exist. No existing repository was changed.' }
    gh repo create "$account/$repository" --public --source . --remote origin --description 'Dual Credit ELA III: Benjamin Franklin and Frederick Douglass story campaigns'
    Assert-NativeSuccess 'Creating the repository'
  }
  git push -u origin main
  Assert-NativeSuccess 'Pushing the game'
  $pages = $null
  try { $pages = gh api "repos/$account/$repository/pages" --jq .build_type 2>$null } catch { $pages = $null }
  if ($pages) {
    gh api --method PUT "repos/$account/$repository/pages" -f build_type=workflow --silent
  } else {
    gh api --method POST "repos/$account/$repository/pages" -f build_type=workflow --silent
  }
  Assert-NativeSuccess 'Enabling GitHub Pages with GitHub Actions'
  Write-Host "Repository: https://github.com/$account/$repository"
  Write-Host "Pages (after the deployment finishes): https://$account.github.io/$repository/"
  Write-Host "The push started the verification and deployment workflow. Follow it with:"
  Write-Host "gh run list --repo $account/$repository --workflow deploy.yml"
  Write-Host 'If the initial run started before Pages was enabled, restart it with:'
  Write-Host "gh workflow run deploy.yml --repo $account/$repository --ref main"
} finally { Pop-Location }
