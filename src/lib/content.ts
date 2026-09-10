import type { HeroContent, TerminalCommand } from '@/types';

export const heroContent = {
  name: 'Filip Choncel',
  title: 'AI / Automation Developer',
} as const satisfies HeroContent;

export const terminalCommands = [
  {
    cmd: 'whoami',
    output: ['Filip Choncel — AI / Automation Developer'],
  },
  {
    cmd: 'cat skills.txt',
    output: [
      'Integracje sztucznej inteligencji — projektowanie i wdrażanie chatbotów AI, które łączą modele językowe z realnymi danymi firmowymi i odpowiadają klientom w czasie rzeczywistym',
      '',
      'Automatyzacja procesów biznesowych — budowanie zautomatyzowanych przepływów pracy łączących różne systemy i aplikacje, bez udziału człowieka na co dzień',
      '',
      'Tworzenie aplikacji webowych — projektowanie i wdrażanie funkcjonalnych aplikacji internetowych od podstaw: baza danych, logika działania, interfejs użytkownika',
      '',
      'Zarządzanie bazami danych — projektowanie struktur danych, autoryzacja użytkowników, obsługa zapytań i aktualizacji w czasie rzeczywistym',
      '',
      'Automatyzacja komunikacji z klientem — wdrażanie systemów automatycznych powiadomień e-mail (potwierdzenia, przypomnienia)',
      '',
      'Programowanie front-endowe — tworzenie stron i interfejsów w HTML, CSS i JavaScript',
      '',
      'Samodzielne zdobywanie kompetencji technicznych — nauka nowych technologii w praktyce, poprzez budowanie własnych, kompletnych projektów, bez formalnego wsparcia edukacyjnego',
    ],
  },
  {
    cmd: 'cat education.log',
    output: ['Wykształcenie średnie'],
  },
  {
    cmd: 'cat experience.log',
    output: [
      '[01] System rezerwacji wycieczek online',
      '     Aplikacja webowa umożliwiająca klientom samodzielne',
      '     przeglądanie i rezerwację wycieczek online, z bezpiecznym',
      '     kontem użytkownika i dostępnością aktualizowaną na bieżąco.',
      '     Po rezerwacji klient automatycznie otrzymuje mailowe',
      '     potwierdzenie oraz przypomnienie.',
      '',
      '[02] Chatbot AI dla biura podróży',
      '     Autorski asystent AI z dostępem do pełnej oferty noclegowej,',
      '     odpowiadający klientom na pytania o dostępność i warunki',
      '     pobytu w czasie rzeczywistym — bez udziału człowieka.',
    ],
  },
] as const satisfies readonly TerminalCommand[];

export const chatWelcomeMessage = 'Inicjalizacja... połączono. Zapytaj mnie o cokolwiek.';
