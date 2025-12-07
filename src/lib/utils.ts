// Utility functions

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeStyle: 'short',
  }).format(date)
}

