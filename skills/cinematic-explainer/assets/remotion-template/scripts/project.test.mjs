import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateData, parseRange, publicFile} from './project.mjs';
const project = {width:1080,height:1920,fps:30,durationInFrames:300,audio:null,mode:'demo',authored:true};
const shots = [{id:'one',startFrame:0,endFrameExclusive:150},{id:'two',startFrame:150,endFrameExclusive:300}];
test('contiguous exclusive shot boundaries cover exactly the intended duration',()=>{
  assert.equal(validateData(project,shots,[]).duration,10);
  assert.throws(()=>validateData(project,[shots[0],{...shots[1],startFrame:151}],[]),/continue/);
  assert.throws(()=>validateData(project,[shots[0],{...shots[1],endFrameExclusive:299}],[]),/complete/);
});
test('an unfinished audio scaffold cannot be passed off as a final film',()=>{
  const production={...project,mode:'production',authored:false,audio:'audio/narration.wav'};
  assert.ok(validateData(production,shots,[]).warnings.length>0);
  assert.throws(()=>validateData(production,shots,[],{forFinal:true}),/Author topic-specific/);
});
test('word intervals must remain inside the actual caption interval',()=>{
  assert.throws(()=>validateData(project,shots,[{start:1,end:2,words:[{text:'word',start:.9,end:1.5}]}]),/word interval/);
  assert.throws(()=>validateData(project,shots,[{start:1,end:2,words:[{text:'word',start:1,end:3}]}]),/word interval/);
  assert.throws(()=>validateData(project,shots,[{start:1,end:2,text:'first'},{start:1.9,end:3,text:'second'}]),/overlapping/);
  assert.doesNotThrow(()=>validateData(project,shots,[{start:1,end:2,text:'Phrase timing only',timingMode:'phrase'}]));
});
test('preview end frame is exclusive and within the composition',()=>{
  assert.deepEqual(parseRange('0:120',300),[0,120]);
  for(const value of ['0:301','120:120','-1:30','1.5:30'])assert.throws(()=>parseRange(value,300));
});
test('render media cannot escape public through paths or symlinks',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'explainer-path-'));
  try {
    fs.mkdirSync(path.join(dir,'public'));fs.writeFileSync(path.join(dir,'private.wav'),'test');
    assert.throws(()=>publicFile(dir,'../private.wav'),/escapes/);
    assert.throws(()=>publicFile(dir,'https://example.com/audio.wav'),/relative/);
    if(process.platform!=='win32'){
      fs.symlinkSync(path.join(dir,'private.wav'),path.join(dir,'public','link.wav'));
      assert.throws(()=>publicFile(dir,'link.wav'),/symlink escapes/);
    }
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
