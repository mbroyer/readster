/* Flat-Monster: einfarbige Silhouette (.m) mit ausgesparten Details (.k = Kachelfarbe). Eigene Entwürfe. */
var MON=(function(){
  function f(n){return Math.round(n*10)/10;}
  function fuzz(cx,cy,r,n,amp){
    var p=[],i,a,rr;
    for(i=0;i<n*2;i++){a=i/(n*2)*Math.PI*2-Math.PI/2;rr=(i%2)?(r-amp):(r+amp*0.4);p.push(f(cx+Math.cos(a)*rr)+' '+f(cy+Math.sin(a)*rr*1.04));}
    return 'M'+p.join('L')+'Z';
  }
  var BODIES={
    blob:{d:'M60 28C88 28 98 52 98 74C98 98 82 108 60 108C38 108 22 98 22 74C22 52 32 28 60 28Z',top:28,ey:62,my:84,hw:38,bot:108},
    egg:{d:'M60 20C84 20 94 54 94 80C94 100 78 110 60 110C42 110 26 100 26 80C26 54 36 20 60 20Z',top:20,ey:64,my:88,hw:34,bot:110},
    tall:{d:'M60 18C80 18 90 28 90 46L90 84C90 100 78 110 60 110C42 110 30 100 30 84L30 46C30 28 40 18 60 18Z',top:18,ey:48,my:76,hw:30,bot:110},
    round:{d:'M22 68A38 38 0 1 1 98 68A38 38 0 1 1 22 68Z',top:30,ey:62,my:84,hw:38,bot:106},
    squat:{d:'M60 44C92 44 110 62 110 82C110 100 92 110 60 110C28 110 10 100 10 82C10 62 28 44 60 44Z',top:44,ey:72,my:93,hw:46,bot:110},
    pear:{d:'M60 22C76 22 84 34 84 48C84 55 90 59 96 68C106 84 100 108 60 108C20 108 14 84 24 68C30 59 36 55 36 48C36 34 44 22 60 22Z',top:22,ey:50,my:80,hw:26,bot:108},
    box:{d:'M36 28H84Q98 28 98 42V94Q98 108 84 108H36Q22 108 22 94V42Q22 28 36 28Z',top:28,ey:54,my:82,hw:36,bot:108},
    fuzz:{d:fuzz(60,68,38,17,5),top:28,ey:62,my:84,hw:36,bot:106}
  };
  function mirror(d){ /* spiegelt einen Pfad an x=60 (nur absolute Befehle M L C Q Z) */
    return d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g,function(_,x,y){return f(120-parseFloat(x))+' '+y;});
  }
  function cs(sp,k){return sp.pal?('fill="'+(k==='m'?sp.pal.mi:sp.pal.tile)+'"'):('class="'+k+'"');}
  function st(sp,k,w){return sp.pal?('fill="none" stroke="'+(k==='m'?sp.pal.mi:sp.pal.tile)+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'):('class="'+k+'s" stroke-width="'+w+'"');}
  function P(sp,k,d){return '<path '+cs(sp,k)+' d="'+d+'"/>';}
  function C(sp,k,x,y,r){return '<circle '+cs(sp,k)+' cx="'+f(x)+'" cy="'+f(y)+'" r="'+r+'"/>';}
  function E(sp,k,x,y,rx,ry,rot){return '<ellipse '+cs(sp,k)+' cx="'+f(x)+'" cy="'+f(y)+'" rx="'+rx+'" ry="'+ry+'"'+(rot?' transform="rotate('+rot+' '+f(x)+' '+f(y)+')"':'')+'/>';}
  function PL(sp,k,pts){return '<path '+cs(sp,k)+' d="M'+pts.map(function(p){return f(p[0])+' '+f(p[1]);}).join('L')+'Z"/>';}
  function L(sp,k,d,w){return '<path '+st(sp,k,w)+' d="'+d+'"/>';}
  /* Aufsätze oben */
  function topPart(sp,b){
    var t=b.top,o='',i;
    switch(sp.top){
      case 'horns':
        o+=P(sp,'m','M40 '+(t+8)+'C32 '+(t-6)+' 24 '+(t-12)+' 16 '+(t-20)+'C34 '+(t-22)+' 50 '+(t-8)+' 54 '+(t+6)+'Z');
        o+=P(sp,'m','M80 '+(t+8)+'C88 '+(t-6)+' 96 '+(t-12)+' 104 '+(t-20)+'C86 '+(t-22)+' 70 '+(t-8)+' 66 '+(t+6)+'Z');break;
      case 'cat':
        o+=PL(sp,'m',[[30,t+20],[26,t-8],[56,t+6]]);o+=PL(sp,'m',[[90,t+20],[94,t-8],[64,t+6]]);break;
      case 'bunny':
        o+=P(sp,'m','M40 '+(t+10)+'C28 '+(t-16)+' 34 '+(t-34)+' 46 '+(t-32)+'C56 '+(t-30)+' 54 '+(t-6)+' 52 '+(t+8)+'Z');
        o+=P(sp,'m','M80 '+(t+10)+'C92 '+(t-16)+' 86 '+(t-34)+' 74 '+(t-32)+'C64 '+(t-30)+' 66 '+(t-6)+' 68 '+(t+8)+'Z');break;
      case 'antennae':
        o+=L(sp,'m','M46 '+(t+4)+'Q40 '+(t-12)+' 34 '+(t-16),5)+C(sp,'m',33,t-17,6);
        o+=L(sp,'m','M74 '+(t+4)+'Q80 '+(t-12)+' 86 '+(t-16),5)+C(sp,'m',87,t-17,6);break;
      case 'tuft':
        o+=PL(sp,'m',[[48,t+4],[50,t-12],[56,t+2]]);o+=PL(sp,'m',[[54,t+3],[60,t-16],[66,t+3]]);o+=PL(sp,'m',[[64,t+2],[70,t-12],[72,t+4]]);break;
      case 'spikes':
        for(i=0;i<5;i++){var x=36+i*12;o+=PL(sp,'m',[[x-5,t+10-Math.abs(i-2)*3],[x,t-10+Math.abs(i-2)*5],[x+5,t+10-Math.abs(i-2)*3]]);}break;
      case 'bear':
        o+=C(sp,'m',30,t+12,13)+C(sp,'m',90,t+12,13)+C(sp,'k',30,t+12,5.5)+C(sp,'k',90,t+12,5.5);break;
      case 'crown':
        o+=PL(sp,'m',[[42,t+8],[40,t-14],[51,t-3],[60,t-20],[69,t-3],[80,t-14],[78,t+8]])+C(sp,'k',60,t-2,3)+C(sp,'k',48,t+1,2.2)+C(sp,'k',72,t+1,2.2);break;
      case 'horn1':
        o+=PL(sp,'m',[[53,t+6],[60,t-24],[67,t+6]]);break;
    }
    return o;
  }
  function armPart(sp,b){
    var hw=b.hw,y=b.ey+22,o='';
    switch(sp.arms){
      case 'wings':(function(){var x=60-hw+4,y0=b.ey+2,pts=[[x,y0-6],[x-30,y0-36],[x-24,y0-20],[x-38,y0-20],[x-26,y0-4],[x-36,y0+0],[x-18,y0+12],[x,y0+12]];
        o+=PL(sp,'m',pts);o+=PL(sp,'m',pts.map(function(p){return [120-p[0],p[1]];}));})();break;
      case 'blobs':o+=E(sp,'m',60-hw-3,y,9,15,18)+E(sp,'m',60+hw+3,y,9,15,-18);break;
      case 'long':o+=L(sp,'m','M'+(60-hw+2)+' '+(b.ey+12)+'Q'+(60-hw-22)+' '+(b.ey+30)+' '+(60-hw-10)+' '+(b.ey+54),9)+L(sp,'m','M'+(60+hw-2)+' '+(b.ey+12)+'Q'+(60+hw+22)+' '+(b.ey+30)+' '+(60+hw+10)+' '+(b.ey+54),9);break;
      case 'up':o+=L(sp,'m','M'+(60-hw+2)+' '+(b.ey+16)+'Q'+(60-hw-16)+' '+(b.ey+2)+' '+(60-hw-10)+' '+(b.ey-18),9)+L(sp,'m','M'+(60+hw-2)+' '+(b.ey+16)+'Q'+(60+hw+16)+' '+(b.ey+2)+' '+(60+hw+10)+' '+(b.ey-18),9);break;
    }
    return o;
  }
  function eyePart(sp,b){
    var y=b.ey,o='',dx=Math.min(16,b.hw*0.5);
    switch(sp.eyes){
      case 'two':o+=C(sp,'k',60-dx,y,10)+C(sp,'k',60+dx,y,10)+C(sp,'m',60-dx+2,y+1,4.6)+C(sp,'m',60+dx+2,y+1,4.6)+C(sp,'k',60-dx+3.5,y-1,1.5)+C(sp,'k',60+dx+3.5,y-1,1.5);break;
      case 'twoSmall':o+=C(sp,'k',60-dx,y,7)+C(sp,'k',60+dx,y,7)+C(sp,'m',60-dx+1,y+1,3.2)+C(sp,'m',60+dx+1,y+1,3.2);break;
      case 'wide':o+=C(sp,'k',60-dx,y,12)+C(sp,'k',60+dx,y,12)+C(sp,'m',60-dx+1,y-2,5.4)+C(sp,'m',60+dx+1,y-2,5.4)+C(sp,'k',60-dx+3,y-4,1.6)+C(sp,'k',60+dx+3,y-4,1.6);break;
      case 'one':o+=C(sp,'k',60,y,16)+C(sp,'m',62,y+1,8)+C(sp,'k',65,y-3,2.8);break;
      case 'three':o+=C(sp,'k',60,y-2,10)+C(sp,'m',61,y-1,4.4)+C(sp,'k',32+(60-b.hw)*0.2,y+8,6.5)+C(sp,'m',33+(60-b.hw)*0.2,y+9,3)+C(sp,'k',88-(60-b.hw)*0.2,y+8,6.5)+C(sp,'m',89-(60-b.hw)*0.2,y+9,3);break;
      case 'angry':
        o+=C(sp,'k',60-dx,y,10)+C(sp,'k',60+dx,y,10)+C(sp,'m',60-dx+2,y+2,4.4)+C(sp,'m',60+dx-2,y+2,4.4);
        o+=PL(sp,'m',[[60-dx-12,y-13],[60-dx+12,y-13],[60-dx+12,y+1],[60-dx-12,y-7]]);
        o+=PL(sp,'m',[[60+dx-12,y+1],[60+dx-12,y-13],[60+dx+12,y-13],[60+dx+12,y-7]]);break;
      case 'happy':o+=L(sp,'k','M'+(60-dx-8)+' '+(y+3)+'Q'+(60-dx)+' '+(y-10)+' '+(60-dx+8)+' '+(y+3),4.5)+L(sp,'k','M'+(60+dx-8)+' '+(y+3)+'Q'+(60+dx)+' '+(y-10)+' '+(60+dx+8)+' '+(y+3),4.5);break;
    }
    return o;
  }
  function mouthPart(sp,b){
    var y=b.my,o='',w=Math.min(20,b.hw*0.6),i;
    switch(sp.mouth){
      case 'smile':o+=P(sp,'k','M'+(60-w)+' '+y+'Q60 '+(y+18)+' '+(60+w)+' '+y+'Z');break;
      case 'open':o+=P(sp,'k','M'+(60-w)+' '+y+'Q60 '+(y+26)+' '+(60+w)+' '+y+'Z')+E(sp,'m',60,y+13,8,4.4);break;
      case 'grin':o+=P(sp,'k','M'+(60-w-4)+' '+y+'Q60 '+(y+18)+' '+(60+w+4)+' '+y+'Q60 '+(y+7)+' '+(60-w-4)+' '+y+'Z');break;
      case 'teeth':
        o+=P(sp,'k','M'+(60-w)+' '+y+'H'+(60+w)+'Q'+(60+w)+' '+(y+18)+' 60 '+(y+18)+'Q'+(60-w)+' '+(y+18)+' '+(60-w)+' '+y+'Z');
        for(i=0;i<4;i++){var x=60-w+i*(2*w/4);o+=PL(sp,'m',[[x,y],[x+w/4,y+7],[x+w/2,y]]);}break;
      case 'fangs':
        o+=P(sp,'k','M'+(60-w)+' '+y+'Q60 '+(y+18)+' '+(60+w)+' '+y+'Z');
        o+=PL(sp,'m',[[60-w+3,y+1],[60-w+7,y+9],[60-w+11,y+4]]);o+=PL(sp,'m',[[60+w-3,y+1],[60+w-7,y+9],[60+w-11,y+4]]);break;
      case 'ribs':
        o+=P(sp,'k','M'+(60-w)+' '+(y-4)+'H'+(60+w)+'V'+(y+20)+'Q'+(60+w)+' '+(y+24)+' '+(60+w-4)+' '+(y+24)+'H'+(60-w+4)+'Q'+(60-w)+' '+(y+24)+' '+(60-w)+' '+(y+20)+'Z');
        for(i=0;i<3;i++)o+=L(sp,'m','M'+(60-w+1)+' '+(y+i*7+1)+'H'+(60+w-1),3);break;
      case 'o':o+=C(sp,'k',60,y+4,6.5);break;
    }
    return o;
  }
  function decor(sp,b){
    var o='',y=b.my+12;
    switch(sp.decor){
      case 'spots':o+=C(sp,'k',60-b.hw*0.55,y+2,3.6)+C(sp,'k',60+b.hw*0.5,y-2,4.4)+C(sp,'k',60-b.hw*0.15,y+10,2.6)+C(sp,'k',60+b.hw*0.2,y+12,3);break;
      case 'stripes':
        for(var i=0;i<3;i++)o+=L(sp,'k','M'+(60-b.hw*0.8)+' '+(y+i*8-2)+'Q60 '+(y+i*8+6)+' '+(60+b.hw*0.8)+' '+(y+i*8-2),3);break;
    }
    return o;
  }
  function legPart(sp,b,dy){
    var o='',bot=b.bot+dy;
    if(sp.legs==='stick'){
      [46,74].forEach(function(x){o+=L(sp,'m','M'+x+' '+(bot-4)+'V'+(bot+14),4.5)+E(sp,'m',x+(x<60?-4:4),bot+15,8,3.6);});
    }else if(sp.legs==='stub'){
      o+=E(sp,'m',60-17,bot-1,11,6)+E(sp,'m',60+17,bot-1,11,6);
    }
    return o;
  }
  function build(sp){
    var b=BODIES[sp.body],dy=(sp.legs==='stick')?-10:0,g='';
    if(sp.egg){
      return '<svg viewBox="0 -10 120 134" aria-hidden="true">'+P(sp,'m',BODIES.egg.d)+L(sp,'k','M36 70L46 62L54 72L64 60L72 72L84 64',4)+'</svg>';
    }
    g+=topPart(sp,b)+armPart(sp,b)+P(sp,'m',b.d)+decor(sp,b)+eyePart(sp,b)+mouthPart(sp,b);
    var sc=sp.sc||1;if(sc!==1){var gy=114;g='<g transform="translate(60 '+gy+') scale('+sc+') translate(-60 -'+gy+')">'+g+legPart(sp,b,dy)+'</g>';return '<svg viewBox="0 -10 120 134" aria-hidden="true"><g'+(dy?' transform="translate(0 '+dy+')"':'')+'></g>'+g+'</svg>';}
    return '<svg viewBox="0 -10 120 134" aria-hidden="true"><g'+(dy?' transform="translate(0 '+dy+')"':'')+'>'+g+'</g>'+legPart(sp,b,dy)+'</svg>';
  }
  var SPECS=[
    {body:'tall',top:'tuft',eyes:'wide',mouth:'smile',arms:'blobs',legs:'stub'},
    {body:'round',top:'spikes',eyes:'one',mouth:'grin',arms:'',legs:'stick'},
    {body:'egg',top:'antennae',eyes:'three',mouth:'open',arms:'long',legs:'stub',decor:'spots'},
    {body:'pear',top:'bunny',eyes:'two',mouth:'teeth',arms:'blobs',legs:'stub'},
    {body:'fuzz',top:'tuft',eyes:'twoSmall',mouth:'smile',arms:'',legs:'stick'},
    {body:'squat',top:'horns',eyes:'angry',mouth:'teeth',arms:'blobs',legs:'stub'},
    {body:'box',top:'cat',eyes:'two',mouth:'ribs',arms:'up',legs:'stub'},
    {body:'blob',top:'bear',eyes:'happy',mouth:'smile',arms:'blobs',legs:'stub'},
    {body:'egg',top:'horns',eyes:'one',mouth:'fangs',arms:'long',legs:'stick',decor:'stripes'},
    {body:'tall',top:'antennae',eyes:'wide',mouth:'o',arms:'blobs',legs:'stub'},
    {body:'fuzz',top:'horns',eyes:'angry',mouth:'fangs',arms:'',legs:'stub'},
    {body:'round',top:'cat',eyes:'twoSmall',mouth:'open',arms:'up',legs:'stick'},
    {body:'squat',top:'spikes',eyes:'two',mouth:'grin',arms:'long',legs:'stub',decor:'spots'},
    {body:'pear',top:'tuft',eyes:'three',mouth:'smile',arms:'',legs:'stub'},
    {body:'box',top:'antennae',eyes:'angry',mouth:'teeth',arms:'blobs',legs:'stick'},
    {body:'blob',top:'horn1',eyes:'two',mouth:'grin',arms:'up',legs:'stub',decor:'stripes'},
    {body:'fuzz',top:'bear',eyes:'wide',mouth:'open',arms:'blobs',legs:'stick'},
    {body:'egg',top:'cat',eyes:'angry',mouth:'teeth',arms:'',legs:'stub'},
    {body:'tall',top:'bunny',eyes:'happy',mouth:'smile',arms:'long',legs:'stub',decor:'spots'},
    {body:'round',top:'horns',eyes:'three',mouth:'fangs',arms:'blobs',legs:'stick'},
    {body:'squat',top:'tuft',eyes:'one',mouth:'ribs',arms:'',legs:'stub'},
    {body:'pear',top:'spikes',eyes:'twoSmall',mouth:'open',arms:'up',legs:'stub',decor:'stripes'},
    {body:'box',top:'horn1',eyes:'wide',mouth:'teeth',arms:'long',legs:'stick'},
    {body:'blob',top:'antennae',eyes:'angry',mouth:'fangs',arms:'blobs',legs:'stub',decor:'spots'}
  ];
  var STAGES=[
    {n:'Ei',lv:1},
    {n:'Schlüpfling',lv:2,sp:{body:'egg',top:'tuft',eyes:'wide',mouth:'smile',arms:'',legs:'stub',sc:.66}},
    {n:'Frechdachs',lv:3,sp:{body:'blob',top:'cat',eyes:'two',mouth:'grin',arms:'blobs',legs:'stub',sc:.8}},
    {n:'Raufbold',lv:5,sp:{body:'round',top:'horns',eyes:'angry',mouth:'teeth',arms:'blobs',legs:'stub',sc:.92}},
    {n:'Riese',lv:7,sp:{body:'box',top:'spikes',eyes:'angry',mouth:'fangs',arms:'long',legs:'stick',decor:'stripes',sc:1}},
    {n:'Legende',lv:9,sp:{body:'tall',top:'crown',eyes:'wide',mouth:'grin',arms:'wings',legs:'stick',decor:'spots',sc:.9}}
  ];
  return {STAGES:STAGES,stage:function(n,pal){if(n===0)return build({egg:true,pal:pal});var sp=Object.assign({},STAGES[n].sp);if(pal)sp.pal=pal;return build(sp);},SPECS:SPECS,build:build,svg:function(i,pal){var sp=(i==='egg')?{egg:true}:SPECS[i];if(pal){sp=Object.assign({},sp,{pal:pal});}return build(sp);}};
})();
if(typeof module!=='undefined')module.exports=MON;
