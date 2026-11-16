const levels=[
 {name:'The Castle Gate',zh:'城堡大門',size:3,target:'soft',goal:8,time:55},
 {name:'The Royal Towers',zh:'皇家高塔',size:4,target:'hard',goal:10,time:60},
 {name:'The Crystal Dungeon',zh:'水晶地城',size:5,target:'mixed',goal:12,time:70}
];
const words={
 soft:['city','cent','center','cereal','cinema','circle','cycle','pencil','face','rice','fancy','spicy','dancer','icy','race','place','nice'],
 hard:['cat','cake','cold','corn','cup','class','crab','music','picnic','doctor','castle','candy','camera','carrot','cloud','cream','cute','color','camp','clean']
};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const screens=$$('.screen'),tutorial=$('#tutorial'),pauseModal=$('#pause-modal');
const bgm=$('#bgm'); bgm.volume=.22;
const sounds={swing:$('#sfx-swing'),hit:$('#sfx-hit'),score:$('#sfx-score'),hurt:$('#sfx-hurt'),cheer:$('#sfx-cheer')};
Object.values(sounds).forEach(a=>a.volume=.72);
let bgmOn=true,sfxOn=true,currentLevel=0,score=0,lives=5,timeLeft=0,total=0,listens=0,timerId=null,spawnId=null,activeHole=null,paused=false,running=false,currentTarget='soft';
let unlocked=Math.max(0,Math.min(2,Number(localStorage.getItem('castleCUnlocked')||0)));

function showScreen(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));}
function playSfx(name,delay=0){if(!sfxOn)return;setTimeout(()=>{const a=sounds[name];a.currentTime=0;a.play().catch(()=>{});},delay)}
function speak(text,rate=.86){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=rate;u.pitch=1.05;speechSynthesis.speak(u)}
function startBgm(){if(bgmOn){bgm.play().catch(()=>{})}}
function syncAudioButtons(){ $$('.bgm-toggle').forEach(b=>{b.classList.toggle('off',!bgmOn);b.textContent=bgmOn?'♫':'♩'});$$('.sfx-toggle').forEach(b=>{b.classList.toggle('off',!sfxOn);b.textContent=sfxOn?'🔊':'🔇'})}
function openTutorial(){tutorial.classList.add('open');tutorial.setAttribute('aria-hidden','false')}
function closeTutorial(){tutorial.classList.remove('open');tutorial.setAttribute('aria-hidden','true')}
function renderMap(){
 $$('.level-card').forEach((b,i)=>{const ok=i<=unlocked;b.classList.toggle('unlocked',ok);b.disabled=!ok;const lock=b.querySelector('.lock');if(lock)lock.style.display=ok?'none':'block'});
 showScreen('map-screen'); startBgm();
}
function makeGrid(size){
 const grid=$('#hole-grid');grid.className=`hole-grid grid-${size}`;grid.innerHTML='';
 for(let i=0;i<size*size;i++){
  const hole=document.createElement('div');hole.className='hole';hole.setAttribute('role','button');hole.tabIndex=0;hole.setAttribute('aria-label','Empty castle hole');
  hole.innerHTML='<span class="mole-wrap"><img class="mole-img" src="assets/mole-normal.png" alt=""><span class="word-card"></span><button type="button" class="word-audio" aria-label="Listen to word" disabled tabindex="-1">🔊</button></span>';
  hole.addEventListener('click',e=>{if(e.target.classList.contains('word-audio')){e.stopPropagation();if(hole.dataset.word){listens++;speak(hole.dataset.word)}return}whack(hole,e)});
  hole.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===hole){e.preventDefault();whack(hole,{clientX:innerWidth/2,clientY:innerHeight/2})}});
  grid.appendChild(hole);
 }
}
function setTarget(type){currentTarget=type;const label=$('#target-label');label.textContent=type==='soft'?'SOFT C /s/':'HARD C /k/';label.className=type==='soft'?'soft-target':'hard-target';$('#mission-zh').textContent=type==='soft'?'找出發 /s/ 的 soft c 單字':'找出發 /k/ 的 hard c 單字'}
function startLevel(index){
 currentLevel=index;const l=levels[index];score=0;lives=5;total=0;listens=0;timeLeft=l.time;paused=false;running=true;
 makeGrid(l.size);setTarget(l.target==='mixed'?(Math.random()<.5?'soft':'hard'):l.target);
 $('#stage-label').textContent=`STAGE ${index+1} · ${l.size}×${l.size} · ${l.name.toUpperCase()}`;$('#goal-value').textContent=l.goal;updateHud();showScreen('game-screen');startBgm();
 clearInterval(timerId);timerId=setInterval(()=>{if(!paused&&running){timeLeft--;updateHud();if(timeLeft<=0)endLevel(false)}},1000);
 clearTimeout(spawnId);scheduleSpawn(450);
}
function updateHud(){
 $('#score-value').textContent=score;$('#time-value').textContent=timeLeft;$('#hearts').textContent=[0,1,2,3,4].map(i=>i<lives?'♥':'♡').join(' ');
}
function scheduleSpawn(delay=900){clearTimeout(spawnId);spawnId=setTimeout(spawnMole,delay)}
function spawnMole(){
 if(!running||paused)return;if(activeHole)hideMole(activeHole);
 if(levels[currentLevel].target==='mixed')setTarget(Math.random()<.5?'soft':'hard');
 const holes=$$('.hole'),hole=holes[Math.floor(Math.random()*holes.length)];const isTarget=Math.random()<.62;const type=isTarget?currentTarget:(currentTarget==='soft'?'hard':'soft');const list=words[type];const word=list[Math.floor(Math.random()*list.length)];
 hole.dataset.word=word;hole.dataset.type=type;hole.dataset.answered='false';hole.querySelector('.word-card').innerHTML=highlightC(word);const listen=hole.querySelector('.word-audio');listen.disabled=false;listen.tabIndex=0;hole.setAttribute('aria-label',`${word}. Press to whack, or use the listen button.`);hole.classList.add('active');activeHole=hole;
 const stay=Math.max(1300,2300-currentLevel*320);spawnId=setTimeout(()=>{if(hole.dataset.answered==='false')hideMole(hole);scheduleSpawn(180)},stay);
}
function highlightC(word){const i=word.toLowerCase().indexOf('c');return i<0?word:`${word.slice(0,i)}<span class="c-letter">${word[i]}</span>${word.slice(i+1)}`}
function hideMole(hole){hole.classList.remove('active','correct','wrong');hole.dataset.answered='true';delete hole.dataset.word;delete hole.dataset.type;hole.setAttribute('aria-label','Empty castle hole');hole.querySelector('.word-card').textContent='';const listen=hole.querySelector('.word-audio');listen.disabled=true;listen.tabIndex=-1;if(activeHole===hole)activeHole=null}
function hammerAt(e){const h=$('#hammer');h.style.left=`${e.clientX}px`;h.style.top=`${e.clientY}px`;h.classList.remove('swing');void h.offsetWidth;h.classList.add('swing')}
function feedback(good,word,type){const f=$('#feedback');f.className=`feedback show ${good?'good':'bad'}`;f.innerHTML=good?`✓ Correct! <b>${word}</b><br><small>答對了！</small>`:`✕ Not this time — <b>${word}</b> is ${type==='soft'?'soft c /s/':'hard c /k/'}<br><small>再看一次 c 後面的字母。</small>`;setTimeout(()=>f.classList.remove('show'),900)}
function whack(hole,e){
 if(!running||paused||!hole.classList.contains('active')||hole.dataset.answered==='true')return;hole.dataset.answered='true';hammerAt(e);playSfx('swing');const good=hole.dataset.type===currentTarget;total++;
 if(good){score++;hole.classList.add('correct');playSfx('score',100);feedback(true,hole.dataset.word,hole.dataset.type)}
 else{lives--;hole.classList.add('wrong');playSfx('hit',80);playSfx('hurt',180);feedback(false,hole.dataset.word,hole.dataset.type)}
 updateHud();clearTimeout(spawnId);setTimeout(()=>{hideMole(hole);if(score>=levels[currentLevel].goal)endLevel(true);else if(lives<=0)endLevel(false);else scheduleSpawn(220)},760);
}
function endLevel(success){
 if(!running)return;running=false;clearInterval(timerId);clearTimeout(spawnId);if(activeHole)hideMole(activeHole);
 const accuracy=total?Math.round(score/total*100):0;const starCount=success?(accuracy>=90?3:accuracy>=70?2:1):0;
 $('#result-stars').textContent=starCount?'★ '.repeat(starCount).trim():'☆ ☆ ☆';$('#result-title').textContent=success?'Crystal Restored!':'Try the Spell Again';$('#result-subtitle').textContent=success?'聲音水晶恢復力量了！':'再練習一次，你一定可以！';$('#result-score').textContent=`${score}/${levels[currentLevel].goal}`;$('#result-accuracy').textContent=`${accuracy}%`;$('#result-listens').textContent=listens;$('#result-mascot').src=success?'assets/mole-correct.png':'assets/mole-hit.png';
 if(success){playSfx('cheer');if(currentLevel<2){unlocked=Math.max(unlocked,currentLevel+1);localStorage.setItem('castleCUnlocked',String(unlocked))}}
 $('#continue-btn').querySelector('span').textContent=success&&currentLevel<2?'Next Stage':'Castle Map';$('#continue-btn').querySelector('small').textContent=success&&currentLevel<2?'下一關':'城堡地圖';showScreen('result-screen');
}
function togglePause(force){if(!running)return;paused=force??!paused;pauseModal.classList.toggle('open',paused);pauseModal.setAttribute('aria-hidden',String(!paused));if(!paused)scheduleSpawn(350)}

$('#start-btn').addEventListener('click',()=>{startBgm();openTutorial()});$('#how-btn').addEventListener('click',openTutorial);$('#tutorial-go').addEventListener('click',()=>{closeTutorial();renderMap()});$('.modal-close').addEventListener('click',closeTutorial);
$$('[data-action="home"]').forEach(b=>b.addEventListener('click',()=>showScreen('home-screen')));$$('[data-action="map"]').forEach(b=>b.addEventListener('click',()=>{running=false;clearInterval(timerId);clearTimeout(spawnId);renderMap()}));
$$('.level-card').forEach((b,i)=>b.addEventListener('click',()=>{if(i<=unlocked)startLevel(i)}));
$('#target-sound-btn').addEventListener('click',()=>speak(currentTarget==='soft'?'Soft C. The sound is sss, as in city.':'Hard C. The sound is k, as in castle.',.82));
$('#target-sound-btn').addEventListener('click',()=>{listens++;speak(currentTarget==='soft'?'Soft C. The sound is sss.':'Hard C. The sound is k.')});
$('#pause-btn').addEventListener('click',()=>togglePause());$('#resume-btn').addEventListener('click',()=>togglePause(false));
$$('.bgm-toggle').forEach(b=>b.addEventListener('click',()=>{bgmOn=!bgmOn;if(bgmOn)startBgm();else bgm.pause();syncAudioButtons()}));$$('.sfx-toggle').forEach(b=>b.addEventListener('click',()=>{sfxOn=!sfxOn;syncAudioButtons()}));
$('#retry-btn').addEventListener('click',()=>startLevel(currentLevel));$('#continue-btn').addEventListener('click',()=>{if(score>=levels[currentLevel].goal&&currentLevel<2)startLevel(currentLevel+1);else renderMap()});
syncAudioButtons();showScreen('home-screen');
