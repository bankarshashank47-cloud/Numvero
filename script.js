"use strict";


/* =========================
   THEME
========================= */

const themeBtn = document.getElementById("themeBtn");

function updateThemeButton() {
  if (document.body.classList.contains("dark")) {
    themeBtn.textContent = "☀";
    themeBtn.setAttribute(
      "aria-label",
      "Switch to light mode"
    );
  } else {
    themeBtn.textContent = "◐";
    themeBtn.setAttribute(
      "aria-label",
      "Switch to dark mode"
    );
  }
}

const savedTheme = localStorage.getItem("numvero-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

updateThemeButton();

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "numvero-theme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

  updateThemeButton();
});


/* =========================
   NAVIGATION
========================= */

const calculatorViews =
  document.querySelectorAll(".calculator-view");

const calculatorMenu =
  document.getElementById("calculators");

function openCalculator(name) {

  calculatorViews.forEach(view => {
    view.classList.remove("active");
    view.setAttribute("aria-hidden", "true");
  });

  const target =
    document.getElementById(`view-${name}`);

  if (!target) return;

  target.classList.add("active");
  target.setAttribute("aria-hidden", "false");

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeCalculator() {

  calculatorViews.forEach(view => {
    view.classList.remove("active");
    view.setAttribute("aria-hidden", "true");
  });

  calculatorMenu.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

document
  .querySelectorAll(".open-calculator")
  .forEach(button => {

    button.addEventListener("click", () => {
      openCalculator(button.dataset.open);
    });

  });

document
  .querySelectorAll("[data-back]")
  .forEach(button => {

    button.addEventListener("click", closeCalculator);

  });


/* =========================
   BASIC CALCULATOR
========================= */

const basicDisplay =
  document.getElementById("basicDisplay");

let basicExpression = "";

function updateBasicDisplay() {

  basicDisplay.value =
    basicExpression || "";

}

function basicCalculate() {

  if (!basicExpression.trim()) return;

  let expression =
    basicExpression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");

  /*
    Percentage handling:
    50% -> 50 / 100
  */
  expression =
    expression.replace(
      /(\d+(?:\.\d+)?)%/g,
      "($1/100)"
    );

  /*
    Only permit calculator characters.
    This prevents arbitrary JavaScript
    from being evaluated.
  */
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    basicDisplay.value = "Error";
    basicExpression = "";
    return;
  }

  try {

    const result = Function(
      `"use strict"; return (${expression})`
    )();

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      throw new Error("Invalid result");
    }

    basicExpression =
      Number.isInteger(result)
        ? String(result)
        : String(Number(result.toFixed(12)));

    updateBasicDisplay();

  } catch {

    basicDisplay.value = "Error";
    basicExpression = "";

  }
}

document
  .querySelectorAll("[data-basic]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const value = button.dataset.basic;

      if (value === "clear") {

        basicExpression = "";
        updateBasicDisplay();
        return;

      }

      if (value === "backspace") {

        basicExpression =
          basicExpression.slice(0, -1);

        updateBasicDisplay();
        return;

      }

      if (value === "=") {

        basicCalculate();
        return;

      }

      basicExpression += value;

      updateBasicDisplay();

    });

  });


/* =========================
   BASIC KEYBOARD SUPPORT
========================= */

basicDisplay.addEventListener("input", () => {

  const cleaned =
    basicDisplay.value.replace(
      /[^0-9+\-*/().%]/g,
      ""
    );

  basicExpression = cleaned;

  basicDisplay.value = cleaned;
});

basicDisplay.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    event.preventDefault();
    basicCalculate();
  }

  if (event.key === "Escape") {
    basicExpression = "";
    updateBasicDisplay();
  }

});


/* =========================
   SCIENTIFIC CALCULATOR
========================= */

const scientificDisplay =
  document.getElementById("scientificDisplay");

const angleMode =
  document.getElementById("angleMode");

const scientificClear =
  document.getElementById("scientificClear");

let scientificExpression = "";
let degreesMode = true;

function updateScientificDisplay() {

  scientificDisplay.value =
    scientificExpression;

}

function toRadians(value) {
  return value * Math.PI / 180;
}

function fromRadians(value) {
  return value * 180 / Math.PI;
}

function scientificCalculate() {

  if (!scientificExpression.trim()) return;

  let expression =
    scientificExpression;

  expression =
    expression.replace(/×/g, "*")
              .replace(/÷/g, "/")
              .replace(/−/g, "-")
              .replace(/π/g, "Math.PI")
              .replace(/\be\b/g, "Math.E");

  expression =
    expression.replace(
      /(\d+(?:\.\d+)?)%/g,
      "($1/100)"
    );

  /*
    Basic scientific operators.
  */

  expression =
    expression.replace(
      /sqrt\(/g,
      "Math.sqrt("
    );

  expression =
    expression.replace(
      /square\(([^()]*)\)/g,
      "($1)**2"
    );

  expression =
    expression.replace(
      /log\(/g,
      "Math.log10("
    );

  expression =
    expression.replace(
      /ln\(/g,
      "Math.log("
    );

  expression =
    expression.replace(
      /exp\(/g,
      "Math.exp("
    );

  expression =
    expression.replace(
      /sin\(/g,
      degreesMode
        ? "Math.sin(toRadians("
        : "Math.sin("
    );

  expression =
    expression.replace(
      /cos\(/g,
      degreesMode
        ? "Math.cos(toRadians("
        : "Math.cos("
    );

  expression =
    expression.replace(
      /tan\(/g,
      degreesMode
        ? "Math.tan(toRadians("
        : "Math.tan("
    );

  /*
    Inverse functions.
  */

  expression =
    expression.replace(
      /asin\(/g,
      degreesMode
        ? "fromRadians(Math.asin("
        : "Math.asin("
    );

  expression =
    expression.replace(
      /acos\(/g,
      degreesMode
        ? "fromRadians(Math.acos("
        : "Math.acos("
    );

  expression =
    expression.replace(
      /atan\(/g,
      degreesMode
        ? "fromRadians(Math.atan("
        : "Math.atan("
    );

  /*
    The generated expression may contain
    nested function calls. The calculator
    buttons are intentionally limited to
    controlled mathematical input.
  */

  try {

    if (!/^[0-9+\-*/().,\sA-Za-z]+$/.test(expression)) {
      throw new Error("Invalid input");
    }

    const result = Function(
      "toRadians",
      "fromRadians",
      `"use strict"; return (${expression})`
    )(toRadians, fromRadians);

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      throw new Error("Invalid result");
    }

    scientificExpression =
      Number.isInteger(result)
        ? String(result)
        : String(Number(result.toFixed(12)));

    updateScientificDisplay();

  } catch {

    scientificDisplay.value = "Error";
    scientificExpression = "";

  }
}


document
  .querySelectorAll("[data-sci]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const value = button.dataset.sci;

      if (value === "clear") {

        scientificExpression = "";
        updateScientificDisplay();
        return;

      }

      if (value === "=") {

        scientificCalculate();
        return;

      }

      if (value === "sqrt") {
        scientificExpression += "sqrt(";
        updateScientificDisplay();
        return;
      }

      if (value === "square") {
        scientificExpression += "square(";
        updateScientificDisplay();
        return;
      }

      if (value === "power") {
        scientificExpression += "**";
        updateScientificDisplay();
        return;
      }

      if (value === "open") {
        scientificExpression += "(";
        updateScientificDisplay();
        return;
      }

      if (value === "close") {
        scientificExpression += ")";
        updateScientificDisplay();
        return;
      }

      if (
        [
          "sin",
          "cos",
          "tan",
          "asin",
          "acos",
          "atan",
          "log",
          "ln",
          "exp"
        ].includes(value)
      ) {

        scientificExpression += `${value}(`;
        updateScientificDisplay();
        return;
      }

      if (value === "pi") {
        scientificExpression += "π";
        updateScientificDisplay();
        return;
      }

      if (value === "e") {
        scientificExpression += "e";
        updateScientificDisplay();
        return;
      }

      scientificExpression += value;

      updateScientificDisplay();

    });

  });


angleMode.addEventListener("click", () => {

  degreesMode = !degreesMode;

  angleMode.textContent =
    degreesMode ? "DEG" : "RAD";

});


scientificClear.addEventListener("click", () => {

  scientificExpression = "";
  updateScientificDisplay();

});


/* =========================
   PERCENTAGE CALCULATOR
========================= */

const percentX =
  document.getElementById("percentX");

const percentY =
  document.getElementById("percentY");

const percentOfResult =
  document.getElementById("percentOfResult");

document
  .getElementById("percentOfBtn")
  .addEventListener("click", () => {

    const x = Number(percentX.value);
    const y = Number(percentY.value);

    if (
      percentX.value === "" ||
      percentY.value === "" ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {

      percentOfResult.textContent =
        "Enter valid values.";

      return;
    }

    const result = (x / 100) * y;

    percentOfResult.textContent =
      `${x}% of ${y} = ${result}`;

  });


const originalValue =
  document.getElementById("originalValue");

const newValue =
  document.getElementById("newValue");

const changeResult =
  document.getElementById("changeResult");

document
  .getElementById("changeBtn")
  .addEventListener("click", () => {

    const original = Number(originalValue.value);
    const current = Number(newValue.value);

    if (
      originalValue.value === "" ||
      newValue.value === "" ||
      !Number.isFinite(original) ||
      !Number.isFinite(current)
    ) {

      changeResult.textContent =
        "Enter valid values.";

      return;
    }

    if (original === 0) {

      changeResult.textContent =
        "Percentage change cannot be calculated from zero.";

      return;
    }

    const difference =
      current - original;

    const percentage =
      (difference / original) * 100;

    const type =
      difference >= 0
        ? "increase"
        : "decrease";

    changeResult.textContent =
      `${Math.abs(percentage).toFixed(2)}% ${type}.`;

  });


const price =
  document.getElementById("price");

const discount =
  document.getElementById("discount");

const discountResult =
  document.getElementById("discountResult");

document
  .getElementById("discountBtn")
  .addEventListener("click", () => {

    const originalPrice =
      Number(price.value);

    const discountPercent =
      Number(discount.value);

    if (
      price.value === "" ||
      discount.value === "" ||
      !Number.isFinite(originalPrice) ||
      !Number.isFinite(discountPercent)
    ) {

      discountResult.textContent =
        "Enter valid values.";

      return;
    }

    const savings =
      originalPrice *
      (discountPercent / 100);

    const finalPrice =
      originalPrice - savings;

    discountResult.textContent =
      `Savings: ${savings.toFixed(2)} | Final price: ${finalPrice.toFixed(2)}`;

  });


/* =========================
   AGE CALCULATOR
========================= */

const birthDate =
  document.getElementById("birthDate");

const ageDate =
  document.getElementById("ageDate");

const ageResult =
  document.getElementById("ageResult");

function calculateAge() {

  if (!birthDate.value || !ageDate.value) {

    ageResult.textContent =
      "Enter both dates.";

    return;
  }

  const birth =
    new Date(`${birthDate.value}T00:00:00`);

  const end =
    new Date(`${ageDate.value}T00:00:00`);

  if (birth > end) {

    ageResult.textContent =
      "The date of birth cannot be after the calculation date.";

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

  ageResult.textContent =
    `${years} year${years === 1 ? "" : "s"}, ` +
    `${months} month${months === 1 ? "" : "s"}, ` +
    `${days} day${days === 1 ? "" : "s"}.`;

}


document
  .getElementById("ageBtn")
  .addEventListener("click", calculateAge);


/* =========================
   BMI CALCULATOR
========================= */

const unitTabs =
  document.querySelectorAll(".unit-tab");

const metricFields =
  document.getElementById("metricFields");

const imperialFields =
  document.getElementById("imperialFields");

let bmiUnit = "metric";


unitTabs.forEach(tab => {

  tab.addEventListener("click", () => {

    unitTabs.forEach(item =>
      item.classList.remove("active")
    );

    tab.classList.add("active");

    bmiUnit =
      tab.dataset.unit;

    if (bmiUnit === "metric") {

      metricFields.classList.remove("hidden");
      imperialFields.classList.add("hidden");

    } else {

      metricFields.classList.add("hidden");
      imperialFields.classList.remove("hidden");

    }

  });

});


document
  .getElementById("bmiBtn")
  .addEventListener("click", () => {

    const result =
      document.getElementById("bmiResult");

    let bmi;

    if (bmiUnit === "metric") {

      const height =
        Number(
          document.getElementById("heightCm").value
        );

      const weight =
        Number(
          document.getElementById("weightKg").value
        );

      if (
        !Number.isFinite(height) ||
        !Number.isFinite(weight) ||
        height <= 0 ||
        weight <= 0
      ) {

        result.textContent =
          "Enter valid height and weight.";

        return;
      }

      const heightMeters =
        height / 100;

      bmi =
        weight /
        (heightMeters * heightMeters);

    } else {

      const height =
        Number(
          document.getElementById("heightIn").value
        );

      const weight =
        Number(
          document.getElementById("weightLb").value
        );

      if (
        !Number.isFinite(height) ||
        !Number.isFinite(weight) ||
        height <= 0 ||
        weight <= 0
      ) {

        result.textContent =
          "Enter valid height and weight.";

        return;
      }

      bmi =
        (weight / (height * height)) *
        703;

    }

    result.textContent =
      `BMI: ${bmi.toFixed(1)}`;

  });


/* =========================
   CURRENT YEAR
========================= */

document.getElementById("currentYear").textContent =
  new Date().getFullYear();


/* =========================
   INITIAL PAGE STATE
========================= */

calculatorViews.forEach(view => {
  view.classList.remove("active");
  view.setAttribute("aria-hidden", "true");
});
