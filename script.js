"use strict";

/* =========================================================
GENERAL HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function formatNumber(value) {
if (!Number.isFinite(value)) return "Error";

return Number(value.toPrecision(12)).toLocaleString(
undefined,
{
maximumFractionDigits: 10
}
);
}

function showError(element, message = "Error") {
element.value = message;
}

/* =========================================================
DARK MODE
========================================================= */

const themeBtn = $("themeBtn");

const savedTheme =
localStorage.getItem("calculator-theme");

if (savedTheme === "dark") {
document.body.classList.add("dark");
}

themeBtn.addEventListener("click", () => {

document.body.classList.toggle("dark");

localStorage.setItem(
"calculator-theme",
document.body.classList.contains("dark")
? "dark"
: "light"
);

});

/* =========================================================
BASIC CALCULATOR
========================================================= */

const basicDisplay = $("basicDisplay");

document.querySelectorAll("[data-basic]").forEach(button => {

button.addEventListener("click", () => {

const value = button.dataset.basic;

if (value === "clear") {
  basicDisplay.value = "";
  return;
}

if (value === "backspace") {
  basicDisplay.value =
    basicDisplay.value.slice(0, -1);
  return;
}

if (value === "=") {
  calculateBasic();
  return;
}

/*
  If an error is currently displayed,
  start a new calculation.
*/
if (basicDisplay.value === "Error") {
  basicDisplay.value = "";
}

basicDisplay.value += value;

});

});

function calculateBasic() {

let expression =
basicDisplay.value.trim();

if (!expression) return;

if (expression === "Error") {
basicDisplay.value = "";
return;
}

/*
Only calculator characters are permitted.
/
if (!/^[0-9+-/().^%\s]+$/.test(expression)) {
basicDisplay.value = "Error";
return;
}

try {

/*
  Convert calculator power operator.
*/
expression =
  expression.replace(/\^/g, "**");

/*
  Convert simple percentages.
  Example: 50% -> 50 / 100
*/
expression =
  expression.replace(
    /(\d+(?:\.\d+)?)%/g,
    "($1/100)"
  );

const result =
  Function(
    `"use strict"; return (${expression})`
  )();

if (!Number.isFinite(result)) {
  throw new Error();
}

basicDisplay.value =
  formatNumber(result);

} catch {

basicDisplay.value = "Error";

}

}

basicDisplay.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {
  event.preventDefault();
  calculateBasic();
}

if (event.key === "Escape") {
  basicDisplay.value = "";
}

}
);

/* =========================================================
SCIENTIFIC CALCULATOR
========================================================= */

const scientificDisplay =
$("scientificDisplay");

let angleMode = "DEG";

$("angleMode").addEventListener(
"click",
() => {

angleMode =
  angleMode === "DEG"
    ? "RAD"
    : "DEG";

$("angleMode").textContent =
  angleMode;

}
);

$("scientificClear").addEventListener(
"click",
() => {
scientificDisplay.value = "";
}
);

document.querySelectorAll(
"[data-sci]"
).forEach(button => {

button.addEventListener(
"click",
() => {

  const value =
    button.dataset.sci;

  if (value === "clear") {
    scientificDisplay.value = "";
    return;
  }

  if (value === "=") {
    calculateScientific();
    return;
  }

  /*
    Scientific backspace.
  */
  if (value === "backspace") {
    scientificDisplay.value =
      scientificDisplay.value.slice(0, -1);
    return;
  }

  /*
    Trigonometric functions.
  */
  if (value === "sin") {
    applyScientificFunction(
      Math.sin,
      true
    );
    return;
  }

  if (value === "cos") {
    applyScientificFunction(
      Math.cos,
      true
    );
    return;
  }

  if (value === "tan") {
    applyScientificFunction(
      Math.tan,
      true
    );
    return;
  }

  /*
    Inverse trigonometric functions.
  */
  if (value === "asin") {
    applyInverseTrig(Math.asin);
    return;
  }

  if (value === "acos") {
    applyInverseTrig(Math.acos);
    return;
  }

  if (value === "atan") {
    applyInverseTrig(Math.atan);
    return;
  }

  /*
    Other one-number functions.
  */
  if (value === "sqrt") {
    applyScientificFunction(
      Math.sqrt,
      false
    );
    return;
  }

  if (value === "square") {
    appendOperator("^2");
    return;
  }

  if (value === "log") {
    applyScientificFunction(
      Math.log10,
      false
    );
    return;
  }

  if (value === "ln") {
    applyScientificFunction(
      Math.log,
      false
    );
    return;
  }

  if (value === "exp") {
    applyScientificFunction(
      Math.exp,
      false
    );
    return;
  }

  /*
    Scientific power.
    Example:
    5 xʸ 3 = 125
  */
  if (value === "power") {
    appendOperator("^");
    return;
  }

  if (value === "pi") {
    scientificDisplay.value += "π";
    return;
  }

  if (value === "e") {
    scientificDisplay.value += "e";
    return;
  }

  if (value === "open") {
    scientificDisplay.value += "(";
    return;
  }

  if (value === "close") {
    scientificDisplay.value += ")";
    return;
  }

  /*
    If an error is displayed,
    start a fresh calculation.
  */
  if (scientificDisplay.value === "Error") {
    scientificDisplay.value = "";
  }

  scientificDisplay.value += value;

}

);

});

function appendOperator(operator) {

if (
scientificDisplay.value === "" ||
scientificDisplay.value === "Error"
) {
return;
}

scientificDisplay.value += operator;

}

function getCurrentNumber() {

const value =
Number(scientificDisplay.value);

if (!Number.isFinite(value)) {
throw new Error();
}

return value;

}

function toRadians(value) {

return angleMode === "DEG"
? value * Math.PI / 180
: value;

}

function fromRadians(value) {

return angleMode === "DEG"
? value * 180 / Math.PI
: value;

}

function applyScientificFunction(
fn,
usesAngle
) {

try {

const value =
  getCurrentNumber();

const argument =
  usesAngle
    ? toRadians(value)
    : value;

const result =
  fn(argument);

if (!Number.isFinite(result)) {
  throw new Error();
}

scientificDisplay.value =
  formatNumber(result);

} catch {

scientificDisplay.value =
  "Error";

}

}

function applyInverseTrig(fn) {

try {

const value =
  getCurrentNumber();

const result =
  fromRadians(fn(value));

if (!Number.isFinite(result)) {
  throw new Error();
}

scientificDisplay.value =
  formatNumber(result);

} catch {

scientificDisplay.value =
  "Error";

}

}

function calculateScientific() {

let expression =
scientificDisplay.value.trim();

if (!expression) return;

if (expression === "Error") {
scientificDisplay.value = "";
return;
}

try {

/*
  Convert constants.
*/
expression =
  expression
    .replace(/π/g, "Math.PI")
    .replace(/\be\b/g, "Math.E");

/*
  Convert power operator.
*/
expression =
  expression.replace(/\^/g, "**");

/*
  Only permit calculator expressions.
*/
if (
  !/^[0-9+\-*/().\sA-Za-z]+$/.test(
    expression
  )
) {
  throw new Error();
}

/*
  The only allowed identifiers
  are Math.PI and Math.E.
*/
const withoutConstants =
  expression
    .replace(/Math\.PI/g, "")
    .replace(/Math\.E/g, "");

if (
  /[A-Za-z]/.test(
    withoutConstants
  )
) {
  throw new Error();
}

const result =
  Function(
    `"use strict"; return (${expression})`
  )();

if (!Number.isFinite(result)) {
  throw new Error();
}

scientificDisplay.value =
  formatNumber(result);

} catch {

scientificDisplay.value =
  "Error";

}

}

scientificDisplay.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {
  event.preventDefault();
  calculateScientific();
}

if (event.key === "Escape") {
  scientificDisplay.value = "";
}

}
);

/* =========================================================
PERCENTAGE CALCULATOR
========================================================= */

$("percentOfBtn").addEventListener(
"click",
() => {

const percentage =
  Number($("percentX").value);

const number =
  Number($("percentY").value);

if (
  !Number.isFinite(percentage) ||
  !Number.isFinite(number)
) {

  $("percentOfResult").textContent =
    "Please enter valid numbers.";

  return;
}

const result =
  percentage / 100 * number;

$("percentOfResult").textContent =
  `${formatNumber(percentage)}% of ` +
  `${formatNumber(number)} = ` +
  `${formatNumber(result)}`;

}
);

$("changeBtn").addEventListener(
"click",
() => {

const original =
  Number($("originalValue").value);

const current =
  Number($("newValue").value);

if (
  !Number.isFinite(original) ||
  !Number.isFinite(current) ||
  original === 0
) {

  $("changeResult").textContent =
    "Enter valid values. Original value cannot be zero.";

  return;
}

const difference =
  current - original;

const percentage =
  difference /
  Math.abs(original) *
  100;

const direction =
  difference > 0
    ? "increase"
    : difference < 0
      ? "decrease"
      : "no change";

$("changeResult").textContent =
  `${formatNumber(Math.abs(percentage))}% ${direction}`;

}
);

$("discountBtn").addEventListener(
"click",
() => {

const price =
  Number($("price").value);

const discount =
  Number($("discount").value);

if (
  !Number.isFinite(price) ||
  !Number.isFinite(discount) ||
  price < 0 ||
  discount < 0 ||
  discount > 100
) {

  $("discountResult").textContent =
    "Enter a valid price and discount between 0% and 100%.";

  return;
}

const saved =
  price * discount / 100;

const finalPrice =
  price - saved;

$("discountResult").textContent =
  `You save ${formatNumber(saved)}. ` +
  `Final price: ${formatNumber(finalPrice)}`;

}
);

/* =========================================================
AGE CALCULATOR
========================================================= */

const today =
new Date();

const todayString =
today.toISOString().split("T")[0];

$("ageDate").value =
todayString;

$("ageBtn").addEventListener(
"click",
() => {

const birthInput =
  $("birthDate").value;

const endInput =
  $("ageDate").value;

if (
  !birthInput ||
  !endInput
) {

  $("ageResult").textContent =
    "Please enter both dates.";

  return;
}

const birth =
  parseLocalDate(birthInput);

const end =
  parseLocalDate(endInput);

if (birth > end) {

  $("ageResult").textContent =
    "Date of birth cannot be after the calculation date.";

  return;
}

let years =
  end.getFullYear() -
  birth.getFullYear();

let months =
  end.getMonth() -
  birth.getMonth();

let days =
  end.getDate() -
  birth.getDate();

if (days < 0) {

  months--;

  const previousMonth =
    new Date(
      end.getFullYear(),
      end.getMonth(),
      0
    );

  days +=
    previousMonth.getDate();

}

if (months < 0) {

  years--;
  months += 12;

}

const totalDays =
  Math.floor(
    (end - birth) /
    86400000
  );

$("ageResult").innerHTML =
  `
  <strong>
    ${years} years,
    ${months} months,
    ${days} days
  </strong>
  <br>
  <small>
    ${totalDays.toLocaleString()}
    total days
  </small>
  `;

}
);

function parseLocalDate(value) {

const [
year,
month,
day
] =
value.split("-").map(Number);

return new Date(
year,
month - 1,
day
);

}

/* =========================================================
BMI CALCULATOR
========================================================= */

let bmiUnit =
"metric";

document.querySelectorAll(
".unit-tab"
).forEach(button => {

button.addEventListener(
"click",
() => {

  document
    .querySelectorAll(".unit-tab")
    .forEach(btn =>
      btn.classList.remove("active")
    );

  button.classList.add("active");

  bmiUnit =
    button.dataset.unit;

  $("metricFields")
    .classList.toggle(
      "hidden",
      bmiUnit !== "metric"
    );

  $("imperialFields")
    .classList.toggle(
      "hidden",
      bmiUnit !== "imperial"
    );

  $("bmiResult").textContent =
    "Enter your height and weight.";

}

);

});

$("bmiBtn").addEventListener(
"click",
() => {

let bmi;

if (bmiUnit === "metric") {

  const heightCm =
    Number($("heightCm").value);

  const weightKg =
    Number($("weightKg").value);

  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {

    $("bmiResult").textContent =
      "Enter valid height and weight.";

    return;
  }

  const heightM =
    heightCm / 100;

  bmi =
    weightKg /
    (heightM * heightM);

} else {

  const heightIn =
    Number($("heightIn").value);

  const weightLb =
    Number($("weightLb").value);

  if (
    !Number.isFinite(heightIn) ||
    !Number.isFinite(weightLb) ||
    heightIn <= 0 ||
    weightLb <= 0
  ) {

    $("bmiResult").textContent =
      "Enter valid height and weight.";

    return;
  }

  bmi =
    703 *
    weightLb /
    (heightIn * heightIn);

}

const rounded =
  Number(bmi.toFixed(1));

$("bmiResult").innerHTML =
  `<strong>BMI: ${rounded}</strong>`;

}
);

/* =========================================================
FOOTER YEAR
========================================================= */

$("year").textContent =
new Date().getFullYear();
