Write-Host "`n🧪 Complete API Keys Integration Tests" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════`n"

$BaseUrl = "http://localhost:3001/api"
$Passed = 0
$Failed = 0

function Run-Test {
    param (
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [PSCustomObject]$Body,
        [int]$ExpectedStatus
    )

    Write-Host -NoNewline "Testing: $TestName... "

    try {
        $params = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "SilentlyContinue"
            StatusCodeVariable = "statusCode"
        }

        if ($Body) {
            $params["Body"] = $Body | ConvertTo-Json
        }

        $response = Invoke-WebRequest @params -SkipHttpErrorCheck
        $statusCode = $response.StatusCode

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASSED (Status: $statusCode)" -ForegroundColor Green
            $script:Passed++
        }
        else {
            Write-Host "✗ FAILED (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
            $script:Failed++
        }

        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        $preview = ($content | ConvertTo-Json | Select-Object -First 1) -replace '(.{0,80}).*', '$1'
        Write-Host "  Response: $preview..."
    }
    catch {
        Write-Host "✗ ERROR: $_" -ForegroundColor Red
        $script:Failed++
    }

    Write-Host ""
}

# Test 1: Public endpoint - Gemini key test
Run-Test "POST /api-keys/test/gemini" "POST" "/api-keys/test/gemini" `
    @{ apiKey = "AIzaSyB6-test-invalid" } 201

# Test 2: Public endpoint - OpenAI key test
Run-Test "POST /api-keys/test/openai" "POST" "/api-keys/test/openai" `
    @{ apiKey = "sk-test-invalid" } 201

# Test 3: Public endpoint - Deepseek key test
Run-Test "POST /api-keys/test/deepseek" "POST" "/api-keys/test/deepseek" `
    @{ apiKey = "sk-test-invalid" } 201

# Test 4: Authenticated endpoint - GET user keys (no auth)
Run-Test "GET /ai-billing/api-keys/user (no auth)" "GET" "/ai-billing/api-keys/user" $null 401

# Test 5: Authenticated endpoint - PUT user keys (no auth)
Run-Test "PUT /ai-billing/api-keys/user (no auth)" "PUT" "/ai-billing/api-keys/user" `
    @{ geminiApiKey = "test" } 401

# Test 6: Valid request structure
Write-Host -NoNewline "Testing: Valid payload structure... "
$payload = @{
    openaiApiKey = "sk-test-123"
    geminiApiKey = "AIza-test-456"
    deepseekApiKey = "sk-test-789"
    defaultModel = "gpt-4o"
    defaultProvider = "openai"
}

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/ai-billing/api-keys/user" `
        -Method "PUT" `
        -ContentType "application/json" `
        -Body ($payload | ConvertTo-Json) `
        -SkipHttpErrorCheck

    if ($response.StatusCode -eq 401) {
        Write-Host "✓ PASSED (Correctly returns 401 for missing auth)" -ForegroundColor Green
        $script:Passed++
    }
    else {
        Write-Host "✗ FAILED (Expected 401, got $($response.StatusCode))" -ForegroundColor Red
        $script:Failed++
    }
}
catch {
    Write-Host "✗ ERROR: $_" -ForegroundColor Red
    $script:Failed++
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════"
Write-Host "Tests: " -NoNewline
Write-Host "$Passed PASSED" -ForegroundColor Green -NoNewline
Write-Host ", " -NoNewline
Write-Host "$Failed FAILED" -ForegroundColor Red

Write-Host ""
if ($Failed -eq 0) {
    Write-Host "✓ All API tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    exit 1
}
