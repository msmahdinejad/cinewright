<#
.SYNOPSIS
  Install the cinewright skill for Codex, Claude Code and other agents that read SKILL.md.

.DESCRIPTION
  Works from a clone (.\install.ps1) and straight from the web:
      irm https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.ps1 | iex
  With options (a piped script cannot take parameters, so wrap it):
      & ([scriptblock]::Create((irm https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.ps1))) -Target codex

  Where it installs (each folder is replaced cleanly, so upgrades never leave stale files):
      -Target all     (default)  ~\.agents\skills  (+ ~\.codex\skills if it exists)  and  ~\.claude\skills
      -Target codex              ~\.agents\skills  (+ ~\.codex\skills if it exists)
      -Target claude             ~\.claude\skills
      -Project                   <current folder>\.agents\skills and <current folder>\.claude\skills (this repository only)
      -Dest <folder>             a custom skills folder

.PARAMETER Ref     branch or tag to download when not running from a clone (default: main)
.PARAMETER Source  a local repository folder, a .zip file or a URL to a .zip (offline installs, testing)
#>
[CmdletBinding()]
param(
  [ValidateSet('all', 'codex', 'claude')] [string]$Target = $(if ($env:PCV_TARGET) { $env:PCV_TARGET } else { 'all' }),
  [string]$Dest = '',
  [string]$Ref = $(if ($env:PCV_REF) { $env:PCV_REF } else { 'main' }),
  [string]$Source = '',
  [switch]$Project,
  [switch]$SkipCheck
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # the progress bar makes Invoke-WebRequest dramatically slower in Windows PowerShell 5.1
$Repo = 'msmahdinejad/cinewright'
$Name = 'cinewright'
$tmp = $null

function Find-SkillDir([string]$root) {
  $c = Join-Path $root "skills\$Name"
  if (Test-Path (Join-Path $c 'SKILL.md')) { return $c }
  $hit = Get-ChildItem -Path $root -Recurse -Filter SKILL.md -ErrorAction SilentlyContinue | Where-Object { $_.Directory.Name -eq $Name } | Select-Object -First 1
  if ($hit) { return $hit.Directory.FullName }
  return $null
}

# -- 1. find the skill folder (clone, local source, or download) --------------------------
$skill = $null
if ($Source) {
  if (Test-Path -PathType Container $Source) { $skill = Find-SkillDir (Resolve-Path $Source).Path }
  else {
    $tmp = Join-Path ([IO.Path]::GetTempPath()) ("pcv-" + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory -Path $tmp | Out-Null
    $zip = Join-Path $tmp 'src.zip'
    if ($Source -match '^https?://') { Invoke-WebRequest -UseBasicParsing -Uri $Source -OutFile $zip } else { Copy-Item $Source $zip }
    Expand-Archive -Path $zip -DestinationPath $tmp -Force; $skill = Find-SkillDir $tmp
  }
}
elseif ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "skills\$Name\SKILL.md"))) { $skill = Join-Path $PSScriptRoot "skills\$Name" }
else {
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("pcv-" + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory -Path $tmp | Out-Null
  $zip = Join-Path $tmp 'src.zip'
  $kind = if ($Ref -match '^v?\d+\.\d+') { 'tags' } else { 'heads' }
  $url = "https://github.com/$Repo/archive/refs/$kind/$Ref.zip"
  Write-Host "downloading $url"
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  try { Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $zip } catch { Write-Host 'download failed once, retrying ...'; Start-Sleep -Seconds 3; Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $zip }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force; $skill = Find-SkillDir $tmp
}
if (-not $skill) { throw "could not find skills/$Name/SKILL.md in the source" }

# -- 2. where to put it --------------------------------------------------------------------
$dests = @()
if ($Dest) { $dests += $Dest }
elseif ($Project) { $dests += (Join-Path (Get-Location) '.agents\skills'); $dests += (Join-Path (Get-Location) '.claude\skills') }
else {
  if ($Target -in 'all', 'codex') {
    $dests += (Join-Path $HOME '.agents\skills')
    if (Test-Path (Join-Path $HOME '.codex\skills')) { $dests += (Join-Path $HOME '.codex\skills') }
  }
  if ($Target -in 'all', 'claude') { $dests += (Join-Path $HOME '.claude\skills') }
}

# -- 3. copy (clean replace) ---------------------------------------------------------------
foreach ($d in $dests) {
  $to = Join-Path $d $Name
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  if (Test-Path $to) { Remove-Item -Recurse -Force $to }
  Copy-Item -Recurse -Force $skill $to
  Write-Host "installed -> $to"
  $legacy = Join-Path $d 'pure-code-video'   # the name before 2.1: remove our own old install so the agent does not see two copies
  if ((Test-Path (Join-Path $legacy 'SKILL.md')) -and ((Get-Content (Join-Path $legacy 'SKILL.md') -TotalCount 3) -match '^name:\s*pure-code-video') -and (Test-Path (Join-Path $legacy 'references\atlas'))) { Remove-Item -Recurse -Force $legacy; Write-Host "removed the old install $legacy (this skill is now called $Name)" }
}
if ($tmp -and (Test-Path $tmp)) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }

# -- 4. check the machine ------------------------------------------------------------------
$doctor = Join-Path (Join-Path $dests[0] $Name) 'scripts\doctor.mjs'
if (-not $SkipCheck) {
  if (Get-Command node -ErrorAction SilentlyContinue) { Write-Host "`nchecking this machine (node, Chrome, ffmpeg, WebGL) ..."; & node $doctor; if ($LASTEXITCODE -ne 0) { Write-Host "`nSomething is missing - the lines above say what to install (Windows: winget install OpenJS.NodeJS.LTS Gyan.FFmpeg Google.Chrome)." } }
  else { Write-Host "`nNode.js is not installed. Install it first:  winget install OpenJS.NodeJS.LTS   (also needed: Chrome/Edge and ffmpeg:  winget install Gyan.FFmpeg)" }
}
Write-Host "`nDone. Restart your agent (Codex / Claude Code) so it rescans skills, then try:"
Write-Host '  $cinewright make a 15-second motion-graphics showreel. Go all out.'
Write-Host "Check the machine any time:  node `"$doctor`""
