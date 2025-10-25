// List type definitions

export interface List {
  _id: string;
  userId: string;
  title: string;
  color: string; // hex color
  emoji?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListData {
  title: string;
  color: string;
  emoji?: string;
}

export interface UpdateListData extends Partial<CreateListData> {}
