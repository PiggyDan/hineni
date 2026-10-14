/** Import source-published metadata only; never execute source-site scripts. */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const directory='https://publicdomainaudiobibles.com/content/mp3/Hymns/';
const source='https://publicdomainaudiobibles.com/Hymns.html';
const rightsSource='https://audiotreasure.com/mp3/Music/index.htm';
const response=await fetch(directory);
if(!response.ok) throw new Error(`Directory HTTP ${response.status}`);
const html=await response.text();
const filenames=[...new Set([...html.matchAll(/href="([^"]+\.mp3)"/gi)].map(match=>decodeURIComponent(match[1])))];
if(filenames.length<100) throw new Error('Source has fewer than 100 recordings');
const results=[]; const failures=[]; let cursor=0;
async function worker() {
 while(cursor<filenames.length) {
  const filename=filenames[cursor++];
  if(filename.includes('/')||filename.includes('\\')) {failures.push(filename);continue;}
  const url=directory+encodeURIComponent(filename);
  try {
   const res=await fetch(url,{headers:{Range:'bytes=0-31'},signal:AbortSignal.timeout(20000)});
   if(!res.ok||!res.body) throw new Error(`HTTP ${res.status}`);
   const reader=res.body.getReader(); const {value}=await reader.read(); await reader.cancel();
   if(!value||!(new TextDecoder().decode(value.subarray(0,3))==='ID3'||(value[0]===255&&(value[1]&224)===224))) throw new Error('Not an MP3');
   results.push({id:`at-${crypto.createHash('sha256').update(filename).digest('hex').slice(0,12)}`,title:filename.replace(/\.mp3$/i,'').replace(/^\d+[_ -]+/,'').replace(/_/g,' ').trim(),artist:'AudioTreasure',artistUrl:'https://audiotreasure.com/',src:url,source,license:'Public domain (source dedication)',licenseUrl:rightsSource,filename,verifiedAt:'2026-10-13',contentType:res.headers.get('content-type'),byteLength:Number((res.headers.get('content-range')??'').split('/')[1])||null});
  } catch(error) { failures.push({filename,error:error.message}); }
 }
}
await Promise.all([worker(),worker(),worker()]);
results.sort((a,b)=>a.title.localeCompare(b.title,'en'));
if(results.length<100) throw new Error(`Only ${results.length} verified recordings`);
await fs.writeFile('apps/web/src/lib/hymn-catalog.json',JSON.stringify(results,null,2)+'\n');
await fs.mkdir('.local',{recursive:true});
await fs.writeFile('.local/hymn-import-failures.json',JSON.stringify(failures,null,2)+'\n');
console.log(JSON.stringify({verified:results.length,failed:failures.length}));
