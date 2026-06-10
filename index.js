const display = document.querySelector("#display");
const expressionPreview = document.querySelector("#expression");
const buttons = document.querySelector(".buttons");
const historyList = document.querySelector("#historyList");
const historyCount = document.querySelector("#historyCount");
const themeButton = document.querySelector('[data-action="theme"]');
const clearHistoryButton = document.querySelector('[data-action="clear-history"]');

const operators = new Set(["+", "-", "*", "/"]);
const historyLimit = 8;
let expression = "";
let history = JSON.parse(localStorage.getItem("calculatorHistory") || "[]");
let shouldResetDisplay = false;

const formatExpression = (value) => value
    .replaceAll("*", "\u00d7")
    .replaceAll("/", "\u00f7")
    .replaceAll("-", "\u2212");

const saveHistory = () => {
    localStorage.setItem("calculatorHistory", JSON.stringify(history));
};

const renderHistory = () => {
    historyList.innerHTML = "";
    historyCount.textContent = history.length;

    if (!history.length) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "Your recent calculations will appear here.";
        historyList.append(empty);
        return;
    }

    history.forEach((item) => {
        const row = document.createElement("li");
        const button = document.createElement("button");
        const expressionLine = document.createElement("span");
        const resultLine = document.createElement("span");

        button.className = "history-item";
        button.type = "button";
        button.dataset.result = item.result;

        expressionLine.className = "history-expression";
        expressionLine.textContent = `${formatExpression(item.expression)} =`;

        resultLine.className = "history-result";
        resultLine.textContent = item.result;

        button.append(expressionLine, resultLine);
        row.append(button);
        historyList.append(row);
    });
};

const addHistoryItem = (calculation, result) => {
    history = [
        { expression: calculation, result },
        ...history.filter((item) => item.expression !== calculation || item.result !== result),
    ].slice(0, historyLimit);

    saveHistory();
    renderHistory();
};

const updateDisplay = (value = expression || "0", preview = "") => {
    display.textContent = value;
    expressionPreview.textContent = preview;
    display.classList.remove("display--error");
};

const showError = (message = "Check the expression") => {
    display.textContent = "Error";
    display.classList.add("display--error");
    expressionPreview.textContent = message;
    expression = "";
    shouldResetDisplay = true;
};

const tokenize = (input) => {
    const tokens = [];
    let number = "";

    for (let index = 0; index < input.length; index += 1) {
        const char = input[index];
        const previous = input[index - 1];
        const isUnaryMinus = char === "-" && (index === 0 || operators.has(previous));

        if (/\d|\./.test(char) || isUnaryMinus) {
            number += char;
            continue;
        }

        if (char === "%") {
            if (!number) return null;
            number = String(Number(number) / 100);
            continue;
        }

        if (operators.has(char)) {
            if (number) {
                tokens.push(Number(number));
                number = "";
            }

            tokens.push(char);
            continue;
        }

        return null;
    }

    if (number) tokens.push(Number(number));

    return tokens.every((token) => Number.isFinite(token) || operators.has(token)) ? tokens : null;
};

const evaluateExpression = (input) => {
    const tokens = tokenize(input);

    if (!tokens || operators.has(tokens.at(-1))) return null;

    const working = [...tokens];

    for (const group of [["*", "/"], ["+", "-"]]) {
        for (let index = 0; index < working.length; index += 1) {
            if (!group.includes(working[index])) continue;

            const left = working[index - 1];
            const right = working[index + 1];
            const operator = working[index];
            let result;

            if (operator === "/" && right === 0) return null;
            if (operator === "*") result = left * right;
            if (operator === "/") result = left / right;
            if (operator === "+") result = left + right;
            if (operator === "-") result = left - right;

            working.splice(index - 1, 3, result);
            index -= 1;
        }
    }

    const result = working[0];
    return Number.isFinite(result) ? Number(result.toFixed(10)) : null;
};

const appendValue = (value) => {
    if (shouldResetDisplay && !operators.has(value)) {
        expression = "";
        shouldResetDisplay = false;
    }

    const last = expression.at(-1);

    if (value === "." && expression.split(/[+\-*/]/).at(-1).includes(".")) return;

    if (operators.has(value) && operators.has(last)) {
        expression = expression.slice(0, -1) + value;
    } else if (value === "%" && (!last || operators.has(last) || last === "%")) {
        return;
    } else {
        expression += value;
    }

    updateDisplay(formatExpression(expression));
};

const clearCalculator = () => {
    expression = "";
    shouldResetDisplay = false;
    updateDisplay();
};

const clearHistory = () => {
    history = [];
    saveHistory();
    renderHistory();
};

const backspace = () => {
    expression = expression.slice(0, -1);
    shouldResetDisplay = false;
    updateDisplay(formatExpression(expression));
};

const toggleSign = () => {
    if (!expression) return;

    const match = expression.match(/(-?\d*\.?\d+%?)$/);
    if (!match) return;

    const start = match.index;
    const number = match[0];
    const toggled = number.startsWith("-") ? number.slice(1) : `-${number}`;

    expression = `${expression.slice(0, start)}${toggled}`;
    updateDisplay(formatExpression(expression));
};

const calculate = () => {
    if (!expression) return;

    const calculation = expression;
    const result = evaluateExpression(calculation);

    if (result === null) {
        showError();
        return;
    }

    expression = String(result);
    shouldResetDisplay = true;
    updateDisplay(expression, `${formatExpression(calculation)} =`);
    addHistoryItem(calculation, expression);
};

const getCurrentNumber = () => {
    if (!expression) return null;

    const result = evaluateExpression(expression);
    return result === null ? null : result;
};

const applyAdvancedAction = (action) => {
    const value = getCurrentNumber();

    if (value === null) {
        showError();
        return;
    }

    let result;
    let label;

    if (action === "sqrt") {
        if (value < 0) {
            showError("Square root needs a positive number");
            return;
        }

        result = Math.sqrt(value);
        label = `sqrt(${formatExpression(expression)})`;
    }

    if (action === "square") {
        result = value ** 2;
        label = `(${formatExpression(expression)})^2`;
    }

    if (action === "reciprocal") {
        if (value === 0) {
            showError("Cannot divide by zero");
            return;
        }

        result = 1 / value;
        label = `1/(${formatExpression(expression)})`;
    }

    result = String(Number(result.toFixed(10)));
    expression = result;
    shouldResetDisplay = true;
    updateDisplay(result, `${label} =`);
    addHistoryItem(label, result);
};

const copyResult = async () => {
    const value = display.textContent;

    try {
        await navigator.clipboard.writeText(value);
        expressionPreview.textContent = "Copied result";
    } catch {
        expressionPreview.textContent = "Copy unavailable";
    }
};

const toggleTheme = () => {
    document.body.classList.toggle("light");
    localStorage.setItem("calculatorTheme", document.body.classList.contains("light") ? "light" : "dark");
};

buttons.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const { value, action } = button.dataset;

    if (value) appendValue(value);
    if (action === "clear") clearCalculator();
    if (action === "sign") toggleSign();
    if (action === "backspace") backspace();
    if (action === "calculate") calculate();
    if (["sqrt", "square", "reciprocal"].includes(action)) applyAdvancedAction(action);
});

document.querySelector(".display-actions").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "copy") copyResult();
    if (button.dataset.action === "backspace") backspace();
});

historyList.addEventListener("click", (event) => {
    const button = event.target.closest(".history-item");
    if (!button) return;

    expression = button.dataset.result;
    shouldResetDisplay = true;
    updateDisplay(expression, "Loaded from history");
});

themeButton.addEventListener("click", toggleTheme);
clearHistoryButton.addEventListener("click", clearHistory);

document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (/\d/.test(key) || key === ".") appendValue(key);
    if (["+", "-", "*", "/", "%"].includes(key)) appendValue(key);
    if (key === "Enter" || key === "=") calculate();
    if (key === "Escape") clearCalculator();
    if (key === "Backspace") backspace();
});

if (localStorage.getItem("calculatorTheme") === "light") {
    document.body.classList.add("light");
}

renderHistory();
updateDisplay();
