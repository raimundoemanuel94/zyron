Write-Host "🚀 DEPLOY AUTOMATICO ZYRON" -ForegroundColor Green
Write-Host ""
Write-Host "1. Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host ""
Write-Host "2. Fazendo commit..." -ForegroundColor Yellow
git commit -m "🚀 Deploy Automatico - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""
Write-Host "3. Enviando para Vercel..." -ForegroundColor Yellow
git push origin master
Write-Host ""
Write-Host "✅ DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Aguarde 2-3 minutos para atualizar" -ForegroundColor Cyan
Write-Host "🌐 Acesse: https://zyron.vercel.app" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para sair"
