// Integracja z API GUS BIR 1.1 (REGON) — wyszukiwanie podmiotu po NIP.
// SOAP 1.2 + WS-Addressing. Klucz API trzymany WYŁĄCZNIE po stronie serwera.

const BIR_URL =
  "https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc";
const NS =
  'xmlns:soap="http://www.w3.org/2003/05/soap-envelope" ' +
  'xmlns:ns="http://CIS/BIR/PUBL/2014/07" ' +
  'xmlns:dat="http://CIS/BIR/PUBL/2014/07/DataContract"';

export type RegonCompany = {
  nazwa: string;
  nip: string | null;
  regon: string | null;
  ulica: string;
  nrNieruchomosci: string;
  nrLokalu: string;
  kodPocztowy: string;
  miejscowosc: string;
  dataZawieszenia: string | null;
};

export function cleanNip(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function isValidNip(raw: string): boolean {
  const nip = cleanNip(raw);
  if (nip.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(nip[i]), 0);
  return sum % 11 === Number(nip[9]);
}

/** Wysyła żądanie SOAP. `sid` przekazujemy w nagłówku HTTP po zalogowaniu. */
async function soap(action: string, body: string, sid?: string): Promise<string> {
  const res = await fetch(BIR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      ...(sid ? { sid } : {}),
    },
    body:
      `<soap:Envelope ${NS}>` +
      `<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
      `<wsa:To>${BIR_URL}</wsa:To>` +
      `<wsa:Action>${action}</wsa:Action>` +
      `</soap:Header>` +
      `<soap:Body>${body}</soap:Body>` +
      `</soap:Envelope>`,
  });
  return res.text();
}

/** Ekstraktor pierwszego dopasowanego tagu. */
function extract(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

/** Wyszukuje firmę po NIP w REGON. Zwraca dane podstawowe lub null. */
export async function lookupByNip(
  gusApiKey: string,
  nip: string,
): Promise<RegonCompany | null> {
  // 1. Logowanie
  const loginXml = await soap(
    "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Zaloguj",
    `<ns:Zaloguj><ns:pKluczUzytkownika>${gusApiKey}</ns:pKluczUzytkownika></ns:Zaloguj>`,
  );
  const sid = extract(loginXml, "ZalogujResult");
  if (!sid) return null; // błędny klucz / brak sesji

  // 2. Wyszukiwanie
  const searchXml = await soap(
    "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DaneSzukajPodmioty",
    `<ns:DaneSzukajPodmioty><ns:pParametryWyszukiwania>` +
      `<dat:Nip>${nip}</dat:Nip>` +
      `</ns:pParametryWyszukiwania></ns:DaneSzukajPodmioty>`,
    sid,
  );

  const raw = extract(searchXml, "DaneSzukajPodmiotyResult");
  if (!raw) return null;

  // 3. Odkodowanie zaescape'owanego XML i parsowanie pól
  const decoded = raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');

  const nazwa = extract(decoded, "Nazwa");
  if (!nazwa) return null;

  return {
    nazwa,
    nip: extract(decoded, "Nip"),
    regon: extract(decoded, "Regon"),
    ulica: extract(decoded, "Ulica") ?? "",
    nrNieruchomosci: extract(decoded, "NrNieruchomosci") ?? "",
    nrLokalu: extract(decoded, "NrLokalu") ?? "",
    kodPocztowy: extract(decoded, "KodPocztowy") ?? "",
    miejscowosc: extract(decoded, "Miejscowosc") ?? "",
    dataZawieszenia: extract(decoded, "DataZawieszeniaDzialalnosci"),
  };
}
