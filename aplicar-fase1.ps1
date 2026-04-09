$ErrorActionPreference = 'Stop'

$projeto = 'C:\Users\COTTON NOVA PRATA\Desktop\zyron'

Write-Host '==> Entrando no projeto:'
Write-Host $projeto
Set-Location $projeto

$arquivos = @(
    (Join-Path $projeto 'workout-validation.js'),
    (Join-Path $projeto 'sync-workout-NOVO.js'),
    (Join-Path $projeto 'logs-NOVO.js'),
    (Join-Path $projeto 'app_logs.sql')
)

foreach ($arquivo in $arquivos) {
    if (-not (Test-Path $arquivo)) {
        throw ('Arquivo não encontrado: ' + $arquivo)
    }
}

$libDir = Join-Path $projeto 'api\_lib'
if (-not (Test-Path $libDir)) {
    Write-Host '==> Criando pasta api\_lib'
    New-Item -ItemType Directory -Path $libDir -Force | Out-Null
}

$backupDir = Join-Path $projeto ('backup-fase1-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Write-Host '==> Criando backup em:'
Write-Host $backupDir
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$destSync = Join-Path $projeto 'api\sync-workout.js'
$destLogs = Join-Path $projeto 'api\logs.js'
$destValidation = Join-Path $projeto 'api\_lib\workout-validation.js'

if (Test-Path $destSync) {
    Copy-Item $destSync (Join-Path $backupDir 'sync-workout.js.bak') -Force
}

if (Test-Path $destLogs) {
    Copy-Item $destLogs (Join-Path $backupDir 'logs.js.bak') -Force
}

if (Test-Path $destValidation) {
    Copy-Item $destValidation (Join-Path $backupDir 'workout-validation.js.bak') -Force
}

Write-Host '==> Copiando arquivos da Fase 1...'
Copy-Item (Join-Path $projeto 'workout-validation.js') $destValidation -Force
Copy-Item (Join-Path $projeto 'sync-workout-NOVO.js') $destSync -Force
Copy-Item (Join-Path $projeto 'logs-NOVO.js') $destLogs -Force

Write-Host ''
Write-Host '==> Git status:'
git status

Write-Host ''
Write-Host '==> Arquivos aplicados com sucesso.'
Write-Host 'Backup salvo em:'
Write-Host $backupDir
Write-Host ''
Write-Host 'PRÓXIMO PASSO MANUAL:'
Write-Host '1. Abrir app_logs.sql'
Write-Host '2. Rodar no SQL Editor do Supabase'
Write-Host '3. Depois executar:'
Write-Host 'git add .'
Write-Host 'git commit -m "FASE 1 completa - sync seguro + logs persistentes"'
Write-Host 'git push'