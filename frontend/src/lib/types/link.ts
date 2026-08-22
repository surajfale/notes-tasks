// Link type definitions
export interface Link {
	_id: string;
	title: string;
	url: string;
	description?: string;
	image?: string;
	siteName?: string;
	tags?: string[];
	listId?: string;
	isArchived?: boolean;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateLinkData {
	title: string;
	url: string;
	tags?: string[];
	listId?: string;
}

export interface UpdateLinkData extends Partial<CreateLinkData> {
    isArchived?: boolean;
}

export interface LinkFilters {
    listId?: string;
    isArchived?: boolean;
    tags?: string[];
    search?: string;
}
