# Immo SaaS - Cree l'icone + le raccourci Bureau
# Usage : clic droit -> "Executer avec PowerShell"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Add-Type -AssemblyName System.Drawing

# -- 1. Genere launcher.ico (maison bleue sur fond sombre) --------------------

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Fond arrondi sombre
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$g.FillRectangle($bgBrush, 0, 0, $size, $size)

# Cercle bleu gradient
$circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
$g.FillEllipse($circleBrush, 18, 18, 220, 220)

# Cercle intérieur plus clair
$innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 96, 165, 250))
$g.FillEllipse($innerBrush, 38, 38, 180, 180)

# Maison blanche (forme simplifiée)
$penWhite = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 8)
$penWhite.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$wBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Toit (triangle)
$roofPts = New-Object 'System.Drawing.Point[]' 3
$roofPts[0] = [System.Drawing.Point]::new(128, 62)   # pointe
$roofPts[1] = [System.Drawing.Point]::new(68, 128)    # gauche
$roofPts[2] = [System.Drawing.Point]::new(188, 128)   # droite
$g.FillPolygon($wBrush, $roofPts)

# Corps maison (rectangle)
$g.FillRectangle($wBrush, 82, 125, 92, 72)

# Porte (rectangle sombre au centre)
$doorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
$g.FillRectangle($doorBrush, 112, 150, 32, 47)

# Fenêtre (carré sombre à gauche)
$g.FillRectangle($doorBrush, 90, 138, 18, 18)

$g.Dispose()

# Encode PNG puis encapsule dans ICO
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngData = $ms.ToArray()

$iconStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($iconStream)
$writer.Write([uint16]0)       # Reserved
$writer.Write([uint16]1)       # Type: ICO
$writer.Write([uint16]1)       # Count: 1 image
$writer.Write([byte]0)         # Width (0 = 256)
$writer.Write([byte]0)         # Height (0 = 256)
$writer.Write([byte]0)         # Colors
$writer.Write([byte]0)         # Reserved
$writer.Write([uint16]1)       # Color planes
$writer.Write([uint16]32)      # Bits per pixel
$writer.Write([uint32]$pngData.Length)  # Image size
$writer.Write([uint32]22)      # Offset to image data
$writer.Write($pngData)
$writer.Flush()

$icoPath = Join-Path $ProjectDir "launcher.ico"
[System.IO.File]::WriteAllBytes($icoPath, $iconStream.ToArray())
Write-Host "OK - Icone creee : $icoPath" -ForegroundColor Green

# -- 2. Cree le raccourci sur le Bureau --------------------------------------

$vbsPath = Join-Path $ProjectDir "start-launcher.vbs"
$lnkPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Immo SaaS.lnk"

$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut($lnkPath)
$lnk.TargetPath = "wscript.exe"
$lnk.Arguments = "`"$vbsPath`""
$lnk.WorkingDirectory = $ProjectDir
$lnk.IconLocation = "$icoPath,0"
$lnk.Description = "Demarrer Immo SaaS (Backend + Frontend)"
$lnk.WindowStyle = 7    # minimized
$lnk.Save()

Write-Host "OK - Raccourci cree : $lnkPath" -ForegroundColor Green
Write-Host ""
Write-Host "Double-clique sur 'Immo SaaS' sur ton Bureau pour lancer !" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuie sur Entree pour fermer"
