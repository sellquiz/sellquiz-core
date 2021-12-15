export enum VariableType {
  Boolean = 'BOOLEAN',
  Scalar = 'SCALAR',
  Text = 'TEXT',
  Unimplemented = 'UNIMPLEMENTED'
}

export enum InputType {
  Checkbox = 'CHECKBOX',
  Radiobutton = 'RADIOBUTTON',
  Textfield = 'TEXTFIELD',
  Unimplemented = 'UNIMPLEMENTED'
}

export interface Question {
  title: string;
  body: string;
  code: string;
  variables: Variable[];
  inputs: Input[];
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export interface Variable {
  name: string;
  type: VariableType;
  value: string;
}

export interface Answer {
  name: string;
  value: string;
}

export interface Input {
  name: string;
  type: InputType;
  width: -1;   // TODO: in pixels? yet unset
}

export interface Feedback {
  score: number;
  items: FeedbackItem[];
}

export interface FeedbackItem {
  inputName: string;
  text: string;
}
