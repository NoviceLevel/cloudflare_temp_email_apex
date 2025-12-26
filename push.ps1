$token = "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"
$repo = "NoviceLevel/cloudflare_temp_email_apex"
$branch = "main"

# Get current commit info
$commitSha = git rev-parse HEAD
$commitMsg = git log -1 --pretty=%B

Write-Host "Pushing commit: $commitSha"
Write-Host "Message: $commitMsg"

# Update ref via GitHub API
$headers = @{
    Authorization = "token $token"
    Accept = "application/vnd.github.v3+json"
}

$body = @{
    sha = $commitSha
    force = $true
} | ConvertTo-Json

$updateRefUrl = "https://api.github.com/repos/$repo/git/refs/heads/$branch"

try {
    $result = Invoke-RestMethod -Uri $updateRefUrl -Method Patch -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Done! Pushed to $branch" -ForegroundColor Green
} catch {
    Write-Host "API failed, trying git push..." -ForegroundColor Yellow
    git push --force origin $branch
}
