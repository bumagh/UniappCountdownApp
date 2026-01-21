# 静态资源文件说明

## 需要从根目录 static/ 复制的文件

请将以下文件从根目录的 `static/` 文件夹复制到 `src/static/` 文件夹：

- `qr.png` - 二维码图片，用于分享功能
- `pic1.png` - 图片资源1
- `pic2.png` - 图片资源2

## 已创建的 SVG 文件

以下 SVG 文件已经创建在 `src/static/` 目录中：

- `home.svg` - 首页图标（未选中状态）
- `home-active.svg` - 首页图标（选中状态）
- `book.svg` - 奇妙本图标（未选中状态）
- `book-active.svg` - 奇妙本图标（选中状态）
- `calendar.svg` - 日历图标（未选中状态）
- `calendar-active.svg` - 日历图标（选中状态）
- `profile.svg` - 我的图标（未选中状态）
- `profile-active.svg` - 我的图标（选中状态）

## 复制命令

可以使用以下命令复制文件：

```bash
cp static/qr.png src/static/
cp static/pic1.png src/static/
cp static/pic2.png src/static/
```

或者在 Windows 中：

```cmd
copy static\qr.png src\static\
copy static\pic1.png src\static\
copy static\pic2.png src\static\
```
