

Write-Host "清理 Expo 和 Android 缓存..." -ForegroundColor Green

# 清理 .expo
if (Test-Path .expo) {
    Remove-Item -Recurse -Force .expo
    Write-Host "已删除 .expo"
}

# 清理 Android 构建目录
if (Test-Path android\build) {
    Remove-Item -Recurse -Force android\build
    Write-Host "已删除 android/build"
}
if (Test-Path android\app\build) {
    Remove-Item -Recurse -Force android\app\build
    Write-Host "已删除 android/app/build"
}

# 清理 node_modules/.cache（可选）
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
}

Write-Host "✨ 清理完成！现在可以重新运行：npx expo run:android" -ForegroundColor Cyan
