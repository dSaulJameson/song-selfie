import type { SongRequestInput } from "@/lib/schema";

export type PhotoStoryContext = {
  summary: string;
  details: string[];
  lyricIdeas: string[];
};

const SONG_TYPE_DESCRIPTORS: Record<
  SongRequestInput["songType"],
  { headline: string; tag: string }
> = {
  "epic-battle": {
    headline: "epic battle song",
    tag: "cinematic clash anthem",
  },
  "love-song": {
    headline: "love song",
    tag: "romantic slow-burn pop",
  },
  "party-anthem": {
    headline: "party anthem",
    tag: "festival-ready singalong banger",
  },
  "funny-roast": {
    headline: "funny roast song",
    tag: "playful roast comedy track",
  },
  "sexy-vibe": {
    headline: "late-night sexy vibe",
    tag: "sleek sensual groove",
  },
  "chill-vibe": {
    headline: "chill vibe track",
    tag: "laid-back cool-down groove",
  },
  "story-mode": {
    headline: "story mode anthem",
    tag: "narrative-driven scene setter",
  },
};

const MOOD_TAGS: Record<SongRequestInput["mood"], string> = {
  chill: "smooth and easygoing",
  happy: "bright and celebratory",
  aggressive: "sharp, aggressive, and high-impact",
  emotional: "heartfelt and dramatic",
  hype: "hype, loud, and peak-hour ready",
};

const STRUCTURE_TAGS: Record<SongRequestInput["structure"], string> = {
  "instant-hook": "opens with the hook immediately",
  "story-arc": "builds like a story with a payoff ending",
  "drop-heavy": "leans into a huge drop and payoff chorus",
  "slow-burn": "starts sparse and blooms over time",
  "singalong-chorus": "features an instant singalong chorus",
};

const ENERGY_MAP: Record<number, string> = {
  1: "barely-there afterglow",
  2: "cool head-nod energy",
  3: "balanced mid-tempo lift",
  4: "crowd-up, hands-high momentum",
  5: "full-send explosive energy",
};

const GENRE_PROFILES: Record<
  SongRequestInput["genre"],
  {
    label: string;
    signature: string;
    anchors: string[];
    lyricDirection: string;
  }
> = {
  "cinematic-pop": {
    label: "cinematic pop",
    signature: "anthemic pop with huge emotional lifts",
    anchors: ["wide-screen synth layers", "big pop drums", "soaring cinematic chorus"],
    lyricDirection: "Keep the topline bold, vivid, and built for a giant payoff.",
  },
  "hip-hop": {
    label: "hip-hop",
    signature: "rhythm-first verses with a punchy hook",
    anchors: ["hard drum pocket", "808 low end", "confident rap cadence"],
    lyricDirection: "Use tight rhythms, punchlines, and chant-ready repetition.",
  },
  edm: {
    label: "EDM",
    signature: "festival-scale dance energy",
    anchors: ["supersaw lift", "drop-build tension", "club-ready kick pulse"],
    lyricDirection: "Keep the words direct, chantable, and built for the drop.",
  },
  rock: {
    label: "rock",
    signature: "live-band drive with a loud chorus",
    anchors: ["crunchy guitars", "driving drum kit", "arena-ready chorus"],
    lyricDirection: "Make the lyrics muscular, hooky, and easy to yell back.",
  },
  country: {
    label: "country",
    signature: "storytelling with warmth and singalong clarity",
    anchors: ["acoustic strum", "country rhythm section", "heartland hook"],
    lyricDirection: "Lean into imagery, detail, and conversational storytelling.",
  },
  "r-and-b": {
    label: "R&B",
    signature: "smooth groove with melodic vocal runs",
    anchors: ["silky chords", "deep pocket drums", "sensual vocal phrasing"],
    lyricDirection: "Keep the writing intimate, melodic, and silky.",
  },
  "indie-pop": {
    label: "indie pop",
    signature: "cool melodic pop with textured edges",
    anchors: ["shimmering guitars", "airy synth texture", "offbeat melodic phrasing"],
    lyricDirection: "Keep the writing clever, fresh, and slightly left of center.",
  },
  latin: {
    label: "Latin",
    signature: "rhythmic, danceable, and instantly warm",
    anchors: ["Latin percussion groove", "syncopated bounce", "sunlit melodic hook"],
    lyricDirection: "Push rhythm, movement, and celebratory vocal phrasing.",
  },
  "lo-fi": {
    label: "lo-fi",
    signature: "soft-focus chill with intimate texture",
    anchors: ["dusty drums", "warm tape texture", "sleepy mellow chords"],
    lyricDirection: "Keep the writing stripped back, conversational, and reflective.",
  },
  house: {
    label: "house",
    signature: "steady club pulse built for movement",
    anchors: ["four-on-the-floor kick", "piano stabs or house chords", "night-drive groove"],
    lyricDirection: "Favor repetition, mantra hooks, and clean rhythmic lines.",
  },
  "jazz-funk": {
    label: "jazz funk",
    signature: "slick musicianship with bounce and swagger",
    anchors: ["syncopated bass groove", "tight funk guitar or keys", "jazzy horn-flavored phrasing"],
    lyricDirection: "Keep the lines playful, stylish, and full of attitude.",
  },
  reggae: {
    label: "reggae",
    signature: "laid-back island groove with unmistakable offbeat feel",
    anchors: ["offbeat skank guitar", "deep dubby bassline", "one-drop reggae groove"],
    lyricDirection: "Use easy, flowing phrasing with a warm chantable chorus.",
  },
  metal: {
    label: "metal",
    signature: "heavy, aggressive, riff-forward intensity",
    anchors: ["distorted down-tuned guitars", "double-kick drum drive", "massive breakdown energy"],
    lyricDirection: "Write with force, intensity, and sharper imagery.",
  },
  emo: {
    label: "emo",
    signature: "confessional emotion with urgent alt-rock lift",
    anchors: ["ringing guitars", "melodic pop-punk drum push", "heart-on-sleeve chorus"],
    lyricDirection: "Make the lyrics raw, personal, and emotionally direct.",
  },
  screamo: {
    label: "screamo",
    signature: "post-hardcore chaos with emotional outburst energy",
    anchors: ["screamed vocal attack", "chaotic post-hardcore drums", "crashing breakdown release"],
    lyricDirection: "Use short explosive lines and intense emotional release.",
  },
  "70s-throwback": {
    label: "70s throwback",
    signature: "retro groove with classic analog shine",
    anchors: ["vintage rhythm section", "retro soul-funk warmth", "classic singalong refrain"],
    lyricDirection: "Keep it colorful, breezy, and vintage in attitude.",
  },
  "80s-throwback": {
    label: "80s throwback",
    signature: "big glossy hooks and neon-era drama",
    anchors: ["gated drum feel", "bright synth leads", "arena-sized chorus"],
    lyricDirection: "Push larger-than-life hooks and bold melodic lines.",
  },
  "90s-throwback": {
    label: "90s throwback",
    signature: "nostalgic radio energy with punch and attitude",
    anchors: ["90s drum punch", "hook-forward alt-pop texture", "nostalgic melodic lift"],
    lyricDirection: "Keep the writing immediate, catchy, and full of throwback attitude.",
  },
};

const GENRE_TAG_PRESETS: Record<
  SongRequestInput["genre"],
  {
    bpm: number;
    tagMood: SongRequestInput["tagMood"];
    tagScene: SongRequestInput["tagScene"];
    tagEnergy: SongRequestInput["tagEnergy"];
    tagInstruments: SongRequestInput["tagInstruments"];
    tagDrumStyle: SongRequestInput["tagDrumStyle"];
    tagVocals: SongRequestInput["tagVocals"];
    tagProduction: SongRequestInput["tagProduction"];
    tagEra: SongRequestInput["tagEra"];
  }
> = {
  "cinematic-pop": {
    bpm: 120,
    tagMood: ["euphoric", "dreamy"],
    tagScene: ["city-night"],
    tagEnergy: ["building"],
    tagInstruments: ["synth", "strings"],
    tagDrumStyle: ["hand-claps"],
    tagVocals: ["female-vocals", "harmonies"],
    tagProduction: ["polished", "stadium-reverb"],
    tagEra: ["y2k-pop"],
  },
  "hip-hop": {
    bpm: 96,
    tagMood: ["aggressive"],
    tagScene: ["late-night"],
    tagEnergy: ["groovy"],
    tagInstruments: ["808-bass", "lead-synth"],
    tagDrumStyle: ["boom-bap", "trap-hi-hats"],
    tagVocals: ["rap-verse", "ad-libs"],
    tagProduction: ["tight-and-dry"],
    tagEra: ["modern-trap", "90s-hip-hop"],
  },
  edm: {
    bpm: 128,
    tagMood: ["euphoric"],
    tagScene: ["party"],
    tagEnergy: ["explosive", "building"],
    tagInstruments: ["synth", "arp-synth", "sub-bass"],
    tagDrumStyle: ["four-on-the-floor"],
    tagVocals: ["female-vocals", "vocal-chops"],
    tagProduction: ["polished", "sidechain"],
    tagEra: ["y2k-pop"],
  },
  rock: {
    bpm: 132,
    tagMood: ["energetic"],
    tagScene: ["road-trip"],
    tagEnergy: ["fast", "intense"],
    tagInstruments: ["electric-guitar", "bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy"],
    tagEra: ["golden-age"],
  },
  country: {
    bpm: 102,
    tagMood: ["peaceful", "nostalgic"],
    tagScene: ["sunset", "road-trip"],
    tagEnergy: ["moderate"],
    tagInstruments: ["acoustic-guitar", "piano"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "harmonies"],
    tagProduction: ["polished"],
    tagEra: ["golden-age"],
  },
  "r-and-b": {
    bpm: 92,
    tagMood: ["romantic", "dreamy"],
    tagScene: ["late-night"],
    tagEnergy: ["slow", "groovy"],
    tagInstruments: ["synth", "sub-bass"],
    tagDrumStyle: ["808-kick"],
    tagVocals: ["female-vocals", "breathy", "harmonies"],
    tagProduction: ["pristine"],
    tagEra: ["90s-r-and-b"],
  },
  "indie-pop": {
    bpm: 112,
    tagMood: ["upbeat", "nostalgic"],
    tagScene: ["sunset"],
    tagEnergy: ["moderate"],
    tagInstruments: ["acoustic-guitar", "synth"],
    tagDrumStyle: ["hand-claps"],
    tagVocals: ["female-vocals"],
    tagProduction: ["bedroom", "vinyl-crackle"],
    tagEra: ["retro-futurism"],
  },
  latin: {
    bpm: 104,
    tagMood: ["upbeat"],
    tagScene: ["beach", "party"],
    tagEnergy: ["groovy", "fast"],
    tagInstruments: ["nylon-guitar", "sub-bass"],
    tagDrumStyle: ["syncopated", "hand-claps"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["polished"],
    tagEra: ["modern-trap"],
  },
  "lo-fi": {
    bpm: 78,
    tagMood: ["chill", "peaceful"],
    tagScene: ["study", "rain"],
    tagEnergy: ["slow", "calm"],
    tagInstruments: ["piano", "synth"],
    tagDrumStyle: ["brush-drums"],
    tagVocals: ["spoken-word"],
    tagProduction: ["lo-fi-tape", "vinyl-crackle"],
    tagEra: ["retro-futurism"],
  },
  house: {
    bpm: 124,
    tagMood: ["energetic"],
    tagScene: ["party", "city-night"],
    tagEnergy: ["groovy", "building"],
    tagInstruments: ["synth", "sub-bass"],
    tagDrumStyle: ["four-on-the-floor"],
    tagVocals: ["female-vocals", "vocal-chops"],
    tagProduction: ["sidechain", "polished"],
    tagEra: ["y2k-pop"],
  },
  "jazz-funk": {
    bpm: 110,
    tagMood: ["upbeat", "euphoric"],
    tagScene: ["morning-coffee"],
    tagEnergy: ["groovy"],
    tagInstruments: ["bass", "saxophone", "piano"],
    tagDrumStyle: ["syncopated"],
    tagVocals: ["soulful"],
    tagProduction: ["pristine"],
    tagEra: ["70s-funk"],
  },
  reggae: {
    bpm: 84,
    tagMood: ["peaceful", "upbeat"],
    tagScene: ["beach", "sunset"],
    tagEnergy: ["groovy", "calm"],
    tagInstruments: ["electric-guitar", "sub-bass", "organ"],
    tagDrumStyle: ["syncopated"],
    tagVocals: ["male-vocals", "harmonies"],
    tagProduction: ["vintage-analog"],
    tagEra: ["golden-age"],
  },
  metal: {
    bpm: 150,
    tagMood: ["dark", "aggressive"],
    tagScene: ["workout"],
    tagEnergy: ["fast", "intense"],
    tagInstruments: ["electric-guitar", "sub-bass"],
    tagDrumStyle: ["live-drums", "808-kick"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy"],
    tagEra: ["golden-age"],
  },
  emo: {
    bpm: 142,
    tagMood: ["melancholic", "nostalgic"],
    tagScene: ["rain", "late-night"],
    tagEnergy: ["building"],
    tagInstruments: ["electric-guitar", "bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "falsetto"],
    tagProduction: ["bedroom", "reverb"],
    tagEra: ["y2k-pop"],
  },
  screamo: {
    bpm: 168,
    tagMood: ["dark", "aggressive"],
    tagScene: ["city-night"],
    tagEnergy: ["fast", "explosive"],
    tagInstruments: ["electric-guitar", "sub-bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy", "reverb"],
    tagEra: ["golden-age"],
  },
  "70s-throwback": {
    bpm: 108,
    tagMood: ["nostalgic", "upbeat"],
    tagScene: ["party"],
    tagEnergy: ["groovy"],
    tagInstruments: ["bass", "piano", "brass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["vintage-analog"],
    tagEra: ["70s-funk", "70s-disco"],
  },
  "80s-throwback": {
    bpm: 118,
    tagMood: ["euphoric", "dreamy"],
    tagScene: ["city-night"],
    tagEnergy: ["building"],
    tagInstruments: ["synth", "arp-synth"],
    tagDrumStyle: ["gated-snare"],
    tagVocals: ["female-vocals", "harmonies"],
    tagProduction: ["polished", "stadium-reverb"],
    tagEra: ["80s-synthwave"],
  },
  "90s-throwback": {
    bpm: 100,
    tagMood: ["nostalgic", "upbeat"],
    tagScene: ["road-trip"],
    tagEnergy: ["moderate", "groovy"],
    tagInstruments: ["piano", "synth", "bass"],
    tagDrumStyle: ["boom-bap", "live-drums"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["polished"],
    tagEra: ["90s-r-and-b", "90s-hip-hop"],
  },
};

const EXPLICIT_SIGNAL_PATTERN =
  /\b(explicit|nsfw|18\+|hookup|hook-up|bedroom|turn on|naked|nude|dirty talk|horny|seduce|body on body|grind)\b/i;

function splitNames(value: string) {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function limitText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function humanizeTag(value: string) {
  return value
    .split("-")
    .map((part) => (part.length <= 3 && /^\d/.test(part) ? part.toUpperCase() : part))
    .join(" ");
}

function joinTags(values: string[]) {
  return values.map(humanizeTag).join(", ");
}

function buildSubject(names: string[]) {
  if (names.length === 0) {
    return "this table";
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function getDurationGuidance(duration: number) {
  if (duration <= 30) {
    return "Keep it tight: hook fast, one short verse, one chorus, and a quick outro.";
  }

  if (duration <= 60) {
    return "Aim for a compact structure with an intro, one verse, one chorus, and a short outro.";
  }

  if (duration <= 120) {
    return "Use a full song shape with intro, verse, chorus, verse, chorus, bridge, and outro.";
  }

  return "Use a full-length arrangement with intro, two verses, repeated chorus, bridge, final chorus, and outro.";
}

export function getLyricCharacterBudget(duration: number) {
  return Math.max(260, Math.min(1800, Math.round(duration * 13.5)));
}

export function getLyricLineBudget(duration: number) {
  return Math.max(6, Math.min(28, Math.round(duration / 4)));
}

export function isExplicitSongRequest(input: SongRequestInput) {
  if (input.kidsMode) {
    return false;
  }

  return (
    input.makeDirty ||
    input.songType === "sexy-vibe" ||
    EXPLICIT_SIGNAL_PATTERN.test(`${input.story}\n${input.lyrics}`)
  );
}

export function buildPromptPackage(
  input: SongRequestInput,
  context?: { venueName?: string; photoStory?: PhotoStoryContext | null },
) {
  const names = splitNames(input.names);
  const subject = buildSubject(names);
  const storySnippet = input.story
    ? `around ${input.story.trim().replace(/\.$/, "")}`
    : "about the moment happening at the table";
  const songDescriptor = SONG_TYPE_DESCRIPTORS[input.songType];
  const genreProfile = GENRE_PROFILES[input.genre];
  const genrePreset = GENRE_TAG_PRESETS[input.genre];
  const tone = MOOD_TAGS[input.mood];
  const structure = STRUCTURE_TAGS[input.structure];
  const selectedMoodTags = input.tagMood.length > 0 ? input.tagMood : genrePreset.tagMood;
  const selectedSceneTags = input.tagScene.length > 0 ? input.tagScene : genrePreset.tagScene;
  const selectedEnergyTags =
    input.tagEnergy.length > 0 ? input.tagEnergy : genrePreset.tagEnergy;
  const selectedInstruments =
    input.tagInstruments.length > 0
      ? input.tagInstruments
      : genrePreset.tagInstruments;
  const selectedDrumStyles =
    input.tagDrumStyle.length > 0 ? input.tagDrumStyle : genrePreset.tagDrumStyle;
  const selectedVocals = input.tagVocals.length > 0 ? input.tagVocals : genrePreset.tagVocals;
  const selectedProduction =
    input.tagProduction.length > 0 ? input.tagProduction : genrePreset.tagProduction;
  const selectedEra = input.tagEra.length > 0 ? input.tagEra : genrePreset.tagEra;
  const effectiveBpm = input.bpm ?? genrePreset.bpm;
  const energy =
    selectedEnergyTags.length > 0
      ? joinTags(selectedEnergyTags)
      : (ENERGY_MAP[input.energy] ?? ENERGY_MAP[3]);
  const venueContext =
    input.mentionVenueName && context?.venueName ? ` at ${context.venueName}` : "";
  const explicit = isExplicitSongRequest(input);
  const familyFriendlyInstruction = input.kidsMode
    ? "Keep everything family-friendly, playful, age-appropriate, and clean. No swearing, sexual content, or adult-coded innuendo. "
    : "";
  const photoStory = context?.photoStory ?? null;
  const namesInstruction =
    input.includeEveryoneNames && names.length > 0
      ? `Work these names directly into the lyrics or chant: ${names.join(", ")}. `
      : "";
  const photoInstruction = photoStory
    ? `Use these visual details from uploaded photos as real scene references when they fit naturally: ${photoStory.details.join(", ")}. ${
        photoStory.lyricIdeas.length > 0
          ? `Optional lyric image cues: ${photoStory.lyricIdeas.join(", ")}. `
          : ""
      }`
    : "";
  const advancedTagInstruction = [
    selectedMoodTags.length > 0 ? `Mood tags: ${joinTags(selectedMoodTags)}.` : null,
    selectedSceneTags.length > 0 ? `Scene tags: ${joinTags(selectedSceneTags)}.` : null,
    selectedEnergyTags.length > 0 ? `Energy tags: ${joinTags(selectedEnergyTags)}.` : null,
    selectedInstruments.length > 0
      ? `Feature instruments like ${joinTags(selectedInstruments)}.`
      : null,
    selectedDrumStyles.length > 0
      ? `Use drum feels such as ${joinTags(selectedDrumStyles)}.`
      : null,
    selectedVocals.length > 0 ? `Vocal direction: ${joinTags(selectedVocals)}.` : null,
    selectedProduction.length > 0
      ? `Production finish: ${joinTags(selectedProduction)}.`
      : null,
    selectedEra.length > 0 ? `Era references: ${joinTags(selectedEra)}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const naturalPrompt = limitText(
    `Create a ${tone} ${songDescriptor.headline} about ${subject}${venueContext}, ${storySnippet}. Make it feel ${energy}, lock the production unmistakably into ${genreProfile.label} with ${genreProfile.signature}, and shape it so it ${structure}. Non-negotiable genre anchors: ${genreProfile.anchors.join(", ")}. ${genreProfile.lyricDirection} ${
      input.makeFunny ? "Keep the writing funny and packed with sharp punchlines. " : ""
    }${
      input.makeDramatic
        ? "Push the drama with cinematic rises, pauses, and tension. "
        : ""
    }${familyFriendlyInstruction}${advancedTagInstruction} ${photoInstruction}${namesInstruction}${
      input.makeDirty && !input.kidsMode
        ? "Lean into suggestive, late-night, flirtier writing without becoming hateful or graphic. "
        : ""
    }`,
    500,
  );

  const tagParts = [
    genreProfile.label,
    genreProfile.signature,
    songDescriptor.tag,
    tone,
    structure,
    energy,
    ...selectedMoodTags,
    ...selectedSceneTags,
    ...selectedEnergyTags,
    ...selectedInstruments,
    ...selectedDrumStyles,
    ...selectedVocals,
    ...selectedProduction,
    ...selectedEra,
    ...genreProfile.anchors,
    effectiveBpm ? `${effectiveBpm} bpm` : null,
    input.makeFunny ? "funny witty lyrical moments" : null,
    input.makeDramatic ? "dramatic cinematic swells" : null,
    input.kidsMode ? "clean kid-friendly singalong" : null,
    input.makeDirty && !input.kidsMode ? "late-night spicy lyrical tone" : null,
    input.includeEveryoneNames && names.length > 0
      ? `include names ${names.join(" ")}`
      : null,
    input.story ? `scene ${input.story}` : null,
    photoStory ? `photo scene ${photoStory.summary}` : null,
    explicit ? "mature sensual vocal delivery" : "clean memorable topline",
  ]
    .filter(Boolean)
    .join(", ");

  const lyricBrief = [
    `Write complete lyrics for a ${tone} ${songDescriptor.headline} about ${subject}${venueContext}.`,
    input.story
      ? `The specific table story is: ${input.story.trim()}.`
      : "Center the lyrics on the table's current moment and shared memories.",
    photoStory
      ? `The uploaded photos show: ${photoStory.summary}. Important visual details: ${photoStory.details.join(", ")}.`
      : "No supporting photos were uploaded.",
    `Musical foundation: ${genreProfile.label} with ${genreProfile.signature}.`,
    `Make the genre unmistakable using these anchors: ${genreProfile.anchors.join(", ")}.`,
    advancedTagInstruction || "Use the default FineTune tag profile for this genre.",
    `Song structure target: ${structure}. ${getDurationGuidance(input.duration)}`,
    genreProfile.lyricDirection,
    input.includeEveryoneNames && names.length > 0
      ? `Call out these names naturally: ${names.join(", ")}.`
      : "Do not force extra names unless they fit naturally.",
    input.makeFunny
      ? "Lean into humor, punchlines, playful exaggeration, and quotable lines."
      : "Keep the writing catchy and emotionally direct.",
    input.makeDramatic
      ? "Use dramatic rises, cinematic tension, and a bigger-than-life payoff."
      : "Keep the emotional arc smooth and singable.",
    input.kidsMode
      ? "Make the finished song feel kid-safe, clean, upbeat, and easy for families or younger listeners to enjoy."
      : input.makeDirty
        ? "It is okay to make the writing dirtier, flirtier, and more adult as long as it stays musical and not hateful."
        : "Keep the tone appropriate for a general crowd unless the rest of the request clearly says otherwise.",
    photoStory && photoStory.lyricIdeas.length > 0
      ? `If it fits naturally, echo these visual image cues in the lyrics: ${photoStory.lyricIdeas.join(", ")}.`
      : "No extra visual lyric cues are required.",
    explicit
      ? "This request can be mature and sensual, but keep it performable and avoid hateful or abusive language."
      : "Keep the lyrics clean enough for a lively public venue.",
    input.lyrics
      ? `Use this user-provided lyric seed when helpful: ${input.lyrics.trim()}`
      : "No user-written lyric seed was supplied.",
    `Keep the finished lyric body under roughly ${getLyricCharacterBudget(input.duration)} characters and around ${getLyricLineBudget(input.duration)} non-empty lines so it fits the requested runtime.`,
    "Return plain text lyrics only with bracketed section headers like [Verse 1] and [Chorus].",
  ].join(" ");

  return {
    names,
    subject,
    explicit,
    title: limitText(`${songDescriptor.headline} for ${subject}`, 80),
    naturalPrompt,
    lyricBrief: limitText(lyricBrief, 1800),
    tags: limitText(tagParts, 500),
    lyrics: input.lyrics.trim() || undefined,
  };
}
