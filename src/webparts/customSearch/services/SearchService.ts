import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ISearchResult } from '../models/ISearchResult';

export class SearchService {
  private context: WebPartContext;
  private siteUrl: string;

  constructor(context: WebPartContext) {
    this.context = context;
    this.siteUrl = context.pageContext.web.absoluteUrl;
  }

  /**
   * Search SharePoint List Items using the Search REST API
   * Uses /_api/search/query with ContentClass filter for list items
   */
  public async searchListItems(query: string): Promise<ISearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    // ContentClass:STS_ListItem excludes document libraries
    const encodedQuery = encodeURIComponent(
      `${query} ContentClass:STS_ListItem`
    );
    const selectProps = encodeURIComponent(
      'Title,Path,Description,Author,Write,SiteTitle,ListId,ListItemId,SPWebUrl'
    );

    const url =
      `${this.siteUrl}/_api/search/query` +
      `?querytext='${encodedQuery}'` +
      `&selectproperties='${selectProps}'` +
      `&rowlimit=20` +
      `&trimduplicates=false`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'odata-version': '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const json = await response.json();
      const rows =
        json?.PrimaryQueryResult?.RelevantResults?.Table?.Rows || [];

      return rows.map((row: any) => {
        const cells: any[] = row.Cells || [];
        const get = (key: string): string =>
          (cells.find((c: any) => c.Key === key) || {}).Value || '';

        return {
          id: `list-${get('ListItemId')}-${get('ListId')}`,
          title: get('Title') || 'Untitled',
          type: 'ListItem' as const,
          url: get('Path'),
          description: get('Description') || '',
          listName: get('SiteTitle'),
          createdBy: get('Author'),
          modified: get('Write')
            ? new Date(get('Write')).toLocaleDateString()
            : '',
        } as ISearchResult;
      });
    } catch (error) {
      console.error('Error searching list items:', error);
      throw error;
    }
  }

  /**
   * Search Document Libraries using the Search REST API
   * Uses ContentClass:STS_ListItem_DocumentLibrary to target documents
   */
  public async searchDocuments(query: string): Promise<ISearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    // IsDocument:1 targets files in document libraries
    const encodedQuery = encodeURIComponent(
      `${query} IsDocument:1`
    );
    const selectProps = encodeURIComponent(
      'Title,Path,Author,Write,FileExtension,Size,SiteName,ParentLink'
    );

    const url =
      `${this.siteUrl}/_api/search/query` +
      `?querytext='${encodedQuery}'` +
      `&selectproperties='${selectProps}'` +
      `&rowlimit=20` +
      `&trimduplicates=false`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'odata-version': '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const json = await response.json();
      const rows =
        json?.PrimaryQueryResult?.RelevantResults?.Table?.Rows || [];

      return rows.map((row: any) => {
        const cells: any[] = row.Cells || [];
        const get = (key: string): string =>
          (cells.find((c: any) => c.Key === key) || {}).Value || '';

        const fileSizeBytes = parseInt(get('Size') || '0');
        const fileSizeKB =
          fileSizeBytes > 0
            ? fileSizeBytes > 1024 * 1024
              ? `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.ceil(fileSizeBytes / 1024)} KB`
            : '';

        return {
          id: `doc-${get('Path')}`,
          title: get('Title') || get('Path').split('/').pop() || 'Untitled',
          type: 'Document' as const,
          url: get('Path'),
          fileType: get('FileExtension').toUpperCase(),
          listName: get('SiteName') || get('ParentLink'),
          createdBy: get('Author'),
          modified: get('Write')
            ? new Date(get('Write')).toLocaleDateString()
            : '',
          size: fileSizeKB,
        } as ISearchResult;
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Combined search: runs both searches in parallel and merges results
   */
  public async searchAll(query: string): Promise<ISearchResult[]> {
    const [listItems, documents] = await Promise.all([
      this.searchListItems(query),
      this.searchDocuments(query),
    ]);
    return [...listItems, ...documents];
  }
}
