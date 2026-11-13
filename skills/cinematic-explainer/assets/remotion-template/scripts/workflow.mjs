import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {readProject, parseRange} from './project.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'check', ...argv] = process.argv.slice(2);
const args = {};
const values = new Set(['range', 'scale', 'output', 'file', 'browser', 'concurrency']);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) throw new Error(`Unexpected argument: ${argv[i]}`);
  const [key, inline] = argv[i].slice(2).split(/=(.*)/s);
  if (values.has(key)) args[key] = inline ?? argv[++i];
  else if (['draft', 'overwrite', 'help'].includes(key)) args[key] = true;
  else throw new Error(`Unknown option: --${key}`);
}
if (args.help) {
  console.log('Commands: doctor, check, render, stills, verify\nOptions: --range START:END (exclusive end), --scale 0.5, --output out/film.mp4, --browser PATH, --concurrency 4, --draft, --overwrite.\nverify: --file out/film.mp4. Authored production videos require complete shots and captions.');
  process.exit(0);
}
const run = (cmd, list) => execFileSync(cmd, list, {encoding:'utf8', stdio:['ignore','pipe','pipe'], maxBuffer:16 * 1024 * 1024});
function hasCommand(name) {try {run(name,['-version']);return true;} catch {return false;}}
function findBrowser() {
  const explicit = args.browser || process.env.REMOTION_BROWSER_EXECUTABLE;
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new Error('Configured Chrome/Chromium executable does not exist.');
    return explicit;
  }
  const candidates = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
    : process.platform === 'win32'
      ? [path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'), path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')]
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((x) => fs.existsSync(x)) ?? null;
}
const browserExecutable = findBrowser();
function requireMediaTools() {
  for (const name of ['ffmpeg','ffprobe']) if (!hasCommand(name)) throw new Error(`${name} is required on PATH for media verification. Install FFmpeg, then retry.`);
}
function verify(file, expected) {
  requireMediaTools();
  const metadata = JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate,duration,nb_frames,sample_rate,channels:format=duration,size','-of','json',file]));
  const v = metadata.streams.find((s) => s.codec_type === 'video');
  const a = metadata.streams.find((s) => s.codec_type === 'audio');
  if (!v || v.codec_name !== 'h264' || v.width !== expected.width || v.height !== expected.height) throw new Error('Export codec/dimensions do not match the render plan.');
  const [num, den] = v.r_frame_rate.split('/').map(Number);
  if (Math.abs(num / den - expected.fps) > .001) throw new Error('Export frame rate differs from project.');
  if (Math.abs(Number(v.duration) - expected.frames / expected.fps) > .5 / expected.fps) throw new Error('Export duration differs from requested frame count.');
  if (v.nb_frames && Number(v.nb_frames) !== expected.frames) throw new Error('Export frame count differs from requested range.');
  if (expected.audio && !a) throw new Error('Narrated export is missing its audio stream.');
  run('ffmpeg',['-v','error','-i',file,'-f','null','-']);
  fs.writeFileSync(`${file}.verification.json`, JSON.stringify({passed:true,checkedAt:new Date().toISOString(),expected,metadata},null,2));
  console.log(`Verified ${path.relative(root,file)}: ${v.width}×${v.height}, ${expected.frames} frames, full decode passed${a ? ', audio present' : ', silent output'}.`);
}
const escapeHtml = (s) => String(s).replace(/[&<>"']/g,(c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function main() {
  if (!['doctor','check','render','stills','verify'].includes(command)) throw new Error(`Unknown command: ${command}`);
  const final = command === 'render' && !args.range && !args.draft;
  const data = readProject(root, {forFinal:final});
  const {project, shots} = data;
  data.warnings.forEach((w) => console.warn(`Note: ${w}`));
  if (command === 'doctor') {
    console.log(`Node ${process.version}; ${process.platform}/${process.arch}; ${os.availableParallelism?.() ?? os.cpus().length} logical CPUs`);
    console.log(`Browser: ${browserExecutable ?? 'Remotion-managed Chrome (first run may download it)'}`);
    console.log(`FFmpeg: ${hasCommand('ffmpeg') ? 'found' : 'MISSING'}; FFprobe: ${hasCommand('ffprobe') ? 'found' : 'MISSING'}`);
    requireMediaTools();
    console.log('Project schema and required local media are valid.');return;
  }
  if (command === 'check') {console.log(`Valid timeline: ${shots.length} shots, ${data.captions.length} caption groups, ${data.duration.toFixed(3)}s.`);return;}
  const range = parseRange(args.range, project.durationInFrames);
  const scale = Number(args.scale ?? (command === 'stills' ? .5 : 1));
  if (!Number.isFinite(scale) || scale <= 0 || scale > 2 || !Number.isInteger(project.width * scale) || !Number.isInteger(project.height * scale) || (project.width * scale) % 2 || (project.height * scale) % 2) throw new Error('Scale must produce positive, even pixel dimensions (for example 0.5 or 1).');
  const expected = {width:project.width*scale,height:project.height*scale,fps:project.fps,frames:range ? range[1]-range[0] : project.durationInFrames,audio:Boolean(project.audio)};
  if (command === 'verify') {
    const file = path.resolve(root, args.file || 'out/film.mp4');
    const report = `${file}.render.json`;
    verify(file, fs.existsSync(report) ? JSON.parse(fs.readFileSync(report,'utf8')).expected : expected);return;
  }
  if (command === 'render') requireMediaTools();
  const {bundle} = await import('@remotion/bundler');
  const {openBrowser,selectComposition,renderMedia,renderStill} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public')});
  const browser = await openBrowser('chrome',{browserExecutable});
  try {
    const composition = await selectComposition({serveUrl,id:'Explainer',puppeteerInstance:browser});
    if (command === 'stills') {
      const dir = path.join(root,'out/review');fs.mkdirSync(dir,{recursive:true});
      const cards = [];
      for (const shot of shots) {
        for (const [label,fraction] of [['early',.2],['middle',.5],['late',.8]]) {
          const frame = Math.min(shot.endFrameExclusive-1,shot.startFrame+Math.floor((shot.endFrameExclusive-shot.startFrame)*fraction));
          const name = `${shot.id}-${label}.png`;
          await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,scale,output:path.join(dir,name),overwrite:true});
          cards.push(`<figure><img src="${name}" alt="${escapeHtml(shot.id)}"><figcaption>${escapeHtml(shot.id)} · frame ${frame}<br>${escapeHtml(shot.action || '')}</figcaption></figure>`);
        }
      }
      fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><meta charset="utf-8"><title>Motion review</title><style>body{margin:24px;background:#0b1822;color:#e9eff1;font:14px system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0}img{display:block;width:100%;max-height:65vh;object-fit:contain}figcaption{padding:10px}</style><h1>Early / middle / late</h1><p>Inspect movement, legibility and physical state changes. Still frames do not establish motion quality; also render a timed excerpt.</p><main>${cards.join('')}</main>`);
      console.log(`Rendered ${cards.length} review frames: out/review/index.html`);return;
    }
    const output = path.resolve(root,args.output || (args.draft ? 'out/draft.mp4' : range ? 'out/preview.mp4' : 'out/film.mp4'));
    if (fs.existsSync(output) && !args.overwrite) throw new Error('Output exists. Choose --output or pass --overwrite intentionally.');
    fs.mkdirSync(path.dirname(output),{recursive:true});
    const concurrency = Number(args.concurrency ?? Math.min(4,os.availableParallelism?.() ?? os.cpus().length));
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) throw new Error('Concurrency must be an integer from1 to64.');
    let logged = -1;
    await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',crf:18,audioBitrate:'256k',sampleRate:48000,scale,concurrency,outputLocation:output,overwrite:Boolean(args.overwrite),...(range ? {frameRange:[range[0],range[1]-1]} : {}),onProgress:({progress})=>{const step=Math.floor(progress*10);if(step!==logged){logged=step;console.log(`Render ${step*10}%`);}}});
    fs.writeFileSync(`${output}.render.json`,JSON.stringify({projectTitle:project.title,draft:Boolean(args.draft),range,expected},null,2));
    verify(output,expected);
  } finally {await browser.close({silent:true});}
}
main().catch((error)=>{console.error(error.message);process.exitCode=1;});
