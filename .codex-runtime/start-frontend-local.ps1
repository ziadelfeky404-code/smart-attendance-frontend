$ErrorActionPreference = 'Stop'

$frontendRoot = 'D:\مشروع الارشاد الاكاديمي\frontend'
$logFile = 'D:\مشروع الارشاد الاكاديمي\.codex-runtime\frontend-local.log'

Set-Location $frontendRoot
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:5000/api'
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:NODE_OPTIONS = '--max-old-space-size=4096'

npm run dev *>> $logFile
