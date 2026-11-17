/* Side-on illustration and water overlay. Display geometry uses the same terrain as the probe. */
window.CoastScene = (() => {
  const W=1120,H=510,Y=313,F=9.4;
  const y = z => Y-z*F;
  const rand = i => { const r=Math.sin(i*127.31+17.7)*43758.5453; return r-Math.floor(r); };
  const poly=(c,points,fill,stroke,width=1)=>{
    if(!points.length)return;
    c.beginPath();c.moveTo(...points[0]);
    for(const pt of points.slice(1))c.lineTo(...pt);
    if(fill){c.closePath();c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  };
  const rect=(c,x,z,w,h,color)=>{c.fillStyle=color;c.fillRect(x,z,w,h);};
  const ell=(c,x,z,w,h,color)=>{c.beginPath();c.ellipse(x,z,w,h,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
  const gradient=(c,z1,z2,stops)=>{
    const g=c.createLinearGradient(0,z1,0,z2);
    stops.forEach(([n,color])=>g.addColorStop(n,color));return g;
  };
  function sky(c,l,t){
    rect(c,0,0,W,H,gradient(c,0,330,[[0,'#1a3547'],[.57,'#4d6d79'],[1,'#b5b5a0']]));
    for(let band=0;band<5;band++){
      const points=[[0,0]];
      for(let x=0;x<=W;x+=8) {
        const offset=x+t*(band+1)*8;
        points.push([x,35+band*32+Math.sin(offset*.006+band)*22+
          Math.sin(offset*.018+band*.8)*8+Math.sin(offset*.034)*3]);
      }
      points.push([W,0]);
      poly(c,points,['#233746','#293f51','#344c5c','#3d5661','#4c616a'][band]+'64');
    }
    const storm=gradient(c,12,232,[[0,'#172c40'],[.64,'#283c4f'],[1,'#3d56649c']]);
    c.globalAlpha=.42+l.weather*.50;
    for(let i=0;i<23;i++){
      const x=((i*78+t*(9+l.weather*13))%(W+480))-230;
      const z=35+rand(i+35)*135;
      ell(c,x,z,110+rand(i+44)*85,17+rand(i+225)*35,storm);
    }
    c.globalAlpha=1;
    // Low distant marsh. Its subdued silhouette keeps the foreground water legible.
    for(let band=0;band<3;band++){
      const p=[];
      for(let x=0;x<=W;x+=7) p.push([x,Math.max(313-(x-325)*.135,282+band*8+Math.sin(x*.045+band)*3+
        Math.sin(x*.014+band*2)*8+rand(x+band)*3)]);
      poly(c,[...p,[W,363],[0,363]],['#68817e','#566d68','#3f615b'][band]);
    }
    for(let i=0;i<74;i++){
      const x=245+rand(i+907)*900;
      const z=290+rand(i+1280)*20;
      poly(c,[[x-3,z],[x,z-3-rand(i+28)*9],[x+4,z]],'#55736a');
    }
  }
  function house(c,x,base,floor,wall,roof,scale){
    c.save();c.translate(x,floor);c.scale(scale,scale);
    const d=(base-floor)/scale;
    poly(c,[[-37,d],[-28,d-2],[37,d-2],[48,d]],'#1b302b69');
    for(const p of [-29,-10,15,31]){
      rect(c,p-2,-5,4,d+5,'#544738');rect(c,p-2,-5,1,d+5,'#ab9065');
    }
    poly(c,[[37,3],[11,d],[14,d+2],[42,5]],'#a48761');
    for(let i=0;i<7;i++){
      const f=i/7;rect(c,37-25*f,4+(d-3)*f,7,1.5,'#c9ab7b');
    }
    rect(c,-35,-38,68,38,wall);poly(c,[[33,-38],[45,-44],[45,-6],[33,0]],'#405850');
    for(let i=-35;i<0;i+=5)rect(c,-34,i,66,1,'#fbf1c83d');
    rect(c,-9,-27,14,26,'#533e37');rect(c,-6,-24,8,12,'#657a79');
    for(const p of [-29,13]){
      rect(c,p-2,-29,17,16,'#e2debc');rect(c,p,-27,13,12,'#efc57d');
      rect(c,p+6,-27,1,12,'#786b56');rect(c,p,-22,13,1,'#786b56');
      rect(c,p-4,-28,3,13,'#354d48');rect(c,p+14,-28,3,13,'#354d48');
    }
    poly(c,[[-43,-37],[-5,-66],[39,-37]],roof,'#303c40',1.3);
    poly(c,[[-5,-66],[10,-69],[51,-44],[39,-37]],'#353f47');
    poly(c,[[-43,-37],[39,-37],[51,-44]],'#232c34');
    for(let i=0;i<6;i++){
      const f=i/6;poly(c,[[-40+35*f,-39-26*f],[37-42*f,-39-26*f]],null,'#f4ede034',.8);
    }
    rect(c,-42,-2,83,4,'#b2a386');
    for(let i=-39;i<=38;i+=8)rect(c,i,-10,1,10,'#e1d7b7');
    rect(c,-41,-11,82,1.6,'#e1d7b7');
    c.restore();
  }
  function landscape(c,model,l,phase,science){
    const ground=x=>Surge.ground(model.s,x);
    const profile=model.elevations.map((z,i)=>[i*2,y(z)]);
    const soil=gradient(c,211,H,[[0,'#55583c'],[.35,'#695d47'],[.68,'#483f3a'],[1,'#2b3030']]);
    poly(c,[...profile,[W,H],[0,H]],soil);
    c.save();
    c.beginPath();c.moveTo(...profile[0]);for(const pt of profile)c.lineTo(...pt);
    c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.clip();
    for(let i=0;i<12;i++){
      const points=profile.filter((_,j)=>j%4===0).map(([x,z])=>
        [x,z+10+i*13+Math.sin(x*.01+i)*4+Math.sin(x*.04+i)*2]);
      poly(c,points,null,i%3===0?'#bea2812c':'#b29a721c',i%3===0?2:1);
    }
    for(let i=0;i<660;i++){
      const x=rand(i+872)*W,z=y(ground(x))+rand(i+724)*195;
      ell(c,x,z,rand(i+291)*2.5+.3,rand(i+250)*1.2+.35,i%3?'#c3a08036':'#272d2b61');
    }
    c.restore();
    poly(c,profile.slice(0,187),null,'#989279',2);
    poly(c,profile.slice(187),null,'#b4b27c',3);
    if(model.crest!==null){
      const x=604;const top=y(model.crest);
      if(model.s.protection==='levee'){
        poly(c,[[584,y(ground(584))],[599,top+3],[599,top],[609,top],[610,top+3],[624,y(ground(624))]],
          '#8b9a96','#beccbd',2);
        for(let z=top+8;z<top+60;z+=9){
          const dx=(z-top)*.37;poly(c,[[603-dx,z],[606+dx,z]],null,'#586f6c',1);
        }
        rect(c,597,top,14,3,'#d1d8c5');
      } else poly(c,profile.filter(([x])=>x>=580&&x<=625),null,'#e0c286',4);
    }
    for(const [left,right,density] of [[372,500,105],[560,593,42],[621,649,17],[724,772,20],[813,847,22],[934,1120,81]]){
      for(let i=0;i<density;i++){
        const n=left+i,x=left+rand(n+2332)*(right-left),z=y(ground(x)),h=4+rand(n+128)*23;
        const bend=(1+l.weather*8)*Math.sin(phase*3+x*.45)+h*.3;
        poly(c,[[x,z],[x+1,z-h*.51],[x+bend,z-h]],null,['#838d58','#a7a36a','#546c4a','#c0a96f'][i%4],1+rand(n+18));
      }
    }
    poly(c,[[749,y(ground(749))-1],[774,y(ground(774))-1],[807,y(ground(807))-1],[840,y(ground(840))-1]],
      null,'#393d3a',5);
    poly(c,[[753,y(ground(753))-2],[776,y(ground(776))-2],[807,y(ground(807))-2],[838,y(ground(838))-2]],
      null,'#a9a698',1.4);
    for(const [x,k] of [[946,.93],[981,1.12],[1073,1.45],[1111,.85]]){
      const z=y(ground(x));
      poly(c,[[x-4,z],[x-1,z-57*k],[x+3,z-74*k],[x+5,z]],'#564e3c');
      for(let i=0;i<9;i++){
        const dx=(rand(i+x)*2-1)*26*k,dz=rand(i+x+97)*44*k;
        poly(c,[[x,z-39*k],[x+dx,z-48*k-dz]],null,'#726851',1.4);
        ell(c,x+dx,z-47*k-dz,(8+rand(i+x+33)*13)*k,(6+rand(i+x+81)*8)*k,
          ['#384d41','#50604a','#647252','#56684e'][i%4]);
      }
    }
    for(const [x,k,col] of [[763,1,'#dc9463'],[806,.77,'#8dadb4']]){
      const z=y(ground(x))-3;
      poly(c,[[x-17*k,z-3],[x-15*k,z-11*k],[x-8*k,z-12*k],[x-3*k,z-20*k],
        [x+9*k,z-20*k],[x+16*k,z-12*k],[x+24*k,z-10*k],[x+25*k,z-3]],
        col,'#303839',1);
      poly(c,[[x-6*k,z-12*k],[x-2*k,z-18*k],[x+8*k,z-18*k],[x+13*k,z-12*k]],'#43575e');
      for(const offset of [-9,16]){ell(c,x+offset*k,z-3,4*k,4*k,'#233339');ell(c,x+offset*k,z-3,2*k,2*k,'#a8a49b');}
    }
    const poles=[633,749,824,929,996].map(x=>[x,y(ground(x))-64]);
    c.beginPath();
    c.moveTo(...poles[0]);
    for(let i=1;i<poles.length;i++){
      const [x,a]=poles[i], [px,pa]=poles[i-1];
      c.quadraticCurveTo((x+px)/2,(a+pa)/2+20,x,a);
    }
    c.strokeStyle='#303b39';c.lineWidth=1.2;c.stroke();
    for(const [x,z] of poles){
      rect(c,x-1.7,z-4,3.4,68,'#5a5143');rect(c,x-10,z,20,2,'#6e6554');
      for(const d of [-8,7])rect(c,x+d,z-3,2,4,'#303c39');
    }
    house(c,680,y(ground(680)),y(7.5),'#bb9869','#874c42',.91);
    house(c,879,y(ground(879)),y(10),'#779790','#647576',.81);
    house(c,1038,y(ground(1038)),y(12),'#a39f78','#605b50',.47);
    const dock=y(3.2);
    for(const x of [481,497,513,529]){
      rect(c,x,dock,3,23,'#6d5d49');rect(c,x,dock-5,3,6,'#9b8e6c');
    }
    rect(c,477,dock,58,4,'#9b8662');
    if(science>.5) poly(c,profile,null,'#d4d2a9a0',1);
  }
  function boat(c,model,l,t,science){
    const w=model.water(l,281);
    const z=y(w.surface)+Math.sin(t*1.8)*(1+l.weather*1.6);
    c.save();c.globalAlpha=1-science*.57;c.translate(270,z);c.rotate(Math.sin(t*1.8)*.055);
    poly(c,[[-38,-7],[38,-7],[28,5],[-28,5]],'#c2c7b2','#354754',1.6);
    poly(c,[[-34,-2],[34,-2],[28,5],[-29,5]],'#456268');
    rect(c,-14,-25,28,18,'#e3d9b9');rect(c,-10,-21,20,9,'#648793');
    rect(c,-18,-27,34,3,'#536b70');rect(c,-1,-47,2,22,'#6d6658');
    poly(c,[[-22,-7],[0,-47],[23,-7]],null,'#aab0a5',1);
    rect(c,15,-10,14,3,'#ae8058');c.restore();
  }
  function drawWater(c,m,l,t,science){
    const slices=[];
    let current=[];
    for(let x=0;x<=W;x+=2){
      const w=m.water(l,x);
      if(w.depth>.005){
        const wave=(.7+(1.65+l.windVisual*4)*Surge.clamp((402-x)/64,0,1))*Math.sin(x*.072-t*2.8);
        current.push([x,Math.min(y(w.z),y(w.surface)+wave*(1-.65*science)),y(w.z)]);
      }else if(current.length){slices.push(current);current=[];}
    }
    if(current.length)slices.push(current);
    for(const slice of slices){
      if(slice.length<2)continue;
      const tops=slice.map(([x,z])=>[x,z]);
      const fillPath=[...tops,...slice.slice().reverse().map(([x,_,z])=>[x,z])];
      c.save();c.beginPath();c.moveTo(...fillPath[0]);for(const pt of fillPath)c.lineTo(...pt);
      c.closePath();c.clip();
      const crest=tops.reduce((min,pt)=>Math.min(min,pt[1]),H);
      rect(c,0,crest,W,H-crest,gradient(c,crest,Math.min(crest+190,H),[
        [0,science>.5?'#3dbaa3b8':'#35a79db9'],[.16,'#1f7d82bf'],[.64,'#245661d9'],[1,'#263b49df']]));
      for(let i=0;i<72;i++){
        const xx=((rand(i+55)*W+t*(4+rand(i+11)*17))%(W+100))-40;
        const zz=crest+rand(i+235)*180;
        poly(c,[[xx-11,zz],[xx,zz-1],[xx+10+rand(i)*33,zz]],null,
          i%3?'#9adde248':'#a8e4df73',i%3?1:1.45);
      }
      c.restore();
      poly(c,tops,null,science>.5?'#a3f3dd':'#a9e6d4',1.65);
      for(let i=0;i<10;i++){
        const pt=tops[Math.floor(rand(i+926)*tops.length)];
        if(pt&&pt[0]<455&&l.weather>.22)ell(c,pt[0]+Math.sin(t*2+i)*5,
          pt[1]-Math.max(0,Math.sin(t*2.2+i))*l.weather*7,1.3,.7,'#c5eee3b0');
      }
    }
    // A shore wash is a visual wave excursion and does not modify measured depth.
    const runup=Math.max(0,Math.sin(t*2.8))*l.windVisual*.5;
    if(runup>.06&&l.coastal<1.6){
      const wash=[];
      let touchedWater=false;
      for(let x=365;x<=495;x+=2){
        const w=m.water(l,x);
        if(w.depth>0){touchedWater=true;continue;}
        if(!touchedWater)continue;
        if(w.z>l.coastal+runup)break;
        const z=y(w.z);
        wash.push([x,z]);
      }
      poly(c,wash,null,'#bff3d7a8',2);
    }
    if(m.crest!==null&&l.spill>0){
      const crest=y(m.crest);
      c.beginPath();c.moveTo(599,crest-1);c.quadraticCurveTo(627,crest-8,646,Math.min(y(3.4),y(2.7+l.interior+l.rainPool)));
      c.strokeStyle='#8fe3d5c9';c.lineWidth=2+Math.min(5,l.spill);c.stroke();
    }
  }
  function weather(c,l,t,science){
    const wind=l.windVisual;
    c.globalAlpha=(.21+wind*.51)*(1-.64*science);
    c.beginPath();
    for(let i=0;i<135*l.weather;i++){
      const x=((rand(i+37)*W+t*(50+wind*132))%(W+80))-40;
      const z=((rand(i+284)*330+t*(90+wind*110))%330);
      c.moveTo(x,z);c.lineTo(x+3+wind*14*l.onshore,z+6+rand(i+65)*12);
    }
    for(let i=0;i<12*wind;i++){
      const x=((rand(i+66)*W+t*(65+wind*150))%(W+90))-60;
      const z=117+rand(i+563)*143;
      c.moveTo(x,z);c.quadraticCurveTo(x+22,z-6,x+45+wind*12,z-3);
    }
    c.strokeStyle='#b6d4dd96';c.lineWidth=1;c.stroke();c.globalAlpha=1;
  }
  function track(c,m,l){
    const left=83, top=24, w=206, h=121, shore=top+66, town=left+127;
    const x0=town-m.s.offset*.29;
    const dx=-Math.sin(m.s.angle*Math.PI/180)*43;
    const p=Surge.clamp(l.t*l.speed/360,-1,1);
    const cx=x0+p*dx, cy=shore-p*35;
    c.save();
    c.beginPath();c.roundRect(left,top,w,h,9);c.clip();
    rect(c,left,top,w,h,'#152e3aeb');
    poly(c,[[left,top],[left+w,top],[left+w,shore-8],[town+23,shore-6],[town+4,shore+1],
      [town-34,shore-6],[town-45,shore+5],[left,shore-3]],'#395c56');
    poly(c,[[x0-dx,shore+35],[x0,shore],[x0+dx,shore-35]],null,'#e8c980',1.6);
    ell(c,town,shore-2,3,3,'#f3f8de');
    ell(c,cx,cy,11+m.radius*.038,9+m.radius*.032,'#9ad5c527');
    ell(c,cx,cy,5.5,5.5,'#f7d187');
    label(c,'STORM TRACK',left+12,top+13,{align:'left',size:11,bg:'#142e39bb'});
    c.restore();
  }
  function label(c,txt,x,z,options={}){
    const {color='#eef5e8',bg='#142e39eb',align='center',size=17}=options;
    c.font='700 '+size+'px system-ui';c.textBaseline='middle';c.textAlign=align;
    const w=c.measureText(txt).width;
    const left=align==='left'?x-7:align==='right'?x-w-7:x-w/2-7;
    c.beginPath();c.roundRect(left,z-12,w+14,24,5);c.fillStyle=bg;c.fill();c.fillStyle=color;c.fillText(txt,x,z+.5);
  }
  function draw(c,m,l,options){
    const {phase,science,labels,numbers,probe}=options;
    sky(c,l,phase);
    if(science>0)rect(c,0,0,W,H,'rgba(18,40,53,'+science*.48+')');
    landscape(c,m,l,phase,science);
    drawWater(c,m,l,phase,science);
    boat(c,m,l,phase,science);
    weather(c,l,phase,science);
    if(science>.05&&numbers){
      c.save();c.globalAlpha=science;
      for(const [z,color,title] of [[l.predictedTide,'#f9cb76','Astronomical tide'],[l.stormTide,'#9eeedf','Storm tide']]){
        c.setLineDash([8,6]);poly(c,[[77,y(z)],[420,y(z)]],null,color,2);
        if(labels)label(c,title,88,y(z)+(title==='Storm tide'?-15:16),{color,align:'left',size:14});
      }
      c.restore();
    }
    if(labels){
      track(c,m,l);
      label(c,'GULF OF MEXICO',192,224,{size:16});
      label(c,'COASTAL MARSH',429,242,{size:15});
      label(c,'BAYOU',532,218,{size:15});
      label(c,'SHELL RIDGE',1037,139,{size:15});
      if(m.crest!==null) label(c,m.s.protection==='levee'?(numbers?'LEVEE · 12 ft':'LEVEE'):(numbers?'NATURAL RIDGE · 6 ft':'NATURAL RIDGE'),
        606,y(m.crest)-27,{color:'#ffd88e',size:14});
      label(c,m.s.shelf==='shallow'?'Broad, shallow shelf':'Narrower, steeper shelf',205,463,{size:16});
    }
    if(numbers){
      poly(c,[[51,y(30)],[51,y(-20)]],null,'#e2eee8ad',1.5);
      for(const z of [30,25,20,15,10,5,0,-5,-10,-15,-20]){
        poly(c,[[46,y(z)],[57,y(z)]],null,'#e2eee8ad',1.5);
        label(c,z===30?'30 ft':String(z),40,y(z),{align:'right',size:12,bg:'#142e39c9'});
      }
      if(science>.55){
        for(const site of Surge.sites.filter(site=>site.floor)){
          c.setLineDash([4,4]);
          poly(c,[[site.x-40,y(site.floor)],[site.x+45,y(site.floor)]],null,'#f8cd83',1.7);
          c.setLineDash([]);
          if(labels)label(c,site.floor+' ft raised floor',site.x,y(site.floor)+17,
            {color:'#f8cd83',size:13});
        }
      }
      const water=m.water(l,probe),py=y(water.z),wet=y(water.surface);
      c.setLineDash([5,4]);poly(c,[[probe,Math.min(py-46,wet-16)],[probe,py]],null,'#ffd685',1.9);c.setLineDash([]);
      ell(c,probe,py,7,7,'#172e3a');ell(c,probe,py,4.4,4.4,'#ffd685');
      if(labels) label(c,water.depth>.05?water.depth.toFixed(1)+' ft deep':'Dry',Math.max(105,Math.min(W-68,probe)),
        Math.min(py-56,wet-24),{color:'#ffd685',size:17});
    }
  }
  function create(canvas){
    // Render the same coordinate system in solo and split screen. Cap the backing resolution.
    const c=canvas.getContext('2d');
    let ratio=0;
    return (m,l,opts)=>{
      const next=Math.min(1.5,Math.max(.65,canvas.clientWidth/W*(window.devicePixelRatio||1)));
      if(Math.abs(next-ratio)>.09){
        ratio=next;canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);
      }
      c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      draw(c,m,l,opts);
    };
  }
  return {create,W,H};
})();
