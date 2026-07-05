export interface AfricanCountry {
  code: string;
  name: string;
  dial: string;
  flag: string;
  groups: number[];
  example: string;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { code: "BJ", name: "Bénin", dial: "229", flag: "🇧🇯", groups: [2, 2, 2, 2, 2], example: "01 91 00 00 00" },
  { code: "DZ", name: "Algérie", dial: "213", flag: "🇩🇿", groups: [3, 2, 2, 2], example: "555 12 34 56" },
  { code: "AO", name: "Angola", dial: "244", flag: "🇦🇴", groups: [3, 3, 3], example: "923 123 456" },
  { code: "BW", name: "Botswana", dial: "267", flag: "🇧🇼", groups: [2, 3, 3], example: "71 234 567" },
  { code: "BF", name: "Burkina Faso", dial: "226", flag: "🇧🇫", groups: [2, 2, 2, 2], example: "70 12 34 56" },
  { code: "BI", name: "Burundi", dial: "257", flag: "🇧🇮", groups: [2, 2, 2, 2], example: "79 56 12 34" },
  { code: "CM", name: "Cameroun", dial: "237", flag: "🇨🇲", groups: [3, 3, 3], example: "655 123 456" },
  { code: "CV", name: "Cap-Vert", dial: "238", flag: "🇨🇻", groups: [3, 2, 2], example: "991 12 34" },
  { code: "CF", name: "Centrafrique", dial: "236", flag: "🇨🇫", groups: [2, 2, 2, 2], example: "70 01 23 45" },
  { code: "KM", name: "Comores", dial: "269", flag: "🇰🇲", groups: [3, 4], example: "321 2345" },
  { code: "CG", name: "Congo", dial: "242", flag: "🇨🇬", groups: [2, 3, 2, 2], example: "06 123 45 67" },
  { code: "CD", name: "Congo (RDC)", dial: "243", flag: "🇨🇩", groups: [3, 3, 3], example: "991 234 567" },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", flag: "🇨🇮", groups: [2, 2, 2, 2, 2], example: "01 02 03 04 05" },
  { code: "DJ", name: "Djibouti", dial: "253", flag: "🇩🇯", groups: [2, 2, 2, 2], example: "77 83 10 01" },
  { code: "EG", name: "Égypte", dial: "20", flag: "🇪🇬", groups: [3, 3, 4], example: "100 123 4567" },
  { code: "ER", name: "Érythrée", dial: "291", flag: "🇪🇷", groups: [1, 3, 3], example: "7 123 456" },
  { code: "SZ", name: "Eswatini", dial: "268", flag: "🇸🇿", groups: [4, 4], example: "7612 3456" },
  { code: "ET", name: "Éthiopie", dial: "251", flag: "🇪🇹", groups: [2, 3, 4], example: "91 123 4567" },
  { code: "GA", name: "Gabon", dial: "241", flag: "🇬🇦", groups: [2, 2, 2, 2], example: "06 03 12 34" },
  { code: "GM", name: "Gambie", dial: "220", flag: "🇬🇲", groups: [3, 4], example: "301 2345" },
  { code: "GH", name: "Ghana", dial: "233", flag: "🇬🇭", groups: [2, 3, 4], example: "24 123 4567" },
  { code: "GN", name: "Guinée", dial: "224", flag: "🇬🇳", groups: [3, 2, 2, 2], example: "601 23 45 67" },
  { code: "GW", name: "Guinée-Bissau", dial: "245", flag: "🇬🇼", groups: [3, 4], example: "955 1234" },
  { code: "GQ", name: "Guinée équatoriale", dial: "240", flag: "🇬🇶", groups: [3, 3, 3], example: "222 123 456" },
  { code: "KE", name: "Kenya", dial: "254", flag: "🇰🇪", groups: [3, 3, 3], example: "712 123 456" },
  { code: "LS", name: "Lesotho", dial: "266", flag: "🇱🇸", groups: [4, 4], example: "5012 3456" },
  { code: "LR", name: "Libéria", dial: "231", flag: "🇱🇷", groups: [2, 3, 3], example: "77 012 3456" },
  { code: "LY", name: "Libye", dial: "218", flag: "🇱🇾", groups: [2, 3, 4], example: "91 220 3456" },
  { code: "MG", name: "Madagascar", dial: "261", flag: "🇲🇬", groups: [2, 2, 3, 2], example: "32 12 345 67" },
  { code: "MW", name: "Malawi", dial: "265", flag: "🇲🇼", groups: [3, 3, 3], example: "991 234 567" },
  { code: "ML", name: "Mali", dial: "223", flag: "🇲🇱", groups: [2, 2, 2, 2], example: "65 12 34 56" },
  { code: "MA", name: "Maroc", dial: "212", flag: "🇲🇦", groups: [3, 3, 3], example: "612 345 678" },
  { code: "MU", name: "Maurice", dial: "230", flag: "🇲🇺", groups: [4, 4], example: "5251 2345" },
  { code: "MR", name: "Mauritanie", dial: "222", flag: "🇲🇷", groups: [2, 2, 2, 2], example: "22 12 34 56" },
  { code: "MZ", name: "Mozambique", dial: "258", flag: "🇲🇿", groups: [2, 3, 4], example: "82 123 4567" },
  { code: "NA", name: "Namibie", dial: "264", flag: "🇳🇦", groups: [2, 3, 4], example: "81 123 4567" },
  { code: "NE", name: "Niger", dial: "227", flag: "🇳🇪", groups: [2, 2, 2, 2], example: "93 12 34 56" },
  { code: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬", groups: [3, 3, 4], example: "802 123 4567" },
  { code: "UG", name: "Ouganda", dial: "256", flag: "🇺🇬", groups: [3, 3, 3], example: "712 345 678" },
  { code: "RW", name: "Rwanda", dial: "250", flag: "🇷🇼", groups: [3, 3, 3], example: "720 123 456" },
  { code: "ST", name: "Sao Tomé-et-Principe", dial: "239", flag: "🇸🇹", groups: [3, 4], example: "981 2345" },
  { code: "SN", name: "Sénégal", dial: "221", flag: "🇸🇳", groups: [2, 3, 2, 2], example: "70 123 45 67" },
  { code: "SC", name: "Seychelles", dial: "248", flag: "🇸🇨", groups: [1, 3, 3], example: "2 510 123" },
  { code: "SL", name: "Sierra Leone", dial: "232", flag: "🇸🇱", groups: [2, 6], example: "25 123456" },
  { code: "SO", name: "Somalie", dial: "252", flag: "🇸🇴", groups: [2, 3, 3], example: "61 123 4567" },
  { code: "SD", name: "Soudan", dial: "249", flag: "🇸🇩", groups: [2, 3, 4], example: "91 123 1234" },
  { code: "SS", name: "Soudan du Sud", dial: "211", flag: "🇸🇸", groups: [3, 3, 3], example: "977 123 456" },
  { code: "TZ", name: "Tanzanie", dial: "255", flag: "🇹🇿", groups: [3, 3, 3], example: "712 345 678" },
  { code: "TD", name: "Tchad", dial: "235", flag: "🇹🇩", groups: [2, 2, 2, 2], example: "63 01 23 45" },
  { code: "TG", name: "Togo", dial: "228", flag: "🇹🇬", groups: [2, 2, 2, 2], example: "90 11 23 45" },
  { code: "TN", name: "Tunisie", dial: "216", flag: "🇹🇳", groups: [2, 3, 3], example: "20 123 456" },
  { code: "ZA", name: "Afrique du Sud", dial: "27", flag: "🇿🇦", groups: [2, 3, 4], example: "71 123 4567" },
  { code: "ZM", name: "Zambie", dial: "260", flag: "🇿🇲", groups: [3, 3, 3], example: "955 123 456" },
  { code: "ZW", name: "Zimbabwe", dial: "263", flag: "🇿🇼", groups: [2, 3, 4], example: "71 234 5678" },
];

export const DEFAULT_COUNTRY = AFRICAN_COUNTRIES[0];

export function findCountry(code: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find((c) => c.code === code);
}

export function expectedDigits(country: AfricanCountry): number {
  return country.groups.reduce((a, b) => a + b, 0);
}

export function formatNational(country: AfricanCountry, digits: string): string {
  const out: string[] = [];
  let i = 0;
  for (const g of country.groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + g));
    i += g;
  }
  return out.join(" ");
}

export function isValidPhone(country: AfricanCountry, digits: string): boolean {
  return digits.length === expectedDigits(country);
}

export function fullPhone(country: AfricanCountry, digits: string): string {
  return `+${country.dial} ${formatNational(country, digits)}`;
}
