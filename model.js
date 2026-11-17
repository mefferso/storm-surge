/* Illustrative storm forcing and terrain. All elevations are feet above model zero. */
window.Surge = (() => {
  const START = -24, END = 36, STEP = 0.1;
  const categories = ['Tropical Storm','Category 1','Category 2','Category 3','Category 4','Category 5'];
  const winds = [[39,73],[74,95],[96,110],[111,129],[130,156],[157,185]];
  const defaults = {cat:2, wind:105, size:'large', speed:'average', angle:0, offset:25,
    shelf:'shallow', tide:'mid', protection:'none'};
  const environments = ['shelf','tide','protection'];
  const land = [[350,-.8],[377,0],[425,1.25],[460,.8],[495,1.5],[510,-2.5],
    [556,-2.8],[572,1.3],[605,2.8],[635,3.4],[675,3.6],[735,3.7],
    [766,3.1],[794,3],[840,4.2],[910,4.1],[948,5.4],[974,6.9],
    [1005,8.2],[1040,8.7],[1080,8.6],[1120,9.5]];
  const sites = [
    {name:'Marsh edge', x:440}, {name:'Bayou', x:535}, {name:'Porch House',x:680,floor:7.5},
    {name:'Cypress Road',x:798}, {name:'Blue House',x:879,floor:10},
    {name:'Shell Ridge',x:1020}
  ];
  const bins = Array.from({length:561},(_,i)=>i*2);
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const at = (pts,x) => {
    const j = pts.findIndex(p=>x<=p[0]);
    if (j<=0) return pts[j===0?0:pts.length-1][1];
    const [a,b] = [pts[j-1],pts[j]];
    return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
  };
  const barrier = s => s.protection==='levee' ? 12 : s.protection==='ridge' ? 6 : null;
  const ground = (s,x) => x<350
    ? at(s.shelf==='shallow'?[[0,-17],[115,-12],[240,-6],[350,-.8]]:[[0,-35],[115,-31],[240,-18],[350,-.8]],x)
    : Math.max(at(land,x),barrier(s)===null ? -Infinity :
      barrier(s) - Math.abs(x-604)*(s.protection==='levee'?.46:.19));
  const gauss = (t,c,w) => Math.exp(-.5*((t-c)/w)**2);
  function build(s) {
    const radius = {small:55,medium:100,large:175}[s.size];
    const speed = {slow:8,average:15,fast:25}[s.speed];
    const shelf = s.shelf==='shallow'?1.3:.67;
    const tidePhase = {low:Math.PI,mid:Math.PI/2,high:0}[s.tide];
    const angle = s.angle*Math.PI/180;
    const proximity = Math.exp(-.33*(s.offset/radius)**2);
    const direction = clamp(.76+.34*Math.tanh((s.offset+12)/(radius*.45)),.36,1.1);
    const onshore = Math.max(.17,Math.cos(angle)*direction);
    const exposure = clamp(4.2+radius/speed*.46,4.6,15);
    const rawStress = 7.6*(s.wind/105)**2*(radius/100)**.86*shelf*onshore*proximity;
    const stress = rawStress <= 17 ? rawStress : 17 + 8*(1-Math.exp(-(rawStress-17)/8));
    // Faster storms may add a short pulse on the right side. Its size depends on track.
    const pulse = .14*stress*(speed/15)**1.2*clamp(Math.sin(angle+.47)+s.offset/radius*.55,0,1.4);
    const responseTime = s.shelf==='shallow'?4.2:2.2;
    const levels = [], elevations = bins.map(x=>ground(s,x));
    const sills = [];
    let sill = -Infinity;
    for (const z of elevations) { sill=Math.max(sill,z); sills.push(sill); }
    const crest=barrier(s);
    let windSetup=0,rainPool=0,interior=0,marshPool=0;
    for(let i=-1200;i<=Math.round((END-START)/STEP);i++){
      const t=START+i*STEP;
      const envelope=gauss(t,-2.1+s.angle*.067+s.offset/radius*1.2,exposure);
      const forcing=stress*envelope+pulse*gauss(t,-.6,2.5);
      windSetup+=(forcing-windSetup)*STEP/responseTime;
      const pressure=.8*(s.wind/105)*proximity*gauss(t,-.2,exposure*.63);
      const predictedTide=.95*Math.cos(t*2*Math.PI/24.84+tidePhase);
      const surge=windSetup+pressure;
      const stormTide=predictedTide+surge;
      const weather=clamp(envelope*proximity,0,1);
      const windVisual=weather*clamp(s.wind/145,.25,1.35);
      const setup=.43*weather*(s.shelf==='shallow'?1:.75)*onshore;
      const coastal=stormTide+setup;
      rainPool=Math.min(1.55,rainPool+STEP*(.14*weather-rainPool/(crest!==null?13:6)));
      const spill=crest===null?0:Math.max(0,coastal-crest);
      // A storage-and-drainage reservoir illustrates delayed overtopping and recession.
      if(crest!==null){
        const inflow = .26*spill**1.5*Math.max(0,1-interior/Math.max(.2,coastal-2.7));
        interior=Math.max(0,interior+STEP*(inflow-interior/16));
      }
      const coastalBasin=crest===null?coastal:Math.min(coastal,crest);
      marshPool=Math.max(0,marshPool+STEP*(Math.max(0,coastalBasin-3.8-marshPool)*.47-marshPool/13));
      if(i>=0) levels.push({t,surge,predictedTide,stormTide,coastal,setup,weather,
        windSetup,pressure,rainPool,interior,marshPool,spill,speed,windVisual,onshore});
    }
    function water(level,x){
      const idx=clamp(Math.round(x/2),0,bins.length-1);
      const z=ground(s,x);
      const behind=crest!==null&&x>=633;
      let surface=behind ? 2.7+level.interior+level.rainPool : level.coastal;
      if(!behind&&x>375&&surface<sills[idx]) {
        if(x>=508&&x<=564) surface=Math.min(.8,Math.max(-.1,level.coastal));
        else if(x>=750&&x<=831&&crest===null) surface=3+level.marshPool+level.rainPool*.32;
        else surface=-Infinity;
      }
      if(behind&&x<750&&level.interior<.05) surface=-Infinity;
      return {surface,depth:Math.max(0,surface-z),z};
    }
    const cache=new Map();
    function stats(x) {
      if(!cache.has(x)){
        let peak=0,peakTime=START,hours=0;
        for(const l of levels){
          const d=water(l,x).depth;
          if(d>peak){peak=d;peakTime=l.t;}
          if(d>=.1)hours+=STEP;
        }
        cache.set(x,{peak,peakTime,hours,stillWet:water(levels.at(-1),x).depth>=.1});
      }
      return cache.get(x);
    }
    return {s,crest,radius,levels,water,stats,elevations,
      state:t=>levels[clamp(Math.round((t-START)/STEP),0,levels.length-1)]};
  }
  const cases = [
    {name:'Category Isn’t Everything', a:{}, b:{cat:4,wind:145,size:'small'},
      explanation:'The larger storm pushes on more water for longer. Over this shallow shelf, that can beat much stronger winds packed into a smaller storm.'},
    {name:'Shallow Water vs. Deep Water',a:{},b:{shelf:'steep'},
      explanation:'On this broad, shallow shelf, onshore wind can pile more water against the coast. The winds are the same in both storms.'},
    {name:'High Tide vs. Low Tide',a:{tide:'high'},b:{tide:'low'},
      explanation:'The storm adds the same surge to each coast at the same hour. The predicted tide changes the starting water level, so the combined water level can be different.'},
    {name:'Levee vs. No Levee',a:{protection:'levee'},b:{},
      explanation:'The levee holds back coastal water until water reaches its crest. Rain can collect on either side, and water can flow over the top without the levee breaking.'},
    {name:'Fast vs. Slow Hurricane',a:{speed:'fast',angle:48,offset:55},b:{speed:'slow',angle:48,offset:55},
      explanation:'Storm motion changes how long onshore winds push water and when it arrives. A faster storm can also deliver a stronger short pulse on some tracks. Try a different angle and compare.'}
  ];
  return {START,END,STEP,categories,winds,defaults,environments,sites,ground,build,cases,clamp};
})();
