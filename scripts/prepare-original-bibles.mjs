import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Parser } from 'htmlparser2';

const folder='.local/bible'; await fs.mkdir(folder,{recursive:true});
const hebrewNames={GEN:'בראשית',EXO:'שמות',LEV:'ויקרא',NUM:'במדבר',DEU:'דברים',JOS:'יהושע',JDG:'שופטים','1SA':'שמואל א׳','2SA':'שמואל ב׳','1KI':'מלכים א׳','2KI':'מלכים ב׳',ISA:'ישעיהו',JER:'ירמיהו',EZK:'יחזקאל',HOS:'הושע',JOL:'יואל',AMO:'עמוס',OBA:'עובדיה',JON:'יונה',MIC:'מיכה',NAM:'נחום',HAB:'חבקוק',ZEP:'צפניה',HAG:'חגי',ZEC:'זכריה',MAL:'מלאכי',PSA:'תהילים',PRO:'משלי',JOB:'איוב',SNG:'שיר השירים',RUT:'רות',ECC:'קהלת',LAM:'איכה',EST:'אסתר',DAN:'דניאל',EZR:'עזרא',NEH:'נחמיה','1CH':'דברי הימים א׳','2CH':'דברי הימים ב׳'};
const osis={GEN:'Gen',EXO:'Exod',LEV:'Lev',NUM:'Num',DEU:'Deut',JOS:'Josh',JDG:'Judg','1SA':'1Sam','2SA':'2Sam','1KI':'1Kgs','2KI':'2Kgs',ISA:'Isa',JER:'Jer',EZK:'Ezek',HOS:'Hos',JOL:'Joel',AMO:'Amos',OBA:'Obad',JON:'Jonah',MIC:'Mic',NAM:'Nah',HAB:'Hab',ZEP:'Zeph',HAG:'Hag',ZEC:'Zech',MAL:'Mal',PSA:'Ps',PRO:'Prov',JOB:'Job',SNG:'Song',RUT:'Ruth',ECC:'Eccl',LAM:'Lam',EST:'Esth',DAN:'Dan',EZR:'Ezra',NEH:'Neh','1CH':'1Chr','2CH':'2Chr'};
const greekNames={MAT:'Κατὰ Ματθαῖον',MRK:'Κατὰ Μᾶρκον',LUK:'Κατὰ Λουκᾶν',JHN:'Κατὰ Ἰωάννην',ACT:'Πράξεις',ROM:'Πρὸς Ῥωμαίους','1CO':'Πρὸς Κορινθίους Αʹ','2CO':'Πρὸς Κορινθίους Βʹ',GAL:'Πρὸς Γαλάτας',EPH:'Πρὸς Ἐφεσίους',PHP:'Πρὸς Φιλιππησίους',COL:'Πρὸς Κολοσσαεῖς','1TH':'Πρὸς Θεσσαλονικεῖς Αʹ','2TH':'Πρὸς Θεσσαλονικεῖς Βʹ','1TI':'Πρὸς Τιμόθεον Αʹ','2TI':'Πρὸς Τιμόθεον Βʹ',TIT:'Πρὸς Τίτον',PHM:'Πρὸς Φιλήμονα',HEB:'Πρὸς Ἑβραίους',JAS:'Ἰακώβου','1PE':'Πέτρου Αʹ','2PE':'Πέτρου Βʹ','1JN':'Ἰωάννου Αʹ','2JN':'Ἰωάννου Βʹ','3JN':'Ἰωάννου Γʹ',JUD:'Ἰούδα',REV:'Ἀποκάλυψις'};
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'HINENI-source-import'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`Source HTTP ${r.status}`);return r.text();}
function makeDataset(id,name,abbr,language,publisher,source,license,books,names,canon,versification){return {version:1,translation:{id,name,abbreviation:abbr,language,publisher,sourceUrl:source,metadata:{direction:language==='hbo'?'rtl':'ltr',versification,canon,books:books.map(b=>({id:b.bookId,name:names[b.bookId],chapters:b.chapters.length}))},license:{copyrightStatus:license.startsWith('CC')?'licensed':'public-domain',license,evidenceUrl:language==='hbo'?'https://github.com/openscriptures/morphhb/blob/master/LICENSE.md':'https://ebible.org/find/show.php?id=grc-tisch',attribution:language==='hbo'?'Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb — CC BY 4.0. Base text: Westminster Leningrad Codex (Public Domain). Ketiv text; morphology separators and notes excluded.':'Tischendorf Greek New Testament, 8th edition — Public Domain. Source: eBible.org grc-tisch.',displayAllowed:true,downloadAllowed:true,audioAvailable:false}},books};}

if(process.argv.includes('--hebrew')){
 const revision=JSON.parse(await get('https://api.github.com/repos/openscriptures/morphhb/commits/master')).sha;
 if(!/^[a-f0-9]{40}$/.test(revision))throw new Error('Invalid source revision');
 await fs.mkdir('.local/scripture-sources/hebrew',{recursive:true});
 await fs.writeFile('.local/scripture-sources/hebrew/LICENSE.md',await get(`https://raw.githubusercontent.com/openscriptures/morphhb/${revision}/LICENSE.md`));
 const entries=Object.entries(osis);const books=new Array(entries.length);let cursor=0;
 async function worker(){while(cursor<entries.length){const index=cursor++;const [id,file]=entries[index];const xml=await get(`https://raw.githubusercontent.com/openscriptures/morphhb/${revision}/wlc/${file}.xml`);await fs.writeFile(`.local/scripture-sources/hebrew/${file}.xml`,xml);
 const chapters=[];let chapter=null,verse=null,notes=0,capture=null,word='',type='';
 const parser=new Parser({onopentag(tag,a){if(tag==='chapter'){chapter={chapter:Number(a.osisID.split('.').at(-1)),verses:[]};chapters.push(chapter);}if(tag==='verse'){verse={verse:Number(a.osisID.split('.').at(-1)),text:''};chapter.verses.push(verse);}if(tag==='note')notes++;if(verse&&!notes&&(tag==='w'||tag==='seg')){capture=tag;word='';type=a.type??'';}},ontext(text){if(capture&&!notes)word+=text;},onclosetag(tag){if(tag==='note')notes--;if(tag===capture&&verse){const value=capture==='w'?word.replaceAll('/',''):word; if(capture==='w')verse.text+=(verse.text&&!verse.text.endsWith('־')?' ':'')+value;else if(type.includes('maqqef'))verse.text=verse.text.trimEnd()+value;else verse.text+=value;capture=null;}if(tag==='verse')verse=null;if(tag==='chapter')chapter=null;}},{xmlMode:true,decodeEntities:true});parser.write(xml);parser.end();
 if(!chapters.length||chapters.some(c=>c.verses.some(v=>!v.text)))throw new Error(`Empty source book ${id}`);
 books[index]={bookId:id,chapters};console.log('Parsed Hebrew',id,chapters.length,'chapters');}}
 await Promise.all([worker(),worker(),worker(),worker()]);
 const dataset=makeDataset('oshb-wlc','מקרא — Open Scriptures Hebrew Bible','OSHB','hbo','Open Scriptures Hebrew Bible',`https://github.com/openscriptures/morphhb/tree/${revision}`,'CC BY 4.0',books,hebrewNames,'tanakh','wlc');
 await fs.writeFile(`${folder}/oshb-wlc.json`,JSON.stringify(dataset));console.log('Hebrew dataset',books.length,'books',revision);
}
if(process.argv.includes('--greek')){
 const raw=await fs.readFile('.local/scripture-sources/greek/grc-tisch_vpl.txt','utf8');
 const map=new Map();
 for(const line of raw.split(/\r?\n/)){
  const match=line.match(/^([A-Z0-9]{3})\s+(\d+):(\d+)\s+(.+)$/);if(!match)continue;
  const [,sourceId,c,v,text]=match;const id=({MAR:'MRK',JOH:'JHN',PHI:'PHP','1JO':'1JN','2JO':'2JN','3JO':'3JN',JAM:'JAS'}[sourceId]??sourceId);if(!greekNames[id])throw new Error(`Unsupported source book ${id}`);
  if(!map.has(id))map.set(id,new Map());const chapters=map.get(id);if(!chapters.has(Number(c)))chapters.set(Number(c),[]);chapters.get(Number(c)).push({verse:Number(v),text:text.trim()});
 }
 const books=[...map].map(([bookId,chapters])=>({bookId,chapters:[...chapters].map(([chapter,verses])=>({chapter,verses}))}));
 if(books.length!==27)throw new Error(`Expected 27 Greek books; parsed ${books.length}. Check source format.`);
 const dataset=makeDataset('grc-tisch','Tischendorf Greek New Testament','TISCH','grc','Tischendorf / eBible.org','https://ebible.org/Scriptures/grc-tisch_vpl.zip','Public Domain',books,greekNames,'greek-nt','tischendorf');
 await fs.writeFile(`${folder}/grc-tisch.json`,JSON.stringify(dataset));console.log('Greek dataset',books.length,'books; source SHA256',crypto.createHash('sha256').update(raw).digest('hex'));
}
