let angleMode = 'DEG'; // Default mode is Degrees
const display = document.getElementById("display");
const clickSound = document.getElementById("clickSound");

function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

function appendValue(value) {
  playClickSound();
  display.value += value;
}

function appendOperator(op) {
  playClickSound();
  display.value += op;
}

function appendFunction(func) {
  playClickSound();
  if (func === 'sqrt') {
    display.value += '√(';
  } else if (func === 'log') {
    display.value += 'log(';
  } else if (func === 'exp') {
    display.value += 'exp(';
  } else if (func === 'factorial') {
    display.value += '!';
  } else {
    display.value += func + '(';
  }
}

function appendConstant(name) {
  playClickSound();
  if (name === 'pi') {
    display.value += Math.PI.toFixed(8);
  }
}

function clearDisplay() {
  playClickSound();
  display.value = '';
}

function deleteChar() {
  playClickSound();
  display.value = display.value.slice(0, -1);
}

function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

function calculate() {
  playClickSound();
  let originalInput = display.value; // 🟢 save input before changes
let expr = originalInput;


  // Check for y = graphing
  if (/^y\s*=\s*/i.test(expr)) {
    const equation = expr.replace(/^y\s*=\s*/i, '');
    drawGraph(equation);
    return;
  } else {
    document.getElementById('graphCanvas').style.display = 'none';
  }

  try {
    expr = expr.replace(/π/g, Math.PI);
    expr = expr.replace(/√\(/g, 'Math.sqrt(');
    expr = expr.replace(/log\(/g, 'Math.log10(');
    expr = expr.replace(/exp\(/g, 'Math.exp(');

    // Apply angle conversion for DEG mode
    if (angleMode === 'DEG') {
      expr = expr.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
      expr = expr.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
      expr = expr.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
    } else {
      expr = expr.replace(/sin\(/g, 'Math.sin(');
      expr = expr.replace(/cos\(/g, 'Math.cos(');
      expr = expr.replace(/tan\(/g, 'Math.tan(');
    }

    // Factorial
    if (expr.includes('!')) {
      expr = expr.replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));
    }
    let originalInput = display.value; // before auto-correct
expr = showSuggestion(expr); // apply corrections



    const result = eval(expr);
    display.value = result;
    speakResult(result);
    addToHistory(originalInput, result);
  } catch (e) {
    display.value = 'Error';
  }
}

let graph = null;
document.getElementById('suggestion').textContent = '';

function drawGraph(equationStr) {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';

  const xValues = [];
  const yValues = [];

  for (let x = -10; x <= 10; x += 0.1) {
    xValues.push(x);
    try {
      // Replace math symbols with JavaScript equivalents
      let expr = equationStr
        .replace(/π/g, Math.PI)
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/x/g, `(${x})`);

      // Handle factorial
      if (expr.includes('!')) {
        expr = expr.replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));
      }

      const y = eval(expr);
      yValues.push(y);
    } catch (e) {
      yValues.push(null);
    }
  }

  if (graph) graph.destroy();

  graph = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xValues,
      datasets: [{
        label: 'y = ' + equationStr,
        data: yValues,
        borderColor: '#007bff',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      }]
    },
    options: {
      responsive: false,
      scales: {
        x: { title: { display: true, text: 'x' } },
        y: { title: { display: true, text: 'y' } }
      }
    }
  });
}


function startVoiceInput() {
  playClickSound();

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = function (event) {
    let transcript = event.results[0][0].transcript.toLowerCase();
      // Voice-based angle mode switch
  if (transcript.includes("degree")) {
    angleMode = "DEG";
    document.getElementById("angleMode").innerText = "Degrees";
    speakResult("Switched to degrees mode");
    return;
  }
  if (transcript.includes("radian")) {
    angleMode = "RAD";
    document.getElementById("angleMode").innerText = "Radians";
    speakResult("Switched to radians mode");
    return;
  }


    // Convert natural language to math expression
    transcript = transcript
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times|multiplied by|multiply/g, '*')
      .replace(/divided by|over/g, '/')
      .replace(/into/g, '*')
      .replace(/equals|equal to/g, '=')

      // Scientific functions
      .replace(/sine of|sin of/g, 'sin(')
      .replace(/cosine of|cos of/g, 'cos(')
      .replace(/tangent of|tan of/g, 'tan(')
      .replace(/logarithm of|log of/g, 'log(')
      .replace(/square root of/g, '√(')
      .replace(/exponential of|exp of|e x p/g, 'exp(')
      .replace(/factorial of/g, '!')

      // Constants
      .replace(/\bpi\b/g, 'π')

      // Numbers (basic words to digits)
      .replace(/\bzero\b/g, '0')
      .replace(/\bone\b/g, '1')
      .replace(/\btwo\b/g, '2')
      .replace(/\bthree\b/g, '3')
      .replace(/\bfour\b/g, '4')
      .replace(/\bfive\b/g, '5')
      .replace(/\bsix\b/g, '6')
      .replace(/\bseven\b/g, '7')
      .replace(/\beight\b/g, '8')
      .replace(/\bnine\b/g, '9')
      .replace(/\bten\b/g, '10')

      // Parentheses
      .replace(/open bracket|open parenthesis/g, '(')
      .replace(/close bracket|close parenthesis/g, ')')
      .replace(/point/g, '.');

    // Remove any trailing equals
    transcript = transcript.replace(/=/g, '');

    display.value = transcript;
    calculate();
  };

  recognition.onerror = function (event) {
    alert('Voice input failed: ' + event.error);
  };
}


function speakResult(result = display.value) {
  playClickSound();
  const speech = new SpeechSynthesisUtterance("The answer is " + result);
  window.speechSynthesis.speak(speech);
}

// Handle keyboard input
document.addEventListener("keydown", function (e) {
  const key = e.key;
  if (!isNaN(key) || "+-*/().".includes(key)) {
    appendValue(key);
  } else if (key === "Enter") {
    e.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    deleteChar();
  } else if (key === "c" || key === "C") {
    clearDisplay();
  }
});

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("dark");
  playClickSound();
}
function changeTheme(theme) {
  document.body.className = theme; // Clears other classes and applies selected
  playClickSound();
}
function toggleAngleMode() {
  angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
  document.getElementById('angleMode').innerText = angleMode === 'DEG' ? 'Degrees' : 'Radians';
  playClickSound();
}
function showSuggestion(expr) {
  let suggestion = '';
  let correctedExpr = expr;

  // Auto-correct sin30 → sin(30)
  if (/sin\d+/.test(expr)) {
    const match = expr.match(/sin(\d+)/);
    if (match) {
      suggestion = `Auto-corrected: sin${match[1]} → sin(${match[1]})`;
      correctedExpr = expr.replace(/sin(\d+)/, `sin(${match[1]})`);
    }
  }

  if (/cos\d+/.test(correctedExpr)) {
    const match = correctedExpr.match(/cos(\d+)/);
    if (match) {
      suggestion = `Auto-corrected: cos${match[1]} → cos(${match[1]})`;
      correctedExpr = correctedExpr.replace(/cos(\d+)/, `cos(${match[1]})`);
    }
  }

  if (/tan\d+/.test(correctedExpr)) {
    const match = correctedExpr.match(/tan(\d+)/);
    if (match) {
      suggestion = `Auto-corrected: tan${match[1]} → tan(${match[1]})`;
      correctedExpr = correctedExpr.replace(/tan(\d+)/, `tan(${match[1]})`);
    }
  }

  if (/log\d+/.test(correctedExpr)) {
    const match = correctedExpr.match(/log(\d+)/);
    if (match) {
      suggestion = `Auto-corrected: log${match[1]} → log(${match[1]})`;
      correctedExpr = correctedExpr.replace(/log(\d+)/, `log(${match[1]})`);
    }
  }

  // Show suggestion on screen
  document.getElementById('suggestion').textContent = suggestion;

  // Return the corrected expression
  return correctedExpr;
}
function askAI() {
  playClickSound();
  const question = document.getElementById('aiQuestion').value.toLowerCase();
  let answer = '';

  if (question.includes('sine') || question.includes('sin')) {
    answer = "Sine (sin) is a trigonometric function that returns the ratio of the opposite side to the hypotenuse in a right triangle.";
  } else if (question.includes('cosine') || question.includes('cos')) {
    answer = "Cosine (cos) is the ratio of the adjacent side to the hypotenuse in a right triangle.";
  } else if (question.includes('tangent') || question.includes('tan')) {
    answer = "Tangent (tan) is the ratio of the opposite side to the adjacent side in a right triangle.";
  } else if (question.includes('log') || question.includes('logarithm')) {
    answer = "Logarithm (log) tells you what power you need to raise a number to get another number. Example: log10(100) = 2.";
  } else if (question.includes('factorial') || question.includes('!')) {
    answer = "Factorial (!) multiplies a number by all whole numbers below it. Example: 4! = 4×3×2×1 = 24.";
  } else if (question.includes('degree') || question.includes('radian')) {
    answer = "Degrees and radians are units for measuring angles. 180 degrees = π radians.";
  } else if (question.includes('pi')) {
    answer = "Pi (π) is approximately 3.14159 and is the ratio of a circle’s circumference to its diameter.";
  } else if (question.includes('exponential') || question.includes('exp')) {
    answer = "Exponential function (exp) means e raised to a power. exp(1) = e ≈ 2.718.";
  } else if (question.includes('square root') || question.includes('√')) {
    answer = "Square root (√) of a number is a value that, when multiplied by itself, gives the original number.";
  } else {
    answer = "Sorry, I don't understand that yet. Try asking about sin, cos, log, pi, etc.";
  }

  document.getElementById('aiAnswer').innerText = answer;
  speakResult(answer);
}
function addToHistory(expression, result) {
  const historyList = document.getElementById('historyList');

  const listItem = document.createElement('li');
  listItem.textContent = `${expression} = ${result}`;

  historyList.insertBefore(listItem, historyList.firstChild);

  // Limit history to 10 items
  if (historyList.childElementCount > 10) {
    historyList.removeChild(historyList.lastChild);
  }
}
function clearHistory() {
  document.getElementById('historyList').innerHTML = '';
}
function toggleUnitMode() {
  const unitSection = document.getElementById('unitConverter');
  const modeLabel = document.getElementById('modeLabel');
  const calcButtons = document.querySelector('.calculator-buttons');

  if (unitSection.style.display === 'none') {
    unitSection.style.display = 'block';
    calcButtons.style.display = 'none';
    modeLabel.innerText = 'Unit Converter';
  } else {
    unitSection.style.display = 'none';
    calcButtons.style.display = 'grid';
    modeLabel.innerText = 'Calculator';
  }
}
function convertUnit() {
  const input = document.getElementById('unitInput').value.trim().toLowerCase();
  const output = document.getElementById('unitResult');

  let value, unit;
  const match = input.match(/^([\d.]+)\s*([a-z°]+)$/);

  if (!match) {
    output.innerText = "❌ Invalid format (try: 10 km)";
    return;
  }

  value = parseFloat(match[1]);
  unit = match[2];

  let result = '';

  switch (unit) {
    case "km": result = `${(value * 0.621371).toFixed(2)} miles`; break;
    case "miles": result = `${(value / 0.621371).toFixed(2)} km`; break;

    case "kg": result = `${(value * 2.20462).toFixed(2)} lb`; break;
    case "lb": result = `${(value / 2.20462).toFixed(2)} kg`; break;

    case "cm": result = `${(value / 100).toFixed(2)} meters`; break;
    case "m": result = `${(value * 100).toFixed(2)} cm`; break;

    case "inches": result = `${(value / 12).toFixed(2)} feet`; break;
    case "feet": result = `${(value * 12).toFixed(2)} inches`; break;

    case "l": result = `${(value * 1000).toFixed(2)} ml`; break;
    case "ml": result = `${(value / 1000).toFixed(2)} L`; break;

    case "g": result = `${(value / 1000).toFixed(2)} kg`; break;
    case "grams": result = `${(value / 1000).toFixed(2)} kg`; break;
    case "kg2": result = `${(value * 1000).toFixed(2)} g`; break;

    case "°c":
    case "c":
      result = `${((value * 9/5) + 32).toFixed(2)} °F`; break;

    case "°f":
    case "f":
      result = `${((value - 32) * 5/9).toFixed(2)} °C`; break;
          // ...existing cases

    case "n": // Newtons to kg·m/s² (1 N = 1 kg·m/s²)
      result = `${(value / 9.80665).toFixed(4)} kg·force`; break;
    case "kgf": // kg-force to N
      result = `${(value * 9.80665).toFixed(2)} N`; break;

    case "j": // Joules to calories
    case "joules":
      result = `${(value / 4.184).toFixed(2)} calories`; break;
    case "cal": // calories to Joules
      result = `${(value * 4.184).toFixed(2)} J`; break;

    case "pa": // Pascals to atm
      result = `${(value / 101325).toFixed(5)} atm`; break;
    case "atm": // atm to Pascals
      result = `${(value * 101325).toFixed(2)} Pa`; break;

    case "w": // Watts to horsepower
      result = `${(value / 745.7).toFixed(4)} hp`; break;
    case "hp": // horsepower to Watts
      result = `${(value * 745.7).toFixed(2)} W`; break;


    default:
      result = "❓ Unit not supported.";
  }


  output.innerText = result;
  speakResult(result); // Optional: speak output
}
function speakUnitInput() {
  const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = function(event) {
    const spoken = event.results[0][0].transcript.toLowerCase();
    const match = spoken.match(/(\d+\.?\d*)\s*([a-z°]+)(?:\sto\s)?\s*([a-z°]+)/i);

    if (match) {
      const value = match[1];
      const fromUnit = match[2];
      const toUnit = match[3];

      // Fill input box with text like: "10 km"
      document.getElementById('unitInput').value = `${value} ${fromUnit}`;
      convertUnit();
    } else {
      document.getElementById('unitResult').innerText = "Could not understand. Try: '10 kg to lb'";
    }
  };

  recognition.onerror = function() {
    document.getElementById('unitResult').innerText = "🎤 Voice recognition error.";
  };
}








