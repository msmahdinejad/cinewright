import {Song,readCues,chord,progression} from './lib/synth.mjs';
const cues=readCues('video.html'),times=cues.t,duration=cues.duration;
const song=new Song({dur:duration,bpm:cues.bpm,seed:73});
const beat=60/cues.bpm,bar=beat*4,kicks=[];
const harmony=progression('A3','minor','i VI III VII'),roots=['A2','F2','C3','G2'];
for(let index=0;index<4;index++){
  const time=index*beat;song.kick(time,{vel:.58,f1:76,decay:.28});song.hit(time,{vel:.28});song.tick(time+beat*.5,{vel:.22,pan:index%2?.25:-.25});kicks.push(time);
}
song.riser(times.type3d-.55,.52,{vel:.28,from:420,to:5800});
for(let time=times.type3d,step=0;time<times.burst-.16;time+=beat,step++){
  song.kick(time,{vel:.58+.16*Math.min(step/18,1),f1:68,decay:.28,click:.22});kicks.push(time);
  if(step%2===1){song.snare(time,{vel:.48});song.clap(time+.012,{vel:.28});}
  song.hat(time+beat*.5,{vel:.36,pan:.22});song.hat(time+beat*.75,{vel:.16,pan:-.25});
}
for(let index=0;index<6;index++){
  const start=times.type3d+index*bar;if(start>=times.burst)break;
  const phraseDuration=Math.min(bar,times.burst-start);
  song.pad(start,harmony[index%4],phraseDuration+.22,{vel:.16,attack:.22,release:.35,cutoff:1600+index*180,movement:.3,send:.20});
  for(let offset=0;offset<phraseDuration-.02;offset+=beat*.5){song.bass(start+offset,roots[index%4],beat*.34,{vel:.29+index*.016,cutoff:1050+index*140,sub:.10,drive:1.2});}
}
const melody=['A4','E5','C5','A5','G5','E5','C5','E5'];
for(let time=times.morph,index=0;time<times.speed;time+=beat*.5,index++){
  song.pluck(time,melody[index%melody.length],beat*.42,{vel:.19,send:.18,echo:.10,pan:Math.sin(index*.9)*.3});
}
for(const [name,time] of Object.entries(times)){
  if(name==='slam')continue;song.whoosh(time-.22,.26,{vel:.38,from:550,to:6200,pan0:-.65,pan1:.65});
  if(name!=='end'&&name!=='burst')song.hit(time,{vel:.29});
}
song.sparkle(times.morph+.05,1.45,{vel:.22});song.chime(times.morph+.90,['A5','C6','E6'],{vel:.25});
song.arp(times.pattern,chord('A4','min7'),6,beat*.25,(time,midi,index)=>song.keys(time,midi,.22,{kind:'bell',vel:.24,send:.16,pan:Math.sin(index)*.45}));
for(let index=0;index<7;index++)song.tick(times.ui+.25+index*.12,{vel:.20,pan:-.35});
song.click(times.ui+1.10,{vel:.65});song.success(times.ui+1.14,{vel:.27});
song.sub(times.fluid,'A2',1.5,{vel:.11,drop:1.15});song.lead(times.fluid+.12,'E4',1.5,{vel:.12,wave:'saw',cutoff:1750,vibrato:4,send:.15,echo:.13});
song.riser(times.speed-.05,times.burst-times.speed-.10,{vel:.50,from:180,to:11000});
for(let index=0;index<7;index++){const time=times.burst-.80+index*.094;song.tom(time,{f:105+index*24,vel:.24+index*.047});}
for(const busName of ['music','drums','sfx','verb','delay']){const channels=song.bus(busName),start=Math.floor((times.burst-.12)*song.sr),finish=Math.ceil(times.burst*song.sr);for(let sample=start;sample<finish;sample++){const elapsed=sample/song.sr-(times.burst-.12),gain=elapsed<.030?1-elapsed/.030:elapsed>.105?(elapsed-.105)/.015:0;for(const channel of channels)channel[sample]*=Math.max(0,Math.min(1,gain));}}
song.impact(times.burst,{vel:.82,size:1.12});song.kick(times.burst,{vel:1.0,f1:66,decay:.45});kicks.push(times.burst);
song.sub(times.burst,'A1',1.15,{vel:.11,drop:1.25});song.sparkle(times.burst+.12,.95,{vel:.32});
for(let index=0;index<6;index++)song.pop(times.burst+.06+index*.065,{vel:.28,f0:650+index*190,pan:(index%2?1:-1)*.55});
song.pad(times.end,chord('A3','maj9'),duration-times.end,{vel:.35,attack:.05,release:.35,cutoff:2700,send:.24});
song.strings(times.end,chord('A3','maj7'),duration-times.end,{vel:.17,attack:.08,release:.28,send:.25});
song.chime(times.end,['A5','C#6','E6','B6'],{vel:.30});song.sub(times.end,'A2',1.4,{vel:.10,drop:1});
song.duck('music',kicks,{depth:.32,attack:.01,release:.13});
song.write('audio.wav',{lufs:-14,ceiling:-1.5,reverb:{rt60:1.5,mix:.16},delay:{mix:.12},fadeOut:.22,tailKeep:0,air:1.4,glueRatio:1.35,glueThreshold:-16});
