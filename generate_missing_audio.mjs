import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = 'sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/words';

const MISSING_WORDS = [
  'action','admirable','air','ambitious','around','barn','bath','bats','bell','bir','bird','bix','blue','bone','boo','born','boss','bow','bows','bug','bung','buzz','by','calls','capable','car','care','chair','chat','chep','chib','chin','chip','chir','chod','choom','chouch','chun','church','claw','clear','coat','come','cool','corn','corner','cows','cries','cute','dach','dad','dair','dare','dark','dazz','dear','delicious','did','digh','dill','dim','ding','dir','direction','dish','dool','door','dorn','doss','dound','dow','draw','drew','ducks','dup','ends','enjoy','ever','everything','explore','fall','far','farm','fass','fay','fear','feast','fell','fig','figh','fix','fizz','fob','foch','food','foom','for','found','fow','fox','foy','fud','fun','furry','fuzz','garden','gate','gir','glorious','glue','goat','gong','good','gorch','gorgeous','gouk','gound','gracious','gush','hair','hawk','hear','heart','here','high','hill','hire','hiss','home','hoo','hoop','huge','hugged','jair','jam','jar','jarn','jazz','jed','jet','jib','jigh','jog','join','joom','jork','jow','joy','joyous','jun','king','lair','lake','lem','lep','lig','light','lights','lizz','loff','looked','loud','loy','luch','mair','mang','march','mee','mell','mich','moo','mool','moor','morning','moss','moth','moush','mout','mozz','munch','name','nan','nature','nay','need','neighbourhood','new','nigh','nir','nob','nop','note','noump','now','nub','nurse','nutritious','nuzz','of','oh','oil','ooh','or','our','out','owl','pair','path','ped','picture','pine','pod','pool','poor','possible','pure','purple','purse','quem','quill','quit','quiz','quob','rag','rain','reasonable','ree','remarkable','responsible','ride','road','rock','rong','room','sail','say','score','scrumptious','seal','section','see','sensible','set','shar','shoot','shoots','shouted','show','sigh','sing','sir','smile','soil','something','song','spies','stir','such','tair','team','tee','thar','then','thick','thig','thob','thook','thort','those','ties','tig','tip','tired','together','told','too','toof','torch','toy','treat','tries','tune','tuss','up','vair','valuable','vam','varm','vat','vep','very','vet','vim','vog','voot','vorn','voy','wait','wall','wants','warm','way','wet','when','wid','wig','win','wire','wow','wup','xip','yak','yam','yap','yard','yark','yay','yem','yob','yud','yum','zag','zan','zap','zar','zay','zee','zeg','zig','zoo','zoom','zoomed','zop','zor','zow'
];

function generateTTS(word) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(OUTPUT_DIR, `${word}.mp3`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  SKIP: ${word} (exists)`);
      resolve();
      return;
    }

    const body = JSON.stringify({
      text: word,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', d => errData += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for "${word}": ${errData}`)));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(outputPath, Buffer.concat(chunks));
        console.log(`  OK: ${word}`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Generating ${MISSING_WORDS.length} missing word audio files...\n`);

  // Process in batches of 5 to avoid rate limiting
  const BATCH_SIZE = 5;
  let done = 0;

  for (let i = 0; i < MISSING_WORDS.length; i += BATCH_SIZE) {
    const batch = MISSING_WORDS.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(w => generateTTS(w).catch(e => console.error(`  ERROR: ${w} — ${e.message}`))));
    done += batch.length;
    console.log(`Progress: ${Math.min(done, MISSING_WORDS.length)}/${MISSING_WORDS.length}`);
    // Small delay between batches
    if (i + BATCH_SIZE < MISSING_WORDS.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\nDone!');
}

main();
