import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('build/assets',{recursive:true});
cpSync('static','build/assets/static',{recursive:true});
for(const name of ['favicon.ico','ads.txt'])cpSync(`static/${name}`,`build/assets/${name}`);
const templates=Object.fromEntries(['index2','success','update','redirect'].map(name=>[name,readFileSync(`templates/${name}.html`,'utf8')]));
writeFileSync('build/templates.mjs',`export default ${JSON.stringify(templates)};\n`);
const revision=process.env.CF_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync('build/assets/deployment.json',JSON.stringify({project:'kikto',revision})+'\n');
