import { Question, VariableTypes } from './types';

export function createQuestion(sellCode: string): Question {
  console.log(sellCode);

  // TODO: generate question from sellcode

  /* example:
    const sellQuestion = sell.parse(sellcode);

    // Build question object
    const question: Question = {
      title: sellQuestion.getTitle(),
      body: sellQuestion.getBody(),
      code: sellCode,
      variables: sellQuestion.getVariables();
    }

   */

  const question: Question = {
    title: 'Test 1',
    body: '<div> Sell Frage HTML </div>',
    code: sellCode,
    variables: [{ name: 'a', type: VariableTypes.Number, value: '1' }],
  };
  return question;
}

export function evaluateQuestion(question: Question): number {
  if (!question.answer) {
    throw new Error('No answer given');
  }

  // TODO: evaluate question

  /* example:
    const sellQuestion = sell.fromQuestion(question); // We expect that this question has answers
    const result = sellQuestion.evaluate();
  */
  const result = 0.42;
  return result;
}
