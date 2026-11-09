export type SearchState = { kind: 'search'; query?: string };
export const keepSearchOpen = (query?: string): SearchState => ({ kind: 'search', query });
