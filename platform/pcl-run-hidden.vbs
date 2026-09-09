' PCL Model Picker - silent launcher (no console window flash).
'
' Why this exists: registering a scheduled task that runs powershell.exe directly makes
' Task Scheduler allocate a console window, which can flash on screen for a moment every
' time the task fires. wscript.exe is a GUI-subsystem host, so nothing is created, and
' WshShell.Run with window style 0 keeps the PowerShell console hidden as well.
'
' Registered by platform/pcl-watchdog.ps1 -Install as:
'   wscript.exe //B //nologo "<this file>"
'
' The watchdog path is resolved relative to this launcher, so the checkout can be moved
' without re-registering the task. ASCII-only on purpose.
Option Explicit
Dim fso, shell, base, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & base & "\pcl-watchdog.ps1"" -Repair -Quiet"
shell.Run cmd, 0, False
