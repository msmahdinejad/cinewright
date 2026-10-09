import { Song, readCues, chord } from './lib/synth.mjs';

const cues=readCues('video.html'), time=cues.t;
const song=new Song({dur:cues.duration,bpm:cues.bpm,seed:281,tail:0});
const beat=song.B, kicks=[];
const roots=['F1','F1','Db2','Eb2'];
for(let index=0;index<28;index++){
 const at=index*beat;
 if(at>time.beyond-.20&&at<time.beyond)continue;
 if(index%4===0||index%4===2||index===5||index===11||index===17||index===23){song.kick(at,{vel:.9,f1:52,decay:.27,click:.25});kicks.push(at);}
 if(index%4===1||index%4===3){song.snare(at,{vel:.5,decay:.14,tone:185});song.clap(at+.008,{vel:.22,send:.14});}
 if(index>=4){song.hat(at,{vel:.25,pan:-.23,decay:.05});song.hat(at+beat/2,{vel:.39,pan:.25,open:index%4===2,decay:.085});}
 if(index>=4&&index<27){const rootNote=roots[Math.floor(index/4)%4];song.bass(at+beat*.5,rootNote,beat*.37,{vel:.4,cutoff:750+120*Math.sin(index),sub:.18,drive:1.3});}
 if(index<5)song.hit(at,{vel:.30,send:.12});
}
for(let index=0;index<4;index++)song.tick(index*beat+beat*.5,{vel:.20,pan:index%2?.4:-.4});
for(let block=0;block<7;block++){
 const start=block*4*beat;
 const notes=chord(['F3','F3','Db3','Eb3'][block%4],['min7','min7','maj7','dom7'][block%4]);
 song.pad(start,notes,4*beat,{vel:.14,attack:.22,release:.45,cutoff:1400,movement:.3,send:.16});
 if(block>0)song.arp(start+beat*.5,chord('F4','min7'),8,beat/2,(at,note,index)=>song.keys(at,note+(index%4===3?12:0),.20,{kind:'marimba',vel:.24,pan:Math.sin(index*1.6)*.6,send:.2,echo:.16}));
}
for(const [name,at] of Object.entries(time)){
 if(name==='ignition')continue;
 song.whoosh(at-.24,.25,{vel:name==='beyond'?.35:.26,from:350,to:6200,pan0:-.65,pan1:.65,send:.12});
 song.hit(at,{vel:name==='beyond'?.85:.36,send:.2});
}
song.riser(time.matter-.7,.66,{vel:.22,from:170,to:3900,send:.12});
song.sub(time.matter,'F1',.45,{vel:.20,drop:1.1});
for(let index=0;index<4;index++){const at=time.type+index*beat;song.tick(at,{vel:.24});song.keys(at,['F4','Ab4','C5','Eb5'][index],.14,{kind:'marimba',vel:.3,pan:index%2?.3:-.3,send:.09});}
for(let index=0;index<8;index++)song.rim(time.rhythm+index*beat/2,{vel:index%2?.20:.38,pan:index%2?.4:-.4});
song.arp(time.flow,chord('F5','min7'),12,beat/4,(at,note,index)=>song.pluck(at,note,.22,{vel:.18,bright:.75,pan:Math.sin(index)*.7,T60:.7,send:.25}));
song.riser(time.flow+.7,1.35,{vel:.25,from:240,to:8200,send:.08});
for(let index=0;index<6;index++)song.tom(time.beyond-.9+index*beat/4,{f:110+index*25,vel:.22+index*.03,send:.08});
for(const bus of ['music','drums','sfx','verb','delay']){
 const signal=song.buses[bus];
 for(let index=Math.floor((time.beyond-.15)*song.sr);index<Math.floor(time.beyond*song.sr);index++){
  const relative=(index/song.sr-(time.beyond-.15))/.15;
  const gain=relative<.18?1-relative/.18:.018;
  signal[0][index]*=gain;signal[1][index]*=gain;
 }
}
song.impact(time.beyond,{vel:.82,size:1.4,send:.23});song.kick(time.beyond,{vel:1.05,f1:49,decay:.5});song.sub(time.beyond,'F1',.8,{vel:.19,drop:1.25});song.downlifter(time.beyond,.85,{vel:.25,from:5200,to:260,send:.2});
song.pad(time.signature,chord('F3','maj9'),1.6,{vel:.36,attack:.05,release:.6,cutoff:2300,send:.35});
song.keys(time.signature,'F4',1.5,{kind:'ep',vel:.50,send:.3});song.keys(time.signature+.10,'C5',1.3,{kind:'bell',vel:.19,send:.35});song.keys(time.signature+.22,'G5',1.1,{kind:'bell',vel:.15,send:.35});song.sub(time.signature,'F1',.8,{vel:.18,drop:1});
song.duck('music',kicks,{depth:.3,attack:.006,release:.12});
song.write('audio.wav',{lufs:-14,ceiling:-1.5,tailKeep:0,fadeIn:.006,fadeOut:.38,reverb:{rt60:1.4,mix:.19},delay:{time:beat*.75,feedback:.22,mix:.13},gains:{drums:-1,sfx:-2}});
