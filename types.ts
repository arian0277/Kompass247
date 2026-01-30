
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  DIVERSE = 'diverse'
}

export type Language = 'de' | 'en' | 'ru' | 'es' | 'fr' | 'it' | 'tr' | 'pl';

export const LANGUAGES: Record<Language, string> = {
  de: "Deutsch",
  en: "English",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  tr: "Türkçe",
  pl: "Polski"
};

export interface UserData {
  name: string;
  birthdate: string;
  gender: Gender;
  language: Language;
}

export interface HealthRow {
  chakra: string;
  color: string;
  physics: number;
  energy: number;
  emotions: number;
}

export interface MatrixData {
  meta: {
    version: string;
    date: string;
    reduce_rule: string;
  };
  base: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  corners: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  center: number;
  inner: {
    vertical: {
      v20: number;
      v15: number;
      v7: number;
      v15b: number;
      v20b: number;
    };
    horizontal: {
      h19: number;
      h11: number;
    };
    extra: {
      right_10_orange: number;
      right_10_black: number;
    };
  };
  lineage: {
    poleA: number[];
    poleB: number[];
  };
  socialization: {
    poleA: number;
    poleB: number;
    total: number;
  };
  healthCard: {
    rows: HealthRow[];
    totals: {
      physics: number;
      energy: number;
      emotions: number;
    };
  };
}

export interface RasterData {
  counts: Record<number, number>;
  grid: Record<number, number>;
  stats: {
    totalDigits: number;
    presentDigits: number;
    missingDigits: number[];
    topDigit: number;
  };
  layers: {
    mind: number;
    soul: number;
    body: number;
  };
}

export interface InterpretationResult {
  fullText: string;
  summary: string;
}

export const DEFAULT_ADMIN_PROMPT = `Analysiere das spezifische Modul der Schicksalsmatrix. Erstelle eine tiefgründige, mystische Deutung und eine extrem kurze, knackige Zusammenfassung für Social Media. Der Ton soll inspirierend und psychologisch fundiert sein.`;

export const STAGES = [
  { 
    id: 1, 
    title: "Passwort", 
    description: "Die technischen Daten deiner Berechnung. Hier siehst du, welche Regeln und Versionen für deine individuelle Analyse verwendet wurden." 
  },
  { 
    id: 2, 
    title: "4 Säulen", 
    description: "Dein Fundament. Diese vier Punkte beschreiben deine Grundpersönlichkeit, dein Karma, deine Talente und deine spirituelle Ausrichtung." 
  },
  { 
    id: 3, 
    title: "Zentrum", 
    description: "Der Kern deines Seins. Deine Hauptenergie, die alle anderen Aspekte deines Lebens steuert und harmonisiert." 
  },
  { 
    id: 4, 
    title: "Szenarien", 
    description: "Wie du auf Situationen reagierst. Diese Punkte zeigen deine Modi für Start, Wachstum, Erhalt und Ergebnisse im Leben." 
  },
  { 
    id: 5, 
    title: "Entwicklung", 
    description: "Dein vertikaler Weg. Vom spirituellen Impuls bis zur physischen Verankerung – so manifestierst du deine Ziele." 
  },
  { 
    id: 6, 
    title: "Kontakt", 
    description: "Deine soziale Interaktion. Wie du mit anderen kommunizierst, Grenzen setzt und energetischen Austausch erlebst." 
  },
  { 
    id: 7, 
    title: "Handlung", 
    description: "Realisierung in der Welt. Der Prozess, wie du eine Idee in eine konkrete Tat und schließlich in ein bleibendes Resultat verwandelst." 
  },
  { 
    id: 8, 
    title: "Ahnen", 
    description: "Dein genetisches Erbe. Die Programme und Ressourcen, die du von deiner männlichen und weiblichen Ahnenlinie mitbekommen hast." 
  },
  { 
    id: 9, 
    title: "Rolle", 
    description: "Deine Position in der Gruppe. Wie dich das Umfeld wahrnimmt und welche natürliche Funktion du in Gemeinschaften einnimmst." 
  },
  { 
    id: 10, 
    title: "Körper", 
    description: "Gesundheit und Energie. Eine detaillierte Übersicht deiner Chakren und der Balance zwischen Physis, Emotion und Energie." 
  }
];

export const ARCANA_NAMES: Record<number, string> = {
  1: "Der Magier", 2: "Die Hohepriesterin", 3: "Die Herrscherin", 4: "Der Herrscher",
  5: "Der Hierophant", 6: "Die Liebenden", 7: "Der Wagen", 8: "Die Gerechtigkeit",
  9: "Der Eremit", 10: "Das Rad des Schicksals", 11: "Die Kraft", 12: "Der Gehängte",
  13: "Der Tod", 14: "Die Mäßigkeit", 15: "Der Teufel", 16: "Der Turm",
  17: "Der Stern", 18: "Der Mond", 19: "Die Sonne", 20: "Gericht",
  21: "Die Welt", 22: "Der Narr"
};
