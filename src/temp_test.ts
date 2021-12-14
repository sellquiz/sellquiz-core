import * as index from './index'

const sellCode = `Addition

    a, b in { 1, 2, ..., 10 }
    c := a + b

Calculate $a + b = #c$`;

const question = index.createQuestion(sellCode);
