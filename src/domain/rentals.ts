export type RentalPeriod = { start: Date; end: Date; status: string };
export function validatePeriod(start: Date, end: Date): string | undefined { return end <= start ? 'Время возврата должно быть позже выдачи' : undefined; }
export function hasConflict(existing: RentalPeriod[], start: Date, end: Date): boolean {
  return existing.some(r => ['booked', 'active'].includes(r.status) && start < r.end && end > r.start);
}
export function validateCompletion(damaged: boolean, comment: string): string | undefined { return damaged && !comment.trim() ? 'При повреждениях обязателен комментарий' : undefined; }
