param(
  [Parameter(Mandatory = $true)][string]$Root,
  [int]$Port = 8767
)

$rootPath = [System.IO.Path]::GetFullPath($Root).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.svg' = 'image/svg+xml'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico' = 'image/x-icon'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
      while (($header = $reader.ReadLine()) -ne $null -and $header -ne '') { }

      $parts = $requestLine.Split(' ')
      $requestTarget = if ($parts.Count -ge 2) { $parts[1] } else { '/' }
      $pathOnly = $requestTarget.Split('?')[0]
      $relativePath = [System.Uri]::UnescapeDataString($pathOnly).TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
      $candidate = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))

      if (-not $candidate.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 - File non trovato')
        $status = '404 Not Found'
        $contentType = 'text/plain; charset=utf-8'
      } else {
        $body = [System.IO.File]::ReadAllBytes($candidate)
        $status = '200 OK'
        $extension = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
        $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
      }

      $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } catch {
    } finally {
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
