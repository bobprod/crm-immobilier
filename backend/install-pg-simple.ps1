Write-Host "Installation PostgreSQL 17.6" -ForegroundColor Cyan
Write-Host ""

$installerPath = "$env:USERPROFILE\Downloads\postgresql-17.6-2-windows-x64.exe"

if (-not (Test-Path $installerPath)) {
    Write-Host "Erreur: Installateur introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "Installateur trouve" -ForegroundColor Green
Write-Host "Lancement de l'installation..." -ForegroundColor Yellow
Write-Host ""

$arguments = @(
    "--mode", "unattended",
    "--unattendedmodeui", "minimal",
    "--prefix", "C:\Program Files\PostgreSQL\17",
    "--datadir", "C:\Program Files\PostgreSQL\17\data",
    "--superpassword", "postgres",
    "--serverport", "5432",
    "--locale", "French, France",
    "--enable-components", "server,commandlinetools,pgAdmin",
    "--disable-stackbuilder", "1"
)

$process = Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait -PassThru -NoNewWindow

if ($process.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "INSTALLATION REUSSIE !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informations:" -ForegroundColor Cyan
    Write-Host "Utilisateur : postgres"
    Write-Host "Mot de passe: postgres"
    Write-Host "Port        : 5432"
    Write-Host ""
} else {
    Write-Host "Erreur lors de l'installation" -ForegroundColor Red
}

Write-Host "Appuyez sur une touche..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
