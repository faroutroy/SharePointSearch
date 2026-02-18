import * as React from 'react';
import { ICustomSearchProps } from './ICustomSearchProps';
import { ISearchResult, ISearchState } from '../models/ISearchResult';
import { SearchService } from '../services/SearchService';
import styles from './CustomSearch.module.scss';

export default class CustomSearch extends React.Component<ICustomSearchProps, ISearchState> {
  private searchService: SearchService;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ICustomSearchProps) {
    super(props);
    this.searchService = new SearchService(props.context);
    this.state = {
      query: '',
      results: [],
      isLoading: false,
      hasSearched: false,
      errorMessage: undefined,
      activeTab: 'all',
    };
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    this.setState({ query });

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (query.trim().length >= 2) {
      this.debounceTimer = setTimeout(() => this.executeSearch(query), 400);
    } else {
      this.setState({ results: [], hasSearched: false });
    }
  };

  private handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.executeSearch(this.state.query);
    }
    if (e.key === 'Escape') {
      this.clearSearch();
    }
  };

  private handleSearchClick = (): void => {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.executeSearch(this.state.query);
  };

  private clearSearch = (): void => {
    this.setState({ query: '', results: [], hasSearched: false, errorMessage: undefined });
  };

  private setActiveTab = (tab: 'all' | 'list' | 'document'): void => {
    this.setState({ activeTab: tab });
  };

  // ─── Search Logic ───────────────────────────────────────────────────────────

  private async executeSearch(query: string): Promise<void> {
    if (!query || query.trim().length < 2) return;

    this.setState({ isLoading: true, errorMessage: undefined, hasSearched: true });

    try {
      const results = await this.searchService.searchAll(query.trim());
      this.setState({ results, isLoading: false });
    } catch (error) {
      this.setState({
        isLoading: false,
        errorMessage: 'Search failed. Please check your permissions and try again.',
        results: [],
      });
    }
  }

  // ─── Computed / Filter ──────────────────────────────────────────────────────

  private getFilteredResults(): ISearchResult[] {
    const { results, activeTab } = this.state;
    if (activeTab === 'list') return results.filter((r) => r.type === 'ListItem');
    if (activeTab === 'document') return results.filter((r) => r.type === 'Document');
    return results;
  }

  private getCountByType(type: 'ListItem' | 'Document'): number {
    return this.state.results.filter((r) => r.type === type).length;
  }

  // ─── File icon helper ───────────────────────────────────────────────────────

  private getFileIcon(fileType?: string): string {
    const icons: Record<string, string> = {
      DOCX: '📄', DOC: '📄',
      XLSX: '📊', XLS: '📊',
      PPTX: '📑', PPT: '📑',
      PDF: '📕',
      PNG: '🖼️', JPG: '🖼️', JPEG: '🖼️', GIF: '🖼️',
      ZIP: '📦', MSG: '✉️',
      TXT: '📝',
    };
    return icons[fileType || ''] || '📁';
  }

  // ─── Render Helpers ─────────────────────────────────────────────────────────

  private renderSearchBar(): JSX.Element {
    const { query, isLoading } = this.state;
    return (
      <div className={styles.searchBar}>
        <div className={styles.searchIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          placeholder={this.props.placeholder || 'Search lists and documents...'}
          aria-label="Search"
          autoComplete="off"
        />
        {query && (
          <button className={styles.clearBtn} onClick={this.clearSearch} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <button
          className={`${styles.searchBtn} ${isLoading ? styles.searchBtnLoading : ''}`}
          onClick={this.handleSearchClick}
          disabled={isLoading || !query.trim()}
          aria-label="Run Search"
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            'Search'
          )}
        </button>
      </div>
    );
  }

  private renderTabs(): JSX.Element {
    const { activeTab, results } = this.state;
    const listCount = this.getCountByType('ListItem');
    const docCount = this.getCountByType('Document');

    return (
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => this.setActiveTab('all')}
        >
          All <span className={styles.badge}>{results.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => this.setActiveTab('list')}
        >
          List Items <span className={styles.badge}>{listCount}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'document' ? styles.tabActive : ''}`}
          onClick={() => this.setActiveTab('document')}
        >
          Documents <span className={styles.badge}>{docCount}</span>
        </button>
      </div>
    );
  }

  private renderResultCard(result: ISearchResult): JSX.Element {
    return (
      <a
        key={result.id}
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.resultCard}
        aria-label={result.title}
      >
        <div className={styles.resultIcon}>
          {result.type === 'Document' ? (
            <span className={styles.fileIcon}>{this.getFileIcon(result.fileType)}</span>
          ) : (
            <span className={styles.listIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </span>
          )}
        </div>
        <div className={styles.resultContent}>
          <div className={styles.resultTitle}>{result.title}</div>
          {result.description && (
            <div className={styles.resultDescription}>{result.description}</div>
          )}
          <div className={styles.resultMeta}>
            {result.type === 'Document' && result.fileType && (
              <span className={styles.fileTypeBadge}>{result.fileType}</span>
            )}
            {result.type === 'ListItem' && (
              <span className={styles.typeBadge}>List Item</span>
            )}
            {result.listName && <span className={styles.metaItem}>📂 {result.listName}</span>}
            {result.createdBy && <span className={styles.metaItem}>👤 {result.createdBy}</span>}
            {result.modified && <span className={styles.metaItem}>🕒 {result.modified}</span>}
            {result.size && <span className={styles.metaItem}>{result.size}</span>}
          </div>
        </div>
        <div className={styles.resultArrow}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </a>
    );
  }

  private renderResults(): JSX.Element {
    const { isLoading, hasSearched, errorMessage, query } = this.state;
    const filtered = this.getFilteredResults();

    if (isLoading) {
      return (
        <div className={styles.statusArea}>
          <div className={styles.loadingDots}>
            <span /><span /><span />
          </div>
          <p>Searching SharePoint...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className={`${styles.statusArea} ${styles.errorState}`}>
          <div className={styles.statusIcon}>⚠️</div>
          <p>{errorMessage}</p>
        </div>
      );
    }

    if (!hasSearched) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p>Start typing to search across list items and documents</p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p>No results found for <strong>"{query}"</strong></p>
          <span>Try different keywords or broaden your search</span>
        </div>
      );
    }

    return (
      <div className={styles.resultsList}>
        {filtered.map((result) => this.renderResultCard(result))}
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  public render(): JSX.Element {
    const { hasSearched, results } = this.state;

    return (
      <div className={styles.container}>
        {this.props.title && (
          <h2 className={styles.webPartTitle}>{this.props.title}</h2>
        )}
        {this.renderSearchBar()}
        {hasSearched && results.length > 0 && this.renderTabs()}
        {this.renderResults()}
      </div>
    );
  }
}
