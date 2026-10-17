import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge kennt nur die Standard-Schriftgrößen. Die eigenen aus globals.css
 * (text-ui, text-label …) hielt es für Textfarben — und strich deshalb die echte
 * Farbe: Aus "text-white text-ui" wurde "text-ui", der Button-Text erbte das helle
 * Grau der Seite und fiel durch die Kontrastprüfung.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta', 'label', 'ui', 'body', 'lead', 'h2', 'display'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
