param(
  [int]$Port = 8787,
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootWithSeparator = $root.TrimEnd("\") + "\"
$url = "http://127.0.0.1:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "Could not start the preview server on port $Port." -ForegroundColor Red
  Write-Host "Another preview may already be running, or the port is in use."
  Write-Host "Try another port: powershell -ExecutionPolicy Bypass -File preview.ps1 -Port 8790"
  Write-Host ""
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host ""
Write-Host "  SHENZHOU / local preview" -ForegroundColor Yellow
Write-Host "  --------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Website: $url" -ForegroundColor Green
Write-Host "  Admin:   ${url}admin.html" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

if (-not $NoOpen) {
  Start-Process $url
}

function Get-MimeType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".js"   { return "text/javascript; charset=utf-8" }
    ".mjs"  { return "text/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".svg"  { return "image/svg+xml" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".webp" { return "image/webp" }
    ".ico"  { return "image/x-icon" }
    ".woff2" { return "font/woff2" }
    ".txt"  { return "text/plain; charset=utf-8" }
    ".webmanifest" { return "application/manifest+json" }
    default { return "application/octet-stream" }
  }
}

function Send-TextResponse($response, [int]$status, [string]$message) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
  $response.StatusCode = $status
  $response.ContentType = "text/plain; charset=utf-8"
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      $relative = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($relative)) {
        $relative = "index.html"
      }

      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
      if (-not $fullPath.StartsWith($rootWithSeparator, [StringComparison]::OrdinalIgnoreCase)) {
        Send-TextResponse $response 403 "Forbidden"
      } elseif (-not (Test-Path $fullPath)) {
        Send-TextResponse $response 404 "Not found: $relative"
      } else {
        if (Test-Path $fullPath -PathType Container) {
          $fullPath = Join-Path $fullPath "index.html"
        }

        if (-not (Test-Path $fullPath -PathType Leaf)) {
          Send-TextResponse $response 404 "Not found: $relative"
        } else {
          $bytes = [System.IO.File]::ReadAllBytes($fullPath)
          $response.StatusCode = 200
          $response.ContentType = Get-MimeType $fullPath
          $response.ContentLength64 = $bytes.Length
          $response.Headers.Add("Cache-Control", "no-store")
          if ($request.HttpMethod -ne "HEAD") {
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
          }
        }
      }
    } catch {
      try {
        Send-TextResponse $response 500 "Preview server error"
      } catch {
        # The client may have disconnected.
      }
    } finally {
      $response.Close()
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
