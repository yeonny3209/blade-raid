# 더블클릭이 아니라 PowerShell 에서 실행 : 비밀번호를 물어본 뒤 dist\BladeRaid.aab 를 만든다
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path 'android\upload.keystore')) { Write-Host 'android\upload.keystore 가 없습니다. 먼저 업로드 키를 만드세요.'; exit 1 }
$bash = @('C:\Program Files\Git\bin\bash.exe', 'C:\Program Files (x86)\Git\bin\bash.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $bash) { Write-Host 'Git 의 bash.exe 를 찾지 못했습니다.'; exit 1 }
$sec = Read-Host '업로드 키 비밀번호 (입력해도 화면에 안 보임)' -AsSecureString
$env:BLADERAID_UPLOAD_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
& $bash 'android/build_aab.sh'
$code = $LASTEXITCODE
Remove-Item Env:\BLADERAID_UPLOAD_PASS
if ($code -eq 0) { Write-Host "`n성공 : $root\dist\BladeRaid.aab" -ForegroundColor Green } else { Write-Host "`n실패 (코드 $code). 위의 오류 메시지를 확인하세요." -ForegroundColor Red }
