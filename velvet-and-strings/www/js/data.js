/* Velvet & Strings — content: styles, shapes, progression library, forms, learning path, trivia, composing guide. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VD = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const X = -1;

  const CATS = [
    { id: 'crooner', name: 'Crooners & Standards', acc: '#e6b85c' },
    { id: 'soul',    name: 'Soul & Blues',         acc: '#e0517a' },
    { id: 'rock',    name: 'Rock Ballads',         acc: '#ff8a5c' },
    { id: 'dark',    name: 'Dark & Noir',          acc: '#9b7bff' },
    { id: 'dream',   name: 'Dream & Art',          acc: '#3fd0c0' },
    { id: 'pop',     name: 'Pop & Folk',           acc: '#7fc8ff' }
  ];

  /* groove: arp | strum | pad | 68 | boom | shuffle · beat: ballad | disco | half | shuffle | train · form: see FORMS */
  const STYLES = [
    { id:'isaak', cat:'dark', artist:'Chris Isaak', style:'Noir Surf-Nocturne', bpm:108, key:'B', minor:true, mood:'dark', groove:'arp', beat:'ballad', form:'pop',
      vibe:'Moonlit reverb-drenched twang, a lonely highway after midnight and a heart that will not stop wanting.',
      secret:'Tremolo-picked single notes on a hollow-body drowned in spring reverb; sing breathy and close, then flip into falsetto on the last word of each line.',
      chords:[['Bm','i',[X,2,4,4,3,2]],['A','bVII',[X,0,2,2,2,0]],['E','IV',[0,2,2,1,0,0]],['E','IV',[0,2,2,1,0,0]]] },
    { id:'him', cat:'dark', artist:'HIM', style:'Gothic Love Metal', bpm:122, key:'C#', minor:true, mood:'dark', groove:'strum', beat:'ballad', form:'pop',
      vibe:'Velvet darkness and heavy guitars: love and death in the same breath, sung like a dark serenade.',
      secret:'Down-tune, double the riff with a clean chorus guitar, and keep the vocal low and seductive in the verse before a soaring baritone chorus.',
      chords:[['C#m','i',[X,4,6,6,5,4]],['A','bVI',[X,0,2,2,2,0]],['E','bIII',[0,2,2,1,0,0]],['B','bVII',[X,2,4,4,4,2]]] },
    { id:'elvis', cat:'crooner', artist:'Elvis Presley', style:'1950s Crooner Ballad', bpm:70, key:'C', minor:false, mood:'tender', groove:'68', beat:'ballad', form:'ballad',
      vibe:'A slow-dance doo-wop progression under a silky, trembling croon.',
      secret:'12/8 triplet piano feel, warm slapback echo on the voice, and a gospel-style backing "ooh" choir answering every line.',
      chords:[['C','I',[X,3,2,0,1,0]],['Em','iii',[0,2,2,0,0,0]],['Am','vi',[X,0,2,2,1,0]],['F','IV',[1,3,3,2,1,1]]] },
    { id:'orbison', cat:'crooner', artist:'Roy Orbison', style:'Operatic Heartbreak', bpm:78, key:'G', minor:false, mood:'dramatic', groove:'pad', beat:'ballad', form:'ballad',
      vibe:'Grand, cinematic heartache that keeps climbing until the voice breaks open.',
      secret:'The borrowed minor iv (C to Cm) is the tear in the voice; build the melody in steps so the final chorus lands an octave higher.',
      chords:[['G','I',[3,2,0,0,0,3]],['C','IV',[X,3,2,0,1,0]],['Cm','iv',[X,3,5,5,4,3]],['D7','V7',[X,X,0,2,1,2]]] },
    { id:'everly', cat:'pop', artist:'The Everly Brothers', style:'Acoustic Harmony', bpm:96, key:'E', minor:false, mood:'tender', groove:'strum', beat:'train', form:'strophic',
      vibe:'Bright open-chord strumming with two voices locked together like siblings.',
      secret:'Keep the harmony a strict third above the lead and move both voices in parallel; a capo and big open chords keep it ringing.',
      chords:[['E','I',[0,2,2,1,0,0]],['C#m','vi',[X,4,6,6,5,4]],['A','IV',[X,0,2,2,2,0]],['B7','V7',[X,2,1,2,0,2]]] },
    { id:'aerosmith', cat:'rock', artist:'Aerosmith', style:'Arena Power Ballad', bpm:68, key:'D', minor:false, mood:'dramatic', groove:'pad', beat:'half', form:'pop',
      vibe:'Lighters up: a piano intro grows into strings and an arena-size chorus.',
      secret:'The A/C# walk-down bass line is the emotional engine; save the full band and the screamed high note for the last chorus.',
      chords:[['D','I',[X,X,0,2,3,2]],['A/C#','V/3',[X,4,2,2,2,0]],['Bm','vi',[X,2,4,4,3,2]],['G','IV',[3,2,0,0,0,3]]] },
    { id:'beatles', cat:'dream', artist:'The Beatles', style:'Baroque Pop Ballad', bpm:66, key:'C', minor:false, mood:'tender', groove:'arp', beat:'ballad', form:'aaba',
      vibe:'A descending inner line under a string quartet and a tender, plain-spoken vocal.',
      secret:'Hold the C chord and move only one note down (C, B, Bb) — the line cliché pulls the ear toward the IV without leaving home.',
      chords:[['C','I',[X,3,2,0,1,0]],['Cmaj7','Imaj7',[X,3,2,0,0,0]],['C7','I7',[X,3,2,3,1,0]],['F','IV',[1,3,3,2,1,1]]] },
    { id:'modern', cat:'pop', artist:'Modern Talking', style:'80s Euro-Disco Romance', bpm:115, key:'D', minor:true, mood:'danceable', groove:'arp', beat:'disco', form:'pop',
      vibe:'Neon heartbreak on the dance floor: four-on-the-floor beat, sparkling synths and a falsetto hook.',
      secret:'Double the chorus hook with a high falsetto an octave up and a low unison under it; octave-bouncing bass on every eighth note.',
      chords:[['Dm','i',[X,X,0,2,3,1]],['Gm','iv',[3,5,5,3,3,3]],['C','bVII',[X,3,2,0,1,0]],['F','bIII',[1,3,3,2,1,1]]] },
    { id:'jones', cat:'soul', artist:'Tom Jones', style:'Brass-Fueled Dramatic Soul', bpm:118, key:'A', minor:true, mood:'dramatic', groove:'strum', beat:'disco', form:'pop',
      vibe:'Big band brass stabs, a swaggering groove and a voice that could fill a stadium without a mic.',
      secret:'Hit the E7 with horn stabs on the off-beats, and push the vocal from a growl in the verse to a full-chest belt on the chorus.',
      chords:[['Am','i',[X,0,2,2,1,0]],['E7','V7',[0,2,0,1,0,0]],['Dm','iv',[X,X,0,2,3,1]],['E7','V7',[0,2,0,1,0,0]]] },
    { id:'zeppelin', cat:'rock', artist:'Led Zeppelin', style:'Mystical Folk-Rock Ballad', bpm:74, key:'D', minor:false, mood:'dreamy', groove:'arp', beat:'ballad', form:'ballad',
      vibe:'Fingerpicked open strings, ringing drones and a slow build from a whisper to thunder.',
      secret:'Keep the top two strings ringing as a drone while the bass walks down (D, C, B, A); add recorder or mellotron flutes over the intro.',
      chords:[['D','I',[X,X,0,2,3,2]],['Cadd9','bVIIadd9',[X,3,2,0,3,0]],['G/B','IV/3',[X,2,0,0,0,3]],['A7sus4','V7sus4',[X,0,2,0,3,0]]] },
    { id:'buckley', cat:'dream', artist:'Jeff Buckley', style:'Ethereal Art-Rock', bpm:60, key:'B', minor:true, mood:'dreamy', groove:'68', beat:'ballad', form:'ballad',
      vibe:'Shimmering clean guitar, open extended chords and a voice that floats between a whisper and a cry.',
      secret:'Let the maj7 and 9th extensions ring through a chorus pedal and long reverb; sing in a fragile head voice and leave lots of space.',
      chords:[['Bm7','i7',[X,2,4,2,3,2]],['Gmaj7','bVImaj7',[3,2,0,0,0,2]],['Dmaj9','bIIImaj9',[X,X,0,2,2,0]],['A6','bVII6',[X,0,2,2,2,2]]] },
    { id:'muddy', cat:'soul', artist:'Muddy Waters', style:'Smoldering Chicago Blues', bpm:72, key:'E', minor:false, mood:'raw', groove:'shuffle', beat:'shuffle', form:'blues12',
      vibe:'Slow-burning electric blues: slide guitar, harmonica cries and a voice full of gravel and pride.',
      secret:'Use call and response — sing a line, let the slide guitar answer — and lean on the flat 7th in every chord. The 12-bar form is the backbone.',
      chords:[['E7','I7',[0,2,0,1,0,0]],['A7','IV7',[X,0,2,0,2,0]],['E7','I7',[0,2,0,1,0,0]],['B7','V7',[X,2,1,2,0,2]]] },
    { id:'sinatra', cat:'crooner', artist:'Frank Sinatra', style:'Swing Crooner Standard', bpm:112, key:'C', minor:false, mood:'tender', groove:'boom', beat:'shuffle', form:'aaba', swing:true,
      vibe:'Tuxedo romance: a lush orchestra, a gentle swing and a voice that phrases every word like a confession.',
      secret:'The ii–V–I with a VI7 turnaround keeps the song circling home; sing behind the beat and stretch the vowels at the end of each phrase.',
      chords:[['Dm7','ii7',[X,X,0,2,1,1]],['G7','V7',[3,2,0,0,0,1]],['Cmaj7','Imaj7',[X,3,2,0,0,0]],['A7','VI7',[X,0,2,0,2,0]]] },
    { id:'righteous', cat:'crooner', artist:'The Righteous Brothers', style:'Wall-of-Sound Serenade', bpm:72, key:'D', minor:false, mood:'dramatic', groove:'pad', beat:'ballad', form:'ballad',
      vibe:'Baritone and tenor trading lines over a cathedral of echo, strings and pounding drums.',
      secret:'Stack many instruments playing the same chord for a huge blur of sound; start the verse low and let the second voice answer an octave higher.',
      chords:[['D','I',[X,X,0,2,3,2]],['Bm','vi',[X,2,4,4,3,2]],['G','IV',[3,2,0,0,0,3]],['A','V',[X,0,2,2,2,0]]] },
    { id:'etta', cat:'soul', artist:'Etta James', style:'Slow 6/8 Soul Ballad', bpm:62, key:'F', minor:false, mood:'tender', groove:'68', beat:'ballad', form:'aaba',
      vibe:'Velvet strings, a slow-rolling 6/8 and a voice that sounds like finally being found.',
      secret:'Lean into the maj7 on the downbeat and let the strings swell on the ii–V; bend into the first note of each line from a semitone below.',
      chords:[['Fmaj7','Imaj7',[X,X,3,2,1,0]],['Dm7','vi7',[X,X,0,2,1,1]],['Gm7','ii7',[3,X,3,3,3,X]],['C7','V7',[X,3,2,3,1,0]]] },
    { id:'whitney', cat:'soul', artist:'Whitney Houston', style:'Gospel Power Ballad', bpm:64, key:'A', minor:false, mood:'dramatic', groove:'pad', beat:'half', form:'pop',
      vibe:'A hushed piano opening that grows into a gospel-sized key change and a note held forever.',
      secret:'Keep the first verse almost spoken, then climb; the classic move is a truck-driver key change up a step into the final chorus.',
      chords:[['A','I',[X,0,2,2,2,0]],['F#m','vi',[2,4,4,2,2,2]],['D','IV',[X,X,0,2,3,2]],['E/G#','V/3',[4,X,2,1,0,0]]] },
    { id:'sade', cat:'soul', artist:'Sade', style:'Smooth Quiet Storm', bpm:90, key:'A', minor:true, mood:'dreamy', groove:'pad', beat:'ballad', form:'pop',
      vibe:'Late-night silk: soft minor-seventh chords, a warm bass line and a cool, unhurried voice.',
      secret:'Extended chords (m7, m9, maj7) and a melodic bass carry the song; sing quietly, close to the mic, with almost no vibrato.',
      chords:[['Am7','i7',[X,0,2,0,1,0]],['Dm9','iv9',[X,5,3,5,5,X]],['Gmaj7','bVIImaj7',[3,2,0,0,0,2]],['Cmaj7','bIIImaj7',[X,3,2,0,0,0]]] },
    { id:'barry', cat:'soul', artist:'Barry White', style:'Silk Orchestral Soul', bpm:100, key:'D', minor:false, mood:'danceable', groove:'arp', beat:'disco', form:'pop',
      vibe:'Sweeping strings, a chicken-scratch guitar and a deep spoken-word baritone full of devotion.',
      secret:'Open with a spoken intro over the groove, keep the voice low and intimate, and let the string section play the hook.',
      chords:[['Em7','ii7',[0,2,0,0,0,0]],['A9','V9',[X,0,2,4,2,3]],['Dmaj7','Imaj7',[X,X,0,2,2,2]],['Bm7','vi7',[X,2,4,2,3,2]]] },
    { id:'adams', cat:'rock', artist:'Bryan Adams', style:'Heartland Love Rock', bpm:76, key:'G', minor:false, mood:'tender', groove:'strum', beat:'ballad', form:'pop',
      vibe:'A raspy, open-hearted vow over chiming acoustic guitars and a slow-burning band.',
      secret:'Use the I–V–vi–IV loop but break it in the bridge; a raspy voice works best when it holds back until the last chorus.',
      chords:[['G','I',[3,2,0,0,0,3]],['D','V',[X,X,0,2,3,2]],['Em','vi',[0,2,2,0,0,0]],['C','IV',[X,3,2,0,1,0]]] },
    { id:'prince', cat:'rock', artist:'Prince', style:'Purple Gospel-Rock Ballad', bpm:58, key:'Bb', minor:false, mood:'dramatic', groove:'pad', beat:'half', form:'ballad',
      vibe:'A slow, sacred rock anthem: chorus-soaked guitar chords, a falsetto plea and a solo that weeps.',
      secret:'Let the guitar chords ring with chorus and delay, sing the verse softly, and give the song a long guitar solo instead of a last verse.',
      chords:[['Bb','I',[X,1,3,3,3,1]],['Gm','vi',[3,5,5,3,3,3]],['F','V',[1,3,3,2,1,1]],['Eb','IV',[X,6,8,8,8,6]]] },
    { id:'fleetwood', cat:'rock', artist:'Fleetwood Mac', style:'Soft-Rock Yearning', bpm:84, key:'F', minor:false, mood:'dreamy', groove:'arp', beat:'ballad', form:'pop',
      vibe:'Fingerpicked acoustic guitar, a mystic alto and a band that sounds like a slow summer drive.',
      secret:'Fingerpick with a steady thumb on the bass strings; layered harmonies on the chorus hide the heartbreak in a warm sound.',
      chords:[['F','I',[1,3,3,2,1,1]],['C','V',[X,3,2,0,1,0]],['Dm','vi',[X,X,0,2,3,1]],['Bb','IV',[X,1,3,3,3,1]]] },
    { id:'cure', cat:'dark', artist:'The Cure', style:'Dreamy Post-Punk Romance', bpm:126, key:'E', minor:true, mood:'dark', groove:'arp', beat:'disco', form:'pop',
      vibe:'Chiming chorus guitars, a melodic bass line up high and a lovesick voice in a dark, swirling room.',
      secret:'Let the bass play the melody high on the neck while guitars shimmer with chorus; the vocal comes in late, after a long intro.',
      chords:[['Em','i',[0,2,2,0,0,0]],['C','bVI',[X,3,2,0,1,0]],['G','bIII',[3,2,0,0,0,3]],['D','bVII',[X,X,0,2,3,2]]] },
    { id:'morricone', cat:'dark', artist:'Ennio Morricone', style:'Spaghetti-Western Serenade', bpm:80, key:'A', minor:true, mood:'dramatic', groove:'arp', beat:'ballad', form:'strophic',
      vibe:'Desert twang, a lonely whistle and a wordless choir rising over a dusty sunset duel.',
      secret:'The Andalusian cadence (i–bVII–bVI–V) is pure drama; add a whistle or a wordless "ah" choir and twangy reverb guitar.',
      chords:[['Am','i',[X,0,2,2,1,0]],['G','bVII',[3,2,0,0,0,3]],['F','bVI',[1,3,3,2,1,1]],['E','V',[0,2,2,1,0,0]]] },
    { id:'depeche', cat:'dark', artist:'Depeche Mode', style:'Synth Dark Romance', bpm:112, key:'C', minor:true, mood:'dark', groove:'arp', beat:'disco', form:'pop',
      vibe:'Cold synth arpeggios, a deep baritone and devotion that feels a little dangerous.',
      secret:'Program the arpeggio tight and mechanical, keep the vocal warm and human on top; a minor key with major VI and III sounds both dark and hopeful.',
      chords:[['Cm','i',[X,3,5,5,4,3]],['Ab','bVI',[4,6,6,5,4,4]],['Eb','bIII',[X,6,8,8,8,6]],['Bb','bVII',[X,1,3,3,3,1]]] },
    { id:'lana', cat:'dream', artist:'Lana Del Rey', style:'Hollywood Sadcore', bpm:70, key:'A', minor:true, mood:'dreamy', groove:'pad', beat:'half', form:'pop',
      vibe:'Vintage strings, slow hip-hop drums and a sleepy voice singing about doomed glamour.',
      secret:'Sing low and lazy in the verse, then jump to a soft falsetto in the chorus; old-Hollywood strings over a slow beat create the mood.',
      chords:[['Am','i',[X,0,2,2,1,0]],['Fmaj7','bVImaj7',[X,X,3,2,1,0]],['C','bIII',[X,3,2,0,1,0]],['G','bVII',[3,2,0,0,0,3]]] },
    { id:'cash', cat:'pop', artist:'Johnny Cash & June Carter', style:'Boom-Chicka Duet', bpm:108, key:'G', minor:false, mood:'raw', groove:'boom', beat:'train', form:'strophic',
      vibe:'A train-beat rhythm guitar, a mariachi horn and two voices falling in love on the same microphone.',
      secret:'Alternate the bass note and a strum ("boom-chicka") on every beat; trade verses between two singers and join for the chorus.',
      chords:[['G','I',[3,2,0,0,0,3]],['C','IV',[X,3,2,0,1,0]],['D7','V7',[X,X,0,2,1,2]],['G','I',[3,2,0,0,0,3]]] }
  ];

  /* curated guitar shapes (standard tuning, low E -> high e); the generator covers everything else */
  const SHAPES = {
    'C':[X,3,2,0,1,0],'D':[X,X,0,2,3,2],'E':[0,2,2,1,0,0],'G':[3,2,0,0,0,3],'A':[X,0,2,2,2,0],'F':[1,3,3,2,1,1],'B':[X,2,4,4,4,2],
    'Am':[X,0,2,2,1,0],'Dm':[X,X,0,2,3,1],'Em':[0,2,2,0,0,0],'Bm':[X,2,4,4,3,2],'F#m':[2,4,4,2,2,2],'C#m':[X,4,6,6,5,4],'Gm':[3,5,5,3,3,3],'Cm':[X,3,5,5,4,3],'Fm':[1,3,3,1,1,1],
    'Bb':[X,1,3,3,3,1],'Eb':[X,6,8,8,8,6],'Ab':[4,6,6,5,4,4],'Db':[X,4,6,6,6,4],'F#':[2,4,4,3,2,2],'G#m':[4,6,6,4,4,4],'Bbm':[X,1,3,3,2,1],'Ebm':[X,6,8,8,7,6],
    'C7':[X,3,2,3,1,0],'D7':[X,X,0,2,1,2],'E7':[0,2,0,1,0,0],'G7':[3,2,0,0,0,1],'A7':[X,0,2,0,2,0],'B7':[X,2,1,2,0,2],'F7':[1,3,1,2,1,1],
    'Cmaj7':[X,3,2,0,0,0],'Dmaj7':[X,X,0,2,2,2],'Emaj7':[0,2,1,1,0,0],'Fmaj7':[X,X,3,2,1,0],'Gmaj7':[3,2,0,0,0,2],'Amaj7':[X,0,2,1,2,0],
    'Am7':[X,0,2,0,1,0],'Dm7':[X,X,0,2,1,1],'Em7':[0,2,0,0,0,0],'Bm7':[X,2,4,2,3,2],'F#m7':[2,4,2,2,2,2],'Gm7':[3,5,3,3,3,3],'Cm7':[X,3,5,3,4,3],
    'Asus4':[X,0,2,2,3,0],'Dsus4':[X,X,0,2,3,3],'Esus4':[0,2,2,2,0,0],'Asus2':[X,0,2,2,0,0],'Dsus2':[X,X,0,2,3,0],'Cadd9':[X,3,2,0,3,0],'Gadd9':[3,X,0,2,0,3],
    'E5':[0,2,2,X,X,X],'A5':[X,0,2,2,X,X],'D5':[X,X,0,2,3,X],'G5':[3,5,5,X,X,X],'C5':[X,3,5,5,X,X],'F5':[1,3,3,X,X,X],
    'Bdim':[X,2,3,4,3,X],'Bm7b5':[X,2,3,2,3,X],'Edim7':[0,1,2,0,2,0],'Am6':[X,0,2,2,1,2],'Fm6':[1,X,0,1,1,1],'Cm6':[X,3,1,2,1,3],'Dm6':[X,X,0,2,0,1]
  };
  STYLES.forEach(s => s.chords.forEach(([n, , f]) => { if (!SHAPES[n]) SHAPES[n] = f; }));
  const UKE_SHAPES = { 'C':[0,0,0,3],'G':[0,2,3,2],'Am':[2,0,0,0],'F':[2,0,1,0],'D':[2,2,2,0],'Em':[0,4,3,2],'Dm':[2,2,1,0],'A':[2,1,0,0],'E7':[1,2,0,2],'G7':[0,2,1,2],'C7':[0,0,0,1],'A7':[0,1,0,0],'Bb':[3,2,1,1] };

  /* ---------- progression library (Roman numerals; example titles only — no lyrics) ---------- */
  const LIB = [
    { id:'axis', name:'Pop axis', mode:'major', roman:['I','V','vi','IV'], tags:['pop','anthem'], level:2,
      desc:'Four chords that power countless hits: home, lift, ache, release. Rotate it to start on vi for a sadder colour.',
      ex:['Let It Be — The Beatles','No Woman, No Cry — Bob Marley & The Wailers','With or Without You — U2'] },
    { id:'sad-axis', name:'Sensitive axis', mode:'any', roman:['vi','IV','I','V'], tags:['pop','emotional'], level:2,
      desc:'The axis starting on the minor chord: the same four chords, but the song now leans melancholy and searching.',
      ex:['Zombie — The Cranberries'] },
    { id:'fifties', name:'50s doo-wop', mode:'major', roman:['I','vi','IV','V'], tags:['retro','ballad'], level:2,
      desc:'The slow-dance progression of the doo-wop era. The vi–IV–V climb makes the return to I feel like a hug.',
      ex:['Stand by Me — Ben E. King','Earth Angel — The Penguins'] },
    { id:'three', name:'Three-chord rock', mode:'major', roman:['I','IV','V','IV'], tags:['rock','folk','easy'], level:1,
      desc:'Tonic, subdominant, dominant — the three pillars of Western harmony. Easy to play, impossible to wear out.',
      ex:['La Bamba — Ritchie Valens','Twist and Shout — The Isley Brothers'] },
    { id:'mixo', name:'Mixolydian swagger', mode:'major', roman:['I','bVII','IV','I'], tags:['rock','swagger'], level:3,
      desc:'The borrowed bVII gives a rock-and-roll strut that never resolves through V. Great for confident, sunny choruses.',
      ex:['Sweet Home Alabama — Lynyrd Skynyrd','Sympathy for the Devil — The Rolling Stones'] },
    { id:'andalusian', name:'Andalusian cadence', mode:'minor', roman:['i','bVII','bVI','V'], tags:['drama','flamenco','noir'], level:3,
      desc:'A stepwise descent to a major V: flamenco fire, surf noir and spaghetti-western drama in four chords.',
      ex:['Hit the Road Jack — Ray Charles','Runaway — Del Shannon'] },
    { id:'epic-minor', name:'Epic minor loop', mode:'minor', roman:['i','bVI','bIII','bVII'], tags:['epic','dark','anthem'], level:3,
      desc:'Minor home with three major chords around it: dark but hopeful. A favourite of goth, synth-pop and film scores.',
      ex:[] },
    { id:'heartbreak', name:'Heartbreak iv', mode:'major', roman:['I','IV','iv','I'], tags:['ballad','bittersweet'], level:3,
      desc:'Major IV turning minor is the sound of a smile breaking. Borrowed from the parallel minor key.',
      ex:[] },
    { id:'creep', name:'Major III to minor iv', mode:'major', roman:['I','III','IV','iv'], tags:['alt','bittersweet'], level:4,
      desc:'A major III pulls upward, then the IV collapses to minor. Lush, uneasy and unforgettable.',
      ex:['Creep — Radiohead'] },
    { id:'cliche', name:'Line cliché', mode:'major', roman:['I','Imaj7','I7','IV'], tags:['ballad','baroque','voice-leading'], level:5,
      desc:'One inner voice descends a semitone at a time (8 → 7 → b7 → 6) while the chord stays. Pure voice-leading magic.',
      ex:['Something — The Beatles'] },
    { id:'minor-cliche', name:'Minor line cliché', mode:'minor', roman:['i','i(maj7)','i7','i6'], tags:['jazz','noir','voice-leading'], level:5,
      desc:'The minor version: the root falls chromatically inside the chord. Mysterious and cinematic.',
      ex:['My Funny Valentine — Rodgers & Hart (standard)'] },
    { id:'iivi', name:'ii–V–I', mode:'major', roman:['ii7','V7','Imaj7','Imaj7'], tags:['jazz','standard'], level:8,
      desc:'The heart of jazz harmony: predominant, dominant, tonic. Every standard is built from chains of these.',
      ex:['Autumn Leaves — Kosma/Prévert (standard)'] },
    { id:'circle', name:'Circle turnaround', mode:'major', roman:['vi7','ii7','V7','Imaj7'], tags:['jazz','crooner'], level:8,
      desc:'Falling fifths: each chord pulls to the next. The engine of swing-era romance.',
      ex:['Fly Me to the Moon — Bart Howard (standard)'] },
    { id:'rhythm', name:'Rhythm changes A', mode:'major', roman:['I','vi','ii','V'], tags:['jazz','swing'], level:5,
      desc:'A quick I–vi–ii–V cycle, two chords per bar in jazz. Light, bouncy and endlessly reharmonisable.',
      ex:['I Got Rhythm — George & Ira Gershwin'] },
    { id:'blues12', name:'12-bar blues', mode:'major', roman:['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7'], tags:['blues','rock'], level:5,
      desc:'Three lines of four bars: statement, repeat over IV, answer over V. The backbone of blues and early rock & roll.',
      ex:['Johnny B. Goode — Chuck Berry','Hound Dog — Big Mama Thornton / Elvis Presley'] },
    { id:'quickchange', name:'Quick-change blues', mode:'major', roman:['I7','IV7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7'], tags:['blues'], level:5,
      desc:'The 12-bar with a jump to IV in bar 2 — more movement right away.', ex:[] },
    { id:'minorblues', name:'Minor blues', mode:'minor', roman:['i7','i7','i7','i7','iv7','iv7','i7','i7','bVI7','V7','i7','V7'], tags:['blues','dark'], level:6,
      desc:'Blues in a minor key: moodier, with a bVI7 → V7 turn that stabs at the end.', ex:['The Thrill Is Gone — B.B. King'] },
    { id:'pachelbel', name:'Canon sequence', mode:'major', roman:['I','V','vi','iii','IV','I','IV','V'], tags:['classical','wedding'], level:3,
      desc:'A bass line falling in steps under rising harmony — the wedding-aisle progression.',
      ex:['Canon in D — Johann Pachelbel'] },
    { id:'dorian', name:'Dorian vamp', mode:'minor', roman:['i7','IV9'], tags:['latin','groove','soul'], level:6,
      desc:'Minor tonic with a major IV: the raised 6th of Dorian. Hypnotic, sensual, made for long grooves.',
      ex:['Oye Como Va — Tito Puente / Santana'] },
    { id:'plagal', name:'Gospel plagal', mode:'major', roman:['I','I7','IV','iv'], tags:['gospel','soul'], level:4,
      desc:'Tonic turning into a dominant 7th that lands on IV, then the minor iv sigh — an "amen" with goosebumps.', ex:[] },
    { id:'lament', name:'Lament bass', mode:'minor', roman:['i','v/3','bVII','bVI','V'], tags:['baroque','tragic'], level:6,
      desc:'A bass line walking down from the tonic to the dominant — centuries of musical grief in one gesture.',
      ex:['Stairway to Heaven (intro idea: descending bass) — Led Zeppelin'] },
    { id:'royal', name:'Lift to the chorus', mode:'major', roman:['IV','V','iii','vi'], tags:['pop','pre-chorus'], level:4,
      desc:'Starting on IV and avoiding the tonic builds suspense — perfect for a pre-chorus that launches the chorus.', ex:[] },
    { id:'power-ballad', name:'Power ballad climb', mode:'major', roman:['vi','IV','V','V'], tags:['rock','pre-chorus'], level:2,
      desc:'Two bars on the dominant at the end hold the breath before the chorus explodes.', ex:[] },
    { id:'phrygian', name:'Phrygian flamenco', mode:'minor', roman:['i','bII','i','bII'], tags:['exotic','dark'], level:6,
      desc:'A half-step above the tonic: Spanish, desert-hot, menacing.', ex:[] }
  ];

  /* ---------- song forms (gen = which generator fills the section) ---------- */
  const FORMS = {
    pop:     { name:'Verse–Pre–Chorus pop', secs:[['Intro','intro',1],['Verse','verse',2],['Pre-Chorus','pre',1],['Chorus','chorus',2],['Verse','verse',2],['Pre-Chorus','pre',1],['Chorus','chorus',2],['Bridge (Twist)','bridge',1],['Climactic Chorus','climax',2],['Outro','outro',1]] },
    ballad:  { name:'Ballad build',          secs:[['Intro','intro',1],['Verse','verse',2],['Verse','verse',2],['Chorus','chorus',2],['Verse','verse',2],['Chorus','chorus',2],['Solo','solo',1],['Bridge (Twist)','bridge',1],['Climactic Chorus','climax',2],['Outro','outro',1]] },
    aaba:    { name:'32-bar AABA standard',  secs:[['Intro','intro',1],['Verse','a',2],['Verse','a',2],['Bridge (Twist)','b',2],['Verse','a',2],['Solo','a',2],['Bridge (Twist)','b',2],['Verse','a',2],['Outro','outro',1]] },
    blues12: { name:'12-bar blues',          secs:[['Intro','intro',1],['Verse','blues',1],['Verse','blues',1],['Solo','blues',1],['Verse','blues',1],['Solo','blues',1],['Verse','blues',1],['Outro','outro',1]] },
    strophic:{ name:'Folk / strophic',       secs:[['Intro','intro',1],['Verse','verse',2],['Verse','verse',2],['Chorus','chorus',1],['Verse','verse',2],['Solo','solo',1],['Verse','verse',2],['Chorus','chorus',2],['Outro','outro',1]] },
    sketch:  { name:'Quick sketch',          secs:[['Verse','verse',2],['Chorus','chorus',2],['Verse','verse',2],['Chorus','chorus',2],['Bridge (Twist)','bridge',1],['Climactic Chorus','climax',2]] }
  };
  const SECTION_TYPES = ['Intro','Verse','Pre-Chorus','Chorus','Bridge (Twist)','Solo','Climactic Chorus','Outro'];
  const SEC_DEF = {
    'Intro':[35,'Hum softly, no words yet'], 'Verse':[50,'Low, intimate, conversational'], 'Pre-Chorus':[65,'Build breath, rise in pitch'],
    'Chorus':[85,'Open throat, full chest voice'], 'Bridge (Twist)':[60,'Fragile head voice over the twist'], 'Solo':[75,'Let the guitar sing; ad-libs only'],
    'Climactic Chorus':[100,'Key-change energy, belt the top note'], 'Outro':[30,'Whispered last line, let it ring']
  };

  /* ---------- lyric tools ---------- */
  const RHYMES = {
    heart:['heart','apart','start','part','art','chart','dark','spark','scar'],
    love:['love','above','of','enough','glove','dove','dreamt of','thinking of','rough'],
    night:['night','light','tonight','bright','tight','white','flight','candlelight','fight'],
    fire:['fire','desire','higher','wire','liar','choir','sapphire','inspire','tired'],
    kiss:['kiss','this','miss','bliss','abyss','wish','reminisce','amiss','lips'],
    eyes:['eyes','skies','lies','goodbyes','sighs','disguise','rise','surprise','lullabies'],
    rain:['rain','pain','again','chain','remain','vain','champagne','refrain','train'],
    soul:['soul','whole','control','roll','gold','hold','cold','console','old'],
    forever:['forever','never','together','whatever','weather','tether','ever','clever','leather'],
    alone:['alone','stone','phone','own','known','home','bone','overgrown','gone'],
    moon:['moon','June','soon','tune','croon','swoon','afternoon','room','bloom'],
    away:['away','stay','say','gray','play','okay','Sunday','yesterday','pray'],
    you:['you','true','blue','through','new','do','knew','avenue','undo'],
    me:['me','free','sea','be','see','memory','key','sympathy','believe'],
    time:['time','mine','line','shine','wine','sign','design','fine','divine'],
    dream:['dream','seem','scream','stream','gleam','between','team','extreme','queen'],
    go:['go','know','slow','glow','below','radio','show','snow','hello'],
    burn:['burn','turn','learn','return','yearn','concern','stern','fern','earned']
  };
  const PROMPTS = {
    crooner:['A jukebox playing your song in an empty diner','Satin gloves left on a dance-hall chair','A slow dance under a single streetlight','Moonlight on a chrome Cadillac fender','A wedding band playing to an empty room'],
    soul:['Candle wax on a piano lid at 3 a.m.','A letter you never had the nerve to send','Church bells and a slow-burning promise','Your perfume still on my coat collar','A voicemail I play back every night'],
    rock:['Headlights on an empty highway home','A stadium of lighters singing back to you','The last train leaving a rainy station','Writing your name on a fogged-up window','A guitar case full of old love letters'],
    dark:['Black roses on a velvet pillow','A neon sign buzzing over a motel bed','Whispered vows in a cathedral of shadows','A desert wind that still says your name','A key to a house that burned down'],
    dream:['Swimming in a pool of starlight','A Polaroid fading in the afternoon sun','Floating through a cloud of old perfume','Sleeping in your sweater on the floor','A film reel of us running backwards'],
    pop:['A mirror ball spinning just for us','Two voices on one microphone','Dancing barefoot in the kitchen','A summer radio hit we called our own','Holding hands on a ferris wheel at closing time']
  };
  const ADJ = ['Velvet','Midnight','Crimson','Silver','Burning','Lonely','Golden','Neon','Wild','Tender','Electric','Broken','Sweet','Blue','Wicked','Paper','Last','Secret','Holy','Restless'];
  const NOUN = ['Heart','Highway','Rose','Kiss','Moon','Fire','Letter','Dance','Rain','Promise','Serenade','Desire','Angel','Mirror','Lullaby','Summer','Motel','Halo','Telephone','Ballroom'];

  const CHALLENGES = {
    harmony:['Use a borrowed iv chord somewhere','Put a bVII in the chorus','Add one secondary dominant (V7/vi)','Start the chorus on a chord the verse never uses','Write the bridge entirely on chords not in the verse','Use a sus4 that resolves','End the song on the IV instead of I','Key change up a whole step for the last chorus'],
    rhythm:['Write it in 6/8','Swing feel only','Half-time drums in the chorus','Tempo under 70 BPM','Tempo over 115 BPM','Leave a full bar of silence before the last chorus'],
    lyric:['Never use the word "love"','Set the whole song in a single room','Write to "you" in the second person','Put a colour in every verse','Tell the story backwards, from the end','Start with a line of dialogue','Name a real street, town or year','The title must be a question'],
    melody:['Chorus melody starts on the highest note of the song','Verse uses only 4 different notes','Use one big leap (6th or octave) in the chorus','Repeat the title three times in the chorus']
  };

  /* ---------- learning path (guitar) ---------- */
  const LEVELS = [
    { n:1, name:'First chords', goal:'Play six open chords cleanly and switch between two of them.',
      chords:['Em','Am','C','G','D','E'], drills:[['Em','Am',20],['C','G',15],['G','D',15]],
      songs:[{ name:'Two-chord sway', key:'Em', roman:['i','iv'], tempo:70 },{ name:'Campfire three', key:'G', roman:['I','IV','V','IV'], tempo:70 }],
      tip:'Press with fingertips right behind the fret wire. Lift all fingers together and land them as a shape.' },
    { n:2, name:'Changes & strumming', goal:'Change chords on the beat while strumming D-DU-UDU.',
      chords:['G','C','D','Em','Am','A'], drills:[['G','C',30],['C','D',30],['Em','C',30],['Am','G',30]],
      songs:[{ name:'Pop axis in G', key:'G', lib:'axis', tempo:80 },{ name:'Doo-wop in C', key:'C', lib:'fifties', tempo:72 }],
      tip:'Keep the strumming hand moving even when you miss a chord — rhythm first, perfect shapes later.' },
    { n:3, name:'The F and power chords', goal:'Play F, Bm and power chords; rock the Andalusian cadence.',
      chords:['F','Bm','E5','A5','D5','G5'], drills:[['C','F',20],['F','G',20],['D','Bm',20]],
      songs:[{ name:'Pop axis in C (with F)', key:'C', lib:'axis', tempo:80 },{ name:'Andalusian in Am', key:'Am', lib:'andalusian', tempo:84 }],
      tip:'For F, roll the index finger slightly onto its bony side and keep the elbow close to your body.' },
    { n:4, name:'Barre freedom', goal:'Move E- and A-shape barres anywhere; know the notes on the low E and A strings.',
      chords:['F#m','C#m','Bb','B','Gm','Cm'], drills:[['F#m','D',20],['Bb','C',20],['C#m','A',20]],
      songs:[{ name:'Sensitive axis in A', key:'A', lib:'sad-axis', tempo:76 },{ name:'Epic minor in Cm', key:'Cm', lib:'epic-minor', tempo:96 }], fret:[0,1],
      tip:'The root of an E-shape barre is on the 6th string, an A-shape barre on the 5th. Learn those two strings and you can find any chord.' },
    { n:5, name:'Colour chords', goal:'Add 7ths, maj7, sus and add9 colours; play a 12-bar blues.',
      chords:['Cmaj7','Am7','Dsus4','Cadd9','E7','A7','B7'], drills:[['Cmaj7','Am7',30],['E7','A7',30],['A7','B7',25]],
      songs:[{ name:'12-bar blues in E', key:'E', lib:'blues12', tempo:84, swing:true },{ name:'Line cliché in C', key:'C', lib:'cliche', tempo:66 }],
      tip:'Colour chords are usually one finger different from the plain chord. Find that one finger and the change becomes easy.' },
    { n:6, name:'Across the neck', goal:'Play the same chord in three positions; find any note on any string.',
      chords:['C','A','G','E','D'], drills:[['G','C',35],['D','A',35]], voicings:true,
      songs:[{ name:'Minor blues in Am', key:'Am', lib:'minorblues', tempo:80, swing:true },{ name:'Dorian vamp in Dm', key:'Dm', lib:'dorian', tempo:96 }], fret:[0,1,2,3,4,5],
      tip:'The CAGED idea: C, A, G, E and D open shapes slide up the neck as barres and link into each other. Use the voicing explorer to see them.' },
    { n:7, name:'Lead lines', goal:'Improvise with the minor pentatonic scale over a progression.',
      chords:['Am','G','F','E'], drills:[['Am','G',40],['F','E',40]], scale:'pentMin',
      songs:[{ name:'Solo over Andalusian', key:'Am', lib:'andalusian', tempo:90 },{ name:'Solo over minor blues', key:'Am', lib:'minorblues', tempo:84, swing:true }],
      tip:'Target a chord tone on beat 1 of each bar. Bend into it, leave space, and repeat ideas before changing them.' },
    { n:8, name:'Jazz & soul voicings', goal:'Play ii–V–I chains, half-diminished and ninth chords.',
      chords:['Dm7','G7','Cmaj7','Bm7b5','E7','Am7','Dm9','A9'], drills:[['Dm7','G7',40],['G7','Cmaj7',40],['Bm7b5','E7',30]],
      songs:[{ name:'ii–V–I in C', key:'C', lib:'iivi', tempo:100, swing:true },{ name:'Circle turnaround', key:'C', lib:'circle', tempo:110, swing:true }],
      tip:'Jazz voicings often drop the 5th and keep the 3rd and 7th — the two notes that define the chord.' }
  ];

  /* ---------- trivia (well-documented facts only) ---------- */
  const TRIVIA = [
    { q:'Which artist recorded "Can’t Help Falling in Love" for the 1961 film Blue Hawaii?', a:'Elvis Presley', t:'artist' },
    { q:'"Heartbreak Hotel" (1956) was the first RCA single by which singer?', a:'Elvis Presley', t:'artist' },
    { q:'In which year did Roy Orbison release "Oh, Pretty Woman"?', a:'1964', t:'year' },
    { q:'Roy Orbison was a member of which supergroup with George Harrison, Bob Dylan, Tom Petty and Jeff Lynne?', a:'Traveling Wilburys', t:'text', w:['The Highwaymen','Cream','Blind Faith'] },
    { q:'Which duo released "All I Have to Do Is Dream" in 1958?', a:'The Everly Brothers', t:'artist' },
    { q:'Which Beatle wrote "Something"?', a:'George Harrison', t:'text', w:['John Lennon','Paul McCartney','Ringo Starr'] },
    { q:'Aerosmith’s "I Don’t Want to Miss a Thing" (1998) was written by which songwriter?', a:'Diane Warren', t:'text', w:['Desmond Child','Jim Steinman','Max Martin'] },
    { q:'"I Don’t Want to Miss a Thing" was the theme of which 1998 film?', a:'Armageddon', t:'text', w:['Titanic','Deep Impact','Godzilla'] },
    { q:'Modern Talking was the duo of Dieter Bohlen and…', a:'Thomas Anders', t:'text', w:['Falco','Nino de Angelo','Chris Norman'] },
    { q:'Tom Jones comes from which country?', a:'Wales', t:'text', w:['Scotland','Ireland','England'] },
    { q:'"It’s Not Unusual" was a 1965 hit for…', a:'Tom Jones', t:'artist' },
    { q:'"Stairway to Heaven" appears on which band’s untitled fourth album (1971)?', a:'Led Zeppelin', t:'artist' },
    { q:'Jeff Buckley’s only completed studio album, released in 1994, is called…', a:'Grace', t:'text', w:['Hallelujah','Sketches','Lover, You Should’ve Come Over'] },
    { q:'Who wrote "Hallelujah", famously covered by Jeff Buckley?', a:'Leonard Cohen', t:'text', w:['Bob Dylan','John Cale','Paul Simon'] },
    { q:'"Hoochie Coochie Man" (1954), recorded by Muddy Waters, was written by…', a:'Willie Dixon', t:'text', w:['Howlin’ Wolf','Robert Johnson','B.B. King'] },
    { q:'Muddy Waters recorded his classic sides for which Chicago label?', a:'Chess Records', t:'text', w:['Sun Records','Motown','Stax'] },
    { q:'HIM, the "love metal" band led by Ville Valo, comes from which country?', a:'Finland', t:'text', w:['Sweden','Norway','Germany'] },
    { q:'Chris Isaak’s "Wicked Game" was featured in which David Lynch film (1990)?', a:'Wild at Heart', t:'text', w:['Blue Velvet','Mulholland Drive','Lost Highway'] },
    { q:'Frank Sinatra recorded "Fly Me to the Moon" in 1964 with which bandleader?', a:'Count Basie', t:'text', w:['Duke Ellington','Glenn Miller','Benny Goodman'] },
    { q:'"You’ve Lost That Lovin’ Feelin’" (1964) was produced by the inventor of the Wall of Sound…', a:'Phil Spector', t:'text', w:['Quincy Jones','George Martin','Berry Gordy'] },
    { q:'"Unchained Melody" by the Righteous Brothers returned to fame in which 1990 film?', a:'Ghost', t:'text', w:['Dirty Dancing','Pretty Woman','Top Gun'] },
    { q:'Who sang the 1960 soul ballad "At Last"?', a:'Etta James', t:'artist' },
    { q:'"I Will Always Love You", a 1992 smash for Whitney Houston, was written by…', a:'Dolly Parton', t:'text', w:['Diane Warren','Carole King','Linda Ronstadt'] },
    { q:'Whitney Houston’s "I Will Always Love You" comes from the soundtrack of…', a:'The Bodyguard', t:'text', w:['Waiting to Exhale','The Preacher’s Wife','Sparkle'] },
    { q:'Sade’s "Smooth Operator" comes from the 1984 debut album…', a:'Diamond Life', t:'text', w:['Promise','Stronger Than Pride','Love Deluxe'] },
    { q:'"Can’t Get Enough of Your Love, Babe" (1974) was a hit for…', a:'Barry White', t:'artist' },
    { q:'Bryan Adams’ "(Everything I Do) I Do It for You" was written for which 1991 film?', a:'Robin Hood: Prince of Thieves', t:'text', w:['Braveheart','The Three Musketeers','Ghost'] },
    { q:'"Purple Rain" was both an album and a 1984 film starring…', a:'Prince', t:'artist' },
    { q:'Which Fleetwood Mac member wrote "Dreams" from Rumours (1977)?', a:'Stevie Nicks', t:'text', w:['Christine McVie','Lindsey Buckingham','Mick Fleetwood'] },
    { q:'The Cure’s "Lovesong" (1989) appears on which album?', a:'Disintegration', t:'text', w:['Pornography','Wish','The Head on the Door'] },
    { q:'Ennio Morricone scored "The Good, the Bad and the Ugly" (1966) for which director?', a:'Sergio Leone', t:'text', w:['Federico Fellini','Sergio Corbucci','Bernardo Bertolucci'] },
    { q:'Depeche Mode’s "Enjoy the Silence" (1990) comes from the album…', a:'Violator', t:'text', w:['Music for the Masses','Songs of Faith and Devotion','Black Celebration'] },
    { q:'"Video Games" (2011) was the breakthrough song of…', a:'Lana Del Rey', t:'artist' },
    { q:'Johnny Cash and June Carter won a Grammy for which 1967 duet?', a:'Jackson', t:'text', w:['Ring of Fire','Walk the Line','Folsom Prison Blues'] },
    { q:'"Ring of Fire" was co-written by June Carter and recorded by…', a:'Johnny Cash', t:'text', w:['Elvis Presley','Roy Orbison','Buddy Holly'] }
  ];
  const TRIVIA_ARTISTS = ['Elvis Presley','Roy Orbison','The Everly Brothers','Tom Jones','Led Zeppelin','Etta James','Barry White','Prince','Lana Del Rey','Frank Sinatra','The Righteous Brothers','Bryan Adams','Chris Isaak','Whitney Houston','Sade'];

  /* ---------- composing guide ---------- */
  const GUIDE = [
    { id:'idea', title:'1 · Start with one sentence', body:[
      'Before chords, write what the song is about in one plain sentence: "I still set two plates at dinner." That sentence becomes your compass for every choice.',
      'A strong concept has tension: a want and an obstacle. Love songs land hardest from an unusual angle — the moment before the kiss, the morning after, the object left behind.',
      'Find the title inside that sentence. Short, singable, a little surprising. If you can picture it, you can write it.'] },
    { id:'form', title:'2 · Form is contrast', body:[
      'Verses tell the story (who, where, what happened). The chorus states the big feeling and carries the title. The bridge offers a new angle or a twist.',
      'Make each section different in at least two ways: melody range, rhythm density, chords, lyric detail or arrangement. If the chorus feels like the verse, it is not a chorus yet.',
      'Get to the first chorus quickly — within about a minute. Keep intros short; a fan can always loop the good part, a stranger will skip.',
      'Try the templates in Write ▸ Form: pop, ballad build, AABA standard, 12-bar blues and folk strophic each solve a different storytelling problem.'] },
    { id:'harmony', title:'3 · Harmony that moves', body:[
      'Think in functions: tonic (home, I/vi), subdominant (away, IV/ii), dominant (tension, V). Songs breathe by leaving home and coming back.',
      'Loops (I–V–vi–IV) keep energy constant; cadences (ii–V–I) create arrivals. Use loops for grooves and verses, cadences to land the title.',
      'Start the chorus on a different chord than the verse — often IV or vi — so the ear feels the gear change even before the melody arrives.',
      'Borrow from the parallel key for colour: iv, bVI and bVII in a major key. One borrowed chord in the bridge does more than five in the verse.',
      'Watch the bass: inversions (V/3, I/5) let the bass walk stepwise and make simple chords sound expensive. That is the Aerosmith and Beatles trick in this app.',
      'Key change: up a semitone or whole step for the last chorus (the "truck-driver" lift). Prepare it with the new key’s V chord, or just jump boldly on the downbeat.'] },
    { id:'melody', title:'4 · Melody is the song', body:[
      'Sing the verse low and narrow, the chorus higher and wider. Range contrast is the cheapest, most reliable way to make a chorus explode.',
      'Repeat, then vary. Say an idea, repeat it, change the ending. Listeners need repetition to remember and variation to stay awake.',
      'Land chord tones on strong beats (1 and 3) and use passing notes in between. The Voices panel shows you which notes belong to each chord.',
      'Use a leap for emotion (a 6th or an octave on the key word), then move back by step. Leaps are exclamation marks — do not use one every line.',
      'Rests are part of the melody. Leave space after the title so it can ring.',
      'Use the melody dice in Studio to get starter ideas, then sing over them and change what feels unnatural. The generator writes a draft; your voice writes the song.'] },
    { id:'hooks', title:'5 · Hooks & titles', body:[
      'A hook is any short idea that sticks: a melodic phrase, a lyric line, a guitar riff, a rhythm. Great songs stack two or three hooks.',
      'Put the title in the first or last line of the chorus — ideally both. Sing it on the longest or highest note.',
      'Give the intro an instrumental hook that returns between sections, so the song is recognisable in two seconds.'] },
    { id:'groove', title:'6 · Tempo, feel & groove', body:[
      'Pick tempo by heartbeat: 60–75 BPM for ballads and slow dances, 90–110 for mid-tempo longing, 115+ for dancing through heartbreak.',
      'Feel changes everything: the same chords in straight 8ths, swing or 6/8 tell three different stories. Try all of them before you decide.',
      'Syncopation — pushing a word slightly ahead of the beat — makes lyrics sound conversational. Half-time drums in a chorus make it feel huge without changing tempo.'] },
    { id:'arrange', title:'7 · Arranging & dynamics', body:[
      'Map energy across the song: start sparse, add one layer per section, drop out before the last chorus, then hit everything at once.',
      'The intensity sliders in Write drive the playback engine: low intensity removes drums and voices, 95%+ adds the choir. Shape the curve like a story arc.',
      'Contrast instruments: if the verse is fingerpicked, strum the chorus. If the verse has drums, try the bridge without them.'] },
    { id:'finish', title:'8 · Finishing (and writing 100 songs a week)', body:[
      'Separate generating from judging. Sketch fast with Quick Sketch or a Challenge, set a 10-minute timer, and finish something ugly. Edit tomorrow.',
      'Use the status pipeline: Sketch → Demo → Finished. Most sketches will stay sketches — that is the point. Quantity trains instinct; instinct makes quality.',
      'Record a voice memo for every idea. Melodies vanish within minutes; a 20-second hum saves them.',
      'Fresh ears: play yesterday’s sketches in Stage view first thing in the morning. Keep the ones you still hum by lunchtime.',
      'Finish means: a title, a chorus that states it, two verses that move the story, and an ending. Polishing is optional; finishing is not.'] }
  ];
  const LYRIC_TIPS = [
    { title:'Show, don’t tell', body:'"I miss you" tells. "Your coffee cup is still in the sink" shows. Give the listener objects, places and actions — they will feel the emotion themselves.' },
    { title:'Be specific', body:'"Her red Mustang" beats "her car". "Tuesday, 3 a.m." beats "late at night". Specific details make a song feel true, even when it is invented.' },
    { title:'Object writing', body:'Pick one object and write for 10 minutes using all senses — sight, sound, smell, taste, touch, plus body feeling and motion. Mine the best images for verses.' },
    { title:'Prosody: words fit the music', body:'Stressed syllables belong on strong beats ("to-NIGHT", not "TO-night"). Sad words sound sadder over minor or borrowed chords; long notes need open vowels (ah, oh, ay).' },
    { title:'Sing it like you talk', body:'If you would never say it, do not sing it. Read every line out loud; twisted grammar to force a rhyme ("love, I’m thinking of") is the fastest way to lose a listener.' },
    { title:'Rhyme with intention', body:'Perfect rhymes (heart/apart) feel resolved; near rhymes (heart/dark, home/alone) feel modern and unsettled. AABB feels stable, ABAB flows, and an unrhymed last line creates unease. The Write tab shows your rhyme scheme.' },
    { title:'Verses move, choruses stay', body:'Each verse should add new information — time passes, the scene changes, the stakes rise. The chorus repeats, so its meaning should deepen as the verses change around it.' },
    { title:'Count your syllables', body:'Matching lines (verse 1 line 1 and verse 2 line 1) should have similar syllable counts so they fit the same melody. The counter beside each lyric box helps.' },
    { title:'Pick a point of view', body:'"I" is confession, "you" is intimacy or accusation, "she/he/they" is storytelling. Choose one per section and stay consistent with tense.' },
    { title:'Twist the cliché', body:'"Heart of stone" is dead; "you kept my heart like a stone in your shoe" is alive. Start from a familiar phrase and bend it.' },
    { title:'Let the bridge turn', body:'The bridge is the "but": a new perspective, a confession, a time jump. If the verses say "you left", the bridge might say "maybe I pushed".' },
    { title:'Cut the filler', body:'Delete "just", "really", "so", and "oh baby" unless they earn their place. Every line should either paint a picture or move the story.' },
    { title:'Romance from a new angle', body:'Write the love song from the jukebox’s point of view, from the ex’s new partner, or 40 years later. A fresh angle makes an old feeling new.' }
  ];
  const SECTION_TIPS = {
    'Intro':'Set the mood in 2–4 bars. An instrumental hook here can return later as a signature.',
    'Verse':'Tell the story with concrete details: who, where, what happened. Keep the melody lower and narrower than the chorus.',
    'Pre-Chorus':'Build tension: rising melody, shorter phrases, chords that avoid the tonic. It should feel like a breath in.',
    'Chorus':'State the big emotion and the title — first or last line, ideally both. Highest notes, simplest words, most repetition.',
    'Bridge (Twist)':'Offer a new angle: a confession, a time jump, a "but". New chords (try a borrowed iv or bVI) make the return to the chorus feel earned.',
    'Solo':'Quote the vocal melody first, then develop it. A solo is a wordless verse.',
    'Climactic Chorus':'Same words, more power: key change, harmonies, ad-libs, a held top note. Change one line for a final twist.',
    'Outro':'Leave on an image, not a summary. Repeat the hook softer, or end on an unresolved chord for a lingering ache.'
  };

  return { CATS, STYLES, SHAPES, UKE_SHAPES, LIB, FORMS, SECTION_TYPES, SEC_DEF, RHYMES, PROMPTS, ADJ, NOUN, CHALLENGES, LEVELS, TRIVIA, TRIVIA_ARTISTS, GUIDE, LYRIC_TIPS, SECTION_TIPS };
});
