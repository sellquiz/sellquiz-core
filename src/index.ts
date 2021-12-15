import { Answer, Feedback, Question, QuestionWithAnswers, VariableType } from './types';

import { SellQuiz } from './interpreter/quiz';

/**
 * Creates a new question from sellCode
 * @param sellCode
 * @returns Question without answers
 */
export function createQuestion(sellCode: string): Question {

  console.log(sellCode);

  // TODO: generate question from sellcode

  const sellQuiz = new SellQuiz();   // TODO: create instance here??
  if(sellQuiz.importQuestion(sellCode) == false) {
    throw new Error('import failed');
  }
  const question: Question = {
    title: sellQuiz.getTitle(),
    body: sellQuiz.getBodyHtml(),
    code: sellQuiz.getSellCode(),
    variables: sellQuiz.getVariables(),
    inputs: sellQuiz.getInputs()
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
export function getCalculatedAnswers(question: Question): Answer[] {
  console.log('Get calculated answers for: ', question.title);
  //const answers: Answer[] = [{ name: 'a', value: '1' }];
  const answers: Answer[] = [];
  for(const v of question.variables) {
    if(v.name.startsWith('$$') == false)
      continue;
    answers.push({
      name: v.name,
      value: v.value
    })
  }
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
export function evaluateQuestion(question: QuestionWithAnswers): Feedback {
  if (!question.answers) {
    throw new Error('No answer given');
  }

  const sellQuiz = new SellQuiz();   // TODO: create instance here??

  ///* example:
    //const sellQuestion = sellQuiz.fromQuestion(question); // We expect that this question has answers

    sellQuiz.setTitle(question.title);
    sellQuiz.setBodyHtml(question.body);
    if(!sellQuiz.setVariables(question.variables)) {
      throw new Error('Failed to set variables');
    }
    if(!sellQuiz.setInputs(question.inputs)) {
      throw new Error('Failed to set inputs');
    }
    sellQuiz.setSellCode(question.code);
    if(!sellQuiz.setStudentAnswers(question.answers)) {
      throw new Error('Failed to set student answers');
    }

    const feedback = sellQuiz.eval();
  //*/

  //const result = 0.42;

  return feedback;
}
