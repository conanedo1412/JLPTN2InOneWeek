export function todayLocal(): string {
  return formatLocalDate(new Date());
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid local date: ${value}`);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function addLocalDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function daysBetweenLocal(from: string, to: string): number {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function defaultExamDate(): string {
  return addLocalDays(todayLocal(), 30);
}
