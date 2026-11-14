#!/bin/bash
# usage: enc.sh <crf> <out.mp4>
SP="C:/Users/mir48/AppData/Local/Temp/claude/d27b549e867e57a2/e3ac0fcd-c495-4d4b-b5bb-b4d9319be164/scratchpad"
FF="C:/Users/mir48/AppData/Roaming/Python/Python311/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
CRF="${1:-20}"; OUT="${2:-$SP/out_v3.mp4}"
"$FF" -y -loglevel error -framerate 60 -i "$SP/frames3/f%04d.jpg" -i "$SP/audio/promo3.wav" \
  -vf "format=gbrp,scale=1920:1080:out_color_matrix=bt709:out_range=tv:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -level 4.2 -pix_fmt yuv420p -r 60 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
ls -la "$OUT"
"$FF" -i "$OUT" 2>&1 | grep -E "Duration|Video:|Audio:"
