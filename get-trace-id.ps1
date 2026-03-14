# Script to generate a trace and show you the trace ID
Write-Host "Generating a new trace to get the trace ID..."

# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body '{"email":"admin@test.com","password":"admin123"}' -ContentType "application/json"
$token = $loginResponse.token

# Make a request that will generate a trace
$headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
$ordersResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/orders?limit=5" -Method Get -Headers $headers

Write-Host "Request completed. Now:"
Write-Host "1. Go to Tempo"
Write-Host "2. Search for kombee-backend service"
Write-Host "3. Look for the most recent GET /api/orders trace"
Write-Host "4. Copy the trace ID from that trace"
Write-Host "5. Use it in Loki with: {service_name=`"kombee-backend`"} |= `"TRACE_ID_HERE`""