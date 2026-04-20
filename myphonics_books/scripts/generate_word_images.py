"""Generate simple flat icon images for spotlight/spelling words using Gemini Imagen.

Output: public/images/words/{word}.png (256x256)
"""
import os
import time
import io
import base64
import requests as http_requests
from PIL import Image

# Read API key
ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
API_KEY = None
with open(ENV_PATH) as f:
    for line in f:
        if line.startswith('GOOGLE_GEMINI_API_KEY='):
            API_KEY = line.strip().split('=', 1)[1].split('#')[0].strip().strip('"\'')
            break

if not API_KEY:
    raise ValueError("GOOGLE_GEMINI_API_KEY not found in .env")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'images', 'words')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# All words needing images
WORDS = {
    'sun': 'a bright yellow sun with rays',
    'sock': 'a colourful stripy sock',
    'six': 'the number 6 in bold blue',
    'sad': 'a sad child face',
    'hat': 'a red woolly hat',
    'cat': 'an orange tabby cat sitting',
    'map': 'a folded treasure map',
    'van': 'a blue delivery van',
    'tin': 'a tin can with label',
    'tap': 'a silver water tap with drip',
    'ten': 'the number 10 in bold red',
    'tub': 'a white bathtub with bubbles',
    'pig': 'a cute pink pig',
    'pan': 'a frying pan',
    'pin': 'a red push pin',
    'peg': 'a wooden clothes peg',
    'bin': 'a grey rubbish bin',
    'dig': 'a garden spade in soil',
    'fin': 'a grey shark fin in blue water',
    'zip': 'a metal zip zipper',
    'net': 'a butterfly net',
    'nut': 'a brown hazelnut',
    'nap': 'a sleeping child on a pillow',
    'nod': 'a person nodding with arrow',
    'man': 'a friendly man waving',
    'mop': 'a mop with bucket',
    'mix': 'a mixing bowl with wooden spoon',
    'mum': 'a friendly woman smiling',
    'dog': 'a happy brown puppy',
    'dip': 'a bowl of dip with crisp',
    'dot': 'a large black circle dot',
    'duck': 'a yellow rubber duck',
    'gap': 'a gap in a wooden fence',
    'gas': 'a red petrol pump',
    'gum': 'a stick of pink chewing gum',
    'gift': 'a wrapped present with red bow',
    'log': 'a brown wooden log',
    'fog': 'trees in thick fog',
    'hot': 'a steaming red mug',
    'pot': 'a silver cooking pot with lid',
    'mud': 'a brown mud puddle with splashes',
    'mat': 'a colourful doormat',
    'sat': 'a child sitting on a wooden chair',
    'box': 'a cardboard box',
    'top': 'a spinning top toy',
    'sit': 'a child sitting cross-legged on the floor',
    'rat': 'a cute grey rat',
    'bat': 'a brown wooden cricket bat',
    'pat': 'a hand gently patting a cat',
    'big': 'a large elephant next to a tiny mouse to show big',
    'ran': 'a child running fast with wind lines',
    'got': 'a child holding a wrapped gift looking surprised',
    'mess': 'a messy room with toys and clothes everywhere',
    'fish': 'a bright orange fish in water',
    'runs': 'a child running with motion lines',
    'fat': 'a very chubby round orange cat',
    'thin': 'a very skinny thin orange cat',
    'paint': 'a paint palette with colourful blobs',
    'sand': 'a beach with golden sand and a bucket',
    'dad': 'a friendly dad smiling and waving',
    # L1.3 words
    'ship': 'a large red sailing ship on blue water',
    'shed': 'a small wooden garden shed',
    'shop': 'a small friendly shop with an awning',
    'sink': 'a kitchen sink with running water',
    'tank': 'a glass fish tank with water and gravel',
    'bank': 'a piggy bank with a coin slot',
    'ink': 'a bottle of blue ink with a splash',
    'wish': 'a child making a wish on a dandelion',
    'cup': 'a colourful cup or mug',
    'bag': 'a clear plastic bag',
    # L1.4 words
    'socks': 'a pair of bright red socks',
    'check': 'a magnifying glass searching',
    'red': 'a bright red circle',
    'bed': 'a small cosy bed with pillows',
    'hen': 'a brown hen with feathers',
    'pen': 'a wooden chicken pen with fence',
    'peck': 'a hen pecking at seeds',
    'kick': 'a foot kicking a football',
    'cap': 'a red baseball cap',
    'cob': 'a corn on the cob',
    'cab': 'a yellow taxi cab',
    'kit': 'a first aid kit box',
    'kid': 'a happy child waving',
    'keg': 'a small wooden barrel keg',
    'kip': 'a child sleeping peacefully',
    'lock': 'a silver padlock',
    'sock': 'a single colourful sock',
    'web': 'a spider web with dewdrops',
    # L1.5 words
    'run': 'a child running fast with wind lines',
    'pup': 'a small cute puppy',
    'hut': 'a small wooden hut or shed',
    'bush': 'a round green bush',
    'rub': 'hands rubbing a puppy with towel',
    'hug': 'a child hugging a puppy',
    'hid': 'a puppy hiding behind a box',
    'bus': 'a red double decker bus',
    'jug': 'a ceramic water jug',
    'rug': 'a colourful patterned rug',
    'rod': 'a fishing rod',
    'hop': 'a rabbit hopping',
    'bun': 'a round bread bun',
    # --- Additional L2-L6 words ---
    'barn': 'a red wooden barn with a curved roof',
    'bath': 'a white bathtub with bubbles and a rubber duck',
    'before': 'two panels showing before and after with an arrow',
    'bell': 'a golden school bell',
    'bike': 'a red bicycle',
    'bird': 'a small blue bird perched on a branch',
    'blue': 'a bright blue paint swatch or colour block',
    'boat': 'a small wooden rowing boat on water',
    'bone': 'a white dog bone',
    'boss': 'a person in a suit sitting at a desk looking important',
    'boy': 'a smiling boy with a school bag',
    'brown': 'a brown paint swatch or colour block',
    'buzz': 'a yellow and black bumblebee buzzing with motion lines',
    'cake': 'a birthday cake with candles and icing',
    'car': 'a small red car',
    'care': 'a heart with a hand holding it',
    'chair': 'a simple wooden chair',
    'chat': 'two people talking with speech bubbles',
    'chin': 'a cartoon face with an arrow pointing to the chin',
    'chip': 'a crispy golden potato chip or crisp',
    'chop': 'a hand chopping vegetables with a knife on a board',
    'church': 'a small stone church with a steeple',
    'claw': 'a large animal claw or paw',
    'clear': 'a clear glass of water',
    'coat': 'a bright red winter coat',
    'coin': 'a shiny gold coin',
    'cool': 'a penguin wearing sunglasses looking cool',
    'corn': 'a yellow ear of corn',
    'cow': 'a black and white dairy cow',
    'cries': 'a child with tears on their face crying',
    'cute': 'a tiny kitten with big round eyes',
    'dare': 'a child standing bravely at the edge of a diving board',
    'day': 'a bright sun in a blue sky representing daytime',
    'dear': 'a heart with the word deer — two deer nuzzling',
    'delicious': 'a plate of food with steam and a smiling face reaction',
    'direction': 'a signpost with arrows pointing different directions',
    'door': 'a red front door with a knocker',
    'down': 'an arrow pointing downward',
    'draw': 'a hand drawing with a pencil on paper',
    'drew': 'a hand sketching a picture with pencil',
    'enjoy': 'a child eating ice cream with a big smile',
    'enormous': 'a tiny person standing next to a very large elephant',
    'explore': 'a child with a backpack and map looking at the horizon',
    'fair': 'a carnival fairground with a Ferris wheel',
    'famous': 'a star on a Hollywood-style walk of fame',
    'farm': 'a colourful farm with barn and fields',
    'fear': 'a child looking scared with wide eyes and sweat drops',
    'feast': 'a long table full of food and dishes',
    'feel': 'a hand touching a soft fluffy texture',
    'fell': 'a cartoon character tumbling and falling',
    'fig': 'a purple fig fruit cut in half showing pink inside',
    'fir': 'a tall green fir tree',
    'fire': 'orange and red flames',
    'fizz': 'a fizzy drink with bubbles popping out of a glass',
    'floor': 'a wooden floor viewed from above',
    'flute': 'a silver musical flute',
    'fork': 'a silver dinner fork',
    'fox': 'an orange fox sitting and looking alert',
    'furry': 'a fluffy soft teddy bear',
    'fuzz': 'a blurry fuzzy circle of soft wool',
    'gate': 'a wooden garden gate in a fence',
    'glorious': 'a stunning golden sunrise over hills',
    'glue': 'a tube of craft glue with a squeeze',
    'goat': 'a white mountain goat with small horns',
    'gong': 'a large bronze gong on a stand with a mallet',
    'gorgeous': 'a beautiful bouquet of bright flowers',
    'gracious': 'a person bowing politely and smiling',
    'hair': 'a cartoon face with curly hair highlighted',
    'hawk': 'a hawk with spread wings soaring',
    'hear': 'a cartoon ear with sound waves',
    'heart': 'a bright red heart shape',
    'high': 'a mountain peak reaching into clouds',
    'hill': 'a gentle green rolling hill',
    'hire': 'a shop sign reading "For Hire" with a bicycle',
    'hiss': 'a snake coiled with its tongue out',
    'home': 'a cosy house with a chimney and smoke',
    'huge': 'a very large elephant with a tiny person beside it',
    'incredible': 'a superhero cape with a star burst of amazement',
    'jam': 'a glass jar of red strawberry jam',
    'jazz': 'a trumpet with musical notes floating',
    'jeep': 'a green off-road jeep on a dirt track',
    'jet': 'a jet aeroplane soaring through clouds',
    'jog': 'a person jogging in trainers with motion lines',
    'join': 'two puzzle pieces clicking together',
    'joy': 'a child jumping in the air with arms raised in happiness',
    'joyous': 'a group of people celebrating with confetti',
    'king': 'a king wearing a crown and holding a sceptre',
    'lake': 'a calm blue lake surrounded by green trees',
    'light': 'a glowing light bulb',
    'look': 'a pair of eyes looking to the right',
    'loud': 'a speaker with sound waves and volume symbols',
    'miss': 'a child waving goodbye looking sad',
    'moon': 'a full white moon in a dark night sky',
    'moor': 'a wide open purple moorland landscape',
    'more': 'a plate with extra food being added',
    'moss': 'green moss growing on a rock',
    'moth': 'a grey moth with spread wings',
    'name': 'a name badge sticker with a name written on it',
    'nature': 'trees, flowers, and a butterfly in a park scene',
    'near': 'two objects very close together with a small arrow',
    'new': 'a shiny new toy still in its box',
    'night': 'a dark sky with stars and a crescent moon',
    'note': 'a yellow sticky note on a wall',
    'now': 'a clock showing the current time with an arrow',
    'nurse': 'a nurse in scrubs with a stethoscope',
    'nutritious': 'a plate with colourful healthy vegetables and fruit',
    'off': 'a light switch in the off position',
    'oil': 'a bottle of olive oil with a drop',
    'out': 'an open door with sunshine outside and an arrow',
    'owl': 'a brown owl perched on a branch at night',
    'pair': 'a matching pair of red mittens side by side',
    'park': 'a park with a bench, tree, and green grass',
    'path': 'a winding stone path through a garden',
    'picture': 'a framed painting on a wall',
    'pine': 'a tall pine tree with needles and cones',
    'play': 'children playing on a playground with a slide',
    'poor': 'a small empty piggy bank with a sad face',
    'possible': 'a tick inside a circle showing yes or possible',
    'precious': 'a jewel or gemstone shining with sparkles',
    'pure': 'a clear glass of pure water with shine effects',
    'purple': 'a bright purple paint swatch or colour block',
    'purse': 'a small purple coin purse',
    'quack': 'a yellow duck with a speech bubble saying quack',
    'quill': 'a feather quill pen and inkpot',
    'quit': 'a hand pressing a red stop button',
    'quiz': 'a quiz paper with questions and a pencil',
    'rain': 'rain drops falling from a grey cloud',
    'reach': 'an arm stretching upward to reach a high shelf',
    'reasonable': 'a balanced scales showing fairness',
    'remarkable': 'a blue ribbon first place award',
    'responsible': 'a child tidying up toys looking reliable',
    'ride': 'a child riding a bicycle with a big smile',
    'ring': 'a gold ring with a diamond',
    'road': 'a straight road stretching to the horizon',
    'round': 'a perfect circle shape',
    'sail': 'a white sail on a sailboat in the wind',
    'say': 'a mouth speaking with a small speech bubble',
    'score': 'a scoreboard showing numbers',
    'scrumptious': 'a beautiful layered cake with cream and berries',
    'section': 'a book open to a chapter section with a bookmark',
    'see': 'a pair of eyes with light rays',
    'sensible': 'a child wearing a helmet before riding a bike',
    'shore': 'a sandy beach shoreline with gentle waves',
    'shout': 'a person shouting with a megaphone',
    'sight': 'a pair of binoculars',
    'sing': 'a child singing with a microphone and musical notes',
    'sir': 'a gentleman with a top hat bowing politely',
    'smart': 'a child in graduation cap with a gold star',
    'smile': 'a large happy smiley face',
    'snail': 'a garden snail with a colourful spiral shell',
    'soil': 'dark brown garden soil with a small sprout',
    'song': 'a music note and a pair of headphones',
    'spies': 'a cartoon spy in a hat peering around a corner',
    'stare': 'a pair of wide eyes staring straight ahead',
    'station': 'a train station with a platform and clock',
    'stay': 'a dog sitting obediently with a hand signal showing stay',
    'stir': 'a spoon stirring a pot of soup',
    'stone': 'a grey pebble stone',
    'straw': 'a stripy drinking straw in a glass',
    'sure': 'a confident person with a thumbs up',
    'suspicious': 'a detective squinting with a magnifying glass',
    'team': 'a group of children putting their hands in the centre of a circle',
    'terrible': 'a thunderstorm with lightning and dark clouds',
    'this': 'a pointing hand or arrow',
    'ties': 'a colourful striped necktie',
    'tired': 'a yawning child with drooping eyes and ZZZ symbols',
    'toy': 'a toy chest overflowing with colourful toys',
    'treat': 'a wrapped sweet treat or candy',
    'tree': 'a tall green oak tree',
    'tries': 'a child trying hard to lift a heavy box with determination',
    'true': 'a checkmark or tick in a circle',
    'tune': 'musical notes floating from a mouth',
    'valuable': 'a diamond or jewel in a secure box',
    'vat': 'a large barrel or vat container',
    'vet': 'a vet in a white coat examining a cat',
    'vim': 'a person flexing muscles with energy stars',
    'wait': 'a traffic light on red with a hand signal',
    'wall': 'a brick wall section',
    'wet': 'a raincoat dripping with rain drops',
    'wig': 'a colourful curly wig on a stand',
    'win': 'a gold trophy cup',
    'wire': 'a coil of copper wire',
    'yak': 'a large fluffy brown yak on a hillside',
    'yam': 'a purple yam root vegetable',
    'yap': 'a tiny dog barking loudly with a speech bubble',
    'yes': 'a large green tick or checkmark',
    'zag': 'a zigzag line pattern',
    'zap': 'a lightning bolt zap symbol',
    'zig': 'a zigzag line with an arrow on the zig part',
    'zoo': 'a zoo entrance gate with animal footprint signs',
    'before': 'a timeline arrow showing a moment before and after',
    'action': 'a superhero running with a cape and motion lines',
    'ambitious': 'a child reaching for a star on a ladder',
    'admirable': 'a gold star medal being awarded',
    'capable': 'a child flexing muscles with a confident smile and a thumbs up',
    'cautious': 'a child looking carefully both ways before crossing a road',
}

STYLE = "Simple flat icon illustration, bold black outlines, bright solid colours, white background, children's educational app style, centred in frame, no text, no labels, square format, suitable for ages 4-6"


def generate_image_gemini(word: str, description: str, output_path: str) -> bool:
    """Generate image using Gemini 2.0 Flash with image output."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={API_KEY}"

    prompt = f"Generate an image of {description}. {STYLE}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }

    try:
        resp = http_requests.post(url, json=payload, timeout=60)
        if resp.status_code != 200:
            print(f"  API ERROR {resp.status_code} for {word}: {resp.text[:100]}")
            return False

        data = resp.json()
        candidates = data.get('candidates', [])
        if not candidates:
            print(f"  NO CANDIDATES for {word}")
            return False

        parts = candidates[0].get('content', {}).get('parts', [])
        for part in parts:
            if 'inlineData' in part:
                img_data = base64.b64decode(part['inlineData']['data'])
                img = Image.open(io.BytesIO(img_data))
                img = img.resize((256, 256), Image.LANCZOS)
                img.save(output_path, 'PNG')
                size_kb = os.path.getsize(output_path) / 1024
                print(f"  OK  ({size_kb:.0f}KB) {word}")
                return True

        print(f"  NO IMAGE DATA for {word}")
        return False

    except Exception as e:
        print(f"  ERROR {word}: {e}")
        return False


def main():
    print(f"Generating {len(WORDS)} word images with Gemini...\n")

    ok = skip = fail = 0
    for word, desc in WORDS.items():
        output_path = os.path.join(OUTPUT_DIR, f"{word}.png")
        if os.path.exists(output_path):
            print(f"  SKIP {word}")
            skip += 1
            continue

        if generate_image_gemini(word, desc, output_path):
            ok += 1
        else:
            fail += 1
        time.sleep(2)  # Rate limit — Gemini image gen is slower

    print(f"\nDone: {ok} generated, {skip} existed, {fail} failed")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
