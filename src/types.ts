export enum VariableTypes {
  Number = 'NUMBER',
  Text = 'TEXT',
}

export interface Question {
  title: string;
  body: string;
  code: string;
  variables: Variable[];
  answer?: Answer[];
}

export interface Variable {
  name: string;
  type: VariableTypes;
  value: string;
}

export interface Answer {
  name: string;
  value: string;
}
