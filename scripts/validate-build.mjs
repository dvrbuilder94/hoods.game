import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const html=fs.readFileSync(path.join(ROOT,'phaser.html'),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const localRefs=[];
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const ref=match[1];
  if(/^https?:\/\//.test(ref)||ref.startsWith('data:')||ref.startsWith('#'))continue;
  localRefs.push(ref.split('?')[0]);
}
for(const ref of localRefs)assert(fs.existsSync(path.join(ROOT,ref)),`phaser.html references missing file: ${ref}`);
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
const pos=name=>scripts.indexOf(name);
assert(pos('phaser-character.js')>=0,'phaser-character.js must be loaded');
assert(pos('phaser-game.js')>pos('phaser-character.js'),'phaser-game.js must load after character definitions');
assert(pos('phaser-map-runtime.js')>pos('phaser-game.js'),'map runtime must load after the Town scene exists');
assert(pos('phaser-character-runtime.js')>pos('phaser-game.js'),'character runtime must load after the Town scene exists');
assert(pos('phaser-equipment-runtime.js')>pos('phaser-character-runtime.js'),'equipment UI must wrap inventory after outfit UI');
assert(new Set(localRefs).size===localRefs.length,'phaser.html contains duplicate local asset references');

if(failures.length){console.error('\nBuild contract validation failed:');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`Build validation OK: ${localRefs.length} local references exist and runtime order is consistent.`);
