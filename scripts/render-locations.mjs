import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { color, cut, keyboard, readPixels } from "./render-loops.mjs";

const base = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(base, "dist/assets");
const artwork = join(base, "artwork");
const W = 768, H = 512;
const offsetX = -85, offsetY = 13;

// Keep the original articulated paws and cut the stationary cat out of its Hong Kong plate.
const body = [
  [183,78],[193,77],[205,81],[225,88],[241,95],[264,106],[275,110],[298,106],[326,103],
  [355,104],[366,105],[383,89],[402,79],[415,75],[423,73],[433,91],[445,113],[452,132],
  [475,135],[480,139],[480,157],[493,167],[501,181],[513,195],[514,215],[520,231],
  [521,254],[515,279],[507,291],[498,297],[491,301],[491,305],[505,311],[525,319],
  [539,330],[557,346],[574,362],[586,378],[596,397],[598,410],[594,418],[581,423],
  [522,426],[442,430],[330,433],[308,441],[235,445],[218,438],[180,437],[177,426],
  [172,415],[169,399],[166,381],[170,358],[181,338],[194,324],[179,326],[167,320],
  [158,308],[153,294],[148,267],[150,245],[154,225],[161,204],[170,189],[177,182],
  [177,163],[173,145],[174,119],[178,91]
];
const monitor = [
  [768,161],[657,167],[646,172],[640,187],[603,392],[598,412],[610,423],[628,428],
  [696,424],[694,448],[660,458],[646,471],[644,483],[690,490],[729,482],[745,464],
  [768,457]
];
const chair = [
  [181,176],[142,177],[109,181],[87,188],[66,204],[53,222],[46,241],[46,259],[54,291],
  [62,318],[70,352],[80,373],[99,391],[122,407],[151,422],[178,433],[187,399],[194,336],
  [201,305],[196,217]
];

function paintPolygon(target, vertices, tone) {
  const { mask, bounds: [x0,y0,x1,y1] } = cut(vertices);
  for (let y = Math.max(0,y0); y < Math.min(H,y1); y++) {
    for (let x = Math.max(0,x0); x < Math.min(W,x1); x++) {
      if (mask[y*W+x]) target[y*W+x] = tone;
    }
  }
}
function keep(source, polygons) {
  const result = new Uint32Array(W*H);
  for (const polygon of polygons) {
    const { mask } = cut(polygon);
    for (let i = 0; i < mask.length; i++) if (mask[i]) result[i] = source[i];
  }
  return result;
}
function stamp(target, layer, dx, dy, zoom=1) {
  const x0 = Math.max(0,dx), x1 = Math.min(W, Math.ceil(dx+W*zoom));
  const y0 = Math.max(0,dy), y1 = Math.min(H, Math.ceil(dy+H*zoom));
  for (let y = y0; y < y1; y++) {
    const row = Math.floor((y-dy)/zoom)*W;
    for (let x = x0; x < x1; x++) {
      const value = layer[row+Math.floor((x-dx)/zoom)];
      if (value >>> 24) target[y*W+x] = value;
    }
  }
}
function officeDesk(backdrop, region) {
  const shadow=color(37,20,59), edge=color(73,39,101), lavender=color(154,104,192);
  const topColor={mo:color(101,48,87),tw:color(63,64,111),us:color(65,43,98)}[region];
  paintPolygon(backdrop, [[0,446],[768,397],[768,512],[0,512]],shadow);
  paintPolygon(backdrop, [[0,453],[768,403],[768,512],[0,512]],topColor);
  paintPolygon(backdrop, [[0,455],[768,405],[768,407],[0,458]],edge);
  const deskGrain={mo:color(111,53,91),tw:color(69,70,119),us:color(71,47,105)}[region];
  for (let y=411; y<H; y+=5) {
    for(let x=(y*37)%83; x<W; x+=71) {
      if(y<=458-x*.065) continue;
      const length=2+(x*y)%15;
      backdrop.fill(deskGrain,y*W+x,y*W+Math.min(W,x+length));
    }
  }
  // A full keyboard extends past both moving paws. Its rows share a shallow perspective.
  paintPolygon(backdrop, [[124,468],[574,430],[623,448],[622,465],[168,511],[124,491]],shadow);
  paintPolygon(backdrop, [[130,469],[572,434],[617,449],[170,493]],lavender);
  paintPolygon(backdrop, [[171,493],[617,449],[617,462],[171,504]],color(104,65,148));
  for(let row=0; row<3; row++) {
    for(let col=0; col<17; col++) {
      const x=144+col*25+row*9, y=468-col*2.01+row*6;
      const p=(a,b)=>[Math.round(x+a),Math.round(y+b)];
      paintPolygon(backdrop,[p(0,0),p(20,-2),p(27,1),p(27,5),p(6,7),p(0,4)],shadow);
      paintPolygon(backdrop,[p(0,0),p(20,-2),p(26,1),p(5,4)],color(237,195,252));
    }
  }
}

const source = readPixels(join(assets,"cat-keyboard.jpg"));
const plate = readPixels(join(artwork,"typing-plate.png"));
const animate = keyboard(source,keep(plate,[chair,body]));
const screen = keep(plate,[monitor]);
// A flying banknote crosses the foot of the original monitor.
for(let i=0; i<screen.length; i++) {
  const r=screen[i]&255, g=(screen[i]>>>8)&255, b=(screen[i]>>>16)&255;
  if(g>r*.87 && g>b*1.35) screen[i]=color(49,25,70);
}
const rawInput=["-f","rawvideo","-pix_fmt","rgba","-s","768x512","-r","16","-i","pipe:0"];
const palette="[0:v]scale=600:400:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle";

for (const region of ["mo","tw","us"]) {
  const backdrop = readPixels(join(artwork,"city-"+region+".jpg"));
  officeDesk(backdrop,region);
  const gif = join(assets,"cat-keyboard-"+region+".gif");
  const encoder = spawn("ffmpeg",["-y","-loglevel","error",...rawInput,"-filter_complex",palette,"-loop","0",gif],{stdio:["pipe","ignore","inherit"]});
  const done = once(encoder,"exit");
  for(let frame=0; frame<64; frame++) {
    const out = backdrop.slice();
    stamp(out,animate(frame/64),offsetX,offsetY);
    stamp(out,screen,246,157,0.68);
    const pixels = Buffer.from(out.buffer);
    if (frame===0) {
      const still=spawnSync("ffmpeg",["-y","-loglevel","error",...rawInput,"-frames:v","1","-q:v","3","-update","1",join(assets,"cat-keyboard-"+region+".jpg")],{input:pixels});
      if(still.status!==0) throw Error(still.stderr.toString());
    }
    if(!encoder.stdin.write(pixels)) await once(encoder.stdin,"drain");
  }
  encoder.stdin.end();
  if ((await done)[0]!==0) throw Error("Failed to encode "+gif);
  const sheet=spawnSync("ffmpeg",["-y","-loglevel","error","-ignore_loop","1","-i",gif,
    "-vf","fps=8,scale=216:144:flags=lanczos,tile=8x4","-frames:v","1","-q:v","4","-update","1",
    join(assets,"typing-frames-"+region+".jpg")],{stdio:"inherit"});
  if(sheet.status!==0) throw Error("Failed to encode regional PiP sheet for "+region);
}
