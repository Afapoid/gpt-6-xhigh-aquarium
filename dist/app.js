import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { Water } from './vendor/Water.js';
import { mergeGeometries, mergeVertices } from './vendor/BufferGeometryUtils.js';

const $ = s => document.querySelector(s);
const icons = {
 'sliders-horizontal':'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
 maximize:'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
 pause:'M8 5v14M16 5v14',play:'m8 5 11 7-11 7Z',
 fish:'M6.5 12C9 5 17 5 21 12c-4 7-12 7-14.5 0ZM6.5 12 3 7v10ZM16 10h.01M12 6l-1-3M12 18l-1 3',
 sun:'M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42',
 sunset:'M3 17h18M5 21h14M6 13a6 6 0 0 1 12 0M12 2v3M3 6l2 2M21 6l-2 2',moon:'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',x:'m6 6 12 12M6 18 18 6'
};
function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]}"/>${name==='sun'?'<circle cx="12" cy="12" r="4"/>':''}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(e=>e.outerHTML=icon(e.dataset.icon));

let seed=41024;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const range=(a,b)=>a+rand()*(b-a), clamp=THREE.MathUtils.clamp;
const sim={time:0,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,quality:innerWidth<700?'balanced':'high',light:'day',food:0};
const time={value:0};
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1412);
scene.fog=new THREE.FogExp2(0x0d211c,0.016);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,sim.quality==='high'?1.6:1.15));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
$('#viewport').appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.aquaFail(new Error('WebGL context lost'));});
const camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,0.1,120);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,3.15,0);
controls.enableDamping=true;controls.dampingFactor=.065;
controls.minDistance=7;controls.maxDistance=80;controls.maxPolarAngle=Math.PI*.51;controls.minPolarAngle=.28;
controls.enablePan=false;controls.autoRotateSpeed=.35;
const pmrem=new THREE.PMREMGenerator(renderer);
const room=new RoomEnvironment();
const env=pmrem.fromScene(room,.045);scene.environment=env.texture;scene.environmentIntensity=.45;
room.dispose();pmrem.dispose();
const hemi=new THREE.HemisphereLight(0xdafff1,0x243120,.85);scene.add(hemi);
const key=new THREE.DirectionalLight(0xf7ffe0,2.4);key.position.set(-3,12,5);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
key.shadow.normalBias=.035;key.shadow.bias=-.00015;key.shadow.camera.far=35;scene.add(key);
const fill=new THREE.DirectionalLight(0x9fdacf,.75);fill.position.set(8,6,-5);scene.add(fill);
const warm=new THREE.PointLight(0xe8ffc6,12,18,2);warm.position.set(-4,6,0);scene.add(warm);

function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const sandTex=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#b0a98c';c.fillRect(0,0,w,h);for(let i=0;i<120000;i++){const n=range(90,220)|0;c.fillStyle=`rgba(${n+15},${n+8},${n-10},${range(.2,.8)})`;const s=range(.5,2);c.fillRect(rand()*w,rand()*h,s,s);}});
sandTex.wrapS=sandTex.wrapT=THREE.RepeatWrapping;sandTex.repeat.set(7,4);
const rockTex=canvasTexture(512,512,(c,w,h)=>{c.fillStyle='#62675a';c.fillRect(0,0,w,h);for(let i=0;i<20000;i++){const g=range(40,140)|0;c.fillStyle=`rgba(${g},${g+4},${g-5},.25)`;c.fillRect(rand()*w,rand()*h,range(1,8),range(1,3));}for(let i=0;i<95;i++){c.strokeStyle=`rgba(180,182,153,${range(.05,.22)})`;c.lineWidth=range(.5,3);c.beginPath();const y=rand()*h;c.moveTo(0,y);for(let x=0;x<=w;x+=24)c.lineTo(x,y+Math.sin(x*.025+i)*10+x*.16);c.stroke();}});
rockTex.wrapS=rockTex.wrapT=THREE.RepeatWrapping;rockTex.repeat.set(2,2);
const barkTex=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#574735';c.fillRect(0,0,w,h);for(let i=0;i<260;i++){c.strokeStyle=`rgba(${range(30,95)|0},${range(25,70)|0},25,.6)`;c.lineWidth=range(.4,3);c.beginPath();let y=rand()*h;c.moveTo(0,y);for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x*.04+i)*2);c.stroke();}});
barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;barkTex.repeat.set(3,2);

const causticMaterials=[];
function caustics(mat,strength=.25){mat.onBeforeCompile=s=>{s.uniforms.uTime=time;s.vertexShader='varying vec3 vWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');s.fragmentShader='uniform float uTime;varying vec3 vWorld;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>',`vec2 p=vWorld.xz*3.1+vWorld.y*.3;float a=sin(p.x+sin(p.y*1.23+uTime*.42)*1.8+uTime*.5);float b=sin(p.y+cos(p.x*1.12-uTime*.33)*1.6);float c=pow(1.0-abs(a*b),20.0);gl_FragColor.rgb += vec3(.65,.94,.71)*c*${strength.toFixed(3)};\n#include <dithering_fragment>`);};causticMaterials.push(mat);return mat;}
function mesh(geo,mat,pos,scale,parent=scene){const m=new THREE.Mesh(geo,mat);if(pos)m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m;}
const rockMat=caustics(new THREE.MeshStandardMaterial({map:rockTex,bumpMap:rockTex,bumpScale:.2,roughness:.86}),.1);
const woodMat=caustics(new THREE.MeshStandardMaterial({map:barkTex,bumpMap:barkTex,bumpScale:.14,roughness:.85}),.11);
function groundY(x,z){return .42+.18*(z+3)/6+1.0*Math.exp(-((x+4.7)**2/5+(z+.8)**2/7))+.62*Math.exp(-((x-4.9)**2/4+(z+.6)**2/5));}
const sandGeo=new THREE.PlaneGeometry(14,6.4,140,64);sandGeo.rotateX(-Math.PI/2);
const sp=sandGeo.attributes.position;
for(let i=0;i<sp.count;i++){const x=sp.getX(i),z=sp.getZ(i);sp.setY(i,groundY(x,z)+Math.sin(x*3+z*4)*.014+rand()*.025);}sandGeo.computeVertexNormals();
const sand=mesh(sandGeo,caustics(new THREE.MeshStandardMaterial({map:sandTex,bumpMap:sandTex,bumpScale:.08,roughness:.94}),.12));sand.receiveShadow=true;
mesh(new THREE.BoxGeometry(14.1,.5,6.5),new THREE.MeshStandardMaterial({color:0x292d22,roughness:.9}),[0,.15,0]);
const base=mesh(new THREE.BoxGeometry(14.5,.22,6.9),new THREE.MeshPhysicalMaterial({color:0x111d18,roughness:.32,metalness:.55}),[0,-.18,0]);base.receiveShadow=true;
const floor=mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:0x030805,roughness:.65,metalness:.1}),[0,-.32,0]);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;

// A lightly illuminated rear pane gives the water depth without obscuring the inhabitants.
const backTex=canvasTexture(32,512,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#739c84');g.addColorStop(.5,'#426b57');g.addColorStop(1,'#142c21');c.fillStyle=g;c.fillRect(0,0,w,h);});
mesh(new THREE.PlaneGeometry(14,6.7),new THREE.MeshStandardMaterial({map:backTex,roughness:.55,metalness:.08}),[0,3.4,-3.24]);
const glassMat=new THREE.MeshPhysicalMaterial({color:0xe4ffee,roughness:.02,metalness:0,transmission:.98,thickness:.08,ior:1.45,side:THREE.DoubleSide,envMapIntensity:.35});
for(const x of [-7.06,7.06]){const side=mesh(new THREE.PlaneGeometry(6.5,7),glassMat,[x,3.4,0]);side.rotation.y=Math.PI/2;}
// Front glass is intentionally almost clear; edge thickness remains visible.
mesh(new THREE.PlaneGeometry(14.1,7),new THREE.MeshPhysicalMaterial({color:0xe5fff1,metalness:.05,roughness:.03,transparent:true,opacity:.025,depthWrite:false,envMapIntensity:.35}),[0,3.4,3.27]);
const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(14.15,7,6.55)),new THREE.LineBasicMaterial({color:0xa0c7b2,transparent:true,opacity:.28}));edges.position.y=3.4;scene.add(edges);
for(const x of [-7.06,7.06])mesh(new THREE.BoxGeometry(.045,6.95,.045),new THREE.MeshBasicMaterial({color:0x91c3b0,transparent:true,opacity:.45}),[x,3.4,3.26]);

const normals=canvasTexture(256,256,(c,w,h)=>{const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;im.data[i]=128+Math.sin(x*.22+Math.sin(y*.17)*2)*34;im.data[i+1]=128+Math.cos(y*.19+Math.sin(x*.13)*2)*34;im.data[i+2]=244;im.data[i+3]=255;}c.putImageData(im,0,0);});normals.colorSpace=THREE.NoColorSpace;normals.wrapS=normals.wrapT=THREE.RepeatWrapping;
const water=new Water(new THREE.PlaneGeometry(14,6.45),{textureWidth:512,textureHeight:512,waterNormals:normals,sunDirection:new THREE.Vector3(-.3,1,.5).normalize(),sunColor:0xffffff,waterColor:0x6d9e8a,distortionScale:.36,alpha:.28,fog:true});
water.rotation.x=-Math.PI/2;water.position.y=6.57;water.material.transparent=true;water.material.depthWrite=false;water.renderOrder=4;scene.add(water);
const waterline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7,6.57,3.23),new THREE.Vector3(7,6.57,3.23),new THREE.Vector3(7,6.57,-3.23),new THREE.Vector3(-7,6.57,-3.23)]),new THREE.LineBasicMaterial({color:0xd6f6db,transparent:true,opacity:.4}));scene.add(waterline);

function rock(x,z,sx,sy,sz,angle=0){const g=new THREE.IcosahedronGeometry(1,3);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+.09*Math.sin(x*9+y*5+z*7)+.06*Math.cos(y*15+z*9);p.setXYZ(i,x*k,y*k,z*k);}const smooth=mergeVertices(g);smooth.computeVertexNormals();g.dispose();const m=mesh(smooth,rockMat,[x,groundY(x,z)+sy*.27,z],[sx,sy,sz]);m.rotation.set(.1,angle,.15);m.castShadow=m.receiveShadow=true;return m;}
rock(-4.4,-.4,1.5,1.95,1.1,.4);rock(-5.6,.7,1.25,1.05,.85,1);rock(-2.9,.5,.85,.8,.75);rock(-4.9,-1.9,1.1,1.5,.8);rock(4.8,-.1,1.2,1.5,1.1,2);rock(3.5,.8,.9,.75,.8,.7);rock(5.8,1.3,.8,.5,.6);
for(let i=0;i<45;i++){const x=range(-6.6,6.6),z=range(-2.8,2.9);const s=range(.04,.19);rock(x,z,s,s*.7,s*.8,rand()*6);}
function branch(points,radius){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(curve,36,radius,9,false);const p=g.attributes.position; // tapered radius along the branch
for(let i=0;i<=36;i++){const center=curve.getPointAt(i/36);const taper=Math.pow(1-i/36,.65)*.88+.12;for(let j=0;j<=9;j++){const n=i*10+j;p.setXYZ(n,center.x+(p.getX(n)-center.x)*taper,center.y+(p.getY(n)-center.y)*taper,center.z+(p.getZ(n)-center.z)*taper);}}g.computeVertexNormals();const m=mesh(g,woodMat);m.castShadow=m.receiveShadow=true;}
branch([[-4.6,1,-.4],[-3.4,1.4,-.8],[-2.4,2.6,-1],[-.8,3.7,-.8],[.5,4.5,-1.4]],.36);
branch([[-3.4,1.4,-.8],[-3.7,2.7,-1],[-3.3,3.8,-1.4],[-3.5,5.2,-1.8]],.19);
branch([[-2.4,2.6,-1],[-1.4,2.7,-.5],[.1,2.5,-.1],[1.6,3,-.3]],.14);
branch([[-.8,3.7,-.8],[-.6,4.6,-.6],[-1,5.1,-.5]],.09);
branch([[-3.7,2.7,-1],[-4.7,3.3,-1.6],[-5.1,4,-1.5]],.11);
branch([[-4.6,1,-.4],[-4.1,1,1],[-3.3,.9,1.8],[-2.7,.7,2.1]],.25);
branch([[4.7,1,-.5],[3.9,1.6,-1.2],[3.3,2.4,-1.5],[3.7,3.8,-2],[4.3,4.8,-1.8]],.28);
branch([[3.3,2.4,-1.5],[2.2,2.8,-1.2],[1.2,3.8,-1.6],[.8,4.1,-1.7]],.14);
branch([[3.7,3.8,-2],[4.6,4,-1.7],[5,4.4,-1.6]],.11);

// Merged, individually shaped leaves: a central rib, curved edges and tapered tips.
const leaves=[];
function leaf(base,height,width,azimuth,lean,color){const positions=[],uv=[],colors=[],indices=[];const c=new THREE.Color(color);const side=new THREE.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));const forward=new THREE.Vector3(Math.sin(azimuth),0,Math.cos(azimuth));const segments=8;
for(let j=0;j<=segments;j++){const t=j/segments;const w=Math.pow(Math.sin(Math.PI*t),.8)*width;for(let k=-1;k<=1;k++){const bend=lean*t*t;positions.push(base.x+side.x*k*w+forward.x*bend,base.y+height*t-Math.abs(k)*w*.18,base.z+side.z*k*w+forward.z*bend);uv.push((k+1)/2,t);const light=(k===0?1.12:.88)*(1-t*.2);colors.push(c.r*light,c.g*light,c.b*light);}}for(let j=0;j<segments;j++)for(let k=0;k<2;k++){const a=j*3+k,b=a+3;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();leaves.push(g);}
for(let i=0;i<4500;i++){const x=range(-6.8,6.8),z=range(-3,3);const river=Math.abs(x-(.8+Math.sin(z*.7)*1.1));if(river<1.6&&rand()<.97)continue;const y=groundY(x,z);const h=range(.10,.32);leaf(new THREE.Vector3(x,y,z),h,range(.025,.06),rand()*6.28,range(.02,.24),new THREE.Color().setHSL(range(.22,.31),range(.4,.7),range(.13,.28)));}
for(let i=0;i<170;i++){const side=i%2?-1:1,x=side*range(4.8,6.7),z=range(-2.9,-.7);leaf(new THREE.Vector3(x,groundY(x,z),z),range(1.5,4.6),range(.055,.14),rand()*6.28,range(.3,1.1),new THREE.Color().setHSL(range(.22,.32),.54,range(.10,.24)));}
for(let i=0;i<190;i++){const side=i%2?-1:1,x=side*range(3,6.4),z=range(-2.5,1.5);leaf(new THREE.Vector3(x,groundY(x,z)+range(0,.35),z),range(.4,1.4),range(.13,.32),rand()*6.28,range(.3,.9),new THREE.Color().setHSL(range(.25,.35),.55,range(.10,.24)));}
// Fine stem plants form dense banks behind the wood, leaving the central water open.
for(let i=0;i<130;i++){const side=i%2?-1:1,x=side*range(2.5,6.6),z=range(-3,-1.8),y=groundY(x,z),h=range(1.4,3.6);for(let j=0;j<12;j++){const t=j/12;for(let k=0;k<2;k++)leaf(new THREE.Vector3(x+Math.sin(t*3+i)*.12,y+h*t,z),range(.13,.28),range(.06,.13),j*2.4+k*Math.PI,range(.13,.28),new THREE.Color().setHSL(side<0?range(.18,.26):range(.06,.16),.45,range(.12,.25)));}}
const leafTexture=canvasTexture(256,512,(c,w,h)=>{c.fillStyle='#c4c4c4';c.fillRect(0,0,w,h);for(let i=0;i<15000;i++){const n=range(155,255)|0;c.fillStyle=`rgba(${n},${n},${n},.25)`;c.fillRect(rand()*w,rand()*h,range(1,4),range(1,5));}c.strokeStyle='#e8e8e8';c.lineWidth=3;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.stroke();for(let y=0;y<h;y+=28){for(const side of [-1,1]){c.strokeStyle='#999999';c.lineWidth=1;c.beginPath();c.moveTo(w/2,y);c.quadraticCurveTo(w/2+side*70,y+20,w/2+side*128,y+65);c.stroke();}}});
const foliageMat=new THREE.MeshStandardMaterial({vertexColors:true,map:leafTexture,bumpMap:leafTexture,bumpScale:.018,side:THREE.DoubleSide,roughness:.58,metalness:.02});
foliageMat.onBeforeCompile=s=>{s.uniforms.uTime=time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sway=sin(uTime*.8+position.x*.8+position.z*.5)*.035;transformed.x+=sway*uv.y*uv.y*max(position.y-.5,.2);transformed.z+=cos(uTime*.6+position.x)*.018*uv.y*position.y;');};
const foliage=mesh(mergeGeometries(leaves),foliageMat);foliage.castShadow=foliage.receiveShadow=true;leaves.forEach(g=>g.dispose());

// Fish anatomy. A ring loft follows the silhouette instead of stretching a sphere.
function fishTexture(kind){return canvasTexture(1024,512,(c,w,h)=>{
const grad=c.createLinearGradient(0,0,0,h);
if(kind==='discus'){grad.addColorStop(0,'#543b29');grad.addColorStop(.2,'#be572b');grad.addColorStop(.5,'#e28c4c');grad.addColorStop(.85,'#ba5c38');grad.addColorStop(1,'#523e32');}
else if(kind==='angel'){grad.addColorStop(0,'#778f82');grad.addColorStop(.4,'#d3cba4');grad.addColorStop(.65,'#ddd8ba');grad.addColorStop(1,'#82978c');}
else{grad.addColorStop(0,'#354d48');grad.addColorStop(.3,'#57897f');grad.addColorStop(.48,'#c1e8ce');grad.addColorStop(1,'#b2aaa0');}
c.fillStyle=grad;c.fillRect(0,0,w,h);
if(kind==='discus'){for(let i=0;i<55;i++){c.beginPath();for(let x=20;x<980;x+=5){const y=i*12+Math.sin(x*.025+i*1.8)*8+Math.sin(x*.052+i)*4;x===20?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=i%3?'rgba(74,172,160,.72)':'rgba(184,218,181,.65)';c.lineWidth=range(1.3,3.6);c.stroke();}for(let i=0;i<8;i++){c.fillStyle=`rgba(38,44,30,${i===6?.23:.08})`;c.fillRect(120+i*105,0,range(15,30),h);}}
if(kind==='angel'){for(const x of [.21,.45,.73,.88]){const g=c.createLinearGradient(w*x-25,0,w*x+32,0);g.addColorStop(0,'rgba(20,29,24,0)');g.addColorStop(.3,'rgba(20,29,24,.9)');g.addColorStop(.7,'rgba(20,29,24,.9)');g.addColorStop(1,'rgba(20,29,24,0)');c.fillStyle=g;c.fillRect(w*x-25,0,57,h);}}
if(kind==='neon'){c.fillStyle='#b82428';c.fillRect(0,h*.52,w*.57,h*.43);const g=c.createLinearGradient(0,h*.31,0,h*.53);g.addColorStop(0,'#036e94');g.addColorStop(.45,'#54eeed');g.addColorStop(.65,'#01a6d9');g.addColorStop(1,'#277c8f');c.fillStyle=g;c.fillRect(0,h*.31,w*.9,h*.22);}
// Scalloped scales have directional highlights and dark overlapping edges.
const size=kind==='neon'?22:13;
for(let y=0;y<h;y+=size*.78)for(let x=0;x<w;x+=size){const off=(Math.round(y/(size*.78))%2)*size*.5;c.beginPath();c.ellipse(x+off,y,size*.55,size*.65,0,-1.3,1.3);c.strokeStyle='rgba(29,36,26,.17)';c.lineWidth=1;c.stroke();c.beginPath();c.ellipse(x+off+1,y-1,size*.51,size*.59,0,-1.2,.8);c.strokeStyle='rgba(255,255,215,.16)';c.lineWidth=.7;c.stroke();}
// Gill cover behind the cheek, blended into the body pattern.
c.beginPath();c.ellipse(w*.83,h*.51,w*.045,h*.29,0,-1.5,1.5);c.strokeStyle='rgba(34,41,31,.5)';c.lineWidth=4;c.stroke();
});}
const fishMaps={discus:fishTexture('discus'),angel:fishTexture('angel'),neon:fishTexture('neon')};
const finMap=canvasTexture(512,512,(c,w,h)=>{c.clearRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(145,155,112,.95)');g.addColorStop(1,'rgba(127,150,113,.55)');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<65;i++){c.beginPath();c.moveTo(0,h*.5);c.quadraticCurveTo(w*.6,i*8,w,i*8);c.strokeStyle='rgba(222,212,154,.9)';c.lineWidth=1.6;c.stroke();}for(let i=0;i<20;i++){c.beginPath();c.moveTo(i*27,0);c.lineTo(i*27,h);c.strokeStyle='rgba(40,70,45,.45)';c.lineWidth=2;c.stroke();}});
function bodyGeometry(kind){const verts=[],uv=[],ind=[];const len=kind==='discus'?1.03:kind==='angel'?.83:.67;const ht=kind==='discus'?.88:kind==='angel'?.62:.155;const depth=kind==='discus'?.22:kind==='angel'?.17:.125;const profile=kind==='neon'?[.04,.27,.55,.78,.95,1,.96,.84,.60,.28,.04]:[.06,.17,.44,.73,.94,1,.99,.88,.66,.3,.06];
for(let i=0;i<=64;i++){const u=i/64,x=(u*2-1)*len;const p=u*10,ix=Math.min(9,Math.floor(p)),f=p-ix,p0=profile[Math.max(0,ix-1)],p1=profile[ix],p2=profile[ix+1],p3=profile[Math.min(10,ix+2)],r=Math.max(.025,.5*((2*p1)+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f));for(let j=0;j<=40;j++){const a=j/40*Math.PI*2;verts.push(x,Math.sin(a)*r*ht,Math.cos(a)*r*depth);uv.push(u,.5+Math.sin(a)*.5);}}for(let i=0;i<64;i++)for(let j=0;j<40;j++){const a=i*41+j,b=a+41;ind.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;}
const bodies={discus:bodyGeometry('discus'),angel:bodyGeometry('angel'),neon:bodyGeometry('neon')};
const eyesMat=new THREE.MeshPhysicalMaterial({color:0x080e0d,roughness:.06,clearcoat:1});
const eyeGold=new THREE.MeshStandardMaterial({color:0xc7a74d,metalness:.65,roughness:.35});
const eyeRed=new THREE.MeshStandardMaterial({color:0xc35529,metalness:.45,roughness:.4});
const eyeWhite=new THREE.MeshBasicMaterial({color:0xeefff4});
const sphere=new THREE.SphereGeometry(1,16,12);
const fish=[];
function finGeo(points){const p=[],uv=[],indices=[];const origin=points[0];for(let i=0;i<points.length;i++){p.push(...points[i]);uv.push(i===0?0:1,points[i][1]+.5);}for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
function makeFish(kind,index){const group=new THREE.Group();scene.add(group);const phase=kind==='discus'?[3.8,.7,5.9][index]:kind==='angel'?[2.6,4.8,.15][index]:rand()*6.28;const mat=new THREE.MeshPhysicalMaterial({map:fishMaps[kind],bumpMap:fishMaps[kind],bumpScale:.018,roughness:kind==='neon'?.27:.42,metalness:kind==='neon'?.48:.18,clearcoat:.7,clearcoatRoughness:.25,envMapIntensity:.7});
mat.onBeforeCompile=s=>{s.uniforms.uTime=time;s.uniforms.phase={value:phase};s.vertexShader='uniform float uTime;uniform float phase;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat tailWeight=pow(max(0.0,-position.x+.15),2.0);transformed.z+=sin(uTime*5.0+position.x*3.0+phase)*tailWeight*.09;');};
const body=mesh(bodies[kind],mat,null,null,group);body.castShadow=true;
const finMat=new THREE.MeshPhysicalMaterial({map:finMap,color:kind==='discus'?0xb17435:kind==='angel'?0xb0baa3:0xc5d8cc,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,roughness:.45,metalness:.1});
finMat.onBeforeCompile=s=>{s.uniforms.uTime=time;s.uniforms.phase={value:phase};s.vertexShader='uniform float uTime;uniform float phase;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*8.0+uTime*4.0+phase)*uv.x*.045;');};
const fins=[];function fin(points){const m=mesh(finGeo(points),finMat,null,null,group);fins.push(m);return m;}
const L=kind==='discus'?1.03:kind==='angel'?.83:.67;
const tail=new THREE.Group();tail.position.x=-L+.05;group.add(tail);
const th=kind==='neon'?.24:kind==='angel'?.42:.4;
mesh(finGeo([[0,0,0],[-.55,th,0],[-.48,th*.4,0],[-.43,0,0],[-.48,-th*.4,0],[-.55,-th,0]]),finMat,null,null,tail);
if(kind==='discus'){
fin([[.35,.42,0],[.3,.83,0],[.05,1.03,0],[-.35,.99,0],[-.7,.72,0],[-.95,.2,0]]);
fin([[.2,-.45,0],[.05,-.9,0],[-.3,-.95,0],[-.75,-.64,0],[-.98,-.16,0]]);
}else if(kind==='angel'){
fin([[.28,.35,0],[.12,.85,0],[-.15,1.48,0],[-.45,1.05,0],[-.65,.5,0],[-.82,.12,0]]);
fin([[.25,-.35,0],[.03,-.9,0],[-.3,-1.25,0],[-.62,-.65,0],[-.82,-.13,0]]);
for(const side of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.4,-.3,side*.08),new THREE.Vector3(.3,-.8,side*.1),new THREE.Vector3(.04,-1.45,side*.14)]);mesh(new THREE.TubeGeometry(curve,16,.012,5,false),new THREE.MeshStandardMaterial({color:0xd9dac0,roughness:.4}),null,null,group);}
}else{fin([[.1,.1,0],[0,.37,0],[-.22,.31,0],[-.34,.09,0]]);fin([[-.1,-.08,0],[-.3,-.27,0],[-.48,-.1,0]]);}
const eyes=kind==='neon'?{x:.49,y:.035,z:.09,r:.052}:{x:kind==='discus'?.73:.59,y:.09,z:kind==='discus'?.135:.105,r:.085};
for(const side of [-1,1]){
mesh(sphere,kind==='discus'?eyeRed:eyeGold,[eyes.x,eyes.y,side*eyes.z],[eyes.r,eyes.r,eyes.r*.44],group);
mesh(sphere,eyesMat,[eyes.x+.006,eyes.y,side*(eyes.z+eyes.r*.27)],[eyes.r*.57,eyes.r*.65,eyes.r*.34],group);
mesh(sphere,eyeWhite,[eyes.x+.018,eyes.y+eyes.r*.28,side*(eyes.z+eyes.r*.55)],[eyes.r*.16,eyes.r*.16,eyes.r*.08],group);
const scale=kind==='neon'?.42:1;const pf=fin([[.35*scale,-.05,side*.13*scale],[-.04*scale,-.3*scale,side*.53*scale],[-.22*scale,-.15*scale,side*.45*scale],[.06*scale,.02,side*.16*scale]]);pf.userData.pectoral=true;
}
const mouthMat=new THREE.MeshStandardMaterial({color:kind==='discus'?0x9a613c:0x858f76,roughness:.5});
const lip=mesh(new THREE.TorusGeometry(kind==='neon'?.024:.045,.012,6,14),mouthMat,[L-.01,-.03,0],null,group);lip.rotation.y=Math.PI/2;
const size=kind==='neon'?range(.55,.78):kind==='angel'?range(.82,1.02):range(.86,1.04);group.scale.setScalar(size);
const data={group,kind,index,phase,tail,fins,speed:kind==='neon'?range(.11,.17):range(.055,.085),radius:kind==='neon'?range(3,5.4):range(3,4.8),height:kind==='neon'?range(2.5,4.5):kind==='angel'?range(3,4.6):range(2.1,4.3),z:kind==='neon'?range(-.6,1.8):range(.7,2.1),position:new THREE.Vector3(),prev:new THREE.Vector3(),initialized:false};fish.push(data);return data;}
for(let i=0;i<3;i++)makeFish('discus',i);
for(let i=0;i<3;i++)makeFish('angel',i);
for(let i=0;i<18;i++)makeFish('neon',i);
$('#fish-count').textContent=fish.length;

const bubbleCount=90;const bubbleGeo=new THREE.SphereGeometry(1,8,6);const bubbleMat=new THREE.MeshPhysicalMaterial({color:0xc9fbe4,metalness:.25,roughness:.05,transparent:true,opacity:.3,depthWrite:false});
const bubbles=new THREE.InstancedMesh(bubbleGeo,bubbleMat,bubbleCount);scene.add(bubbles);const dummy=new THREE.Object3D();const bubbleData=Array.from({length:bubbleCount},()=>({x:range(-.16,.16)+5.8,z:range(-.2,.2)-1.3,offset:rand()*7,speed:range(.35,.75),size:range(.015,.045)}));
const dustPositions=new Float32Array(190*3);for(let i=0;i<190;i++){dustPositions[i*3]=range(-6.7,6.7);dustPositions[i*3+1]=range(.9,6.3);dustPositions[i*3+2]=range(-2.8,3);}
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd6edc8,size:.023,transparent:true,opacity:.3,depthWrite:false}));scene.add(dust);
const foodMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.027,6,5),new THREE.MeshStandardMaterial({color:0x9c673a,roughness:.9}),65);foodMesh.count=0;scene.add(foodMesh);let feedStart=-100;const feedData=Array.from({length:65},()=>({x:range(-1.4,1.4),z:range(.6,2.1),speed:range(.18,.32),offset:range(0,.8)}));

let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function pauseUI(){$('#pause').innerHTML=icon(sim.paused?'play':'pause');$('#pause').setAttribute('aria-label',sim.paused?'Продолжить':'Пауза');$('#pause').title=sim.paused?'Продолжить':'Пауза';}
pauseUI();$('#pause').onclick=()=>{sim.paused=!sim.paused;pauseUI();toast(sim.paused?'Аквариум на паузе':'Аквариум ожил');};
$('#feed').onclick=()=>{if(sim.food>0)return;if(sim.paused){sim.paused=false;pauseUI();}feedStart=sim.time;sim.food=1;foodMesh.count=65;$('#feed').disabled=true;toast('Корм в воде — рыбы подплывают');};
const lightPresets={day:{key:0xf7ffe0,fill:0x9fdacf,intensity:2.4,hemi:.85,exposure:.9,water:0x6d9e8a},sunset:{key:0xffb35f,fill:0xb8c5af,intensity:2.6,hemi:.6,exposure:.9,water:0x8b8c5d},night:{key:0x9dbbe0,fill:0x527f91,intensity:.8,hemi:.3,exposure:.8,water:0x274e56}};
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{sim.light=b.dataset.light;document.querySelectorAll('[data-light]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
let cameraTween=null,currentView='front';
function setView(name,instant=false){currentView=name;const aspect=innerWidth/innerHeight;let pos,target;if(name==='detail'){pos=new THREE.Vector3(0,4.6,12);target=new THREE.Vector3(0,3.2,.6);}else if(name==='side'){pos=new THREE.Vector3(16,8.8,16);target=new THREE.Vector3(0,3,0);}else{pos=new THREE.Vector3(7.2,9.0,22.5);target=new THREE.Vector3(0,3.1,0);}if(aspect<1.2){pos.multiplyScalar(1.2/aspect);pos.y*=.75;target.y=3.0;}
if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(pos);controls.target.copy(target);}else cameraTween={from:camera.position.clone(),to:pos,targetFrom:controls.target.clone(),targetTo:target,t:0};document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));setView('front',true);controls.update();
controls.addEventListener('start',()=>{cameraTween=null;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));});
$('#viewport').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();cameraTween=null;const offset=camera.position.clone().sub(controls.target);const sph=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')sph.theta-=.08;if(e.key==='ArrowRight')sph.theta+=.08;if(e.key==='ArrowUp')sph.phi-=.06;if(e.key==='ArrowDown')sph.phi+=.06;if(e.key==='+'||e.key==='=')sph.radius*=.9;if(e.key==='-')sph.radius*=1.1;sph.phi=clamp(sph.phi,.28,Math.PI*.51);sph.radius=clamp(sph.radius,7,80);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));});
const settings=$('#settings');$('#settings-button').onclick=()=>settings.showModal();$('#close-settings').onclick=()=>settings.close();settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
$('#quality').value=sim.quality;$('#quality').onchange=e=>{sim.quality=e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio,sim.quality==='high'?1.6:sim.quality==='balanced'?1.15:.8));renderer.shadowMap.enabled=sim.quality!=='low';scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});toast('Качество изменено');};
$('#bubbles').onchange=e=>bubbles.visible=e.target.checked;
$('#auto-orbit').onchange=e=>controls.autoRotate=e.target.checked;
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Полный экран недоступен в этом браузере');}catch{toast('Браузер не разрешил полный экран');}};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(currentView==='front')setView('front',true);});

const desiredQuaternion=new THREE.Quaternion();const targetColor=new THREE.Color();const direction=new THREE.Vector3();const xAxis=new THREE.Vector3(1,0,0);
function updateFish(dt){const t=sim.time;fish.forEach(f=>{const a=t*f.speed+f.phase;const p=f.position;const school=f.kind==='neon';p.set(Math.sin(a)*f.radius,f.height+Math.sin(t*.35+f.phase)*.28,f.z+Math.cos(a)*.65);
if(sim.food>0){const attract=Math.sin(Math.min(1,(t-feedStart)/3)*Math.PI/2)*Math.min(1,(13-(t-feedStart))/3);const foodPos=new THREE.Vector3(Math.sin(f.phase)*1.3,5.8-(t-feedStart)*.22+Math.sin(f.phase)*.4,1.3+Math.cos(f.phase)*.65);p.lerp(foodPos,clamp(attract,0,.88));}
if(!f.initialized){f.prev.copy(p);f.group.position.copy(p);f.group.rotation.y=Math.cos(a)>0?0:Math.PI;f.initialized=true;}else{direction.copy(p).sub(f.prev);direction.y*=.6;if(direction.lengthSq()>.0000001){direction.normalize();desiredQuaternion.setFromEuler(new THREE.Euler(0,Math.atan2(-direction.z,direction.x),Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),'YXZ'));f.group.quaternion.slerp(desiredQuaternion,Math.min(1,dt*2));}f.group.position.copy(p);f.prev.copy(p);}
f.tail.rotation.y=Math.sin(t*(school?9:5)+f.phase)*(school?.35:.22);f.fins.forEach((fin,i)=>{fin.rotation.x=Math.sin(t*(fin.userData.pectoral?7:3)+f.phase+i)*.06;});});}
function animate(dt){if(!sim.paused)sim.time+=dt;time.value=sim.time;water.material.uniforms.time.value=sim.time*.36;
if(!sim.paused||!fish[0].initialized)updateFish(dt);
bubbleData.forEach((b,i)=>{const y=.6+(sim.time*b.speed+b.offset)%5.9;dummy.position.set(b.x+Math.sin(y*2+i)*.08,y,b.z+Math.cos(y+i)*.06);dummy.scale.setScalar(b.size);dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);});bubbles.instanceMatrix.needsUpdate=true;
dust.rotation.y=Math.sin(sim.time*.025)*.025;
if(sim.food){const age=sim.time-feedStart;feedData.forEach((f,i)=>{dummy.position.set(f.x+Math.sin(age*.5+i)*.15,6.35-age*f.speed-f.offset,f.z);dummy.scale.setScalar(Math.max(0,1-age/13));dummy.updateMatrix();foodMesh.setMatrixAt(i,dummy.matrix);});foodMesh.instanceMatrix.needsUpdate=true;if(age>=13){sim.food=0;foodMesh.count=0;$('#feed').disabled=false;}}
const l=lightPresets[sim.light],lerp=1-Math.exp(-dt*2);key.color.lerp(targetColor.set(l.key),lerp);fill.color.lerp(targetColor.set(l.fill),lerp);key.intensity=THREE.MathUtils.lerp(key.intensity,l.intensity,lerp);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,l.hemi,lerp);renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,l.exposure,lerp);water.material.uniforms.waterColor.value.lerp(targetColor.set(l.water),lerp);
if(cameraTween){cameraTween.t=Math.min(1,cameraTween.t+dt*.9);const k=1-Math.pow(1-cameraTween.t,3);camera.position.lerpVectors(cameraTween.from,cameraTween.to,k);controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,k);if(cameraTween.t===1)cameraTween=null;}
const auto=controls.autoRotate;controls.autoRotate=auto&&!sim.paused;controls.update();controls.autoRotate=auto;renderer.render(scene,camera);
}
let last=performance.now(),frames=0,elapsed=0;
function frame(now){requestAnimationFrame(frame);const rawDt=(now-last)/1000;const dt=Math.min(rawDt,.05);last=now;if(document.hidden)return;animate(dt);frames++;elapsed+=rawDt;if(elapsed>2){window.aquariumStats={fps:Math.round(frames/elapsed),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,fish:fish.length,paused:sim.paused,light:sim.light,food:sim.food};frames=0;elapsed=0;}}
animate(.016);$('#loading').hidden=true;window.aquarium={scene,camera,renderer,sim,fish,controls,setView};requestAnimationFrame(frame);
