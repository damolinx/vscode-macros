import { Node } from '../node';
import { ExpansionContext } from './expansionContext';

export interface MetaNode extends Node {
  readonly role: 'meta';
  expand(context: ExpansionContext): Node[];
}
