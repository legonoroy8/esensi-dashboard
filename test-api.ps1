# Test script for Esensi Dashboard API
# Run this with: .\test-api.ps1

Write-Host "=== Testing Esensi Dashboard API ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1] Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8085/health" -Method GET
    Write-Host "✓ Health: $($health.status) - Environment: $($health.environment)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n[2] Testing Login..." -ForegroundColor Yellow
try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginBody = @{
        username = "admin"
        password = "test123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8085/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -WebSession $session `
        -SessionVariable globalSession
    
    Write-Host "✓ Login successful: $($loginResponse.user.username) - Role: $($loginResponse.user.role)" -ForegroundColor Green
    $session = $globalSession
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: KPI Summary (will fail without DB, but tests auth)
Write-Host "`n[3] Testing KPI Summary (authenticated)..." -ForegroundColor Yellow
try {
    $kpi = Invoke-RestMethod -Uri "http://localhost:8085/api/kpi/summary" `
        -Method GET `
        -WebSession $session
    Write-Host "✓ KPI Summary retrieved successfully" -ForegroundColor Green
    Write-Host "  Total Leads: $($kpi.totalLeads)" -ForegroundColor Gray
    Write-Host "  Leads (7d): $($kpi.leads7Days)" -ForegroundColor Gray
    Write-Host "  Leads (30d): $($kpi.leads30Days)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "⚠ KPI endpoint reachable but DB not connected (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ KPI Summary failed: $_" -ForegroundColor Red
    }
}

# Test 4: Chart Data
Write-Host "`n[4] Testing Chart Data (authenticated)..." -ForegroundColor Yellow
try {
    $chart = Invoke-RestMethod -Uri "http://localhost:8085/api/chart/leads-over-time" `
        -Method GET `
        -WebSession $session
    Write-Host "✓ Chart data retrieved successfully" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "⚠ Chart endpoint reachable but DB not connected (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Chart data failed: $_" -ForegroundColor Red
    }
}

# Test 5: Table Data
Write-Host "`n[5] Testing Table Data (authenticated)..." -ForegroundColor Yellow
try {
    $table = Invoke-RestMethod -Uri "http://localhost:8085/api/table/recent-leads?page=1&page_size=10" `
        -Method GET `
        -WebSession $session
    Write-Host "✓ Table data retrieved successfully" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "⚠ Table endpoint reachable but DB not connected (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Table data failed: $_" -ForegroundColor Red
    }
}

# Test 6: Unauthorized access (without session)
Write-Host "`n[6] Testing Unauthorized Access..." -ForegroundColor Yellow
try {
    $unauthorized = Invoke-RestMethod -Uri "http://localhost:8085/api/kpi/summary" -Method GET
    Write-Host "✗ Should have been blocked!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✓ Correctly blocked unauthorized access" -ForegroundColor Green
    } else {
        Write-Host "✗ Wrong error: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
