$api = 'http://127.0.0.1:3000'
Write-Host '=== ROUTES ==='
try {
    $routes = Invoke-WebRequest -Uri "$api/__routes__" -UseBasicParsing -ErrorAction Stop
    $routes.Content
} catch {
    Write-Host "Failed to fetch /__routes__: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host '=== END ROUTES ==='

$chef = 1
$start = (Get-Date).ToString('yyyy-MM-dd')
$end = (Get-Date).AddDays(6).ToString('yyyy-MM-dd')
$urls = @(
    $api + '/bookings/chef/' + $chef + '?start=' + $start + '&end=' + $end,
    $api + '/booking/bookings/chef/' + $chef + '?start=' + $start + '&end=' + $end,
    $api + '/booking/chef/' + $chef + '/bookings?start=' + $start + '&end=' + $end
)

foreach ($u in $urls) {
    Write-Host "\nREQUEST: $u"
    try {
        $r = Invoke-WebRequest -Uri $u -UseBasicParsing -ErrorAction Stop
        Write-Host "Status: $($r.StatusCode)"
        Write-Host "Content-Type: $($r.Headers['Content-Type'])"
        $b = $r.Content
        Write-Host "Body (first 800 chars):"
        $len = [Math]::Min(800, $b.Length)
        Write-Host $b.Substring(0, $len)
    } catch {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
