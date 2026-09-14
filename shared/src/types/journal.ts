/**
 * A personal travel journal entry.
 */
export interface IJournalEntry {
  id: string;
  userId: string;
  tripId?: string;
  title: string;
  content: string;
  /** Location name or address where the entry was written */
  location?: string;
  latitude?: number;
  longitude?: number;
  /** Photo URIs attached to the entry */
  photos: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a journal entry.
 */
export interface ICreateJournalEntry {
  tripId?: string;
  title: string;
  content: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  date: string;
}
