import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ICustomSearchProps {
  context: WebPartContext;
  title: string;
  placeholder: string;
}
