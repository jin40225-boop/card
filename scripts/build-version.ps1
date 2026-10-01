# Write version.js with the current short commit hash and today's date.
#   window.__BUILD__ = { commit: "abc1234", date: "2026-10-01" };
# Usage (from the repo folder):  powershell -ExecutionPolicy Bypass -File scripts\build-version.ps1
# If git is missing or the repo has no commit yet, commit is written as "dev".

$root = Split-Path -Parent $PSScriptRoot

$commit = 'dev'
if (Get-Command git -ErrorAction SilentlyContinue) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $hash = & git -C $root rev-parse --short HEAD 2>$null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($code -eq 0 -and $hash) { $commit = ([string]$hash).Trim() }
}

$date = Get-Date -Format 'yyyy-MM-dd'
$line = 'window.__BUILD__ = { commit: "' + $commit + '", date: "' + $date + '" };'
$target = Join-Path $root 'version.js'
[System.IO.File]::WriteAllText($target, $line + "`n", (New-Object System.Text.UTF8Encoding($false)))

Write-Host ('version.js <- ' + $line)
