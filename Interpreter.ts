// Main interpreter class
export class Interpreter {
    public context: InterpreterContext

    constructor() {
        this.context = new InterpreterContext()
    }

    interpret(input: string): any {
        const lexer = new Lexer(input)
        const parser = new Parser(lexer, this)
        const ast = parser.parse()
        return ast.evaluate(this.context)
    }
}

// ---------------------------------------------------

// Token types for our language
enum TokenType {
    NUMBER,
    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,
    IDENTIFIER,
    EQUALS,        // Assignment =
    EQUAL,         // Comparison ==
    NOT_EQUAL,     // !=
    GREATER,       // >
    GREATER_EQUAL, // >=
    LESS,          // <
    LESS_EQUAL,    // <=
    IF,
    THEN,
    ELSE,
    END,
    FOR,
    TO,
    FN,
    RETURN,
    LPAREN,
    RPAREN,
    COMMA,
    PRINT,
    BUILTIN_FN,
    EOF
}

// Token class to represent lexical tokens
class Token {
    constructor(
        public type: TokenType,
        public value: string | number
    ) { }
}

// Lexer to convert input string into tokens
class Lexer {
    private position: number = 0
    private currentChar: string | null
    private keywords: Map<string, TokenType>

    constructor(private input: string) {
        this.currentChar = this.input[0]
        this.keywords = new Map([
            ['if', TokenType.IF],
            ['then', TokenType.THEN],
            ['else', TokenType.ELSE],
            ['end', TokenType.END],
            ['for', TokenType.FOR],
            ['to', TokenType.TO],
            ['fn', TokenType.FN],
            ['return', TokenType.RETURN],
            ['print', TokenType.PRINT]
        ])
    }

    private advance(): void {
        this.position++
        this.currentChar = this.position < this.input.length ? this.input[this.position] : null
    }

    private skipWhitespace(): void {
        while (this.currentChar && /\s/.test(this.currentChar)) {
            this.advance()
        }
    }

    private readNumber(): number {
        let result = ''
        let hasDecimalPoint = false

        // Read digits before decimal point
        while (this.currentChar && (/\d/.test(this.currentChar) || this.currentChar === '.')) {
            if (this.currentChar === '.') {
                if (hasDecimalPoint) {
                    throw new Error('Invalid number: multiple decimal points')
                }
                hasDecimalPoint = true
            }
            result += this.currentChar
            this.advance()
        }

        // Handle scientific notation (e.g., 1.23e-4)
        if (this.currentChar && (this.currentChar.toLowerCase() === 'e')) {
            result += this.currentChar
            this.advance()

            // Handle optional + or - after e
            if (this.currentChar && (this.currentChar === '+' || this.currentChar === '-')) {
                result += this.currentChar
                this.advance()
            }

            // Read exponent digits
            let hasExponentDigits = false
            while (this.currentChar && /\d/.test(this.currentChar)) {
                hasExponentDigits = true
                result += this.currentChar
                this.advance()
            }

            if (!hasExponentDigits) {
                throw new Error('Invalid scientific notation: missing exponent digits')
            }
        }

        const parsed = Number(result)
        if (isNaN(parsed)) {
            throw new Error(`Invalid number format: ${result}`)
        }

        return parsed
    }

    private readIdentifier(): Token {
        let result = ''
        while (this.currentChar && /[a-zA-Z_]/.test(this.currentChar)) {
            result += this.currentChar
            this.advance()
        }
        const keyword = this.keywords.get(result)
        return keyword !== undefined
            ? new Token(keyword, result)
            : new Token(TokenType.IDENTIFIER, result)
    }

    private peek(): string | null {
        const peekPos = this.position + 1
        return peekPos < this.input.length ? this.input[peekPos] : null
    }

    getNextToken(): Token {
        while (this.currentChar) {
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace()
                continue
            }

            if (/\d/.test(this.currentChar)) {
                return new Token(TokenType.NUMBER, this.readNumber())
            }

            if (/[a-zA-Z_]/.test(this.currentChar)) {
                return this.readIdentifier()
            }

            // Handle two-character operators
            const nextChar = this.peek()
            if (nextChar) {
                const twoCharOp = this.currentChar + nextChar
                switch (twoCharOp) {
                    case '==':
                        this.advance()
                        this.advance()
                        return new Token(TokenType.EQUAL, '==')
                    case '!=':
                        this.advance()
                        this.advance()
                        return new Token(TokenType.NOT_EQUAL, '!=')
                    case '>=':
                        this.advance()
                        this.advance()
                        return new Token(TokenType.GREATER_EQUAL, '>=')
                    case '<=':
                        this.advance()
                        this.advance()
                        return new Token(TokenType.LESS_EQUAL, '<=')
                }
            }

            // Handle single-character operators
            switch (this.currentChar) {
                case '+': this.advance(); return new Token(TokenType.PLUS, '+')
                case '-': this.advance(); return new Token(TokenType.MINUS, '-')
                case '*': this.advance(); return new Token(TokenType.MULTIPLY, '*')
                case '/': this.advance(); return new Token(TokenType.DIVIDE, '/')
                case '=': this.advance(); return new Token(TokenType.EQUALS, '=')
                case '>': this.advance(); return new Token(TokenType.GREATER, '>')
                case '<': this.advance(); return new Token(TokenType.LESS, '<')
                case '(': this.advance(); return new Token(TokenType.LPAREN, '(')
                case ')': this.advance(); return new Token(TokenType.RPAREN, ')')
                case ',': this.advance(); return new Token(TokenType.COMMA, ',')
            }

            throw new Error(`Invalid character: ${this.currentChar}`)
        }

        return new Token(TokenType.EOF, '')
    }
}

// Abstract Syntax Tree nodes
interface ASTNode {
    evaluate(context: InterpreterContext): any
}

class NumberNode implements ASTNode {
    constructor(public value: number) { }

    evaluate(): number {
        return this.value
    }
}

// Add FormatNode to handle number formatting
class FormatNode implements ASTNode {
    constructor(
        public value: ASTNode,
        public decimals: number
    ) { }

    evaluate(context: InterpreterContext): string {
        const num = this.value.evaluate(context)
        return num.toFixed(this.decimals)
    }
}

class BinaryOperationNode implements ASTNode {
    constructor(
        public left: ASTNode,
        public operator: TokenType,
        public right: ASTNode
    ) { }

    evaluate(context: InterpreterContext): number {
        const leftVal = this.left.evaluate(context)
        const rightVal = this.right.evaluate(context)

        switch (this.operator) {
            case TokenType.PLUS: return leftVal + rightVal
            case TokenType.MINUS: return leftVal - rightVal
            case TokenType.MULTIPLY: return leftVal * rightVal
            case TokenType.DIVIDE:
                if (rightVal === 0) throw new Error('Division by zero')
                return leftVal / rightVal
            case TokenType.EQUAL: return Number(leftVal === rightVal)
            case TokenType.NOT_EQUAL: return Number(leftVal !== rightVal)
            case TokenType.GREATER: return Number(leftVal > rightVal)
            case TokenType.GREATER_EQUAL: return Number(leftVal >= rightVal)
            case TokenType.LESS: return Number(leftVal < rightVal)
            case TokenType.LESS_EQUAL: return Number(leftVal <= rightVal)
            default:
                throw new Error('Invalid operator')
        }
    }
}

class IfNode implements ASTNode {
    constructor(
        public condition: ASTNode,
        public thenBody: ASTNode,
        public elseBody?: ASTNode
    ) { }

    evaluate(context: InterpreterContext): any {
        const conditionValue = this.condition.evaluate(context)
        if (conditionValue !== 0) {
            return this.thenBody.evaluate(context)
        } else if (this.elseBody) {
            return this.elseBody.evaluate(context)
        }
        return 0
    }
}

class ForNode implements ASTNode {
    constructor(
        public variable: string,
        public start: ASTNode,
        public end: ASTNode,
        public body: ASTNode
    ) { }

    evaluate(context: InterpreterContext): number {
        const startVal = this.start.evaluate(context)
        const endVal = this.end.evaluate(context)
        let lastValue = 0

        for (let i = startVal; i <= endVal; i++) {
            context.setVariable(this.variable, i)
            lastValue = this.body.evaluate(context)
        }

        return lastValue
    }
}

class FunctionNode implements ASTNode {
    constructor(
        public name: string,
        public params: string[],
        public body: ASTNode
    ) { }

    evaluate(context: InterpreterContext): number {
        context.defineFunction(this.name, this)
        return 0
    }
}

class FunctionCallNode implements ASTNode {
    constructor(
        public name: string,
        public args: ASTNode[]
    ) { }

    evaluate(context: InterpreterContext): any {
        const func = context.getFunction(this.name)
        const newContext = new InterpreterContext(context)

        const evaluatedArgs = this.args.map(arg => arg.evaluate(context))
        func.params.forEach((param, index) => {
            newContext.setVariable(param, evaluatedArgs[index])
        })

        return func.body.evaluate(newContext)
    }
}

class ReturnNode implements ASTNode {
    constructor(public value: ASTNode) { }

    evaluate(context: InterpreterContext): any {
        return this.value.evaluate(context)
    }
}

class BlockNode implements ASTNode {
    constructor(public statements: ASTNode[]) { }

    evaluate(context: InterpreterContext): any {
        let result = 0
        for (const statement of this.statements) {
            result = statement.evaluate(context)
        }
        return result
    }
}

class VariableNode implements ASTNode {
    constructor(public name: string) { }

    evaluate(context: InterpreterContext): number {
        return context.getVariable(this.name)
    }
}

class AssignmentNode implements ASTNode {
    constructor(
        public name: string,
        public value: ASTNode
    ) { }

    evaluate(context: InterpreterContext): number {
        const val = this.value.evaluate(context)
        context.setVariable(this.name, val)
        return val
    }
}

class PrintNode implements ASTNode {
    constructor(public expression: ASTNode) { }

    evaluate(context: InterpreterContext): any {
        const value = this.expression.evaluate(context)
        console.log(value)
        return value
    }
}

class BuiltinFunctionCallNode implements ASTNode {
    constructor(
        public name: string,
        public args: ASTNode[]
    ) { }

    evaluate(context: InterpreterContext): number {
        const evaluatedArgs = this.args.map(arg => arg.evaluate(context))
        return context.executeBuiltinFunction(this.name, evaluatedArgs)
    }
}

// Parser to convert tokens into AST
class Parser {
    private currentToken: Token

    constructor(private lexer: Lexer, private interpreter: Interpreter) {
        this.currentToken = this.lexer.getNextToken()
    }

    private eat(tokenType: TokenType): void {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken()
        } else {
            throw new Error(`Expected ${TokenType[tokenType]}, got ${TokenType[this.currentToken.type]}`)
        }
    }

    private factor(): ASTNode {
        const token = this.currentToken

        switch (token.type) {
            case TokenType.NUMBER:
                this.eat(TokenType.NUMBER)
                return new NumberNode(token.value as number)
            case TokenType.IDENTIFIER:
                this.eat(TokenType.IDENTIFIER)
                if (this.currentToken.type === TokenType.EQUALS) {
                    this.eat(TokenType.EQUALS)
                    const value = this.expr()
                    return new AssignmentNode(token.value as string, value)
                }
                if (this.currentToken.type === TokenType.LPAREN) {
                    return this.functionCall(token.value as string)
                }
                return new VariableNode(token.value as string)
            case TokenType.LPAREN:
                this.eat(TokenType.LPAREN)
                const node = this.expr()
                this.eat(TokenType.RPAREN)
                return node
            default:
                throw new Error('Invalid syntax')
        }
    }

    private term(): ASTNode {
        let node = this.factor()

        while (
            this.currentToken.type === TokenType.MULTIPLY ||
            this.currentToken.type === TokenType.DIVIDE
        ) {
            const operator = this.currentToken.type
            this.eat(operator)
            node = new BinaryOperationNode(node, operator, this.factor())
        }

        return node
    }

    private expr(): ASTNode {
        let node = this.term()

        while (
            [TokenType.PLUS, TokenType.MINUS, TokenType.GREATER, TokenType.LESS].includes(this.currentToken.type)
        ) {
            const operator = this.currentToken.type
            this.eat(operator)
            node = new BinaryOperationNode(node, operator, this.term())
        }

        return node
    }

    private ifStatement(): ASTNode {
        this.eat(TokenType.IF)
        const condition = this.comparison()
        this.eat(TokenType.THEN)
        const thenBody = this.statement()
        let elseBody: ASTNode | undefined

        if (this.currentToken.type === TokenType.ELSE) {
            this.eat(TokenType.ELSE)
            elseBody = this.statement()
        }

        this.eat(TokenType.END)
        return new IfNode(condition, thenBody, elseBody)
    }

    private booleanExpression(): ASTNode {
        return this.comparison()
    }

    private forStatement(): ASTNode {
        this.eat(TokenType.FOR)
        const variable = this.currentToken.value as string
        this.eat(TokenType.IDENTIFIER)
        this.eat(TokenType.EQUALS)
        const start = this.expr()
        this.eat(TokenType.TO)
        const end = this.expr()
        const body = this.statement()
        this.eat(TokenType.END)
        return new ForNode(variable, start, end, body)
    }

    private functionDefinition(): ASTNode {
        this.eat(TokenType.FN)
        const name = this.currentToken.value as string
        this.eat(TokenType.IDENTIFIER)
        this.eat(TokenType.LPAREN)

        const params: string[] = []
        if (this.currentToken.type === TokenType.IDENTIFIER) {
            params.push(this.currentToken.value as string)
            this.eat(TokenType.IDENTIFIER)
            while (this.currentToken.type === TokenType.COMMA) {
                this.eat(TokenType.COMMA)
                params.push(this.currentToken.value as string)
                this.eat(TokenType.IDENTIFIER)
            }
        }

        this.eat(TokenType.RPAREN)
        const body = this.statement()
        this.eat(TokenType.END)
        return new FunctionNode(name, params, body)
    }

    private functionCall(name: string): ASTNode {
        this.eat(TokenType.LPAREN)
        const args: ASTNode[] = []
        if (this.currentToken.type !== TokenType.RPAREN) {
            args.push(this.expr())
            while (this.currentToken.type === TokenType.COMMA) {
                this.eat(TokenType.COMMA)
                args.push(this.expr())
            }
        }
        this.eat(TokenType.RPAREN)
        // return new FunctionCallNode(name, args)

        // Check if it's a built-in function
        if (this.interpreter.context.isBuiltinFunction(name)) {
            return new BuiltinFunctionCallNode(name, args)
        }
        return new FunctionCallNode(name, args)
    }

    private statement(): ASTNode {
        switch (this.currentToken.type) {
            case TokenType.IF:
                return this.ifStatement()
            case TokenType.FOR:
                return this.forStatement()
            case TokenType.FN:
                return this.functionDefinition()
            case TokenType.RETURN:
                this.eat(TokenType.RETURN)
                return new ReturnNode(this.booleanExpression())
            case TokenType.PRINT:
                this.eat(TokenType.PRINT)
                return new PrintNode(this.booleanExpression())
            default:
                return this.comparison()
        }
    }

    private comparison(): ASTNode {
        let node = this.expr()

        while ([
            TokenType.EQUAL,
            TokenType.NOT_EQUAL,
            TokenType.GREATER,
            TokenType.GREATER_EQUAL,
            TokenType.LESS,
            TokenType.LESS_EQUAL
        ].includes(this.currentToken.type)) {
            const operator = this.currentToken.type
            this.eat(operator)
            node = new BinaryOperationNode(node, operator, this.expr())
        }

        return node
    }

    private block(): ASTNode {
        const statements: ASTNode[] = []
        statements.push(this.statement())
        while (this.currentToken.type !== TokenType.EOF) {
            statements.push(this.statement())
        }
        return new BlockNode(statements)
    }

    parse(): ASTNode {
        return this.block()
    }
}

// Interpreter context to store variables and functions
class InterpreterContext {
    private variables: Map<string, number> = new Map()
    private functions: Map<string, FunctionNode> = new Map()
    private builtinFunctions: Map<string, (...args: number[]) => number>

    constructor(private parent?: InterpreterContext) {
        // Initialize built-in math functions
        this.builtinFunctions = new Map([
            ['sin', Math.sin],
            ['cos', Math.cos],
            ['tan', Math.tan],
            ['asin', Math.asin],
            ['acos', Math.acos],
            ['atan', Math.atan],
            ['sqrt', Math.sqrt],
            ['abs', Math.abs],
            ['round', Math.round],
            ['floor', Math.floor],
            ['ceil', Math.ceil],
            ['log', Math.log],
            ['exp', Math.exp],
            ['pow', Math.pow],
            ['min', Math.min],
            ['max', Math.max],
            // Constants
            ['pi', () => Math.PI],
            ['e', () => Math.E],

            // Add formatting function
            ['format', (num: number, decimals: number) => {
                return Number(num.toFixed(decimals))
            }],

            // Add functions to handle floating point arithmetic more precisely
            ['round', (num: number, decimals: number = 0) => {
                const factor = Math.pow(10, decimals)
                return Math.round(num * factor) / factor
            }],

            // Add epsilon comparison for floating point equality
            ['equals', (a: number, b: number, epsilon = 1e-10) => {
                return Math.abs(a - b) < epsilon ? 1 : 0
            }],
            ['bool', (value: number) => {return value !== 0 ? 1 : 0}],
            ['not', (value: number) => {return value === 0 ? 1 : 0}]
        ])
    }

    setVariable(name: string, value: number): void {
        this.variables.set(name, value)
    }

    getVariable(name: string): number {
        const value = this.variables.get(name)
        if (value !== undefined) return value
        if (this.parent) return this.parent.getVariable(name)
        throw new Error(`Variable ${name} is not defined`)
    }

    defineFunction(name: string, func: FunctionNode): void {
        this.functions.set(name, func)
    }

    getFunction(name: string): FunctionNode {
        const func = this.functions.get(name)
        if (func !== undefined) return func
        if (this.parent) return this.parent.getFunction(name)
        throw new Error(`Function ${name} is not defined`)
    }

    isBuiltinFunction(name: string): boolean {
        return this.builtinFunctions.has(name)
    }

    executeBuiltinFunction(name: string, args: number[]): number {
        const func = this.builtinFunctions.get(name)
        if (!func) throw new Error(`Built-in function ${name} not found`)
        return func(...args)
    }
}
