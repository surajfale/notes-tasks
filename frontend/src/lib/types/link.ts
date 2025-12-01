// Link type definitions
title: string;
url: string;
tags ?: string[];
listId ?: string;
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
