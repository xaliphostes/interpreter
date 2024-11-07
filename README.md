# Interpreter in TypeScript
How to write an interpreter in TypeScript.

The interpreter works in these steps:
1) Lexer breaks input into tokens
2) Parser converts tokens into an Abstract Syntax Tree (AST)
3) Interpreter evaluates the AST

## Run the interpreter
```sh
deno run --unstable-sloppy-imports test.ts
```

## Example
```ts
const code = `
    x = 2

    if x == 1 then
        fn op(a, b)
            return a + b
        end
    else
        fn op(a, b)
            return a - b
        end
    end

    result = op(5, 3)
    print result
`

const interpreter = new Interpreter()
interpreter.interpret(code)
```

# Main functionalities
- `if ... else ..; end`
- `for i=0 to 10 ... end`
- `fn name(params) ... return ... end`
- `print ...`

    The print keyword can be used with:
    - Variables
    - Expressions
    - Function calls
    - Inside control structures (if/else, loops)
- All math functions

    **Available mathematical functions**:

    - Trigonometric: `sin, cos, tan, asin, acos, atan`
    - Basic math: `sqrt, abs, round, floor, ceil`
    - Advanced: `log, exp, pow`
    - Multiple arguments: `min, max`
    - Constants: `pi(), e()`

- Basic arithmetic operations (`+, -, *, /`)
- Variable assignment and usage
- Logical operators (`<, >, <=, >=, ==`)

    **Important notes**:
    - Comparisons return 1 for true and 0 for false
    - For floating-point comparisons, consider using the `equals()` function to handle precision issues
    - Comparisons have lower precedence than arithmetic operators
    - Multiple comparisons can be combined using logical operators (if you add them)

- Floating point number
    - Support for decimal points (e.g., `3.14`)
    - Support for scientific notation (e.g., `1.23e-4`)
    - Number formatting with specified decimal places
    - Proper handling of floating-point arithmetic
    - Epsilon comparison for floating-point equality
    - Error handling for invalid number formats
    - `equals(a: number, b: number, epsilon = 1e-10)`
    - `format(num: number, decimals: number)`
    - `round(num: number, decimals: number = 0)`
    - `bool(value: number)`,
    - `not(value: number)`

    **Important considerations**:
    - Numbers are stored as JavaScript's native 64-bit floating-point numbers (IEEE 754)
    - The `format()` function helps control decimal place display
    - The `equals()` function helps compare floating-point numbers safely
    - Scientific notation is supported for both input and output
    - Error handling for invalid number formats (multiple decimal points, invalid scientific notation)
