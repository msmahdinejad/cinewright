# run-detached.ps1 — run one benchmark queue so that it survives the agent app being closed, and keep the computer awake while it runs.
#   usage (started through WMI so it is NOT a child of the app):  powershell -NoProfile -ExecutionPolicy Bypass -File run-detached.ps1 -Config queue-FA.json
# The config is { "cwd": "...", "cmd": "node benchmark/run.mjs ... >> log 2>&1" }.
# SetThreadExecutionState only tells Windows "do not idle-sleep while this process lives" (the same call video players make); it changes no setting and ends with the process.
param([Parameter(Mandatory = $true)][string]$Config)
$cfg = Get-Content -Raw -Path $Config | ConvertFrom-Json
Add-Type -Namespace Win -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
[void][Win.Power]::SetThreadExecutionState(0x80000001)      # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
Set-Location -Path $cfg.cwd
& cmd.exe /c $cfg.cmd
