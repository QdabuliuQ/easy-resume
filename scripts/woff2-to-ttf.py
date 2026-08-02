#!/usr/bin/env python3
"""Convert woff2 → ttf for cn-font-split fallback."""
import sys
from fontTools.ttLib import TTFont

src, dst = sys.argv[1], sys.argv[2]
font = TTFont(src)
font.flavor = None
font.save(dst)
