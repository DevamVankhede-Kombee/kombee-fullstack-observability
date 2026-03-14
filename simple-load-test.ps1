# Simple Load Test Script (Alternative to k6)
# Generates traffic to test the observability platform

Write-Host "Starting load test..." -ForegroundColor Green
Write-Host "Sending 50 requests to the backend..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3001"
$successCount = 0
$errorCount = 0

# Test health endpoint
Write-Host ""
Write-Host "Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    Write-Host "Health check passed" -ForegroundColor Green
}
catch {
    Write-Host "Health check failed - is the backend running?" -ForegroundColor Red
    exit 1
}

# Generate load - Products endpoint
Write-Host ""
Write-Host "Generating load on /api/products..."
for ($i = 1; $i -le 50; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/products" -Method GET -UseBasicParsing -TimeoutSec 5
        $successCount++
        Write-Host "." -NoNewline -ForegroundColor Green
    }
    catch {
        $errorCount++
        Write-Host "x" -NoNewline -ForegroundColor Red
    }
    
    # Small delay between requests
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host ""
Write-Host "Load Test Results:" -ForegroundColor Cyan
Write-Host "Total Requests: 50"
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $errorCount" -ForegroundColor Red

Write-Host ""
Write-Host "Load test complete! Check Grafana dashboards at http://localhost:3000" -ForegroundColor Green
