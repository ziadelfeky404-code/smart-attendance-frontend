@echo off
cd /d D:\مشروع الارشاد الاكاديمي\frontend
set NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
set NEXT_TELEMETRY_DISABLED=1
set NODE_OPTIONS=--max-old-space-size=4096
node node_modules\next\dist\bin\next dev -p 3000 >> D:\مشروع الارشاد الاكاديمي\.codex-runtime\frontend-local.log 2>&1
