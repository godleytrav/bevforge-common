#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SRC="favicon.svg"; OUTDIR="."
sizes=(16 32 48 64 96 128 192 256 512)
for s in "${sizes[@]}"; do
  if command -v inkscape >/dev/null 2>&1; then inkscape --export-type=png --export-filename "${OUTDIR}/favicon-${s}.png" -w "$s" -h "$s" "$SRC";
  elif command -v rsvg-convert >/dev/null 2>&1; then rsvg-convert -w "$s" -h "$s" "$SRC" > "${OUTDIR}/favicon-${s}.png";
  elif command -v magick >/dev/null 2>&1; then magick -background none "$SRC" -resize "${s}x${s}" "${OUTDIR}/favicon-${s}.png";
  else echo "Need inkscape or rsvg-convert or ImageMagick (magick)."; exit 1; fi
done
if command -v magick >/dev/null 2>&1; then magick "${OUTDIR}/favicon-192.png" -resize 180x180 "${OUTDIR}/apple-touch-icon.png"; else cp "${OUTDIR}/favicon-192.png" "${OUTDIR}/apple-touch-icon.png"; fi
if command -v magick >/dev/null 2>&1; then magick "${OUTDIR}/favicon-16.png" "${OUTDIR}/favicon-32.png" "${OUTDIR}/favicon-48.png" "${OUTDIR}/favicon-64.png" "${OUTDIR}/favicon.ico"; else echo "Install ImageMagick (magick) to build favicon.ico (optional)."; fi
echo "Favicons generated."
