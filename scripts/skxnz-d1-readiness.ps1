param(
  [switch]$IncludeBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:FailureCount = 0

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message =="
}

function Invoke-Logged {
  param(
    [string]$Label,
    [scriptblock]$Command
  )

  Write-Step $Label
  & $Command
  $exitCode = if ($null -ne $global:LASTEXITCODE) { $global:LASTEXITCODE } else { 0 }
  if ($exitCode -ne 0) {
    $script:FailureCount += 1
    Write-Host "Command failed with exit code $exitCode. Continuing so the full report is still visible."
    $global:LASTEXITCODE = 0
  }
}

function Test-NpmScript {
  param([string]$Name)

  if (-not (Test-Path -LiteralPath "package.json")) { return $false }
  $pkg = Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json
  return $null -ne $pkg.scripts -and $null -ne $pkg.scripts.PSObject.Properties[$Name]
}

function Get-PackageRunner {
  if (Test-Path -LiteralPath "pnpm-lock.yaml") { return "pnpm" }
  if (Test-Path -LiteralPath "yarn.lock") { return "yarn" }
  if (Test-Path -LiteralPath "package-lock.json") { return "npm" }
  return "npm"
}

function Invoke-PackageScript {
  param([string]$Name)

  $runner = Get-PackageRunner
  if ($runner -eq "npm") { & npm run $Name } else { & $runner run $Name }
}

function Get-TrackedScanFiles {
  $files = @(git ls-files)
  foreach ($file in $files) {
    if ($file -match '(^|/)(node_modules|\.next|\.git|coverage|dist|build|out|generated)(/|$)') { continue }
    if ($file -match '\.(lock|png|jpg|jpeg|gif|webp|ico|pdf|zip|gz|woff|woff2|ttf|mp4|mov)$') { continue }
    if ($file -match '(^|/)\.env') { continue }
    if ($file -match '\.(ts|tsx|js|jsx|mjs|cjs|json|md|sql|css|scss|html)$') { $file }
  }
}

Write-Host "SKXNZ Day 1 readiness check"
Write-Host "This script reports findings only. It does not edit, stage, commit, push, deploy, install, reset, clean, or apply SQL."

Invoke-Logged "Git branch" { git branch --show-current }
Invoke-Logged "Git HEAD" { git rev-parse HEAD }
Invoke-Logged "Git status" { git status --short }

$runner = Get-PackageRunner
Write-Step "Package manager"
Write-Host $runner

if (Test-NpmScript "typecheck") {
  Invoke-Logged "TypeScript" { Invoke-PackageScript "typecheck" }
} elseif (Test-Path -LiteralPath "tsconfig.json") {
  if (Get-Command tsc -ErrorAction SilentlyContinue) {
    Invoke-Logged "TypeScript" { & tsc --noEmit --incremental false }
  } else {
    $script:FailureCount += 1
    Write-Step "TypeScript"
    Write-Host "tsconfig.json exists, but no typecheck script or tsc executable is available."
  }
} else {
  Write-Step "TypeScript"
  Write-Host "No tsconfig.json found; skipped."
}

if (Test-NpmScript "lint") {
  Invoke-Logged "Lint" { Invoke-PackageScript "lint" }
} else {
  Write-Step "Lint"
  Write-Host "No lint script found; skipped."
}

$testScripts = @()
if (Test-Path -LiteralPath "package.json") {
  $pkg = Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json
  if ($null -ne $pkg.scripts) {
    $pkg.scripts.PSObject.Properties |
      Where-Object { $_.Name -eq "test" -or $_.Name -like "test:*" } |
      ForEach-Object { $testScripts += $_.Name }
  }
}

if ($testScripts.Count -gt 0) {
  foreach ($scriptName in $testScripts) {
    Invoke-Logged "Test script: $scriptName" { Invoke-PackageScript $scriptName }
  }
} else {
  Write-Step "Tests"
  Write-Host "No test script found; skipped."
}

if ($IncludeBuild) {
  if (Test-NpmScript "build") {
    Invoke-Logged "Build" { Invoke-PackageScript "build" }
  } else {
    Write-Step "Build"
    Write-Host "No build script found; skipped."
  }
} else {
  Write-Step "Build"
  Write-Host "Skipped. Re-run with -IncludeBuild to include build."
}

$scanFiles = @(Get-TrackedScanFiles)

Write-Step "Secret pattern scan"
$secretPattern = '(sk_live_[A-Za-z0-9_]+|rzp_live_[A-Za-z0-9_]+|service_role["'':= ]+[A-Za-z0-9._-]{20,}|SUPABASE_SERVICE_ROLE_KEY["'':= ]+[A-Za-z0-9._-]{20,})'
$secretFindings = @()
foreach ($file in $scanFiles) {
  $matches = Select-String -LiteralPath $file -Pattern $secretPattern -CaseSensitive -ErrorAction SilentlyContinue
  foreach ($match in $matches) { $secretFindings += "$($match.Path):$($match.LineNumber): $($match.Line.Trim())" }
}
if ($secretFindings.Count -eq 0) {
  Write-Host "No likely real secret patterns found in tracked scan files."
} else {
  Write-Host "Review these potential secret references. This is a pattern finding, not automatic proof of exposure:"
  $secretFindings | ForEach-Object { Write-Host $_ }
}

Write-Step "Internal wording scan"
$keywordRoots = @("app", "components", "lib")
$keywordFiles = @($scanFiles | Where-Object {
  $path = ($_ -replace '\\', '/')
  $isMatch = $false
  foreach ($root in $keywordRoots) {
    if ($path.StartsWith("$root/")) { $isMatch = $true }
  }
  $isMatch
})
$keywordPattern = '\b(demo|mock|placeholder|MVP)\b'
$keywordFindings = @()
foreach ($file in $keywordFiles) {
  $matches = Select-String -LiteralPath $file -Pattern $keywordPattern -CaseSensitive:$false -ErrorAction SilentlyContinue
  foreach ($match in $matches) { $keywordFindings += "$($match.Path):$($match.LineNumber): $($match.Line.Trim())" }
}
if ($keywordFindings.Count -eq 0) {
  Write-Host "No internal wording keywords found in app/components/lib tracked files."
} else {
  Write-Host "Review these keyword findings. They may be legitimate internal code or stale public copy:"
  $keywordFindings | ForEach-Object { Write-Host $_ }
}

Write-Step "Summary"
if ($script:FailureCount -gt 0) {
  Write-Host "$script:FailureCount command check(s) failed. Keyword findings did not affect this exit code."
  exit 1
}
Write-Host "Completed successfully. Keyword findings do not change the exit code."
