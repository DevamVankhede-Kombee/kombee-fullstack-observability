# PowerShell script to generate traces with N+1 queries
Write-Host "Generating traces to demonstrate N+1 query problem..."

# First, login to get a token
Write-Host "Step 1: Logging in..."
$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    Write-Host "Make sure the backend is running and seeded with admin user"
    exit 1
}

# Create some orders
Write-Host "Step 2: Creating orders..."
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

for ($i = 1; $i -le 3; $i++) {
    $orderBody = @{
        productId = $i
        quantity = 1
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/api/orders" -Method Post -Body $orderBody -Headers $headers
        Write-Host "Order $i created"
    } catch {
        Write-Host "Failed to create order $i : $($_.Exception.Message)"
    }
}

# Now fetch orders - THIS WILL TRIGGER N+1 QUERIES
Write-Host "Step 3: Fetching orders (this triggers N+1 queries)..."
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/orders?limit=20" -Method Get -Headers $headers
    Write-Host "Fetched $($ordersResponse.orders.Count) orders"
    Write-Host ""
    Write-Host "N+1 queries have been triggered!"
    Write-Host "Now go to Grafana Tempo to see the trace with multiple database queries."
} catch {
    Write-Host "Failed to fetch orders: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Go to Grafana at http://localhost:3000"
Write-Host "2. Navigate to Explore -> Tempo"
Write-Host "3. Look for traces from kombee-backend service"
Write-Host "4. Find traces with GET /api/orders operation"
Write-Host "5. Click on a trace to see the N+1 query waterfall"