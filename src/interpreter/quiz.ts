/******************************************************************************
 * SELL - SIMPLE E-LEARNING LANGUAGE                                          *
 *                                                                            *
 * Copyright (c) 2019-2021 TH Köln                                            *
 * Author: Andreas Schwenk, contact@compiler-construction.com                 *
 *                                                                            *
 * Partly funded by: Digitale Hochschule NRW                                  *
 * https://www.dh.nrw/kooperationen/hm4mint.nrw-31                            *
 *                                                                            *
 * GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007                         *
 *                                                                            *
 * This library is licensed as described in LICENSE, which you should have    *
 * received as part of this distribution.                                     *
 *                                                                            *
 * This software is distributed on "AS IS" basis, WITHOUT WARRENTY OF ANY     *
 * KIND, either impressed or implied.                                         *
 ******************************************************************************/

import { symtype, SellSymbol } from './symbol';
import { SellToken, Lexer } from './lex';
import { ParseText } from './parse-text';
import { ParseCode } from './parse-code';
import { ParseCodeSym } from './parse-code-sym';
import { ParseIM } from './parse-im';
import { ParseIM_Input } from './parse-im-input';
import { ParseProg } from './parse-prog';
import { Evaluate } from './../eval/evaluate';
import { Variable, VariableType, Input, InputType, Answer, Feedback, FeedbackItem } from '../types';
//import { MatrixInput } from './matinput';
//import { getHtmlChildElementRecursive } from './help';
//import { check_symbol_svg } from './img'
//import { sellassert } from './sellassert';
//import { GET_STR } from './../locale/lang';

export enum SellInputElementType {
  UNKNOWN = 'unknown',
  TEXTFIELD = 'textfield', // one input box
  COMPLEX_NUMBER = 'complex_number', // two separate input boxes for real and imag
  CHECKBOX = 'checkbox', // boolean checkbox
  VECTOR = 'vector', // vector with n input boxes (also used for sets)
  MATRIX = 'matrix', // matrix with m*n input boxes
  PROGRAMMING = 'programming',
}

export class SellInput {
  //htmlElementId = '';
  htmlElementInputType: SellInputElementType = SellInputElementType.UNKNOWN;
  //htmlElementId_feedback = '';
  solutionVariableId = '';
  solutionVariableRef: SellSymbol | null = null;
  // linearized input: one element for scalars, n elemens for vectors, m*n elements for matrices (row-major)
  studentAnswer: string[] = [];
  evaluationFeedbackStr = '';
  correct = false;
  // only used for matrix based mathtypes
  //matrixInput: MatrixInput|null = null;
  // only used for vector based mathtypes
  vectorLength = 1;
  // evaluation of e.g. programming tasks is done asynchronesouly.
  // As long as the evaluation is ongoing, evaluationInProgress is set true.
  //evaluationInProgress: boolean = false;
  //codeMirror : any = null; // IDE instance; only used for programming tasks
}

export class SellQuestion {
  src = '';
  html = '';
  titleHtml = '';
  bodyHtml = '';
  //bodyHtmlElement: HTMLElement = null;
  symbols: { [key: string]: SellSymbol } = {};
  solutionSymbols: { [key: string]: SellSymbol } = {};
  solutionSymbolsMustDiffFirst: { [key: string]: string } = {};
  lastParsedInputSymbol: SellSymbol | null = null;
  stack: Array<SellSymbol> = [];
  inputs: Array<SellInput> = [];

  generalFeedbackStr = '';
  allAnswersCorrect = false;
  // TODO: move parse method and other methods here

  getInput(name: string) : SellInput {
    for(const input of this.inputs) {
      if(input.solutionVariableId === name)
        return input;
    }
    return null;
  }
}

export class SellQuiz {
  // subclases
  evaluate: Evaluate | null = null;

  textParser: ParseText | null = null;
  codeParser: ParseCode | null = null;
  codeSymParser: ParseCodeSym | null = null;
  imParser: ParseIM | null = null;
  imInputParser: ParseIM_Input | null = null;
  progParser: ParseProg | null = null;

  ELEMENT_TYPE_INPUT = 'input';
  ELEMENT_TYPE_SPAN = 'span';

  // preferences
  latexMode = false;
  debug = false;
  log = '';
  language = 'en';
  generateInputFieldHtmlCode = false;
  servicePath = './services/';

  // questions
  //questions: Array<SellQuestion> = [];
  q: SellQuestion = new SellQuestion(); // current question
  //qidx = 0; // current question index
  html = '';
  variablesJsonStr = ''; // TODO!!

  // lexer (remark: if attributes are changed, then methods backupLexer,
  //        and replayLexer must also be changed)
  tokens: Array<SellToken> = [];
  tk = '';
  tk2 = '';
  tk_line = 0;
  tk_col = 0;
  tkIdx = 0;
  id = '';

  // parsing states
  parseWhitespaces = false;
  parsingInlineCode = false; // true while parsing solution code after '#'

  // style states
  isBoldFont = false;
  isItalicFont = false;
  isItemize = false;
  isItemizeItem = false;

  singleMultipleChoiceFeedbackHTML = ''; // written at end of line

  // matrix inputs
  //matrixInputs: Array<SellMatrixInput> = [];
  resizableRows = false;
  resizableCols = false;

  // unique id counter
  uniqueIDCtr = 0;
  editButton = false;

  constructor() {
    // instantiate evaluation class
    this.evaluate = new Evaluate(this);
    // instantiate parser classes
    this.textParser = new ParseText(this);
    this.codeParser = new ParseCode(this);
    this.codeSymParser = new ParseCodeSym(this);
    this.imParser = new ParseIM(this);
    this.imInputParser = new ParseIM_Input(this);
    this.progParser = new ParseProg(this);

    this.q = new SellQuestion();
  }

  getTitle() : string {
    return this.q.titleHtml;
  }

  setTitle(title : string) {
    this.q.titleHtml = title;
  }

  getSellCode() : string {
    return this.q.src;
  }

  setSellCode(code : string) {
    this.q.src = code;
  }

  getBodyHtml() : string {
    return this.q.bodyHtml;
  }

  setBodyHtml(bodyHtml : string) {
    this.q.bodyHtml = bodyHtml;
  }

  getVariables() : Variable[] {
    // TODO: precision!
    const vars : Variable[] = [];

    //const allSymbols = Object.assign({}, this.q.symbols, this.q.solutionSymbols);
    const allSymbols = this.q.symbols;
    for(const symId in this.q.solutionSymbols) {
      allSymbols['$$' + symId] = this.q.solutionSymbols[symId];
    }
    for(const symId in allSymbols) {
      const sym = allSymbols[symId];
      let type : VariableType;
      switch(sym.type) {
        case symtype.T_REAL:
          type = VariableType.Scalar;
          break;
        default:
          // TODO!!
          type = VariableType.Unimplemented;
      }
      const v : Variable = {
        name: symId,
        type: type,
        value: sym.toAsciiMath()
      }
      vars.push(v);
    }
    return vars;
  }

  setVariables(vars : Variable[]) : boolean {
    // TODO: precision!
    for(const v of vars) {
      let type : symtype;
      switch(v.type) {
        case VariableType.Boolean:
          type = symtype.T_BOOL;
          break;
        case VariableType.Scalar:
          type = symtype.T_REAL;
          break;
        default:
          // TODO!!
          return false;
      }
      if(v.name.startsWith('$$')) {
        const name = v.name.substring(2);
        this.q.solutionSymbols[name] = new SellSymbol(type);
        this.q.solutionSymbols[name].fromAsciiMath(v.value);
      } else {
        this.q.symbols[v.name] = new SellSymbol(type);
        this.q.symbols[v.name].fromAsciiMath(v.value);
      }
    }
    return true;
  }

  getInputs() : Input[] {
    const inputs : Input[] = [];
    for(const sellInput of this.q.inputs) {
      let type : InputType;
      switch(sellInput.htmlElementInputType) {
        case SellInputElementType.CHECKBOX:
          type = InputType.Checkbox;
          break;
        case SellInputElementType.TEXTFIELD:
          type = InputType.Textfield;
          break;
        default:
          // TODO!!
          type = InputType.Unimplemented;
      }
      const input : Input = {
        name: '$$' + sellInput.solutionVariableId,
        type: type,
        width: -1  // TODO
      }
      inputs.push(input);
    }
    return inputs;
  }

  setInputs(inputs : Input[]) : boolean {
    for(const input of inputs) {
      const sellInput = new SellInput();
      const name = input.name.substring(2); // remove preceding '$$'
      sellInput.solutionVariableId = name;
      if(!(name in this.q.solutionSymbols))
        return false;
      sellInput.solutionVariableRef = this.q.solutionSymbols[name];
      this.q.inputs.push(sellInput);
      let type : SellInputElementType;
      switch(input.type) {
        case InputType.Checkbox:
          type = SellInputElementType.CHECKBOX;
          break;
        case InputType.Textfield:
          type = SellInputElementType.TEXTFIELD;
          break;
        default:
          // TODO
          return false;
      }
      sellInput.htmlElementInputType = type;
    }
    return true;
  }

  setStudentAnswers(answers : Answer[]) : boolean {
    for(const answer of answers) {
      const input = this.q.getInput(answer.name.substring(2));
      if(input == null)
        return false;
      input.studentAnswer = [ ''+answer.value ];
    }
    return true;
  }

  eval() : Feedback {
    if(!this.evaluate.evaluate()) {
      throw new Error("failed to evaluate");
    }
    const feedbackItems : FeedbackItem[] = [];
    for(const input of this.q.inputs) {
      const feedbackItem : FeedbackItem = {
        inputName: '$$' + input.solutionVariableId,
        text: input.evaluationFeedbackStr
      }
      feedbackItems.push(feedbackItem);
    }
    const score = this.evaluate.getScore();
    const feedback : Feedback = {
      score: score,
      items: feedbackItems
    }
    return feedback;
  }

  // TODO:
  /*createIDE(sellInput : SellInput, htmlElement : Element, lang="Java", height=75) {
        // dev info: the CodeMirror editor is not included here directly for two reasons:
        //  (a.) many users will use SELL without programming questions
        //  (b.) CodeMirror can not be used in combination with node.js (DOM-environment not present)
        console.log("ERROR: Obviously your quiz includes a programming task. Please also include sellquiz.ide.min.js in your HTML file");
    }*/

  importQuestion(src: string, codeStartRow = 0): boolean {

    this.resizableRows = false;
    this.resizableCols = false;

    this.tokens = [];
    this.tk = '';
    this.tk_line = 0;
    this.tk_col = 0;
    this.tk2 = ''; // look ahead 2
    this.tkIdx = 0;
    this.id = ''; // last identifier

    this.q = new SellQuestion();
    this.q.src = src;

    const lines = src.split('\n');
    let last_indent = 0;
    let code_block = false; // inline code (NOT to be confused with SELL-code)
    for (let i = 0; i < lines.length; i++) {
      if (!code_block && lines[i].startsWith('```')) code_block = true;
      let indent = 0;
      if (lines[i].startsWith('\t\t') || lines[i].startsWith('        '))
        indent = 2;
      else if (lines[i].startsWith('\t') || lines[i].startsWith('    '))
        indent = 1;
      const line_str = lines[i].split('%')[0]; // remove comments
      if (line_str.length == 0)
        // empty line
        continue;
      const lineTokens = Lexer.tokenize(line_str);
      if (lineTokens.length == 0) continue;
      lineTokens.push(new SellToken('§EOL', i + 1, -1)); // end of line
      if (!code_block) {
        if (last_indent == 0 && indent == 1)
          this.tokens.push(new SellToken('§CODE_START', i + 1, -1));
        else if (last_indent == 0 && indent == 2) {
          this.tokens.push(new SellToken('§CODE_START', i + 1, -1));
          this.tokens.push(new SellToken('§CODE2_START', i + 1, -1));
        } else if (last_indent == 1 && indent == 2)
          this.tokens.push(new SellToken('§CODE2_START', i + 1, -1));
        else if (last_indent == 2 && indent == 1)
          this.tokens.push(new SellToken('§CODE2_END', i + 1, -1));
        else if (last_indent == 2 && indent == 0) {
          this.tokens.push(new SellToken('§CODE2_END', i + 1, -1));
          this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
        } else if (last_indent == 1 && indent == 0)
          this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
      }
      for (let j = 0; j < lineTokens.length; j++) {
        this.tokens.push(lineTokens[j]);
        this.tokens[this.tokens.length - 1].line = codeStartRow + i + 1;
      }
      last_indent = indent;
      if (code_block && lines[i].endsWith('```')) code_block = false;
    }
    this.tokens.push(new SellToken('§END', -1, -1));
    //console.log(this.tokens);
    //this.helper.printTokenList(this.tokens);
    this.tkIdx = 0;
    this.next();
    try {
      this.parse();
    } catch (e) {
      this.log += e + '\n';
      this.log += 'Error: compilation failed';
      return false;
    }
    if (this.tk !== '§END')
      this.err('Error: remaining tokens: "' + this.tk + '"...');
    this.log += '... compilation succeeded!\n';

    // --- permutate patterns '§['...']§' (shuffles single/multiple choice answers) ---
    // TODO: does NOT work for multiple groups of multiple-choice/single-choice
    const options: Array<string> = [];
    const n = this.q.html.length;
    let tmpHtml = '';
    // fill options-array and replace occurring patterns '§['...']§' by
    // '§i', with i := index of current option (0<=i<k, with  k   the total
    // number of options)
    for (let i = 0; i < n; i++) {
      let ch = this.q.html[i];
      let ch2 = i + 1 < n ? this.q.html[i + 1] : '';
      if (ch == '§' && ch2 == '[') {
        tmpHtml += '§' + options.length;
        options.push('');
        for (let j = i + 2; j < n; j++) {
          ch = this.q.html[j];
          ch2 = j + 1 < n ? this.q.html[j + 1] : '';
          if (ch == ']' && ch2 == '§') {
            i = j + 1;
            break;
          }
          options[options.length - 1] += ch;
        }
      } else tmpHtml += ch;
    }
    // shuffle options
    const k = options.length;
    for (let l = 0; l < k; l++) {
      const i = Lexer.randomInt(0, k);
      const j = Lexer.randomInt(0, k);
      const tmp = options[i];
      options[i] = options[j];
      options[j] = tmp;
    }
    // reconstruct question-html
    for (let l = 0; l < k; l++) tmpHtml = tmpHtml.replace('§' + l, options[l]);
    this.q.html = tmpHtml;

    // --- set HTML ---
    this.html += this.q.html + '\n\n';
    return true;
  }

  /*backupQuestion(questionID : number) : string {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return null;
        let backup = {};
        // source and generated HTML
        backup["source_code"] = q.src;
        backup["title_html"] = q.titleHtml;
        backup["body_html"] = q.bodyHtml;
        // variables
        backup["variables"] = [];
        for(let symid in q.symbols)
            backup["variables"].push(q.symbols[symid].exportDictionary(symid));
        backup["solution_variables"] = [];
        for(let symid in q.solutionSymbols)
            backup["solution_variables"].push(q.solutionSymbols[symid].exportDictionary(symid));
        // TODO: mustDiffFrist, ....
        // input fields
        backup["input_fields"] = [];
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            let f = {};
            f["element_type"] = input.htmlElementInputType;
            f["element_id"] = input.htmlElementId;
            f["element_id__feedback"] = input.htmlElementId_feedback;
            f["correct"] = input.correct;
            f["feedback_message"] = input.evaluationFeedbackStr;
            f["student_answer_string"] = input.studentAnswer;
            f["solution_variable_id"] = input.solutionVariableId;
            backup["input_fields"].push(f);
        }
        // global evaluation feedback
        backup["general_feedback"] = {};
        backup["general_feedback"]["all_answers_correct"] = q.allAnswersCorrect;
        backup["general_feedback"]["feedback_message"] = q.generalFeedbackStr;
        // stringify
        return JSON.stringify(backup, null, 4);
    }*/

  /*getQuestionInputFields(questionID : number) : any {
        let inputFields = [];
        let backupStr = this.backupQuestion(questionID);
        let backup = JSON.parse(backupStr);
        for(let i=0; i<backup["input_fields"].length; i++) {
            inputFields.push({
                "element_id": backup["input_fields"][i]["element_id"],
                "element_type": backup["input_fields"][i]["element_type"],
                "solution_variable_id": backup["input_fields"][i]["solution_variable_id"]
            });
        }
        return inputFields;
    }*/

  /*createQuestionFromBackup(backupStr : string) : number {
        let backup = JSON.parse(backupStr);
        // TODO: check, if backup string is consistent
        let q = new SellQuestion();
        q.idx = this.questions.length;
        // source and generated HTML
        q.src = backup["source_code"];
        q.titleHtml = backup["title_html"];
        q.bodyHtml = backup["body_html"];
        // variables
        q.symbols = {};
        for(let i=0; i<backup["variables"].length; i++) {
            let v = backup["variables"][i];
            let sym = new SellSymbol();
            sym.importDictionary(v);
            q.symbols[v["id"]] = sym;
        }
        q.solutionSymbols = {};
        for(let i=0; i<backup["solution_variables"].length; i++) {
            let v = backup["solution_variables"][i];
            let sym = new SellSymbol();
            sym.importDictionary(v);
            q.solutionSymbols[v["id"]] = sym;
        }
        // input fields
        q.inputs = [];
        for(let i=0; i<backup["input_fields"].length; i++) {
            let input = new SellInput();
            let f = backup["input_fields"][i];
            input.htmlElementInputType = f["element_type"];
            input.htmlElementId = f["element_id"];
            input.htmlElementId_feedback = f["element_id__feedback"];
            input.correct = f["correct"];
            input.evaluationFeedbackStr = f["feedback_message"];
            input.studentAnswer = f["student_answer_string"];
            input.solutionVariableId = f["solution_variable_id"];
            q.inputs.push(input);
        }
        // global evaluation feedback
        q.allAnswersCorrect = backup["general_feedback"]["all_answers_correct"];
        q.generalFeedbackStr = backup["general_feedback"]["feedback_message"];
        // push question and return index
        this.questions.push(q);
        return q.idx;
    }*/

  /*getElementByIdAndType(id : string, type) {
        // TODO:!!!!!
        / *if (this.environment == "mumie") {
            // https://www.integral-learning.de/platform/
            let inputField;
            inputField = Array.from(document.getElementsByTagName(type))
                .filter((inputFields) => inputFields.id === id)
                .find((inputFields) => inputFields.offsetParent !== null);
            return inputField ? inputField : document.getElementById(id);
        } else {
            // standalone version
            return document.getElementById(id);
        }* /
        return document.getElementById(id);
    }*/

  backupLexer(): { [key: string]: any } {
    // backup lexer (used e.g. in code-loops)
    return {
      tk: this.tk,
      tk_line: this.tk_line,
      tk_col: this.tk_col,
      tk2: this.tk2,
      tkIdx: this.tkIdx,
      id: this.id,
    };
  }

  replayLexer(lexState: { [key: string]: any }) {
    // replay lexer backup (used e.g. in code-loops)
    this.tk = lexState['tk'];
    this.tk_line = lexState['tk_line'];
    this.tk_col = lexState['tk_col'];
    this.tk2 = lexState['tk2'];
    this.tkIdx = lexState['tkIdx'];
    this.id = lexState['id'];
  }

  createUniqueID() {
    return '' + this.uniqueIDCtr++;
  }

  /*updateMatrixInputs(questionID : number) : boolean {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.matrixInput != null) // TODO: better compare input.htmlElementInputType??
                input.matrixInput.updateHTML();
        }
        return true;
    }*/

  /*createProgrammingTaskEditors(questionID : number) : boolean {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.htmlElementInputType == SellInputElementType.PROGRAMMING) {
                let textarea = getHtmlChildElementRecursive(q.bodyHtmlElement, input.htmlElementId);
                let proglang = '';
                if(input.solutionVariableRef.value.type.startsWith("Java"))
                    proglang = 'java';
                else if(input.solutionVariableRef.value.type.startsWith("Python"))
                    proglang = 'python';
                else
                    alert('UNIMPLMENTED: createProgrammingTaskEditors: unimplemented type '
                        + input.solutionVariableRef.value.type);
                this.createIDE(input, textarea, 'java', 150); // TODO: make height adjustable
            }
        }
        return true;
    }*/

  /*updateMatrixDims(questionID : number, htmlElementId : string,
        deltaRows : number, deltaCols : number) : boolean {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.matrixInput != null && input.htmlElementId == htmlElementId)
                input.matrixInput.resize(deltaRows, deltaCols);
        }
        return true;
    }*/

  next() {
    // look-ahead 1
    if (this.tkIdx >= this.tokens.length) {
      this.tk = '§END';
      this.tk_line = -1;
      this.tk_col = -1;
    } else {
      this.tk = this.tokens[this.tkIdx].str;
      this.tk_line = this.tokens[this.tkIdx].line;
      this.tk_col = this.tokens[this.tkIdx].col;
    }
    // look-ahead 2
    if (this.tkIdx + 1 >= this.tokens.length) this.tk2 = '§END';
    else this.tk2 = this.tokens[this.tkIdx + 1].str;
    this.tkIdx++;

    if (!this.parseWhitespaces && this.tk === ' ') this.next();

    // lexer hack for parsing inline code: e.g. ['a','_','b'] -> ['a_b']
    if (this.parsingInlineCode && Lexer.isIdentifier(this.tk)) {
      while (
        this.parsingInlineCode &&
        this.tkIdx < this.tokens.length - 1 &&
        this.tk !== '§END' &&
        (this.tokens[this.tkIdx].str === '_' ||
          Lexer.isIdentifier(this.tokens[this.tkIdx].str) ||
          Lexer.isInteger(this.tokens[this.tkIdx].str))
      ) {
        this.tk += this.tokens[this.tkIdx].str;
        this.tk_line = this.tokens[this.tkIdx].line;
        this.tk_col = this.tokens[this.tkIdx].col;
        this.tkIdx++;
      }
    }
    if (!this.parseWhitespaces && this.tk === ' ') this.next();
  }

  err(msg: string) {
    throw 'Error:' + this.tk_line + ':' + this.tk_col + ': ' + msg;
  }

  terminal(t: string) {
    if (this.tk === t) this.next();
    else {
      if (t == '§EOL') this.err("expected linebreak, got '" + this.tk + "'");
      else
        this.err(
          "expected '" +
            t +
            "', got '" +
            this.tk.replace('§EOL', 'linebreak') +
            "'",
        );
    }
  }

  ident() {
    if (this.isIdent()) {
      this.id = this.tk;
      this.next();
    } else this.err('expected identifier');
  }

  isIdent() {
    return Lexer.isIdentifier(this.tk);
  }

  isNumber() {
    return !isNaN(this.tk as any);
  }

  isInt() {
    return Lexer.isInteger(this.tk);
  }

  is(s: string) {
    return this.tk === s;
  }

  is2(s: string) {
    return this.tk2 === s;
  }

  isNumberInt(v: number) {
    return Math.abs(v - Math.round(v)) < 1e-6;
  }

  pushSym(type: symtype, value: any, precision = 1e-9) {
    if (this.q == null) return; // TODO: assert false
    this.q.stack.push(new SellSymbol(type, value, precision));
  }

  charToHTML(c: string) {
    switch (c) {
      case '§EOL':
        return '<br/>\n';
      default:
        return c;
    }
  }

  // sell =
  //   title { code | text };
  parse() {
    if (this.textParser == null || this.q == null) {
      return; // TODO: assert false
    }
    this.textParser.parseTitle();
    this.q.html = '';
    while (!this.is('§END')) {
      if (this.codeParser == null) return; // TODO: assert false
      if (this.is('§CODE_START')) this.codeParser.parseCode();
      else this.textParser.parseText();
    }
    this.q.bodyHtml = this.q.html;
    //this.createHighLevelHTML();
  }

  /*createHighLevelHTML() {
        // create high-level HTML:
        this.q.html  = '<div id="sell_question_html_element_' + this.q.idx + '" class="card border-dark">\n';
        this.q.html += '<div class="card-body px-3 py-2">\n'; // ** begin body
        this.q.html += '    <span class="h2 py-1 my-1">' + this.q.titleHtml + '</span><br/>\n';
        this.q.html += '    <a name="question-' + (this.questions.length-1) + '"></a>\n';
        this.q.html += '<div class="py-1">';
        this.q.html += this.q.bodyHtml;
        this.q.html += '</div>';
        this.q.html += '<span>';
        // submit button
        //this.q.html += '<input type="image" id="button-evaluate" onclick="sellquiz.autoEvaluateQuiz(' + this.qidx + ', \'sell_question_html_element_' + this.q.idx + '\');" height="28px" src=\"' + check_symbol_svg + '\" title="evaluate"></input>';
        const evalStr = GET_STR('evaluate', this.language, false);
        this.q.html += '<button type="button" class="btn btn-primary" onclick="sellquiz.autoEvaluateQuiz(' + this.qidx + ', \'sell_question_html_element_' + this.q.idx + '\');">' + evalStr + '</button>'
        // edit button
        if(this.editButton) {
            this.q.html += '&nbsp;<button type="button" class="btn btn-primary" onclick="editSellQuestion(' + this.qidx + ')">Edit</button>';
        }
        // general feedback
        this.q.html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="general_feedback"></span>';
        // end
        this.q.html += '</span>';
        this.q.html += '</div>\n'; // ** end body (begins in keyword 'TITLE')
        this.q.html += '</div>\n'; // *** end of card
        this.q.html += '<br/>';
    }*/

  /*enableInputFields(questionID : number, enable = true) {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        if(q.bodyHtmlElement == null)
            sellassert(false, "enableInputFields(): q.bodyHtmlElement was not set");
        for(let i=0; i<q.inputs.length; i++) {
            let element = getHtmlChildElementRecursive(q.bodyHtmlElement, q.inputs[i].htmlElementId);
            (<HTMLInputElement>element).disabled = !enable;
        }
        return true;
    }*/
} // end of class Sell
