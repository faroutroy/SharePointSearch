export interface ISearchResult {
  id: string;
  title: string;
  type: 'ListItem' | 'Document';
  url: string;
  description?: string;
  fileType?: string;
  listName?: string;
  createdBy?: string;
  modified?: string;
  size?: string;
}

export interface ISearchState {
  query: string;
  results: ISearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  errorMessage?: string;
  activeTab: 'all' | 'list' | 'document';
}
