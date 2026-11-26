# Testowanie aplikacji

Wszystkie polecenia uruchamiaj w głównym katalogu projektu. Po pobraniu repozytorium zainstaluj zależności przez `npm ci`.

## Testy jednostkowe

```bash
npm run test:unit
```

Pliki w `tests/unit/` sprawdzają:

- lokalne daty, granice miesięcy i lat, rok przestępny;
- połączenie wydarzeń, zadań i terminów oraz zakres najbliższego tygodnia;
- zachowanie równoczesnych zmian projektu i ochronę przed odtworzeniem usuniętych zadań;
- walidację danych projektów, kalendarza i zespołów;
- komunikaty uwierzytelniania;
- timeout odczytu Firestore, powrót połączenia i sprzątanie subskrypcji.

Daty są stałe, a strefa testów to `Europe/Warsaw`. Te testy nie łączą się z Firebase.

## Testy UI komponentów i formularzy

```bash
npm run test:ui
```

Jest Expo i React Native Testing Library renderują rzeczywiste komponenty i wywołują ich zdarzenia. Testy obejmują rejestrację z `SessionProvider`, osobne pola imienia i nazwiska, walidację haseł, dodawanie zadania, zachowanie agendy, listę uczestników i przełączanie motywu. Natywne fonty, nawigacja i usługi Firebase są zastąpione kontrolowanymi mockami; nie jest uruchamiany emulator telefonu.

```bash
npm test                 # jednostkowe + UI komponentów
npm run test:watch       # obserwowanie zmian
npm run test:coverage    # raport reports/coverage/index.html
```

Raport pokazuje pokrycie wybranych katalogów logiki i komponentów w testach jednostkowych i UI. Osobno uruchamiane testy integracyjne nie są wliczane do tego raportu. Nie jest dowodem pełnego przetestowania aplikacji; nie narzucamy sztucznego progu procentowego.

## Testy integracyjne z Firebase

Wymagania: Node.js 22 lub nowszy i Java 21 lub nowsza. Firebase CLI jest zależnością deweloperską projektu.

```bash
npm run test:integration
```

Polecenie samo uruchamia i zatrzymuje lokalne emulatory Authentication i Firestore według `firebase.tests.json`. Nie wymaga logowania do Firebase CLI, pliku `.env.local`, wdrażania reguł ani konta w chmurze.

Używany jest wyłącznie projekt `demo-praca-tests`: Auth na `127.0.0.1:9799`, Firestore na `127.0.0.1:8788`. Fixture odmawia startu, jeśli adresy emulatorów nie pasują. Przed każdym testem czyści tylko dane tego projektu demonstracyjnego. Testy działają kolejno, ponieważ współdzielą tę przestrzeń danych.

Sprawdzane są rzeczywiste wywołania SDK i reguły z `firestore.rules`: prywatność danych, CRUD, archiwizacja, import lokalnych danych, współbieżne zapisy, zaproszenia jednorazowe, dostęp uczestników, usuwanie dostępu i blokada wyłączonego konta.

```bash
npm run test:all         # jednostkowe, komponentowe UI i integracyjne
```

Dotychczasowe skrypty diagnostyczne w `emulator/verify-*.cjs` pozostają dostępne. Standardowy zestaw testów korzysta z katalogu `tests/`.

## Testy UI na emulatorze telefonu — Maestro

Scenariusze znajdują się w `.maestro/`. Zainstaluj [Maestro CLI](https://docs.maestro.dev/maestro-cli), uruchom dedykowany emulator iOS, zainstaluj development build aplikacji i wyloguj się w aplikacji. Scenariusze nie czyszczą danych aplikacji ani pęku kluczy; jeśli zalogowane konto otworzy stronę główną, test zatrzyma się na oczekiwaniu na ekran logowania.

W pierwszym terminalu:

```bash
npx expo start --dev-client --localhost
```

W drugim:

```bash
npm run test:e2e
```

Runner przekazuje identyfikator aplikacji z `app.json` i adres lokalnego serwera Expo. Gdy działa kilka emulatorów lub Metro używa innego portu, możesz wskazać je jawnie:

```bash
E2E_DEVICE_ID="UDID_EMULATORA" npm run test:e2e
E2E_APP_URL="LINK_DEVELOPMENT_BUILD_Z_TERMINALA_EXPO" npm run test:e2e
```

Dla Androida ustaw też `E2E_APP_ID` zgodnie z identyfikatorem zainstalowanego builda i `E2E_APP_URL` na link serwera osiągalnego z emulatora Androida. Domyślna konfiguracja celuje w lokalny emulator iOS.

Oba scenariusze sprawdzają lokalną walidację błędnych lub niepełnych formularzy. Nie wysyłają poprawnego logowania ani rejestracji, nie tworzą kont i nie usuwają danych. Testy komponentowe sprawdzają także poprawny zapis z mockiem usługi, a integracyjne — rzeczywistą współpracę Auth i Firestore w emulatorach.

Raport E2E: `reports/maestro.xml`; pozostałe artefakty: `reports/maestro/`. Testy Maestro wymagają działającego urządzenia i serwera; nie są automatycznie częścią `test:all`.
