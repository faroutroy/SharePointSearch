import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import CustomSearch from './components/CustomSearch';
import { ICustomSearchProps } from './components/ICustomSearchProps';

export interface ICustomSearchWebPartProps {
  title: string;
  placeholder: string;
}

export default class CustomSearchWebPart extends BaseClientSideWebPart<ICustomSearchWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ICustomSearchProps> = React.createElement(
      CustomSearch,
      {
        context: this.context,
        title: this.properties.title,
        placeholder: this.properties.placeholder || 'Search list items and documents...',
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  // SPFx version — update if you upgrade SDK
  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  // ─── Property Pane ─────────────────────────────────────────────────────────
  // These fields appear in the web part editor (pencil icon) on a modern page
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configure Search Web Part' },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Web Part Title',
                  placeholder: 'e.g. Search',
                }),
                PropertyPaneTextField('placeholder', {
                  label: 'Search Input Placeholder',
                  placeholder: 'Search list items and documents...',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
