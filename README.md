# 扫码与打印

网页端扫描二维码和常见条形码，生成二维码或 Code 39 条形码，并通过系统打印窗口保存 PDF 或发送打印机。摄像头需要 HTTPS 或 localhost。所有扫描和生成都在设备本地进行。

## 网页开发

运行 `npm install` 和 `npm run build`，然后通过 HTTPS 或 localhost 托管 `dist/`。`src.js` 为生成与扫码逻辑；`dist/index.html`、`dist/style.css` 是界面。构建产物 `dist/app.js` 由构建命令生成。

## Android

`android/` 是独立 WebView 应用，使用 AndroidX WebViewAssetLoader 提供安全的本地 HTTPS origin，并通过系统打印服务保存 PDF 或选择打印机。GitHub Actions 的 **Android APK** 工作流可手动触发。没有签名 secrets 时上传 debug APK artifact；设置以下仓库 Actions secrets 后构建正式签名 APK：

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

推送 `v*` 标签会触发构建，生成的 APK 可在 Actions 的 `scanner-apk` artifact 下载；发布 GitHub Release 需要手动上传。覆盖安装须保持 `applicationId` 与签名证书不变，并在每次发布前递增 `versionCode`。首次安装的 debug 包不能由不同签名的 release 包覆盖。

条形码采用 Code 39，仅支持英文字母、数字、空格和 `- . $ / + %`。二维码和条形码输入最多 100 个字符，长 Code 39 条形码打印后可能过密，建议用二维码。

生成和识别使用 ZXing (`@zxing/browser`, `@zxing/library`)，详见其 Apache-2.0 许可证。
