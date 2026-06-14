import type { Language } from './utils/language.js';

export type CountdownStyle = 'large' | 'compact' | 'minimal';

export interface CountdownPart {
  value: number;
  label: string;
}

export interface CountdownTimeRemaining {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
}

export interface CountdownStrings {
  completedMessage: string;
  ariaPrefix: string;
  ariaSuffix: string;
  conjunction: string;
  day: [string, string];
  hour: [string, string];
  minute: [string, string];
}

export const COUNTDOWN_STRINGS: Record<Language, CountdownStrings> = {
  no: {
    completedMessage: 'Tiden er ute!',
    ariaPrefix: 'Nedtelling:',
    ariaSuffix: 'igjen',
    conjunction: 'og',
    day: ['dag', 'dager'],
    hour: ['time', 'timer'],
    minute: ['minutt', 'minutter']
  },
  en: {
    completedMessage: 'Time is up!',
    ariaPrefix: 'Countdown:',
    ariaSuffix: 'remaining',
    conjunction: 'and',
    day: ['day', 'days'],
    hour: ['hour', 'hours'],
    minute: ['minute', 'minutes']
  }
};

export function getTimeRemaining(targetDate: Date, now = new Date()): CountdownTimeRemaining {
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
}

export function getVisibleParts(
  timeRemaining: CountdownTimeRemaining,
  strings: CountdownStrings
): CountdownPart[] {
  const visibleParts = [
    timeRemaining.days > 0 ? { value: timeRemaining.days, label: timeRemaining.days === 1 ? strings.day[0] : strings.day[1] } : null,
    timeRemaining.hours > 0 ? { value: timeRemaining.hours, label: timeRemaining.hours === 1 ? strings.hour[0] : strings.hour[1] } : null,
    timeRemaining.minutes > 0 ? { value: timeRemaining.minutes, label: timeRemaining.minutes === 1 ? strings.minute[0] : strings.minute[1] } : null,
  ].filter((part): part is CountdownPart => part !== null);

  if (visibleParts.length === 0 && !timeRemaining.expired) {
    return [{ value: 0, label: strings.minute[1] }];
  }

  return visibleParts;
}

export function buildAriaLabel(
  timeRemaining: CountdownTimeRemaining,
  visibleParts: CountdownPart[],
  strings: CountdownStrings,
  completedMessage: string
): string {
  if (timeRemaining.expired) {
    return completedMessage;
  }

  const ariaParts = visibleParts.map((part) => `${part.value} ${part.label}`);
  return `${strings.ariaPrefix} ${ariaParts.join(', ')} ${strings.ariaSuffix}`;
}
