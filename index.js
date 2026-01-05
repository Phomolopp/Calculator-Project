const display = document.getElementById("display");

function appendToDisplay(value) {
    if (display.value === "0" && value !== ".") {
        display.value = value;
    } else {
        display.value += value;
    }
}

function clearDisplay() {
    display.value = "";
}

function calculate() {
    try {
        // Replace % with /100 for calculations
        let expression = display.value.replace(/%/g, "/100");
        display.value = eval(expression);
    } catch {
        display.value = "ERROR";
    }
}

function toggleSign() {
    if(display.value){
        if(display.value.startsWith('-')){
            display.value = display.value.slice(1);
        } else {
            display.value = '-' + display.value;
        }
    }
}

// Optional: keyboard support
document.addEventListener('keydown', (e) => {
    if(e.key >= 0 && e.key <= 9) appendToDisplay(e.key);
    else if(['+', '-', '*', '/'].includes(e.key)) appendToDisplay(e.key);
    else if(e.key === 'Enter') calculate();
    else if(e.key === 'Backspace') display.value = display.value.slice(0,-1);
    else if(e.key === '.') appendToDisplay('.');
});
