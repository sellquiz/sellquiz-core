import { Answer, Question, QuestionWithAnswers, VariableTypes } from './types';

import { SellQuiz } from './interpreter/quiz';

/**
 * Creates a new question from sellCode
 * @param sellCode
 * @returns Question without answers
 */
export function createQuestion(sellCode: string): Question {
  console.log(sellCode);

  // TODO: generate question from sellcode

  const sellQuiz = new SellQuiz();
  if(sellQuiz.importQuestion(sellCode) == false) {
    // TODO: error handling
  }
  const question: Question = {
    title: sellQuiz.getTitle(),
    body: sellQuiz.getBodyHtml(),
    code: sellCode,
    variables: sellQuiz.getVariables()
  }


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

  /*const question: Question = {
    title: 'Test 1',
    body: '<div> Sell Frage HTML </div>',
    code: sellCode,
    variables: [{ name: 'a', type: VariableTypes.Number, value: '1' }],
  };*/
  return question;
}

/**
 * Get answers for a question
 * @param question
 * @returns
 */
export function getAnswers(question: Question): Answer[] {
  console.log('Get answers for: ', question.title);
  const answers: Answer[] = [{ name: 'a', value: '1' }];
  return answers;
}

/**
 * Checks if the given sellCode is valid
 * @param sellCode string containing sell code
 */
export function validate(sellCode: string): boolean {
  console.log('Validate Code: ', sellCode);
  // TODO: validate sellCode

  // Return boolean for now. In the future, we should return an error message
  return true;
}

/**
 * Evaluates answer for a question
 * @param question question object with answers
 * @returns score
 */
export function evaluateQuestion(question: QuestionWithAnswers): number {
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
