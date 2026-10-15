const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = __dirname;
const assets = path.join(root, 'assets', 'reels', 'reel-001');
const outputDir = path.join(root, 'exports');
const workDir = path.join(outputDir, 'reel-build');
const output = path.join(outputDir, 'ELAVENE-warm-home-final.mp4');
fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const scenes = [
  { image: '01-hero-living-room.png', duration: 2.75, zoom: '1.00+0.0022*on', x: '(iw-iw/zoom)/2', y: '(ih-ih/zoom)/2' },
  { image: '02-linen-detail.png', duration: 2.75, zoom: '1.04+0.0012*on', x: '(iw-iw/zoom)/2-0.08*on', y: '(ih-ih/zoom)/2' },
  { image: '03-reading-nook.png', duration: 2.75, zoom: '1.00+0.0018*on', x: '(iw-iw/zoom)/2', y: '(ih-ih/zoom)/2' },
  { image: '01-hero-living-room.png', duration: 3.00, zoom: '1.18+0.0010*on', x: 'iw-iw/zoom', y: 'ih-ih/zoom' },
  { image: '01-hero-living-room.png', duration: 1.75, zoom: '1.04', x: '(iw-iw/zoom)/2', y: '(ih-ih/zoom)/2' },
];
const fps = 30;
const dissolve = 0.25;
const finalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0) - dissolve * (scenes.length - 1);

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

for (let i = 0; i < scenes.length; i += 1) {
  const scene = scenes[i];
  const image = path.join(assets, scene.image);
  if (!fs.existsSync(image)) throw new Error(`Missing source image: ${image}`);
  const clip = path.join(workDir, `shot-${i}.mp4`);
  const frames = Math.round(scene.duration * fps);
  const vf = `scale=1620:2880,zoompan=z='${scene.zoom}':x='${scene.x}':y='${scene.y}':d=1:s=1080x1920:fps=${fps},setsar=1,format=yuv420p`;
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-framerate', String(fps), '-i', image, '-vf', vf, '-frames:v', String(frames), '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', clip]);
  console.log(`Rendered scene ${i + 1}/${scenes.length}`);
}

const inputs = [];
for (let i = 0; i < scenes.length; i += 1) inputs.push('-i', path.join(workDir, `shot-${i}.mp4`));

const offsets = [2.5, 5.0, 7.5, 10.25];
let graph = `[0:v][1:v]xfade=transition=fade:duration=${dissolve}:offset=${offsets[0]}[v1];`;
graph += `[v1][2:v]xfade=transition=fade:duration=${dissolve}:offset=${offsets[1]}[v2];`;
graph += `[v2][3:v]xfade=transition=fade:duration=${dissolve}:offset=${offsets[2]}[v3];`;
graph += `[v3][4:v]xfade=transition=fade:duration=${dissolve}:offset=${offsets[3]},fade=t=out:st=11:d=1:color=0xF5F0E8[base];`;
const serif = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf';
const sans = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const titleColor = '0x302F2C';
let textIndex = 0;
const addText = (text, font, size, y, start, end) => {
  const safe = text.replaceAll(':', '\\:').replaceAll("'", "\\'");
  const alpha = `if(lt(t,${start}),0,if(lt(t,${start}+0.25),(t-${start})/0.25,if(lt(t,${end}-0.25),1,max(0,(${end}-t)/0.25))))`;
  const input = textIndex === 0 ? 'base' : `txt${textIndex}`;
  const outputLabel = `txt${textIndex + 1}`;
  graph += `[${input}]drawtext=fontfile=${font}:text='${safe}':fontsize=${size}:fontcolor=${titleColor}:x=(w-tw)/2:y=${y}:alpha='${alpha}'[${outputLabel}];`;
  textIndex += 1;
};
addText('A calmer,', serif, 66, 500, 0.25, 2.45);
addText('warmer home.', serif, 66, 585, 0.25, 2.45);
addText('begins with how it feels', serif, 46, 1260, 2.7, 4.85);
addText('not how much you own', serif, 46, 1260, 5.2, 7.35);
addText('ÉLAVÉNE', serif, 76, 730, 10.95, 12.0);
addText('Save this for later', sans, 34, 845, 11.2, 12.0);
graph += `[txt${textIndex}]format=yuv420p[outv]`;

run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex_threads', '1', '-filter_complex', graph, '-map', '[outv]', '-an', '-t', finalDuration.toFixed(2), '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);

const cover = path.join(outputDir, 'ELAVENE-reel-cover.jpg');
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(assets, '01-hero-living-room.png'), '-vf', `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,drawtext=fontfile=${serif}:text='A calmer,':fontsize=66:fontcolor=${titleColor}:x=(w-tw)/2:y=500,drawtext=fontfile=${serif}:text='warmer home.':fontsize=66:fontcolor=${titleColor}:x=(w-tw)/2:y=585`, '-frames:v', '1', '-q:v', '2', cover]);
console.log(`Final silent Reel rendered: ${output}`);
console.log(`Expected duration: ${finalDuration.toFixed(2)}s; Instagram music is added at upload as specified in the content pack.`);
console.log(`Cover rendered: ${cover}`);
