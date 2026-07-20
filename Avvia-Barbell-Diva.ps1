param([int]$Port = 8767)

$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $appRoot 'Barbell-Diva-Server.ps1'
$appUrl = "http://127.0.0.1:$Port/index.html?v=114-phase19.2"

function Test-BarbellDivaPort {
  param([int]$TargetPort)
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync('127.0.0.1', $TargetPort)
    return $task.Wait(350) -and $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

if (-not (Test-BarbellDivaPort -TargetPort $Port)) {
  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"{0}"' -f $serverScript),
    '-Root', ('"{0}"' -f $appRoot),
    '-Port', $Port
  )
  Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WindowStyle Hidden
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    Start-Sleep -Milliseconds 100
    if (Test-BarbellDivaPort -TargetPort $Port) { $ready = $true; break }
  }
  if (-not $ready) { throw "Barbell Diva non è riuscita ad avviare il server locale sulla porta $Port." }
}

Start-Process $appUrl
