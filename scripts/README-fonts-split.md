# 字体 unicode-range 切片（方案 B）

编辑器按需加载小包；PDF/图片导出仍用 `public/fonts/*.woff2` 完整字体。

## 首次

依赖：Node、`cn-font-split` 原生核心、Python3 + `fonttools`（部分 woff2 需先转 ttf）。

```bash
npm i
npm run fonts:split:install-core   # 安装 cn-font-split 原生核心
pip3 install fonttools brotli      # woff2→ttf 回退
npm run fonts:split                # 切割全部字体 → public/fonts/split/
```

只切部分：

```bash
npm run fonts:split -- shanggu-serif acy
```

## 部署

`public/fonts/`（含 `split/`）被 gitignore。服务器上需要：

1. 完整 `*.woff2`
2. `public/fonts/split/**`（跑完 `fonts:split` 的产物）

## 行为

- 有切片：`ensureResumeFontLoaded` / `ResumeFontCdn` 走 `/fonts/split/{id}/{weight}/result.css`
- 无切片：自动回退完整 woff2
