import templates from '../build/templates.mjs';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const escape=value=>String(value??'None').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const js=value=>JSON.stringify(String(value??'None')).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export function render(name,values={}) {
  let text=templates[name];
  text=text.replace(/{% if ga != None %}([\s\S]*?){% endif %}/g,(_,body)=>values.ga!=null?body:'');
  text=text.replace(/"{{redirect}}"/g,()=>js(values.redirect));
  text=text.replace(/'{{ga}}'/g,()=>js(values.ga));
  return text.replace(/{{(\w+)}}/g,(_,key)=>escape(values[key]));
}
function response(body,status=200,type='text/html; charset=utf-8') {
  return new Response(body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function random(length) {
  let result='';
  while(result.length<length)for(const byte of crypto.getRandomValues(new Uint8Array(length*2)))if(byte<248&&result.length<length)result+=alphabet[byte%62];
  return result;
}
function one(rows){return rows.results.length===1?rows.results[0]:null;}
function page(name,values,readonly) {
  let html=render(name,values);
  if(readonly)html=html.replace(/<body[^>]*>/i,match=>match+'<p role="status">Kik.to is temporarily read-only while its hosting is migrated. Existing links remain available.</p>');
  return response(html);
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url), path=url.pathname, readonly=env.READ_ONLY==='true';
    if(readonly&&!['GET','HEAD','OPTIONS'].includes(request.method))return response('Temporarily read-only',503,'text/plain; charset=utf-8');
    if(path==='/deployment.json'){
      const asset=await env.ASSETS.fetch(request);const headers=new Headers(asset.headers);headers.set('Cache-Control','no-store');return new Response(asset.body,{status:asset.status,headers});
    }
    if(['/favicon.ico','/ads.txt'].includes(path)||path.startsWith('/static/'))return env.ASSETS.fetch(request);
    try {
      if(path==='/'&&['GET','HEAD'].includes(request.method)) {
        if(url.searchParams.has('k')) {
          const row=one(await env.DB.prepare('SELECT * FROM url WHERE k = ? LIMIT 2').bind(url.searchParams.get('k')).all());
          return row?page('update',{key:row.k,id:row.i,url:row.u,eth:row.e,ga:row.g},readonly):response('bad key');
        }
        return page('index2',{},readonly);
      }
      if(path==='/new'&&request.method==='POST') {
        const form=await request.formData(),target=form.get('u');
        if(typeof target!=='string')return response('Missing URL',400,'text/plain; charset=utf-8');
        if(target.length>800)return response('URL too long',400,'text/plain; charset=utf-8');
        for(let length=1;length<10;length++)for(let attempt=0;attempt<4;attempt++){
          const id=random(length),key=random(10);
          const inserted=await env.DB.prepare('INSERT INTO url (i,k,u) VALUES (?,?,?) ON CONFLICT(i) DO NOTHING RETURNING id').bind(id,key,target).all();
          if(inserted.results.length)return page('success',{newid:id,key},readonly);
        }
        return response('nope');
      }
      if(path==='/update'&&request.method==='POST') {
        const form=await request.formData(),keys=['key','id','url','eth','ga'];
        if(keys.some(k=>typeof form.get(k)!=='string')||!form.get('key'))return response('update failed');
        const row=one(await env.DB.prepare('SELECT id FROM url WHERE k = ? LIMIT 2').bind(form.get('key')).all());
        if(!row)return response('update failed');
        try {await env.DB.prepare('UPDATE url SET i=?,u=?,e=?,g=? WHERE id=? AND k=?').bind(form.get('id'),form.get('url'),form.get('eth'),form.get('ga'),row.id,form.get('key')).run();}
        catch{return response('update failed');}
        return response('update success');
      }
      if(['GET','HEAD'].includes(request.method)&&!['/new','/update'].includes(path)) {
        const row=await env.DB.prepare('SELECT * FROM url WHERE i = ?').bind(decodeURIComponent(path.slice(1))).first();
        if(row)return page('redirect',{redirect:row.u,hits:row.h,ga:row.g},readonly);
        return response('nope.  if you think this is an error, send angry tweets to @deanpierce',404);
      }
      return response('Method not allowed',405,'text/plain; charset=utf-8');
    } catch {
      console.error(JSON.stringify({event:'request_failed',method:request.method}));
      return response('Service temporarily unavailable',503,'text/plain; charset=utf-8');
    }
  }
};
