import * as index from './index'
import { Answer, QuestionWithAnswers } from './types';

// simple question
let sellCode = `Addition

    a, b in {1, 2, ..., 20}
    c := a + b

Calculate $a + b = #c$`;

let question = index.createQuestion(sellCode);
console.log(question);

// case (a)
console.log("case (a) assume an excellent student: 100 % correct!");
let answers = index.getCalculatedAnswers(question);
let questionWithAnswers : QuestionWithAnswers = {
  ...question,
  answers: answers
}
let score = index.evaluateQuestion(questionWithAnswers);
console.log(score);

// case (b)
console.log("case (b): assume total fail: 0 % correct...");
answers = [{
  name: '$$0',
  value: "-1"
}]
questionWithAnswers = {
  ...question,
  answers: answers
}
score = index.evaluateQuestion(questionWithAnswers);
console.log(score);

// case (c)
console.log("case (c): assume syntax error by student");
answers = [{
  name: '$$0',
  value: "x+0"
}]
questionWithAnswers = {
  ...question,
  answers: answers
}
score = index.evaluateQuestion(questionWithAnswers);
console.log(score);


// question with syntactic error
sellCode = `Addition

    a, b inBLUB {1, 2, ..., 20}
    c := a + b

Calculate $a + b = #c$`;

try {
  question = index.createQuestion(sellCode);  // THROWS ERROR (AS EXPECTED)!!
  console.log(question);
} catch(error) {
  console.log("... fails as expected!");
}
