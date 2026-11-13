import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export function publicFile(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative) || /^[a-z]+:/i.test(relative)) throw new Error('Audio must be a relative file path inside public/.');
  const base = path.resolve(root, 'public');
  const result = path.resolve(base, relative);
  const rel = path.relative(base, result);
  if (rel === '..' || rel.startsWith(`..${path.sep}`)) throw new Error('Audio path escapes public/.');
  if (!fs.existsSync(result) || !fs.statSync(result).isFile()) throw new Error(`Missing audio: public/${relative}`);
  const real = path.relative(fs.realpathSync(base), fs.realpathSync(result));
  if (real === '..' || real.startsWith(`..${path.sep}`)) throw new Error('Audio symlink escapes public/.');
  return result;
}
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const positiveInt = (x) => Number.isInteger(x) && x > 0;

export function validateData(project, shots, captions, {forFinal = false} = {}) {
  const errors = [];
  const warnings = [];
  if (!project || typeof project !== 'object') throw new Error('project.json must be an object.');
  for (const k of ['width', 'height', 'fps', 'durationInFrames']) if (!positiveInt(project[k])) errors.push(`${k} must be a positive integer.`);
  if (project.width % 2 || project.height % 2) errors.push('H.264 width and height must be even.');
  if (!['demo', 'production'].includes(project.mode)) errors.push('mode must be demo or production.');
  if (typeof project.authored !== 'boolean') errors.push('authored must be true or false.');
  if (!(project.audio === null || typeof project.audio === 'string')) errors.push('audio must be null or a public-relative file path.');
  const duration = project.durationInFrames / project.fps;
  if (!Array.isArray(shots) || !shots.length) errors.push('shots.json must contain a non-empty shots array.');
  else {
    let next = 0;
    const ids = new Set();
    for (const [i, s] of shots.entries()) {
      if (!s || typeof s !== 'object') { errors.push(`Shot ${i} must be an object.`); continue; }
      if (typeof s.id !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(s.id) || ids.has(s.id)) errors.push(`Shot ${i} needs a unique safe id.`);
      ids.add(s.id);
      if (!Number.isInteger(s.startFrame) || s.startFrame !== next || !Number.isInteger(s.endFrameExclusive) || s.endFrameExclusive <= s.startFrame) errors.push(`Shot ${s.id ?? i} must continue at frame ${next} and have positive length.`);
      next = s.endFrameExclusive;
      if (forFinal && project.mode === 'production' && (s.id === 'unplanned' || s.kind === 'unplanned' || (typeof s.action !== 'string' || !s.action.trim()))) errors.push(`Author the physical action for shot ${s.id}.`);
    }
    if (next !== project.durationInFrames) errors.push('Shots must cover the complete composition exactly.');
  }
  if (!Array.isArray(captions)) errors.push('captions.json must contain a captions array.');
  else {
    let previousEnd = 0;
    for (const [i, c] of captions.entries()) {
      if (!c || !finite(c.start) || !finite(c.end) || c.start < previousEnd - 1e-6 || c.end <= c.start || c.end > duration + 1e-6) {errors.push(`Caption ${i} has invalid, overlapping, or out-of-range times.`);continue;}
      previousEnd = c.end;
      if (c.words !== undefined) {
        if (!Array.isArray(c.words) || !c.words.length) {errors.push(`Caption ${i} has empty or invalid words.`);continue;}
        let wordEnd = c.start;
        for (const w of c.words) {
          if (!w || typeof w.text !== 'string' || !w.text.trim() || !finite(w.start) || !finite(w.end) || w.start < wordEnd - 1e-6 || w.end <= w.start || w.end > c.end + 1e-6) errors.push(`Caption ${i} has an invalid word interval.`);
          wordEnd = w?.end;
        }
      } else if (typeof c.text !== 'string' || !c.text.trim()) errors.push(`Caption ${i} needs text or timed words.`);
    }
    if (project.audio && project.captionsRequired !== false && captions.length === 0) {
      (forFinal ? errors : warnings).push('Narrated projects need timed captions, or captionsRequired:false when deliberately omitted.');
    }
  }
  if (project.mode === 'production' && !project.authored) (forFinal ? errors : warnings).push('Author topic-specific scenes and set authored:true before final export. Draft ranges remain available.');
  if (errors.length) throw new Error(errors.join('\n'));
  return {duration, warnings};
}

export function readProject(root, options = {}) {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
  const project = read('project.json');
  const shots = read('shots.json').shots;
  const captions = read('captions.json').captions;
  const result = validateData(project, shots, captions, options);
  if (project.audio) {
    const audioPath = publicFile(root, project.audio);
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', audioPath], {encoding:'utf8'}));
    const audioDuration = Number(probe.format?.duration);
    if (!probe.streams?.some((s) => s.codec_type === 'audio') || !Number.isFinite(audioDuration) || audioDuration <= 0) throw new Error('Narration file has no valid audio stream/duration.');
    if (audioDuration > result.duration + .001) throw new Error('Composition is shorter than the supplied narration.');
  }
  return {project, shots, captions, ...result};
}

export function parseRange(value, total) {
  if (value === undefined) return null;
  const parts = String(value).split(':');
  if (parts.length !== 2 || !parts.every((x) => /^\d+$/.test(x))) throw new Error('Use --range START:END with an exclusive end frame.');
  const [start, end] = parts.map(Number);
  if (start < 0 || end <= start || end > total) throw new Error('Frame range is outside the composition.');
  return [start, end];
}
