// Note type definitions

export interface Note {
  _id: string;
  userId: string;
  listId?: string;
  title: string;
  body: string;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  title: string;
  body: string;
  tags?: string[];
  listId?: string;
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  isArchived?: boolean;
}

export interface NoteFilters {
  listId?: string;
  isArchived?: boolean;
  tags?: string[];
  search?: string;
}
