# Spec 01: napredak i reset

## Cilj

Povezati postojeće checkbox stavke sa prikazom napretka i dugmetom
`Resetuj napredak`, bez novih zavisnosti i uz najmanji potreban obim izmene.
Sačuvano stanje ostaje u postojećem [`localStorage`][mdn-localstorage]
ugovoru klase `CompletedItemsStore`.

## Plan rada

- [x] U `src/main.ts` proširiti `InterviewPreparationPage` referencama na
  postojeće DOM elemente `#progress-text`, `#progress-percentage`,
  `#progress-bar`, `#progress-message` i `#reset-progress`; pri tome
  validirati njihov tip i prijaviti jasan `MissingElementError` ako HTML
  ugovor nije ispunjen.

- [x] Dodati malu, čistu funkciju za računanje napretka iz broja označenih
  checkbox stavki i ukupnog broja stavki: završeni broj, zaokružen procenat
  i vrednost za HTML `progress` element.

- [x] Dodati metodu koja iz trenutnog stanja checkbox stavki ažurira broj,
  procenat, `value` trake i statusnu poruku za početni, delimični i potpuno
  završeni napredak.

- [x] Pri pokretanju stranice, nakon učitavanja sačuvanih checkbox stavki,
  pozvati ažuriranje prikaza kako bi ekran odmah odgovarao obnovljenom
  stanju.

- [x] U postojećem `change` obrađivaču checkbox stavki, uz čuvanje stanja,
  pozvati ažuriranje prikaza da broj, procenat, traka i poruka reaguju u
  realnom vremenu.

- [x] Povezati `#reset-progress` sa eksplicitnim obrađivačem koji uklanja
  oznaku sa svih checkbox stavki, poziva postojeći `CompletedItemsStore.clear()`
  i odmah osvežava ceo prikaz napretka na početno stanje.

- [x] Sačuvati postojeći HTML i CSS ako nove reference nisu potrebne; ne
  dodavati pakete, novi format skladištenja niti paralelni izvor stanja.

- [x] Dopuniti ili dodati automatizovane testove za čistu funkciju računanja
  napretka, uključujući 0, delimičan broj i svih 8 označenih stavki, ako se
  funkcija može testirati bez browsera.

- [x] Pokrenuti `npm test` i `npm run build` da se potvrde provera tipova,
  testovi i generisanje browser fajlova.

- [ ] Ručno proveriti u browseru: označavanje i odznačavanje odmah menjaju
  sva četiri prikaza, osvežavanje stranice vraća sačuvane oznake i njihov
  napredak, a reset uklanja oznake i ostaje resetovan i nakon osvežavanja.

## Kriterijumi prihvatanja

- [ ] Prikaz uvek pokazuje stvaran broj od 8, odgovarajući procenat, vrednost
  trake i pravilnu statusnu poruku.

- [ ] Reset vraća checkbox stavke i svaki element napretka na početne
  vrednosti u istoj interakciji.

- [ ] Nakon reseta, ključ sa završenim stavkama ne postoji u
  [`localStorage`][mdn-localstorage], pa osvežavanje ne može vratiti stare
  oznake.

- [ ] Izmena ostaje ograničena na postojeću logiku i njene relevantne
  testove, bez novih zavisnosti.

## Reference

[mdn-localstorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
