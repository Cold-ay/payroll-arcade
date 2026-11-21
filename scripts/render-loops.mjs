import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Bake short silent loops. A parked browser tab never needs a rendering engine for the cat.
const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "../dist/assets");
const W = 768, H = 512, fps = 16, frames = fps * 4;
const tau = 2 * Math.PI;
function readPixels(file) {
  const result = spawnSync("ffmpeg", ["-v","error","-i",file,"-vf","scale=768:512:flags=lanczos","-frames:v","1","-f","rawvideo","-pix_fmt","rgba","pipe:1"], { maxBuffer: W*H*4+4096 });
  if (result.status !== 0) throw Error(result.stderr.toString());
  return new Uint32Array(result.stdout.buffer, result.stdout.byteOffset, W*H);
}
function color(r,g,b) { return (0xff000000 | b<<16 | g<<8 | r) >>> 0; }
function box(out, x, y, w, h, c) {
  x=Math.round(x); y=Math.round(y);
  for(let dy=0;dy<h;dy++) if(y+dy>=0 && y+dy<H) out.fill(c,(y+dy)*W+Math.max(0,x),(y+dy)*W+Math.min(W,x+w));
}
function sparkle(out,x,y,size,c) {
  box(out,x-size,y-1,2*size+2,3,c); box(out,x-1,y-size,3,2*size+2,c);
  if(size>5) box(out,x-2,y-2,5,5,c);
}
function inPolygon(x,y,p) {
  let inside=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++) {
    const [x1,y1]=p[i], [x2,y2]=p[j];
    if((y1>y)!==(y2>y) && x<(x2-x1)*(y-y1)/(y2-y1)+x1) inside=!inside;
  }
  return inside;
}
function cut(polygon) {
  const mask=new Uint8Array(W*H);
  const xs=polygon.map(p=>p[0]), ys=polygon.map(p=>p[1]);
  const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  for(let y=bounds[1];y<=bounds[3];y++) for(let x=bounds[0];x<=bounds[2];x++) {
    if(inPolygon(x+.5,y+.5,polygon)) mask[y*W+x]=1;
  }
  return {mask,bounds};
}
function swing(out,source,part,pivot,angle,dx,dy) {
  const [cx,cy]=pivot, [x0,y0,x1,y1]=part.bounds, c=Math.cos(angle), s=Math.sin(angle);
  for(let y=Math.max(0,y0-65);y<Math.min(H,y1+32);y++) for(let x=Math.max(0,x0-40);x<Math.min(W,x1+40);x++) {
    const px=x-cx-dx, py=y-cy-dy, sx=Math.round(c*px+s*py+cx), sy=Math.round(-s*px+c*py+cy);
    const i=sy*W+sx;
    if(part.mask[i]) out[y*W+x]=source[i];
  }
}
function keyboard(source) {
  const plate=readPixels(join(here,"../artwork/typing-plate.png"));
  const left=cut([[210,420],[215,402],[222,395],[233,382],[254,370],[276,360],[293,359],[310,363],[326,367],[339,377],[356,380],[365,383],[381,386],[398,390],[409,396],[418,405],[424,417],[425,438],[422,448],[414,455],[407,455],[405,459],[394,462],[381,462],[376,460],[365,464],[341,464],[332,459],[317,457],[307,451],[291,454],[275,457],[266,462],[262,472],[251,472],[245,469],[231,467],[217,461],[209,449],[207,436]]);
  const right=cut([[512,388],[519,375],[528,365],[545,356],[558,354],[576,355],[589,359],[604,367],[607,382],[607,406],[613,411],[612,426],[602,433],[590,434],[585,431],[579,435],[561,435],[551,433],[545,439],[525,437],[515,433],[509,424],[507,407]]);
  return phase=>{
    const out=plate.slice();
    // Five alternating keystrokes, then a short rest before the same four-second loop repeats.
    const beat=Math.min(phase/.84,1)*5*tau;
    const raised=(Math.cos(beat)+1)/2;
    const leftLift=Math.pow(raised,.88), rightLift=Math.pow(1-raised,.88);
    swing(out,source,right,[531,380],-.29*rightLift,.5,-9*rightLift+1);
    swing(out,source,left,[250,414],-.29*leftLift,1,2);
    if(phase<.84 && Math.sin(beat)>.92) {
      box(out,603,433,7,3,color(255,215,135)); box(out,612,429,3,3,color(255,235,179));
    }
    if(phase<.84 && Math.sin(beat)<-.92) {
      box(out,412,452,6,3,color(255,215,135)); box(out,419,448,3,3,color(255,235,179));
    }
    return out;
  };
}

// A soft joint mask anchors each moving part to the unchanging room.
function joint(cx,cy,rx,ry) {
  const weights = new Float32Array(W*H);
  for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(H,cy+ry);y++) {
    for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(W,cx+rx);x++) {
      const r=((x-cx)/rx)**2+((y-cy)/ry)**2;
      if(r<1) { const v=Math.min(1,(1-r)*1.6); weights[y*W+x]=v*v*(3-2*v); }
    }
  }
  return weights;
}
function pose(source,parts) {
  const out=source.slice();
  for(let y=0,i=0;y<H;y++) for(let x=0;x<W;x++,i++) {
    let dx=0,dy=0;
    for(const [mask,ox,oy] of parts) { dx+=mask[i]*ox; dy+=mask[i]*oy; }
    if(Math.abs(dx)+Math.abs(dy)<.49) continue;
    const sx=Math.max(0,Math.min(W-1,Math.round(x-dx))), sy=Math.max(0,Math.min(H-1,Math.round(y-dy)));
    out[i]=source[sy*W+sx];
  }
  return out;
}
function cash(source) {
  const paw=joint(436,395,137,95), stack=joint(554,252,145,246), head=joint(320,156,174,148), tail=joint(82,400,80,125);
  return t=>{
    const hug=(1-Math.cos(t*tau*2))/2, sway=Math.sin(t*tau);
    const out=pose(source,[[paw,12*hug,-11*hug],[stack,-8*hug,-5*hug],[head,2*sway,5*hug],[tail,13*sway,-4*hug]]);
    const glint=Math.sin(t*tau*2);
    if(glint>.4) sparkle(out,628,152,Math.round(7*glint),color(255,241,154));
    if(glint<-.45) sparkle(out,491,53,Math.round(-6*glint),color(245,255,179));
    return out;
  };
}
function tea(source) {
  const cup=joint(480,383,115,94), straw=joint(454,305,63,67), face=joint(405,227,177,112), steam=joint(554,242,62,103);
  return t=>{
    const sip=(1-Math.cos(t*tau))/2;
    return pose(source,[[cup,-7*sip,-19*sip],[straw,-5*sip,-8*sip],[face,2*sip,7*sip],[steam,7*Math.sin(t*tau*2),-8*sip]]);
  };
}
function tired(source) {
  const head=joint(346,266,201,128), left=joint(196,353,92,63), tail=joint(127,238,69,74);
  return t=>{
    const breath=(1-Math.cos(t*tau))/2;
    const out=pose(source,[[head,0,-9*breath],[left,3*breath,-4*breath],[tail,-4*breath,6*breath]]);
    const row=["1111","0010","0100","1111"];
    for(let j=0;j<2;j++) {
      const age=(t+j*.5)%1;
      if(age<.1 || age>.9) continue;
      const size=age>.5?3:2, x=Math.round(480+23*age), y=Math.round(168-56*age);
      row.forEach((r,dy)=>Array.from(r).forEach((bit,dx)=>{ if(bit==="1") box(out,x+dx*size,y+dy*size,size,size,color(226,199,253)); }));
    }
    return out;
  };
}
const generators={keyboard,cash,tea,tired};
for(const name of Object.keys(generators)) {
  const source=readPixels(join(assets,"cat-"+name+".jpg"));
  const frame=generators[name](source);
  const palette="[0:v]scale=600:400:flags=lanczos,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle";
  const child=spawn("ffmpeg",["-y","-v","error","-f","rawvideo","-pix_fmt","rgba","-s","768x512","-r",String(fps),"-i","pipe:0","-filter_complex",palette,"-loop","0",join(assets,"cat-"+name+".gif")],{stdio:["pipe","ignore","inherit"]});
  const exited=once(child,"exit");
  for(let i=0;i<frames;i++) {
    const img=frame(i/frames);
    if(!child.stdin.write(Buffer.from(img.buffer,img.byteOffset,img.byteLength))) await once(child.stdin,"drain");
  }
  child.stdin.end();
  if((await exited)[0]!==0) throw Error("Failed to encode "+name);
  console.log(name+" · "+frames+" frames · "+fps+" fps");
}

const sheet = spawnSync("ffmpeg", [
  "-y", "-v", "error", "-ignore_loop", "1", "-i", join(assets, "cat-keyboard.gif"),
  "-vf", "fps=8,scale=216:144:flags=lanczos,tile=8x4",
  "-frames:v", "1", "-update", "1", "-q:v", "4", join(assets, "typing-frames.jpg"),
], { stdio: "inherit" });
if (sheet.status !== 0) throw Error("Failed to encode typing sprite sheet");
