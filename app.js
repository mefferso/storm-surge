(() => {
  const $=id=>document.getElementById(id);
  const S=Surge, signed=n=>(n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(1);
  const feet=n=>n.toFixed(1)+' ft';
  const timestamp=t=>Math.abs(t)<.05?'Landfall':Math.abs(t).toFixed(1).replace(/\.0$/,'')+' h '+(t<0?'before':'after')+' landfall';
  const makeStorm=s=>({model:S.build(s),t:-9,playing:false});
  let solo=makeStorm({...S.defaults});solo.t=-15;
  let storms=S.cases.slice(0,1).flatMap(p=>[makeStorm({...S.defaults,...p.a}),makeStorm({...S.defaults,...p.b})]);
  let comparing=false, active=0, speed=1, probe=680, science=0, targetScience=0;
  let guess=null, revealed=false, preset=0, sceneCards=[], clocks=[];
  let activeExplanation=S.cases[0].explanation;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const roster=()=>comparing?storms:[solo];
  const editable=()=>roster()[active];
  const independent=()=>comparing&&$('independent').checked;
  const location=()=>S.sites.find(site=>site.x===probe);
  const options=(values,selected)=>values.map(([value,label])=>'<option value="'+value+'"'+
    (String(value)===String(selected)?' selected':'')+'>'+label+'</option>').join('');
  const press=(el,is)=>el.setAttribute('aria-pressed',String(is));
  const weatherWords=t=>t<-15?'Well offshore':t<-9?'Approaching the coast':t<-4?'Onshore winds building':
    t<-.1?'Nearing the coast':t<.1?'Crossing the coast':t<8?'Moving inland':t<20?'Water can linger':'Late recession';
  const selectField=(title,name,values,s)=>'<label class="field"><span>'+title+
    '</span><select data-field="'+name+'">'+options(values,s[name])+'</select></label>';
  const rangeField=(title,name,min,max,step,value,label)=>'<label class="slider-field"><span>'+title+
    '<output data-out="'+name+'">'+label+'</output></span><input type="range" data-field="'+name+
    '" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
  const angleText=v=>v===0?'Head-on':Math.abs(v)+'° '+(v<0?'from west':'from east');
  const offsetText=v=>v===0?'At community':Math.abs(v)+' mi '+(v>0?'west':'east')+' of town';
  const categoryRange=cat=>S.categories[cat]+', '+S.winds[cat][0]+(cat===5?' or more':'–'+S.winds[cat][1])+' mph';
  function buildFields(){
    const s=editable().model.s;
    const [min,max]=S.winds[s.cat];
    $('fields').innerHTML='<div class="storm-card"><div class="field-heading">Storm intensity</div>'+
      '<strong id="category-label">'+S.categories[s.cat]+'</strong><span id="wind-label">'+s.wind+' mph sustained</span>'+
      '<input aria-label="Hurricane category" aria-valuetext="'+categoryRange(s.cat)+'" type="range" min="0" max="5" step="1" data-field="cat" value="'+s.cat+'">'+
      '<div class="steps" aria-hidden="true"><span>TS</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>'+
      '<label class="wind-detail">Peak wind <input aria-label="Maximum sustained wind in mph" type="number" data-field="wind" min="'+min+'" max="'+(s.cat===5?250:max)+'" value="'+s.wind+'"> mph</label></div>'+
      '<div class="fields-group">'+
      selectField('Storm size','size',[['small','Small'],['medium','Medium'],['large','Large']],s)+
      selectField('Forward speed','speed',[['slow','Slow · 8 mph'],['average','Average · 15 mph'],['fast','Fast · 25 mph']],s)+
      rangeField('Approach angle','angle',-75,75,5,s.angle,angleText(s.angle))+
      rangeField('Landfall track','offset',-150,150,5,s.offset,offsetText(s.offset))+
      '<div class="divider"></div>'+
      selectField('Continental shelf','shelf',[['shallow','Broad & shallow'],['steep','Narrower & steeper']],s)+
      selectField('Tide at landfall','tide',[['low','Low tide'],['mid','Mid tide'],['high','High tide']],s)+
      selectField('Coastal protection','protection',[['none','Unprotected'],['ridge','Natural ridge'],['levee','Engineered levee']],s)+
      '</div>';
  }
  function updateField(input){
    const k=input.dataset.field;
    const s={...editable().model.s};
    s[k]=['cat','wind','angle','offset'].includes(k)?Number(input.value):input.value;
    if(k==='cat'){
      const [min,max]=S.winds[s.cat];s.wind=Math.round((min+max)/2);
      const wind=$('fields').querySelector('[data-field=wind]');
      wind.min=min;wind.max=s.cat===5?250:max;wind.value=s.wind;
      $('category-label').textContent=S.categories[s.cat];
      input.setAttribute('aria-valuetext',categoryRange(s.cat));
    }
    if(k==='wind'){
      if(!input.value){input.value=s.wind=editable().model.s.wind;}
      s.wind=S.clamp(s.wind,+input.min,+input.max);input.value=s.wind;
    }
    $('wind-label').textContent=s.wind+' mph sustained';
    if(k==='angle'||k==='offset') $('fields').querySelector('[data-out='+k+']').textContent=k==='angle'?angleText(s[k]):offsetText(s[k]);
    editable().model=S.build(s);
    if(comparing&&S.environments.includes(k)&&$('lock').checked){
      const other=storms[1-active];other.model=S.build({...other.model.s,[k]:s[k]});
    }
    if(comparing){
      activeExplanation='Check the peak depth, flood duration, surge and tide in each panel. Change one control at a time to see what changes.';
      $('preset').value='custom';resetPrediction(false);
    }
  }
  function buildCards(){
    $('scenes').replaceChildren();
    $('readings').replaceChildren();
    sceneCards=roster().map((_,i)=>{
      const card=document.createElement('article');card.className='scene';
      const readings=document.createElement('section');readings.className='readings';
      card.innerHTML='<div class="scene-top"><strong></strong><span></span></div>'+
        '<div class="canvas-wrap"><canvas aria-label="Animated cross-section of the coast. Tap within it to place a depth probe."></canvas>'+
        '<div class="scene-badge"><i></i><span></span></div></div>';
      readings.setAttribute('aria-label',comparing?'Storm '+(i?'B':'A')+' measurements':'Measurements');
      readings.innerHTML='<div class="metrics"></div>'+
        '<div class="probe"><label>Depth probe <select aria-label="Depth probe location">'+
        options([...S.sites.map(site=>[site.x,site.name]),['custom','Selected point']],probe)+'</select></label><div class="probe-info"></div></div>';
      $('scenes').append(card);$('readings').append(readings);
      const canvas=card.querySelector('canvas');
      canvas.addEventListener('pointerup',e=>{
        if(!$('numbers').checked)return;
        const r=canvas.getBoundingClientRect();
        setProbe(S.clamp(Math.round(((e.clientX-r.left)/r.width)*CoastScene.W/2)*2,0,1120));
      });
      const select=readings.querySelector('select');
      select.addEventListener('change',()=>{if(select.value!=='custom')setProbe(+select.value);});
      return {card,select,draw:CoastScene.create(canvas),
        title:card.querySelector('.scene-top strong'),track:card.querySelector('.scene-top span'),
        badge:card.querySelector('.scene-badge'),badgeText:card.querySelector('.scene-badge span'),
        readings,metrics:readings.querySelector('.metrics'),
        probeInfo:readings.querySelector('.probe-info')};
    });
    syncProbe();
  }
  function syncProbe(){
    sceneCards.forEach(card=>{
      card.select.value=location()?probe:'custom';
      card.select.lastElementChild.hidden=!!location();
    });
    $('prediction-location').textContent='Compare peak water depth at '+(location()?.name??'the selected point')+'.';
  }
  function setProbe(x){
    probe=x;syncProbe();
    if(comparing&&revealed)reveal();
    else if(guess||revealed)resetPrediction(false);
  }
  function rebuildClocks(){
    $('timeline').replaceChildren();
    const count=independent()?2:1;
    clocks=Array.from({length:count},(_,i)=>{
      const node=document.createElement('div');node.className='clock';
      const caption=independent()?'Storm '+(i?'B':'A')+' timeline':'Hurricane timeline';
      node.innerHTML='<div class="clock-top"><strong>'+caption+'</strong><output></output><span></span></div>'+
        '<input type="range" aria-label="'+caption+'" min="-24" max="36" step="0.1">'+
        '<div class="ticks" aria-hidden="true"><span>−24 h</span><span>−12 h</span><span class="landfall">Landfall</span><span>+12 h</span><span>+24 h</span><span>+36 h</span></div>'+
        '<div class="play-controls"><button class="play"></button><button class="restart">↺ Restart</button>'+
        (i===0?'<label>Speed <select aria-label="Playback speed">'+options([[.5,'½×'],[1,'1×'],[2,'2×'],[4,'4×']],speed)+'</select></label>':'')+'</div>';
      $('timeline').append(node);
      const selected=()=>independent()?[storms[i]]:roster();
      const range=node.querySelector('input'), button=node.querySelector('.play');
      range.addEventListener('input',()=>{
        for(const st of selected()){st.t=+range.value;st.playing=false;}
      });
      button.addEventListener('click',()=>{
        const targets=selected(), play=!targets[0].playing;
        for(const st of targets){if(play&&st.t>=S.END)st.t=S.START;st.playing=play;}
      });
      node.querySelector('.restart').addEventListener('click',()=>{
        for(const st of selected()){st.t=S.START;st.playing=false;}
        if(comparing)resetPrediction(false);
      });
      node.querySelector('select')?.addEventListener('change',e=>{speed=+e.target.value;});
      return {range,button,selected,time:node.querySelector('output'),stage:node.querySelector('.clock-top span')};
    });
  }
  function resetPrediction(rewind){
    guess=null;revealed=false;
    if(rewind)for(const st of storms){st.t=S.START;st.playing=false;}
    for(const button of $('answers').children)press(button,false);
    $('result').textContent='';
    for(const card of sceneCards)card.card.classList.remove('winner');
  }
  function selectPreset(i,pair){
    preset=i;
    const p=i>=0?S.cases[i]:pair;
    storms=[makeStorm({...S.defaults,...p.a}),makeStorm({...S.defaults,...p.b})];
    activeExplanation=p.explanation;
    $('lock').checked=S.environments.every(k=>storms[0].model.s[k]===storms[1].model.s[k]);
    $('preset').value=i>=0?i:'custom';
    resetPrediction(true);buildFields();rebuildClocks();
  }
  function reveal(){
    revealed=true;
    const [a,b]=storms.map(st=>st.model.stats(probe).peak);
    const winner=Math.abs(a-b)<.35?'tie':a>b?'A':'B';
    const outcome=winner==='tie'?'The flood depths were about the same.':'Storm '+winner+' flooded this spot more.';
    $('result').textContent=(guess===winner?'You got it! ':guess?'Here’s what happened. ':'')+outcome+
      ($('numbers').checked?' A peaked at '+feet(a)+' and B at '+feet(b)+'. ':' ')+activeExplanation;
    sceneCards[0].card.classList.toggle('winner',winner==='A');
    sceneCards[1].card.classList.toggle('winner',winner==='B');
  }
  function compare(enable){
    for(const st of roster())st.playing=false;
    comparing=enable;active=0;
    $('experiment').hidden=!enable;$('comparison-controls').hidden=!enable;
    $('workspace').classList.toggle('comparing',enable);
    document.body.classList.toggle('showdown-open',enable);
    press($('solo'),!enable);press($('showdown'),enable);
    press($('edit-a'),true);press($('edit-b'),false);
    if(enable&&$('preset').value==='')selectPreset(preset);
    buildCards();buildFields();rebuildClocks();
    if(enable&&revealed)reveal();
  }
  $('preset').innerHTML=options([...S.cases.map((p,i)=>[i,p.name]),['custom','Custom experiment']],0);
  $('preset').lastElementChild.disabled=true;
  $('preset').addEventListener('change',e=>selectPreset(+e.target.value));
  $('solo').addEventListener('click',()=>{if(comparing)compare(false);});
  $('showdown').addEventListener('click',()=>{
    if(!comparing){compare(true);if(guess===null&&storms.every(st=>st.t===-9))resetPrediction(true);}
  });
  $('fields').addEventListener('input',e=>{if(e.target.type==='range')updateField(e.target);});
  $('fields').addEventListener('change',e=>{if(e.target.dataset.field&&e.target.type!=='range')updateField(e.target);});
  for(const [i,key] of ['edit-a','edit-b'].entries()){
    $(key).addEventListener('click',()=>{
      active=i;press($('edit-a'),i===0);press($('edit-b'),i===1);buildFields();
    });
  }
  $('lock').checked=true;
  $('lock').addEventListener('change',()=>{
    if($('lock').checked){
      const st=storms[1-active], env=editable().model.s;
      st.model=S.build({...st.model.s,...Object.fromEntries(S.environments.map(k=>[k,env[k]]))});
      if(preset>=0&&S.environments.some(k=>S.cases[preset].a[k]!==S.cases[preset].b[k])){
        $('preset').value='custom';activeExplanation='Both storms now share the same shelf, tide and protective barrier.';
      }
      resetPrediction(false);
    }
  });
  $('independent').addEventListener('change',()=>{
    storms.forEach(st=>st.playing=false);
    if(!independent())storms[1].t=storms[0].t;
    resetPrediction(false);rebuildClocks();
  });
  $('answers').addEventListener('click',e=>{
    if(!e.target.dataset.guess)return;
    resetPrediction(true);guess=e.target.dataset.guess;
    press(e.target,true);
    $('result').textContent='Watch the water at the selected spot.';
    storms.forEach(st=>st.playing=true);
  });
  $('surprise').addEventListener('click',()=>{
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const base=pick(S.cases);
    const angle=pick([-25,0,30,45]),offset=pick([5,25,50]);
    selectPreset(-1,{a:{angle,offset,...base.a},b:{angle,offset,...base.b},explanation:base.explanation});
  });
  function switchView(isScience){
    targetScience=Number(isScience);press($('kid'),!isScience);press($('science'),isScience);
    $('science-note').hidden=!isScience;
  }
  $('kid').onclick=()=>switchView(false);
  $('science').onclick=()=>switchView(true);
  $('numbers').onchange=()=>{if(revealed)reveal();};
  $('guide').onclick=()=>$('guide-dialog').showModal();
  function presentation(on){
    document.body.classList.toggle('presentation',on);
    press($('fullscreen'),on);
    $('fullscreen').textContent=on?'⛶ Exit fullscreen':'⛶ Fullscreen';
    if(on)window.scrollTo(0,0);
  }
  $('fullscreen').onclick=async()=>{
    if(document.fullscreenElement){await document.exitFullscreen();return;}
    if(document.body.classList.contains('presentation')){presentation(false);return;}
    try{await document.documentElement.requestFullscreen();}
    catch{presentation(true);}
  };
  document.addEventListener('fullscreenchange',()=>presentation(!!document.fullscreenElement));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!document.fullscreenElement&&!$('guide-dialog').open) presentation(false);
  });

  const questions=[
    {q:'Can a Category 2 cause worse storm surge than a Category 4?',yes:true,p:0,why:S.cases[0].explanation},
    {q:'Can shallower Gulf water make the same storm’s surge higher?',yes:true,p:1,why:S.cases[1].explanation},
    {q:'Can the road flood before the hurricane makes landfall?',yes:true,t:-6,site:798,why:'Onshore winds can push water inland hours before the center reaches the coast. Try scrubbing to six hours before landfall.'},
    {q:'Will a raised house’s floor flood whenever the yard gets wet?',yes:false,t:-14,site:680,why:'Pilings lift the floor above the yard. Watch for the water to climb up to the floor mark.'},
    {q:'Do two hurricanes of the same category always flood a town the same way?',yes:false,p:4,why:'Change the storm track, shelf or speed. They can all change water levels even when the peak wind stays the same.'},
    {q:'Can high tide raise the total coastal water level?',yes:true,p:2,why:S.cases[2].explanation},
    {q:'Can low spots stay flooded after the wind calms down?',yes:true,t:19,site:798,why:'Water can collect in low spots and drain slowly. Compare Cypress Road with Shell Ridge late in the timeline.'}
  ];
  $('question').innerHTML=options(questions.map((_,i)=>[i,'Challenge '+(i+1)]),0);
  function showQuestion(){
    const q=questions[+$('question').value];$('challenge-prompt').textContent=q.q;
    $('challenge-feedback').textContent='';
  }
  $('question').onchange=showQuestion;showQuestion();
  $('challenge-answers').innerHTML='<button data-choice="true">Yes</button><button data-choice="false">No</button><button id="try">Try it in the lab</button>';
  $('challenge-answers').onclick=e=>{
    const challenge=questions[+$('question').value];
    if(e.target.id==='try'){
      if(challenge.p!==undefined){compare(true);selectPreset(challenge.p);}
      else{
        compare(false);solo=makeStorm({...S.defaults});solo.t=challenge.t;
        setProbe(challenge.site);buildFields();rebuildClocks();
      }
    }else if(e.target.dataset.choice) $('challenge-feedback').textContent=
      ((e.target.dataset.choice==='true')===challenge.yes?'You got it! ':'Try it and see. ')+challenge.why;
  };

  function renderCard(st,card,i,phase){
    const m=st.model,l=m.state(st.t),w=m.water(l,probe);
    const s=m.s, site=location();
    const env=s.protection==='none'?'Open coast':s.protection==='levee'?'Levee-protected coast':'Natural ridge coast';
    const title=comparing?'Storm '+(i?'B':'A')+' · '+S.categories[s.cat]:env;
    if(card.title.textContent!==title)card.title.textContent=title;
    card.track.textContent=comparing?s.wind+' mph · '+s.size+' storm · '+env:weatherWords(st.t);
    card.badge.hidden=!$('labels').checked;
    card.badgeText.textContent=l.spill>0?'Water overtopping':w.depth>.1?'Water at the probe':'Probe is dry';
    card.badge.classList.toggle('wet',w.depth>.1);
    card.draw(m,l,{phase,science,labels:$('labels').checked,numbers:$('numbers').checked,probe});
    card.readings.hidden=!$('numbers').checked;
    if(card.readings.hidden)return;
    const stats=m.stats(probe);
    const metrics=[['Storm surge',feet(l.surge)],['Astronomical tide',signed(l.predictedTide)+' ft'],
      ['Storm tide',signed(l.stormTide)+' ft'],['Wave setup',feet(l.setup)],['Depth at probe',feet(w.depth)]];
    if(m.crest!==null)metrics.push(['Exterior coastal level',signed(l.coastal)+' ft'],
      ['Interior water level',2.7+l.interior+l.rainPool>3?signed(2.7+l.interior+l.rainPool)+' ft':'Dry'],['Rainwater in basin',feet(l.rainPool)]);
    const html=metrics.map(([key,val])=>'<div><span>'+key+'</span><b>'+val+'</b></div>').join('');
    if(card.metrics.cached!==html){card.metrics.innerHTML=html;card.metrics.cached=html;}
    const dist=Math.round(Math.abs(l.t)*l.speed);
    const floor=site?.floor;
    const msg=(comparing?(w.depth>=.1?'Flooded · ':'Dry · '):'')+'Ground '+signed(w.z)+' ft'+
      (floor?' · Raised floor '+feet(floor)+' · '+(w.depth>0&&w.surface>=floor?feet(w.surface-floor)+' over floor':'floor dry'):'')+
      ' · '+(l.t===0?'At landfall':dist+' mi '+(l.t<0?'along track to landfall':'along track past landfall'))+
      ' · '+s.size[0].toUpperCase()+s.size.slice(1)+' storm'+
      (comparing&&!revealed&&st.t<S.END ? '' :
        ' · Peak '+feet(stats.peak)+(stats.peak>=.1?' · '+timestamp(stats.peakTime):'')+
        ' · Flooded '+(stats.hours>=1?Math.round(stats.hours):stats.hours.toFixed(1))+' h'+(stats.stillWet?' within window, still wet at end':''));
    if(card.probeInfo.textContent!==msg)card.probeInfo.textContent=msg;
  }
  let last=0,lastDraw=0,phase=0;
  function frame(now){
    const dt=last?Math.min(.30,(now-last)/1000):0;last=now;
    for(const st of roster()){
      if(st.playing){st.t=Math.min(S.END,st.t+dt*3.6*speed);if(st.t>=S.END)st.playing=false;}
    }
    if(comparing&&guess&&!revealed&&storms.every(st=>st.t>=S.END))reveal();
    if(now-lastDraw>=33||!lastDraw){
      lastDraw=now;
      science=reduced.matches?targetScience:science+(targetScience-science)*.22;
      if(!reduced.matches)phase=now/1000;
      roster().forEach((st,i)=>renderCard(st,sceneCards[i],i,phase));
      for(const clock of clocks){
        const st=clock.selected()[0],next=st.playing?'Ⅱ Pause':'▶ Play';
        clock.range.value=st.t;clock.range.setAttribute('aria-valuetext',timestamp(st.t));
        clock.time.textContent=timestamp(st.t);clock.stage.textContent=weatherWords(st.t);
        if(clock.button.textContent!==next)clock.button.textContent=next;
      }
      const st=editable(), l=st.model.state(st.t);
      $('fact-text').textContent=l.spill>0?'Water can flow over an intact levee. As the coast drains, water can still be trapped on the land side.':
        st.t>8?'The storm center can be far inland while water still covers coastal roads.':
        st.model.s.tide!=='mid'?'The Moon and Sun drive astronomical tides. Compare two different tide phases while keeping the wind the same.':
        'The Saffir–Simpson scale ranks hurricanes by their maximum sustained winds. A wider storm can push on more of the Gulf.';
    }
    requestAnimationFrame(frame);
  }
  compare(false);requestAnimationFrame(frame);
})();
