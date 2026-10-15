const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = __dirname;
const outputDir = path.join(root, 'exports');
const sceneDir = path.join(root, 'assets', 'reels', 'reel-001', 'generated-scenes');
const sceneFiles = [
  'scene-01-living-room.mp4',
  'scene-02-linen.mp4',
  'scene-03-reading-nook.mp4',
  'scene-04-breakfast-nook.mp4',
  'scene-05-entryway.mp4',
].map((file) => path.join(sceneDir, file));
const music = path.join(root, 'assets', 'reels', 'reel-001', 'audio', 'warm-silence.mp3');
const output = path.join(outputDir, 'ELAVENE-reel-001-ru-base.mp4');
const cover = path.join(outputDir, 'ELAVENE-reel-001-ru-cover.jpg');
const serif = path.join(root, 'assets', 'brand', 'fonts', 'Prata', 'Prata-Regular.ttf');
const sans = path.join(root, 'assets', 'brand', 'fonts', 'Montserrat', 'Montserrat-Variable.ttf');
const fps = 30;
const dissolve = 0.2;
const sceneDurations = [2.4, 2.4, 2.4, 2.4, 2.4, 3.0];

for (const input of [...sceneFiles, music]) {
  if (!fs.existsSync(input)) throw new Error(`Missing required file: ${input}`);
}
fs.mkdirSync(outputDir, { recursive: true });

function run(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

const inputs = [];
for (const file of sceneFiles) inputs.push('-i', file);
inputs.push('-i', music);

let graph = '';
const clipIndices = [0, 1, 2, 3, 4, 0]; // Return to the animated living-room shot for the end card.
for (let i = 0; i < clipIndices.length; i += 1) {
  graph += `[${clipIndices[i]}:v]trim=duration=${sceneDurations[i]},setpts=PTS-STARTPTS,fps=${fps},scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v${i}];`;
}

let previous = 'v0';
let totalBeforeCrossfade = sceneDurations[0];
for (let i = 1; i < clipIndices.length; i += 1) {
  const out = `xf${i}`;
  const offset = totalBeforeCrossfade - dissolve;
  graph += `[${previous}][v${i}]xfade=transition=fade:duration=${dissolve}:offset=${offset.toFixed(2)}[${out}];`;
  previous = out;
  totalBeforeCrossfade += sceneDurations[i] - dissolve;
}

graph += `[${previous}]fade=t=out:st=13.35:d=0.65:color=0xF5F0E8,format=yuv420p[outv];`;
graph += `[5:a]lowpass=f=1350,highpass=f=90,volume=0.10,afade=t=in:st=0:d=0.7,afade=t=out:st=12.35:d=1.55[aout]`;

run([...inputs, '-filter_complex_threads', '1', '-filter_complex', graph, '-map', '[outv]', '-map', '[aout]', '-t', '14', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);

run(['-i', sceneFiles[0], '-vf', `select=eq(n\\,0),scale=1080:1920,drawtext=fontfile=${serif}:text='Дом, в котором':fontsize=76:fontcolor=0x302F2C:borderw=2:bordercolor=0xF5F0E8@0.72:x=(w-tw)/2:y=500,drawtext=fontfile=${serif}:text='спокойнее':fontsize=76:fontcolor=0x302F2C:borderw=2:bordercolor=0xF5F0E8@0.72:x=(w-tw)/2:y=595`, '-frames:v', '1', '-q:v', '2', cover]);

console.log(`Rendered Russian Reel: ${output}`);
console.log(`Rendered cover: ${cover}`);
