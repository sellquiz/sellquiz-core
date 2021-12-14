import {
  createQuestion,
  evaluateQuestion,
  getAnswers,
  validate,
} from './index';
import { Question, QuestionWithAnswers, VariableTypes } from './types';

const sellCode = `Mengen

    a, b, c in { 1, 2, 3 }
    A := { a, a+b, a+b+c }
    B := { a, a+b+c }

Gegeben sei die Menge $ "A" = A $. Ist die folgende Aussage wahr?
[x] $ B sub A $`;

const question: Question = {
  title: 'Test 1',
  body: '<div> Sell Frage HTML </div>', //TODO: check real html
  code: sellCode,
  variables: [{ name: 'a', type: VariableTypes.Number, value: '1' }],
};

const questionWithAnswers: QuestionWithAnswers = {
  ...question,
  answer: [{ name: 'a', value: '1' }],
};

describe('sellcode to sellobject', () => {
  it('should convert sellcode to sellobject', () => {
    const outout = createQuestion(sellCode);

    expect(outout).toEqual(question);
  });

  it('evaluate question', () => {
    const output = evaluateQuestion(questionWithAnswers);

    expect(output).toEqual(0.42);
  });

  it('validates sellCode', () => {
    const output = validate(sellCode);

    expect(output).toEqual(true);
  });

  it('gets answers for a question', () => {
    const output = getAnswers(question);

    expect(output).toEqual([{ name: 'a', value: '1' }]);
  });
});
