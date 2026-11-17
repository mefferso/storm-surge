const assert = require('node:assert/strict');
const {test} = require('node:test');
global.window = {};
require('./model.js');
const S = window.Surge;
const make = over => S.build({...S.defaults,...over});
const pair = i => [make(S.cases[i].a),make(S.cases[i].b)];
const peakSurge = m => Math.max(...m.levels.map(l=>l.surge));

test('the complete timeline and arbitrary scrubbing are reproducible',()=>{
  const m=make(), again=make();
  assert.deepEqual(m.levels,again.levels);
  const t=m.state(-7.2);
  m.state(22);
  assert.deepEqual(t,m.state(-7.2));
  assert.equal(m.state(-100).t,S.START);
  assert.equal(m.state(100).t,S.END);
  assert.equal(m.water(m.state(-24),680).depth,0);
  assert.ok(m.water(m.state(-6),680).depth>0);
  assert.ok(m.water(m.state(0),680).depth>m.water(m.state(19),680).depth);
  assert.equal(m.water(m.state(36),680).depth,0);
  assert.ok(m.water(m.state(36),798).depth>0);
});

test('Category 2 comparison exceeds the compact Category 4 in surge and depth',()=>{
  const [a,b]=pair(0);
  assert.ok(a.s.wind<b.s.wind);
  assert.ok(peakSurge(a)>peakSurge(b));
  assert.ok(a.stats(680).peak>b.stats(680).peak);
});

test('shelf changes geometry and surge; tide changes storm tide while surge stays equal',()=>{
  const [shallow,steep]=pair(1);
  assert.ok(peakSurge(shallow)>peakSurge(steep));
  assert.ok(S.ground(shallow.s,0)>S.ground(steep.s,0));
  const [high,low]=pair(2);
  for(let i=0;i<high.levels.length;i++) {
    const a=high.levels[i], b=low.levels[i];
    assert.equal(a.surge,b.surge);
    assert.equal(a.stormTide,a.surge+a.predictedTide);
    assert.equal(a.coastal,a.stormTide+a.setup);
  }
  assert.ok(high.state(0).stormTide>low.state(0).stormTide);
  assert.ok(high.stats(680).peak>low.stats(680).peak);
});

test('protected water is separate and overtopping depends on crest',()=>{
  const [levee,open]=pair(3);
  assert.equal(peakSurge(levee),peakSurge(open));
  assert.ok(levee.stats(680).peak<open.stats(680).peak);
  assert.ok(levee.levels.some(l=>l.spill>0));
  assert.ok(levee.levels.some(l=>l.spill===0&&l.interior>0));
  for(const l of levee.levels) assert.equal(l.spill,Math.max(0,l.coastal-levee.crest));
  const mild=make({cat:0,wind:55,size:'medium',protection:'levee'});
  assert.ok(mild.levels.every(l=>l.interior===0));
  assert.ok(mild.levels.some(l=>l.rainPool>0));
  assert.equal(mild.stats(680).peak,0);
});

test('faster storm can peak higher while the slow storm floods longer',()=>{
  const [fast,slow]=pair(4);
  assert.ok(peakSurge(fast)>peakSurge(slow));
  assert.ok(fast.stats(680).hours<slow.stats(680).hours);
});

test('depth follows the ground or user-selected height, and modeled peaks can shift',()=>{
  const m=make();
  const l=m.state(0), home=S.sites[2], w=m.water(l,home.x);
  assert.equal(w.depth,w.surface-S.ground(m.s,home.x));
  assert.ok(w.depth>w.surface-home.floor);
  const early=make({angle:-65,offset:0,shelf:'steep'});
  const peak=m=>m.levels.reduce((a,b)=>a.surge>b.surge?a:b);
  assert.ok(peak(early).t<0);
  assert.ok(peak(m).t>0);
});
