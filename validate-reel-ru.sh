#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
video="$root/exports/ELAVENE-reel-001-ru-animated.mp4"
cover="$root/exports/ELAVENE-reel-001-ru-cover.jpg"
video_meta="$(ffprobe -v error -show_streams -show_format -of json "$video")"
cover_meta="$(ffprobe -v error -show_streams -show_format -of json "$cover")"

jq -e '
  ([.streams[] | select(.codec_type == "video")]) as $video |
  ([.streams[] | select(.codec_type == "audio")]) as $audio |
  ($video | length) == 1 and
  ($audio | length) == 1 and
  $video[0].codec_name == "h264" and
  $video[0].width == 1080 and
  $video[0].height == 1920 and
  $video[0].r_frame_rate == "30/1" and
  $audio[0].codec_name == "aac" and
  ((.format.duration | tonumber) >= 13.95 and (.format.duration | tonumber) <= 14.05)
' <<<"$video_meta" >/dev/null
ffmpeg -hide_banner -v error -i "$video" -f null -
printf '%s\n' 'PASS: H.264, 1080×1920, 30 fps, AAC audio, 14 seconds; full decode is clean.'

jq -e '
  ([.streams[] | select(.codec_type == "video")]) as $image |
  ($image | length) == 1 and
  $image[0].width == 1080 and
  $image[0].height == 1920
' <<<"$cover_meta" >/dev/null
printf '%s\n' 'PASS: Cover is 1080×1920.'
