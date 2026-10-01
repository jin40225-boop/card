# Re-render the static images with local headless Chrome.
#   assets\card-1080x1440.png  <- card-image.html  (1080x1440)
#   assets\og.png              <- og.html          (1200x630)
#   _out\print.pdf             <- print.html       (2 pages, 90mm x 54mm)
# Usage (from the repo folder):  powershell -ExecutionPolicy Bypass -File scripts\render-assets.ps1
# Needs internet access (the pages load the Noto Sans TC web font).
# Each file is rendered to _out\ first, checked, and only then copied over the old one.

$root = Split-Path -Parent $PSScriptRoot

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
if (-not (Test-Path $chrome)) {
    Write-Host 'ERROR: chrome.exe not found. Install Google Chrome or edit the path at the top of this script.'
    exit 1
}

$outDir = Join-Path $root '_out'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$profileDir = Join-Path $env:TEMP 'yanyu-card-chrome-profile'

Add-Type -AssemblyName System.Drawing

function Get-FileUrl([string]$name) {
    return ([System.Uri](Join-Path $root $name)).AbsoluteUri
}

function Invoke-Chrome([string[]]$extraArgs) {
    $common = @(
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--virtual-time-budget=8000',
        ('--user-data-dir="{0}"' -f $profileDir)
    )
    Start-Process -FilePath $chrome -ArgumentList ($common + $extraArgs) -Wait -WindowStyle Hidden
}

function Render-Png([string]$page, [string]$target, [int]$width, [int]$height) {
    $tmp = Join-Path $outDir ('render-' + [System.IO.Path]::GetFileName($target))
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
    Invoke-Chrome @(
        ('--screenshot="{0}"' -f $tmp),
        ('--window-size={0},{1}' -f $width, $height),
        (Get-FileUrl $page)
    )
    if (-not (Test-Path $tmp)) {
        Write-Host ('FAIL  {0}: Chrome did not write the screenshot.' -f $target)
        return $false
    }
    $img = [System.Drawing.Image]::FromFile($tmp)
    $w = $img.Width
    $h = $img.Height
    $img.Dispose()
    if ($w -ne $width -or $h -ne $height) {
        Write-Host ('FAIL  {0}: got {1}x{2}, expected {3}x{4}. Old file kept.' -f $target, $w, $h, $width, $height)
        return $false
    }
    Copy-Item $tmp (Join-Path $root $target) -Force
    Remove-Item $tmp -Force
    Write-Host ('OK    {0}  {1}x{2}' -f $target, $w, $h)
    return $true
}

function Render-Pdf([string]$page, [string]$target) {
    $out = Join-Path $root $target
    if (Test-Path $out) { Remove-Item $out -Force }
    Invoke-Chrome @(
        ('--print-to-pdf="{0}"' -f $out),
        '--no-pdf-header-footer',
        (Get-FileUrl $page)
    )
    if (-not (Test-Path $out)) {
        Write-Host ('FAIL  {0}: Chrome did not write the PDF.' -f $target)
        return $false
    }
    Write-Host ('OK    {0}  {1} bytes' -f $target, (Get-Item $out).Length)
    return $true
}

$ok = $true
if (-not (Render-Png 'card-image.html' 'assets\card-1080x1440.png' 1080 1440)) { $ok = $false }
if (-not (Render-Png 'og.html' 'assets\og.png' 1200 630)) { $ok = $false }
if (-not (Render-Pdf 'print.html' '_out\print.pdf')) { $ok = $false }

if ($ok) {
    Write-Host 'Done. Open the two PNG files and look at them before committing.'
    exit 0
}
Write-Host 'Finished with failures (see FAIL lines above).'
exit 1
