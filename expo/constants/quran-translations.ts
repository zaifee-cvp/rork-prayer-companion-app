export interface QuranTranslation {
  id: number;
  name: string;
  author: string;
  language: string;
  languageCode: string;
  flag: string;
}

export const QURAN_TRANSLATIONS: QuranTranslation[] = [
  { id: 20, name: 'Sahih International', author: 'Sahih International', language: 'English', languageCode: 'en', flag: '🇬🇧' },
  { id: 85, name: 'Abdul Haleem', author: 'M.A.S. Abdel Haleem', language: 'English', languageCode: 'en', flag: '🇬🇧' },
  { id: 84, name: 'Mufti Taqi Usmani', author: 'Mufti Taqi Usmani', language: 'English', languageCode: 'en', flag: '🇬🇧' },
  { id: 22, name: 'Yusuf Ali', author: 'Abdullah Yusuf Ali', language: 'English', languageCode: 'en', flag: '🇬🇧' },
  { id: 19, name: 'Pickthall', author: 'M. Pickthall', language: 'English', languageCode: 'en', flag: '🇬🇧' },
  { id: 136, name: 'Montada Islamic Foundation', author: 'Montada Islamic Foundation', language: 'French', languageCode: 'fr', flag: '🇫🇷' },
  { id: 77, name: 'Diyanet', author: 'Diyanet Isleri', language: 'Turkish', languageCode: 'tr', flag: '🇹🇷' },
  { id: 210, name: 'Dar Al-Salam Center', author: 'Dar Al-Salam Center', language: 'Turkish', languageCode: 'tr', flag: '🇹🇷' },
  { id: 234, name: 'Fatah Muhammad Jalandhari', author: 'Fatah Muhammad Jalandhari', language: 'Urdu', languageCode: 'ur', flag: '🇵🇰' },
  { id: 97, name: 'Tafheem e Qur\'an', author: 'Syed Abu Ali Maududi', language: 'Urdu', languageCode: 'ur', flag: '🇵🇰' },
  { id: 134, name: 'King Fahad Quran Complex', author: 'King Fahad Quran Complex', language: 'Indonesian', languageCode: 'id', flag: '🇮🇩' },
  { id: 141, name: 'The Sabiq Company', author: 'The Sabiq Company', language: 'Indonesian', languageCode: 'id', flag: '🇮🇩' },
  { id: 39, name: 'Abdullah Muhammad Basmeih', author: 'Abdullah Muhammad Basmeih', language: 'Malay', languageCode: 'ms', flag: '🇲🇾' },
  { id: 161, name: 'Taisirul Quran', author: 'Tawheed Publication', language: 'Bengali', languageCode: 'bn', flag: '🇧🇩' },
  { id: 163, name: 'Sheikh Mujibur Rahman', author: 'Darussalaam Publication', language: 'Bengali', languageCode: 'bn', flag: '🇧🇩' },
  { id: 45, name: 'Elmir Kuliev', author: 'Elmir Kuliev', language: 'Russian', languageCode: 'ru', flag: '🇷🇺' },
  { id: 78, name: 'Ministry of Awqaf', author: 'Ministry of Awqaf, Egypt', language: 'Russian', languageCode: 'ru', flag: '🇷🇺' },
  { id: 83, name: 'Sheikh Isa Garcia', author: 'Sheikh Isa Garcia', language: 'Spanish', languageCode: 'es', flag: '🇪🇸' },
  { id: 140, name: 'Montada Islamic Foundation', author: 'Montada Islamic Foundation', language: 'Spanish', languageCode: 'es', flag: '🇪🇸' },
  { id: 153, name: 'Hamza Roberto Piccardo', author: 'Hamza Roberto Piccardo', language: 'Italian', languageCode: 'it', flag: '🇮🇹' },
  { id: 103, name: 'Helmi Nasr', author: 'Helmi Nasr', language: 'Portuguese', languageCode: 'pt', flag: '🇧🇷' },
  { id: 144, name: 'Sofian S. Siregar', author: 'Sofian S. Siregar', language: 'Dutch', languageCode: 'nl', flag: '🇳🇱' },
  { id: 135, name: 'IslamHouse.com', author: 'IslamHouse.com', language: 'Persian', languageCode: 'fa', flag: '🇮🇷' },
  { id: 35, name: 'Ryoichi Mita', author: 'Ryoichi Mita', language: 'Japanese', languageCode: 'ja', flag: '🇯🇵' },
  { id: 36, name: 'Korean Translation', author: 'Korean', language: 'Korean', languageCode: 'ko', flag: '🇰🇷' },
  { id: 230, name: 'Society of Institutes', author: 'Society of Institutes and Universities', language: 'Thai', languageCode: 'th', flag: '🇹🇭' },
  { id: 220, name: 'Translation Pioneers Center', author: 'Ruwwad Center', language: 'Vietnamese', languageCode: 'vi', flag: '🇻🇳' },
  { id: 231, name: 'Dr. Abdullah Muhammad Abu Bakr', author: 'Dr. Abdullah Muhammad Abu Bakr', language: 'Swahili', languageCode: 'sw', flag: '🇹🇿' },
  { id: 229, name: 'Sheikh Omar Sharif', author: 'Sheikh Omar Sharif bin Abdul Salam', language: 'Tamil', languageCode: 'ta', flag: '🇮🇳' },
  { id: 227, name: 'Maulana Abder-Rahim', author: 'Maulana Abder-Rahim ibn Muhammad', language: 'Telugu', languageCode: 'te', flag: '🇮🇳' },
  { id: 80, name: 'Muhammad Karakunnu', author: 'Muhammad Karakunnu and Vanidas Elayavoor', language: 'Malayalam', languageCode: 'ml', flag: '🇮🇳' },
  { id: 225, name: 'Rabila Al-Umry', author: 'Rabila Al-Umry', language: 'Gujarati', languageCode: 'gu', flag: '🇮🇳' },
  { id: 214, name: 'Dar Al-Salam Center', author: 'Dar Al-Salam Center', language: 'Bosnian', languageCode: 'bs', flag: '🇧🇦' },
  { id: 47, name: 'Albanian Translation', author: 'Albanian', language: 'Albanian', languageCode: 'sq', flag: '🇦🇱' },
  { id: 48, name: 'Knut Bernström', author: 'Knut Bernström', language: 'Swedish', languageCode: 'sv', flag: '🇸🇪' },
  { id: 41, name: 'Norwegian Translation', author: 'Norwegian', language: 'Norwegian', languageCode: 'no', flag: '🇳🇴' },
  { id: 42, name: 'Józef Bielawski', author: 'Józef Bielawski', language: 'Polish', languageCode: 'pl', flag: '🇵🇱' },
  { id: 217, name: 'Dr. Mikhailo Yaqubovic', author: 'Dr. Mikhailo Yaqubovic', language: 'Ukrainian', languageCode: 'uk', flag: '🇺🇦' },
  { id: 222, name: 'Khalifa Altay', author: 'Khalifa Altay', language: 'Kazakh', languageCode: 'kk', flag: '🇰🇿' },
  { id: 75, name: 'Alikhan Musayev', author: 'Alikhan Musayev', language: 'Azerbaijani', languageCode: 'az', flag: '🇦🇿' },
  { id: 55, name: 'Muhammad Sodiq (Latin)', author: 'Muhammad Sodiq Muhammad Yusuf', language: 'Uzbek', languageCode: 'uz', flag: '🇺🇿' },
  { id: 87, name: 'Sadiq and Sani', author: 'Sadiq and Sani', language: 'Amharic', languageCode: 'am', flag: '🇪🇹' },
  { id: 211, name: 'Dar Al-Salam Center', author: 'Dar Al-Salam Center', language: 'Tagalog', languageCode: 'tl', flag: '🇵🇭' },
  { id: 233, name: 'Dar Al-Salam Center', author: 'Dar Al-Salam Center', language: 'Hebrew', languageCode: 'he', flag: '🇮🇱' },
  { id: 26, name: 'Czech Translation', author: 'Czech', language: 'Czech', languageCode: 'cs', flag: '🇨🇿' },
  { id: 44, name: 'George Grigore', author: 'George Grigore', language: 'Romanian', languageCode: 'ro', flag: '🇷🇴' },
  { id: 30, name: 'Finnish Translation', author: 'Finnish', language: 'Finnish', languageCode: 'fi', flag: '🇫🇮' },
];

export const DEFAULT_TRANSLATION_ID = 20;

export function getTranslationById(id: number): QuranTranslation | undefined {
  return QURAN_TRANSLATIONS.find((t) => t.id === id);
}

export function getUniqueLanguages(): string[] {
  const langs = new Set(QURAN_TRANSLATIONS.map((t) => t.language));
  return Array.from(langs).sort();
}

export function getTranslationsByLanguage(language: string): QuranTranslation[] {
  return QURAN_TRANSLATIONS.filter((t) => t.language === language);
}
