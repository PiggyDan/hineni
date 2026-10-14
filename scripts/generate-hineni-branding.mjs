import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const output='apps/web/public/branding';
await fs.mkdir(output,{recursive:true});
const hebrew='הִנֵּנִי';
const font=await fs.readFile(path.join(output,'fonts/NotoSerifHebrew.ttf'));
const fontStyle=`<style>@font-face{font-family:HineniHebrew;src:url(data:font/ttf;base64,${font.toString('base64')})} .hebrew{font-family:HineniHebrew,'Times New Roman',serif;font-weight:600}</style>`;
const defs=`<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFF0BA"/><stop offset=".52" stop-color="#E7C77D"/><stop offset="1" stop-color="#B8883E"/></linearGradient><radialGradient id="light"><stop stop-color="#FFE9A1" stop-opacity=".55"/><stop offset="1" stop-color="#E7C77D" stop-opacity="0"/></radialGradient></defs>`;
function scene(light=false) {
 return `<circle cx="160" cy="164" r="108" fill="url(#light)"/><path d="M23 222 91 168 122 184 160 165 191 183 228 163 297 222Z" fill="${light?'#D9D3C6':'#29374C'}"/><path d="M10 244 78 198 120 220 173 182 231 217 285 195 310 243Z" fill="${light?'#C2BCAD':'#1A2639'}"/><path d="M13 252 96 231 153 251 232 229 307 251 287 275 32 275Z" fill="${light?'#EDE5D5':'#101522'}"/><path d="M116 287C125 264 236 244 205 226C184 214 128 214 145 200C150 196 164 190 168 189C146 195 112 202 130 213C145 224 174 225 169 235C164 244 111 248 74 277Z" fill="url(#gold)"/><path d="M69 237V126C69 85 103 49 160 27C217 49 251 85 251 126V237" fill="none" stroke="url(#gold)" stroke-width="10"/><path d="M160 43 165 107 195 85 172 116 217 121 172 126 191 149 165 134 160 188 155 134 130 150 149 126 103 121 149 116 127 88 155 107Z" fill="url(#gold)"/><path d="M160 48V180" stroke="#FFF4D1" stroke-width="1" opacity=".8"/>`;
}
function svg(width,height,body,{light=false,background=false}={}) {
 const gradients=light?defs.replaceAll('#FFF0BA','#C69A47').replaceAll('#E7C77D','#A77D34').replaceAll('#B8883E','#76501B'):defs;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="HINENI — Here I Am"><title>HINENI — ${hebrew} — Here I Am</title>${gradients}${fontStyle}${background?`<rect width="${width}" height="${height}" fill="${light?'#FAF7F2':'#101522'}"/>`:''}${body}</svg>`;
}
function words(x,y,size,color) {
 return `<text class="hebrew" x="${x}" y="${y}" direction="rtl" unicode-bidi="embed" text-anchor="middle" font-size="${size}" fill="url(#gold)">${hebrew}</text><text x="${x}" y="${y+size*.85}" text-anchor="middle" font-family="Georgia,serif" font-size="${size*.48}" letter-spacing="${size*.13}" fill="${color}">HINENI</text>`;
}
const horizontal=(light)=>svg(450,160,`<g transform="translate(0 0) scale(.5)">${scene(light)}</g>${words(300,72,88,light?'#101522':'#FAF7F2')}`,{light});
const vertical=(light)=>svg(440,620,`<g transform="translate(60 0)">${scene(light)}</g>${words(220,410,125,light?'#101522':'#FAF7F2')}<path d="M67 555H130M310 555H373" stroke="#B8883E"/><text x="220" y="562" text-anchor="middle" font-family="Georgia,serif" font-size="17" letter-spacing="4" fill="${light?'#846329':'#E7C77D'}">HERE I AM</text><text x="220" y="598" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${light?'#101522':'#FAF7F2'}">Hear His Word. Answer His Call.</text>`,{light});
const simplified=`<path d="M16 49V28C16 18 23 10 32 6C41 10 48 18 48 28V49" stroke="#E7C77D" stroke-width="4" fill="none"/><path d="M32 16 34 28 43 31 34 34 32 46 30 34 21 31 30 28Z" fill="#FFF0BA"/>`;
const favicon=svg(64,64,`<rect width="64" height="64" rx="14" fill="#101522"/>${simplified}`);
const icon=svg(1024,1024,`<rect width="1024" height="1024" fill="#101522"/><g transform="translate(77 40) scale(2.72)">${scene()}</g><text class="hebrew" x="512" y="911" direction="rtl" unicode-bidi="embed" text-anchor="middle" font-size="200" fill="url(#gold)">${hebrew}</text>`);
const assets={
 'hineni-logo-horizontal.svg':horizontal(false),'hineni-logo-dark.svg':horizontal(false),'hineni-logo-light.svg':horizontal(true),
 'hineni-logo-vertical.svg':vertical(false),'hineni-logo-vertical-light.svg':vertical(true),
 'hineni-hebrew.svg':svg(390,140,`<text class="hebrew" x="195" y="104" direction="rtl" unicode-bidi="embed" text-anchor="middle" font-size="100" fill="url(#gold)">${hebrew}</text>`),
 'hineni-symbol.svg':svg(320,320,scene()),'hineni-symbol-light.svg':svg(320,320,scene(true)),
 'hineni-favicon.svg':favicon,'hineni-app-icon.svg':icon,
 'hineni-og.svg':svg(1200,630,`<g transform="translate(380 25)">${vertical(false).replace(/^.*?<\/style>/s,'').replace(/<\/svg>$/,'')}</g>`,{background:true}),
};
// The share image uses the same source geometry without nesting document roots.
assets['hineni-og.svg']=svg(1200,630,`<g transform="translate(90 50) scale(1.45)">${scene()}</g>${words(820,245,125,'#FAF7F2')}<text x="820" y="419" text-anchor="middle" font-family="Georgia,serif" font-size="25" letter-spacing="6" fill="#E7C77D">HERE I AM</text><text x="820" y="477" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#FAF7F2">Hear His Word. Answer His Call.</text>`,{background:true});
for(const [name,data] of Object.entries(assets)) await fs.writeFile(path.join(output,name),data);
for(const [name,size] of [['hineni-app-icon.png',1024],['hineni-icon-512.png',512],['hineni-icon-192.png',192],['apple-touch-icon.png',180]]) await sharp(Buffer.from(icon)).resize(size,size).png().toFile(path.join(output,name));
const faviconBuffers=[];
for(const size of [16,32,48]) {
 const buffer=await sharp(Buffer.from(favicon)).resize(size,size).png().toBuffer();
 faviconBuffers.push({size,buffer});
 if(size<=32) await fs.writeFile(path.join(output,`favicon-${size}.png`),buffer);
}
// ICO supports PNG payloads; write the standard container without another dependency.
const header=Buffer.alloc(6+16*faviconBuffers.length);header.writeUInt16LE(1,2);header.writeUInt16LE(faviconBuffers.length,4);
let offset=header.length;
faviconBuffers.forEach(({size,buffer},index)=>{const entry=6+index*16;header[entry]=size;header[entry+1]=size;header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(buffer.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=buffer.length;});
await fs.writeFile(path.join(output,'favicon.ico'),Buffer.concat([header,...faviconBuffers.map(item=>item.buffer)]));
await sharp(Buffer.from(assets['hineni-og.svg'])).png().toFile(path.join(output,'hineni-og.png'));
// A review sheet demonstrates transparent logos against their intended surfaces.
const sheet=svg(1200,900,`<rect width="600" height="900" fill="#101522"/><rect x="600" width="600" height="900" fill="#FAF7F2"/><g transform="translate(80 35) scale(.9)">${vertical(false).replace(/^.*?<\/style>/s,'').replace(/<\/svg>$/,'')}</g><g transform="translate(680 35) scale(.9)">${vertical(true).replace(/^.*?<\/style>/s,'').replace(/<\/svg>$/,'')}</g><g transform="translate(24 600) scale(.8)">${scene()}</g><g transform="translate(640 600) scale(.8)">${scene(true)}</g>`);
await fs.mkdir('.local',{recursive:true});await sharp(Buffer.from(sheet)).png().toFile('.local/hineni-brand-review.png');
console.log(`Generated ${Object.keys(assets).length} SVGs, 7 PNGs, and favicon.ico in ${output}`);
