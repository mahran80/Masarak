[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$response = Invoke-WebRequest -Uri "https://localhost:49179/api/grades" -UseBasicParsing
Write-Host $response.Content
