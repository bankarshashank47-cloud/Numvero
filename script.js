"use strict";

/* =========================================================
   GENERAL HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";

  const rounded = Number(value.toPrecision(12));

  return rounded.toLocaleString(undefined, {
    maximumFractionDigits: 10
  });
}

function cleanNumber(value) {
  return String(value).replace(/,/g, "");
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

function updateThemeButton() {

  const isDark =
    document.body.classList.contains("dark");

  themeBtn.textContent =
    isDark ? "☀" : "◐";

  themeBtn.setAttribute(
    "aria-label",
    isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
  );
}

updateThemeButton();


themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "calculator-theme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

  updateThemeButton();

});


/* =========================================================
   BASIC CALCULATOR
========================================================= */

const basicDisplay =
  $("basicDisplay");


document.querySelectorAll("[data-basic]")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const value =
        button.dataset.basic;

      if (value === "clear") {

        basicDisplay.value = "";
        basicDisplay.focus();
        return;

      }


      if (value === "backspace") {

        basicDisplay.value =
          basicDisplay.value === "Error"
            ? ""
            : basicDisplay.value.slice(0, -1);

        basicDisplay.focus();
        return;

      }


      if (value === "=") {

        calculateBasic();
        return;

      }


      if (basicDisplay.value === "Error") {
        basicDisplay.value = "";
      }


      basicDisplay.value += value;

      basicDisplay.focus();

    });

  });


function calculateBasic() {

  let expression =
    basicDisplay.value.trim();

  if (!expression) return;


  /*
    Remove display formatting commas.
    Example:
    1,000 + 2 -> 1000 + 2
  */
  expression =
    cleanNumber(expression);


  /*
    Only permit characters required
    by the calculator.
  */
  if (!/^[0-9+\-*/().^%\s]+$/.test(expression)) {

    showError(basicDisplay);
    return;

  }


  try {

    /*
      Convert percentage:
      50% -> (50/100)
    */
    expression =
      expression.replace(
        /(\d+(?:\.\d+)?)%/g,
        "($1/100)"
      );


    /*
      Convert power:
      2^3 -> 2**3
    */
    expression =
      expression.replace(/\^/g, "**");


    /*
      Reject obviously malformed
      operator sequences.
    */
    if (
      /(\*\*{2,})/.test(expression) ||
      /[+\-*/]{3,}/.test(expression)
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


    basicDisplay.value =
      formatNumber(result);

  } catch {

    showError(basicDisplay);

  }

}


/* Keyboard */

basicDisplay.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();
      calculateBasic();

    }


    if (event.key === "Escape") {

      event.preventDefault();
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


$("scientificClear")
  .addEventListener("click", () => {

    scientificDisplay.value = "";
    scientificDisplay.focus();

  });


document.querySelectorAll("[data-sci]")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const value =
        button.dataset.sci;


      if (value === "clear") {

        scientificDisplay.value = "";
        scientificDisplay.focus();
        return;

      }


      if (value === "=") {

        calculateScientific();
        return;

      }


      if (scientificDisplay.value === "Error") {
        scientificDisplay.value = "";
      }


      switch (value) {

        case "sin":
          applyScientificFunction("sin");
          return;

        case "cos":
          applyScientificFunction("cos");
          return;

        case "tan":
          applyScientificFunction("tan");
          return;

        case "asin":
          applyInverseTrig("asin");
          return;

        case "acos":
          applyInverseTrig("acos");
          return;

        case "atan":
          applyInverseTrig("atan");
          return;

        case "sqrt":
          applyScientificFunction("sqrt");
          return;

        case "square":

          scientificDisplay.value += "^2";
          return;

        case "log":
          applyScientificFunction("log");
          return;

        case "ln":
          applyScientificFunction("ln");
          return;

        case "exp":
          applyScientificFunction("exp");
          return;

        case "power":

          scientificDisplay.value += "^";
          return;

        case "pi":

          scientificDisplay.value += "π";
          return;

        case "e":

          scientificDisplay.value += "e";
          return;

        case "open":

          scientificDisplay.value += "(";
          return;

        case "close":

          scientificDisplay.value += ")";
          return;

        default:

          scientificDisplay.value += value;

      }


      scientificDisplay.focus();

    });

  });


function getCurrentNumber() {

  const value =
    Number(
      cleanNumber(
        scientificDisplay.value
      )
    );


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
  functionName
) {

  try {

    const value =
      getCurrentNumber();

    let result;


    switch (functionName) {

      case "sin":

        result =
          Math.sin(
            toRadians(value)
          );

        break;


      case "cos":

        result =
          Math.cos(
            toRadians(value)
          );

        break;


      case "tan":

        result =
          Math.tan(
            toRadians(value)
          );

        break;


      case "sqrt":

        result =
          Math.sqrt(value);

        break;


      case "log":

        result =
          Math.log10(value);

        break;


      case "ln":

        result =
          Math.log(value);

        break;


      case "exp":

        result =
          Math.exp(value);

        break;


      default:

        throw new Error();

    }


    if (!Number.isFinite(result)) {
      throw new Error();
    }


    scientificDisplay.value =
      formatNumber(result);


  } catch {

    showError(scientificDisplay);

  }

}


function applyInverseTrig(
  functionName
) {

  try {

    const value =
      getCurrentNumber();

    let result;


    switch (functionName) {

      case "asin":

        result =
          fromRadians(
            Math.asin(value)
          );

        break;


      case "acos":

        result =
          fromRadians(
            Math.acos(value)
          );

        break;


      case "atan":

        result =
          fromRadians(
            Math.atan(value)
          );

        break;


      default:

        throw new Error();

    }


    if (!Number.isFinite(result)) {
      throw new Error();
    }


    scientificDisplay.value =
      formatNumber(result);


  } catch {

    showError(scientificDisplay);

  }

}


function calculateScientific() {

  let expression =
    scientificDisplay.value.trim();


  if (!expression) return;


  /*
    Remove display commas.
  */
  expression =
    cleanNumber(expression);


  /*
    Allow only calculator characters.
  */
  if (
    !/^[0-9+\-*/().^πe\s]+$/
      .test(expression)
  ) {

    showError(scientificDisplay);
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
      Convert powers.
    */
    expression =
      expression.replace(/\^/g, "**");


    /*
      Remove constants temporarily
      for character validation.
    */
    const validationExpression =
      expression
        .replace(/Math\.PI/g, "")
        .replace(/Math\.E/g, "");


    if (
      !/^[0-9+\-*/().\s*]+$/
        .test(validationExpression)
    ) {

      throw new Error();

    }


    /*
      Reject malformed operator sequences.
    */
    if (
      /(\*\*{2,})/.test(expression) ||
      /[+\-*/]{3,}/.test(expression)
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

    showError(scientificDisplay);

  }

}


scientificDisplay.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();
      calculateScientific();

    }


    if (event.key === "Escape") {

      event.preventDefault();
      scientificDisplay.value = "";

    }

  }
);


/* =========================================================
   PERCENTAGE CALCULATOR
========================================================= */

$("percentOfBtn")
  .addEventListener("click", () => {

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
      `${formatNumber(percentage)}% of ${formatNumber(number)} = ${formatNumber(result)}`;

  });


$("changeBtn")
  .addEventListener("click", () => {

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


    let direction;


    if (difference > 0) {

      direction = "increase";

    } else if (difference < 0) {

      direction = "decrease";

    } else {

      direction = "no change";

    }


    $("changeResult").textContent =
      `${formatNumber(Math.abs(percentage))}% ${direction}`;

  });


$("discountBtn")
  .addEventListener("click", () => {

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
      `You save ${formatNumber(saved)}. Final price: ${formatNumber(finalPrice)}`;

  });


/* =========================================================
   AGE CALCULATOR
========================================================= */

function getLocalDateString(date) {

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");


  return `${year}-${month}-${day}`;

}


const today =
  new Date();


$("ageDate").value =
  getLocalDateString(today);


$("ageBtn")
  .addEventListener("click", () => {

    const birthInput =
      $("birthDate").value;

    const endInput =
      $("ageDate").value;


    if (!birthInput || !endInput) {

      $("ageResult").textContent =
        "Please enter both dates.";

      return;

    }


    const birth =
      parseLocalDate(birthInput);

    const end =
      parseLocalDate(endInput);


    if (
      !birth ||
      !end ||
      Number.isNaN(birth.getTime()) ||
      Number.isNaN(end.getTime())
    ) {

      $("ageResult").textContent =
        "Please enter valid dates.";

      return;

    }


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
        (
          end.getTime() -
          birth.getTime()
        ) /
        86400000
      );


    $("ageResult").innerHTML = `
      <strong>
        ${years} years, ${months} months, ${days} days
      </strong>
      <br>
      <small>
        ${totalDays.toLocaleString()} total days
      </small>
    `;

  });


function parseLocalDate(value) {

  const parts =
    value.split("-").map(Number);


  if (parts.length !== 3) {
    return null;
  }


  const [year, month, day] =
    parts;


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  /*
    Reject invalid dates such as
    31 February.
  */
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {

    return null;

  }


  return date;

}


/* =========================================================
   BMI CALCULATOR
========================================================= */

let bmiUnit = "metric";


document.querySelectorAll(".unit-tab")
  .forEach((button) => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".unit-tab")
        .forEach((btn) => {
          btn.classList.remove("active");
        });


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

    });

  });


$("bmiBtn")
  .addEventListener("click", () => {

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


    if (!Number.isFinite(bmi)) {

      $("bmiResult").textContent =
        "Unable to calculate BMI.";

      return;

    }


    const rounded =
      Number(bmi.toFixed(1));


    $("bmiResult").innerHTML =
      `<strong>BMI: ${rounded}</strong>`;

  });


/* =========================================================
   FOOTER YEAR
========================================================= */

$("year").textContent =
  new Date().getFullYear();


/* =========================================================
   DATE LIMIT
========================================================= */

$("birthDate").max =
  getLocalDateString(new Date());


/* =========================================================
   ERROR RECOVERY
========================================================= */

basicDisplay.addEventListener(
  "input",
  () => {

    if (
      basicDisplay.value === "Error"
    ) {
      basicDisplay.value = "";
    }

  }
);


scientificDisplay.addEventListener(
  "input",
  () => {

    if (
      scientificDisplay.value === "Error"
    ) {
      scientificDisplay.value = "";
    }

  }
);