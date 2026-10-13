import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {render} from '../src/worker.mjs';
test('script-context URLs cannot escape the redirect script',()=>{
  const text=render('redirect',{redirect:'https://example.test/</script><script>alert(1)</script>',hits:3,ga:null});
  assert.ok(!text.includes('window.location="https://example.test/</script>'));
  assert.ok(text.includes('\\u003c/script\\u003e'));
});
test('real D1 preserves edit capability, atomic collisions and maintenance boundary',async()=>{
  execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--outdir','build/worker'],{stdio:'pipe'});
  const options=(readOnly)=>{
    const result=convertV4MiniflareOptions({name:'kikto-test',modules:true,scriptPath:'build/worker/worker.js',compatibilityDate:'2026-10-12',d1Databases:['DB'],bindings:{READ_ONLY:readOnly},assets:{directory:'build/assets',binding:'ASSETS',run_worker_first:true}});
    result.workers[0].config.assets.hasUserWorker=true;
    return result;
  };
  const mf=new Miniflare(options('false'));
  try {
    const db=await mf.getD1Database('DB');await db.exec(readFileSync('migrations/0001_urls.sql','utf8').replace(/\n/g,' '));
    await db.prepare('INSERT INTO url(id,i,k,u,h,ctime) VALUES(1660,?,?,?,?,?)').bind('old','original-edit-key','https://example.test/a?q=1',7,'2020-01-02T03:04:05').run();
    const old=await mf.dispatchFetch('https://kik.to/old');assert.equal(old.status,200,await old.clone().text());assert.match(await old.text(),/example.test/);
    const edit=await mf.dispatchFetch('https://kik.to/?k=original-edit-key');assert.match(await edit.text(),/original-edit-key/);assert.equal(edit.headers.get('cache-control'),'no-store');
    const requests=Array.from({length:16},()=>mf.dispatchFetch('https://kik.to/new',{method:'POST',body:new URLSearchParams({u:'https://example.test/new'})}));
    for(const res of await Promise.all(requests)){assert.equal(res.status,200);assert.match(await res.text(),/To edit later/);}
    assert.equal((await db.prepare('SELECT COUNT(*) count FROM url').first()).count,17);
    const updated=await mf.dispatchFetch('https://kik.to/update',{method:'POST',body:new URLSearchParams({key:'original-edit-key',id:'old',url:'https://example.test/changed',eth:'',ga:''})});assert.equal(await updated.text(),'update success');
    const stored=await db.prepare('SELECT * FROM url WHERE id=1660').first();assert.equal(stored.k,'original-edit-key');assert.equal(stored.ctime,'2020-01-02T03:04:05');assert.equal(stored.h,7);
    const missing=await mf.dispatchFetch('https://kik.to/missing');assert.equal(missing.status,404);
    await mf.setOptions(options('true'));
    assert.equal((await mf.dispatchFetch('https://kik.to/new',{method:'POST',body:new URLSearchParams({u:'https://example.test/no'})})).status,503);
  } finally {await mf.dispose();}
});
