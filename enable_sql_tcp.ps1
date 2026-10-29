# ============================================
# MUST RUN AS ADMIN: Right-click PowerShell -> "Run as Administrator"
# Then paste:  powershell -ExecutionPolicy Bypass -File "d:\ITI\MVC\final project\Masarak\Masarak\enable_sql_tcp.ps1"
# ============================================

$ErrorActionPreference = "Stop"
$tcpPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp"
$ipAllPath = "$tcpPath\IPAll"

Write-Host "Current TCP Enabled: $((Get-ItemProperty $tcpPath).Enabled)"

Set-ItemProperty -Path $tcpPath -Name "Enabled" -Value 1
Set-ItemProperty -Path $ipAllPath -Name "TcpPort" -Value "1433"
Set-ItemProperty -Path $ipAllPath -Name "TcpDynamicPorts" -Value ""

Write-Host "New TCP Enabled: $((Get-ItemProperty $tcpPath).Enabled)"
Write-Host "New TcpPort: $((Get-ItemProperty $ipAllPath).TcpPort)"

Write-Host "`nRestarting SQL Server..."
Restart-Service "MSSQL`$SQLEXPRESS" -Force
Start-Sleep -Seconds 5

Write-Host "Testing connection with Data Source=. ..."
sqlcmd -S . -Q "SELECT @@SERVERNAME AS ServerName" -C
Write-Host "`nDone! Press Enter to close."
Read-Host
