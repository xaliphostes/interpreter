import { Interpreter } from "./Interpreter"

function interpret(code: string) {
    const interpreter = new Interpreter()
    interpreter.interpret(code)
}

// -----------------------------------
// Basic printing
// -----------------------------------

interpret(`
    x = 42
    print x
`) // Outputs: 42

// -----------------------------------
// Print expressions
// -----------------------------------
interpret(`
    print 2 + 3 * 4
`) // Outputs: 14

// -----------------------------------
// Print in if statements
// -----------------------------------
interpret(`
    if 5 > 3 then
        print 10
    else
        print 0
    end
`) // Outputs: 10

// -----------------------------------
// Print in loops
// -----------------------------------
interpret(`
    for i = 1 to 5
        print i
    end
`) // Outputs: 1, 2, 3, 4, 5

// -----------------------------------
// Print function results
// -----------------------------------
interpret(`
    fn add(a, b)
        return a + b
    end

    result = add(5, 3)
    print result
`) // Outputs: 8

// -----------------------------------
// Combining functions
// -----------------------------------
interpret(`
    x = 0.5
    result = sin(x) + cos(x) * cos(x)
    print result
`) // Should be 1 (sin²(x) + cos²(x) = 1)


// -----------------------------------
// Other test: conditional function
// -----------------------------------
interpret(`
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
`) // Output: depend on x
