#!/usr/bin/env python3
"""
解压 public/ 下的阿里妈妈字体压缩包，将 woff2 文件提取到 public/fonts/ 目录。
"""

import zipfile
import os
import shutil

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
FONTS_DIR = os.path.join(PUBLIC_DIR, "fonts")

FONT_ZIPS = [
    "阿里妈妈数黑体.zip",
    "阿里妈妈东方大楷.zip",
    "阿里妈妈方圆体.zip",
    "阿里妈妈刀隶体.zip",
]

# 只提取 woff2 文件（体积最小，浏览器兼容性好）
EXTRACT_EXT = ".woff2"

os.makedirs(FONTS_DIR, exist_ok=True)

for zip_name in FONT_ZIPS:
    zip_path = os.path.join(PUBLIC_DIR, zip_name)
    if not os.path.exists(zip_path):
        print(f"[跳过] 未找到: {zip_name}")
        continue
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.namelist():
            if member.lower().endswith(EXTRACT_EXT):
                filename = os.path.basename(member)
                dest = os.path.join(FONTS_DIR, filename)
                with zf.open(member) as src, open(dest, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                print(f"[提取] {zip_name} -> fonts/{filename}")

print("\n完成！public/fonts/ 下的字体文件：")
for f in sorted(os.listdir(FONTS_DIR)):
    size_kb = os.path.getsize(os.path.join(FONTS_DIR, f)) // 1024
    print(f"  {f}  ({size_kb} KB)")
