# 扫码与打印

网页端扫描二维码和常见条形码，生成二维码或 Code 39 条形码，并通过系统打印窗口保存 PDF 或发送打印机。摄像头需要 HTTPS 或 localhost。所有扫描和生成都在设备本地进行。

## 网页开发

运行 `npm install` 和 `npm run build`，然后通过 HTTPS 或 localhost 托管 `dist/`。`src.js` 为生成与扫码逻辑；`dist/index.html`、`dist/style.css` 是界面。构建产物 `dist/app.js` 由构建命令生成。

## Android

`android/` 是独立 WebView 应用。和 `pomodoro-focus` 的 debug 流程一样，推送 `main` 或手动启动 GitHub Actions 的 **Build Android debug APK**，构建完成后在运行详情页下载 `code-scanner-debug-apk`。debug 包无需签名 secrets。安装正式签名版本前需卸载 debug 包。

扫码时若相机画面持续无法识别，可分别使用“选择照片”或“拍照识别”。状态文字显示相机画面尺寸和识别尝试次数，便于定位设备问题。

条形码采用 Code 39，仅支持英文字母、数字、空格和 `- . $ / + %`。二维码和条形码输入最多 100 个字符，长 Code 39 条形码打印后可能过密，建议用二维码。

生成和识别使用 ZXing (`@zxing/browser`, `@zxing/library`)，详见其 Apache-2.0 许可证。
