# PCL Model Picker - auto-repair watchdog (Windows / OpenClaw)
#
# Why this exists: `npm i -g openclaw@<new>` replaces the whole
# dist/control-ui directory, which deletes the injected <script> tag and the
# enhancement asset. The core installer (scripts/pcl-patch.ps1) is idempotent
# but has to be run again. This watchdog detects the wipe and re-runs the
# installer automatically, so the enhancement survives upgrades.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1              # same as -Repair
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1 -Check       # report only, exit 0/10
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1 -Repair      # check and repair if needed
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1 -Install     # register the scheduled task
#                                     (launched through the bundled pcl-run-hidden.vbs,
#                                      so no console window ever flashes)
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1 -Uninstall   # remove the scheduled task
#   powershell -ExecutionPolicy Bypass -File pcl-watchdog.ps1 -Status      # show task + last log lines
#
# Options:
#   -Dist "<...>\dist\control-ui"   explicit Control UI directory
#   -IntervalMinutes <n>            scheduled task cadence (default 15)
#   -Quiet                          no console output (used by the scheduled task)
#
# Exit codes: 0 = already healthy, 10 = repaired, 1 = error
#
# ASCII-only on purpose: PowerShell 5.1 reads BOM-less files as ANSI, so a
# non-ASCII comment could corrupt parsing on a non-Chinese Windows install.

param(
    [switch]$Check,
    [switch]$Repair,
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Status,
    [string]$Dist = '',
    [int]$IntervalMinutes = 15,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$taskName = 'BigLobster-PclModelPickerRepair'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$patchScript = Join-Path (Join-Path $repoRoot 'scripts') 'pcl-patch.ps1'
$logDir = Join-Path $env:USERPROFILE '.openclaw\logs'
$logFile = Join-Path $logDir 'pcl-model-picker-watchdog.log'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    try {
        if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
        Add-Content -Path $logFile -Value $line -Encoding UTF8
        # keep the log small (last 200 lines)
        $all = @(Get-Content $logFile -ErrorAction SilentlyContinue)
        if ($all.Count -gt 200) { $all[-200..-1] | Set-Content -Path $logFile -Encoding UTF8 }
    } catch { }
    if (-not $Quiet) { Write-Host $line }
}

function Find-ControlUiDir {
    param([string]$Explicit)
    if ($Explicit) {
        if (Test-Path (Join-Path $Explicit 'index.html')) { return $Explicit }
        throw "no index.html under -Dist: $Explicit"
    }
    $candidates = New-Object System.Collections.Generic.List[string]
    try {
        $npmRoot = (& npm root -g 2>$null)
        if ($npmRoot) { $candidates.Add((Join-Path $npmRoot 'openclaw\dist\control-ui')) }
    } catch { }
    $candidates.Add('C:\npm-global\node_modules\openclaw\dist\control-ui')
    if ($env:APPDATA) { $candidates.Add((Join-Path $env:APPDATA 'npm\node_modules\openclaw\dist\control-ui')) }
    $candidates.Add('/usr/local/lib/node_modules/openclaw/dist/control-ui')
    $candidates.Add('/usr/lib/node_modules/openclaw/dist/control-ui')
    try {
        $cmd = Get-Command openclaw -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source) {
            $dir = Split-Path -Parent $cmd.Source
            for ($i = 0; $i -lt 6 -and $dir; $i++) {
                $candidates.Add((Join-Path $dir 'node_modules\openclaw\dist\control-ui'))
                $dir = Split-Path -Parent $dir
            }
        }
    } catch { }
    foreach ($c in $candidates) {
        if ($c -and (Test-Path (Join-Path $c 'index.html'))) { return $c }
    }
    throw 'OpenClaw Control UI directory not found; pass -Dist explicitly.'
}

# Expected asset name + fingerprint come from the newest packaged script.
function Get-ExpectedBuild {
    $scriptsDir = Join-Path $repoRoot 'scripts'
    $js = Get-ChildItem $scriptsDir -Filter 'pcl-model-picker.v*.js' -ErrorAction SilentlyContinue |
        Sort-Object { [int]([regex]::Match($_.Name, 'v(\d+)\.js$').Groups[1].Value) } -Descending |
        Select-Object -First 1
    if (-not $js) { throw "no pcl-model-picker.v*.js under $scriptsDir" }
    $fp = (Get-FileHash $js.FullName -Algorithm SHA256).Hash.Substring(0, 8).ToLower()
    [pscustomobject]@{ File = $js.Name; Fingerprint = $fp; Path = $js.FullName }
}

function Test-Injection {
    param([string]$ControlUiDir, [pscustomobject]$Expected)
    $index = Join-Path $ControlUiDir 'index.html'
    $asset = Join-Path (Join-Path $ControlUiDir 'assets') $Expected.File
    $result = [pscustomobject]@{
        Index = $index; Asset = $asset
        TagPresent = $false; TagCurrent = $false; AssetPresent = $false; AssetMatches = $false
        Healthy = $false; Reason = ''
    }
    if (-not (Test-Path $index)) { $result.Reason = 'index.html missing'; return $result }
    $html = [System.IO.File]::ReadAllText($index)
    $result.TagPresent = ($html -match '<!-- pcl-model-picker -->')
    $expectedTag = [regex]::Escape($Expected.File) + '\?h=' + $Expected.Fingerprint
    $result.TagCurrent = ($html -match $expectedTag)
    $result.AssetPresent = (Test-Path $asset)
    if ($result.AssetPresent) {
        $actual = (Get-FileHash $asset -Algorithm SHA256).Hash.Substring(0, 8).ToLower()
        $result.AssetMatches = ($actual -eq $Expected.Fingerprint)
    }
    $result.Healthy = ($result.TagCurrent -and $result.AssetPresent -and $result.AssetMatches)
    if (-not $result.Healthy) {
        if (-not $result.TagPresent) { $result.Reason = 'injected tag missing (upgrade wiped dist/)' }
        elseif (-not $result.TagCurrent) { $result.Reason = 'injected tag is stale (version or fingerprint changed)' }
        elseif (-not $result.AssetPresent) { $result.Reason = 'enhancement asset missing' }
        else { $result.Reason = 'enhancement asset content differs from package' }
    }
    return $result
}

function Invoke-Repair {
    param([string]$ControlUiDir)
    if (-not (Test-Path $patchScript)) { throw "installer not found: $patchScript" }
    $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $patchScript -Dist $ControlUiDir 2>&1
    return ($out | Out-String).Trim()
}

# ---- actions ----

if ($Uninstall) {
    $removed = $false
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction Stop
        $removed = $true
    } catch {
        & schtasks /delete /tn $taskName /f 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $removed = $true }
    }
    Write-Log ("scheduled task {0}: {1}" -f $taskName, $(if ($removed) { 'removed' } else { 'not found' }))
    if (-not $Quiet) { Write-Host ("[PCL-WD] task '{0}' {1}" -f $taskName, $(if ($removed) { 'removed' } else { 'was not installed' })) }
    exit 0
}

if ($Install) {
    # Launch through conhost.exe --headless: no console window, no VBScript dependency.
    # conhost.exe --headless creates a headless console host (Windows 11+),
    # eliminating both the brief flash and the VBScriptDeprecationAlert warnings.
    $exe = Join-Path $env:SystemRoot 'System32\conhost.exe'
    $psScript = Join-Path $scriptDir 'pcl-watchdog.ps1'
    $argument = '--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}" -Repair -Quiet' -f $psScript
    $ok = $false
    try {
        $action = New-ScheduledTaskAction -Execute $exe -Argument $argument
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force -Description 'Re-applies the ModelSelectorOpenClaw enhancement when an OpenClaw upgrade wipes dist/control-ui.' | Out-Null
        $ok = $true
    } catch {
        $tr = '"{0}" {1}' -f $exe, $argument
        & schtasks /create /tn $taskName /tr $tr /sc minute /mo $IntervalMinutes /f 2>$null | Out-Null
        $ok = ($LASTEXITCODE -eq 0)
    }
    if ($ok) {
        Write-Log ("scheduled task {0} registered, every {1} min" -f $taskName, $IntervalMinutes)
        if (-not $Quiet) { Write-Host ("[PCL-WD] installed: {0} (every {1} min)" -f $taskName, $IntervalMinutes) }
        exit 0
    }
    Write-Log 'failed to register the scheduled task' 'ERROR'
    if (-not $Quiet) { Write-Host '[PCL-WD] ERROR: could not register the scheduled task' }
    exit 1
}

if ($Status) {
    if (-not $Quiet) {
        Write-Host ("[PCL-WD] task: {0}" -f $taskName)
        & schtasks /query /tn $taskName /fo list 2>$null | Select-Object -First 6 | ForEach-Object { Write-Host ("  " + $_) }
        Write-Host ("[PCL-WD] log: {0}" -f $logFile)
        if (Test-Path $logFile) { Get-Content $logFile -Tail 10 | ForEach-Object { Write-Host ("  " + $_) } }
    }
    exit 0
}

# default action = repair (also used by -Check / -Repair)
try {
    $expected = Get-ExpectedBuild
    $dir = Find-ControlUiDir $Dist
    $state = Test-Injection -ControlUiDir $dir -Expected $expected
    if ($state.Healthy) {
        if ($Check) {
            Write-Log ("healthy: {0} @ {1}" -f $expected.File, $dir)
            if (-not $Quiet) { Write-Host ("[PCL-WD] OK - enhancement active ({0}, h={1})" -f $expected.File, $expected.Fingerprint) }
            exit 0
        }
        exit 0
    }
    if ($Check) {
        Write-Log ("needs repair: {0} ({1})" -f $state.Reason, $dir) 'WARN'
        if (-not $Quiet) { Write-Host ("[PCL-WD] needs repair: {0}" -f $state.Reason) }
        exit 10
    }
    Write-Log ("repairing: {0} ({1})" -f $state.Reason, $dir) 'WARN'
    $out = Invoke-Repair -ControlUiDir $dir
    $after = Test-Injection -ControlUiDir $dir -Expected $expected
    if ($after.Healthy) {
        Write-Log 'repaired: injection restored'
        if (-not $Quiet) { Write-Host '[PCL-WD] repaired: injection restored' }
        exit 10
    }
    Write-Log ("repair did not take effect: {0} :: {1}" -f $after.Reason, $out) 'ERROR'
    if (-not $Quiet) { Write-Host ("[PCL-WD] ERROR: repair failed ({0})" -f $after.Reason) }
    exit 1
} catch {
    Write-Log ("error: {0}" -f $_.Exception.Message) 'ERROR'
    if (-not $Quiet) { Write-Host ("[PCL-WD] ERROR: {0}" -f $_.Exception.Message) }
    exit 1
}
