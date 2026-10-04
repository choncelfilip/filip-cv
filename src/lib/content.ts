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
      'AI integrations — designing and deploying AI chatbots that connect language models with real business data and respond to customers in real time',
      '',
      'Business process automation — building automated workflows connecting various systems and applications, without daily human involvement',
      '',
      'Web application development — designing and deploying fully functional web applications from scratch: database, business logic, and user interface',
      '',
      'Database management — designing data structures, user authorization, and handling queries and real-time updates',
      '',
      'Customer communication automation — implementing automated email notification systems (confirmations, reminders)',
      '',
      'Front-end development — building websites and interfaces in HTML, CSS, and JavaScript',
      '',
      'Self-directed technical learning — mastering new technologies in practice by building complete, real-world projects without formal educational support',
    ],
  },
  {
    cmd: 'cat education.log',
    output: ['Secondary education'],
  },
  {
    cmd: 'cat experience.log',
    output: [
      '[01] Online Tour Booking System',
      '     A web application allowing customers to independently',
      '     browse and book tours online, with a secure user account',
      '     and real-time availability updates.',
      '     After booking, the customer automatically receives an email',
      '     confirmation and reminder.',
      '',
      '[02] AI Chatbot for a Travel Agency',
      '     A custom AI assistant with access to the full accommodation',
      '     catalogue, answering customer questions about availability',
      '     and stay conditions in real time — without human involvement.',
    ],
  },
] as const satisfies readonly TerminalCommand[];

export const chatWelcomeMessage = 'Initializing... connected. Ask me anything.';
