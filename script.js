"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     HELPERS
  ===================================================== */

  const $ = id => document.getElementById(id);

  const $$ = selector =>
    document.querySelectorAll(selector);

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";

    return Number(value.toPrecision(12)).toLocaleString(
      undefined,
      { maximumFractionDigits: 10 }
    );
  }

  function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
  }


  /* =====================================================
     CURRENT YEAR
  ===================================================== */

  const year = $("currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  /* =====================================================
     THEME
  ===================================================== */

  const themeBtn = $("themeBtn");

  function applyTheme(theme) {
    document.body.classList.toggle(
      "dark",
      theme === "dark"
    );

    if (themeBtn) {
      themeBtn.textContent =
        theme === "dark" ? "☀" : "◐";

      themeBtn.setAttribute(
        "aria-label",
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      );
    }
  }

  const savedTheme =
    localStorage.getItem("numvero-theme");

  applyTheme(
    savedTheme === "dark"
      ? "dark"
      : "light"
  );

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const newTheme =
        document.body.classList.contains("dark")
          ? "light"
          : "dark";

      localStorage.setItem(
        "numvero-theme",
        newTheme
      );

      applyTheme(newTheme);
    });
  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  const menu =
    document.querySelector(".calculator-menu");

  const views =
    $$(".calculator-view");

  const openButtons =
    $$(".open-calculator");

  const backButtons =
    $$("[data-back]");

  function hideAllCalculators() {
    views.forEach(view => {
      view.classList.remove("active");
      view.setAttribute("aria-hidden", "true");
    });
  }

  function showMenu(scroll = true) {
    hideAllCalculators();

    if (menu) {
      menu.classList.remove("hidden");
    }

    if (scroll) {
      const target =
        document.getElementById("calculators");

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  }

  function showCalculator(name, updateURL = true) {
    const target = $(`view-${name}`);

    if (!target) {
      showMenu();
      return;
    }

    if (menu) {
      menu.classList.add("hidden");
    }

    hideAllCalculators();

    target.classList.add("active");
    target.setAttribute(
      "aria-hidden",
      "false"
    );

    if (updateURL) {
      history.pushState(
        { calculator: name },
        "",
        `${window.location.pathname}` +
        `${window.location.search}` +
        `#${name}`
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  openButtons.forEach(button => {
    button.addEventListener("click", () => {
      showCalculator(
        button.dataset.open,
        true
      );
    });
  });

  backButtons.forEach(button => {
    button.addEventListener("click", () => {
      history.pushState(
        {},
        "",
        window.location.pathname +
        window.location.search
      );

      showMenu();
    });
  });

  function loadFromHash() {
    const hash =
      window.location.hash
        .replace("#", "")
        .toLowerCase();

    const valid = [
      "basic",
      "scientific",
      "percentage",
      "age",
      "bmi"
    ];

    if (valid.includes(hash)) {
      showCalculator(hash, false);
    } else {
      showMenu(false);
    }
  }

  window.addEventListener(
    "popstate",
    loadFromHash
  );

  window.addEventListener(
    "hashchange",
    loadFromHash
  );

  loadFromHash();


  /* =====================================================
     BASIC CALCULATOR
  ===================================================== */

  const basicDisplay =
    $("basicDisplay");

  if (basicDisplay) {

    function calculateBasic() {
      let expression =
        basicDisplay.value.trim();

      if (!expression) return;

      if (
        !/^[0-9+\-*/().^%\s]+$/.test(
          expression
        )
      ) {
        basicDisplay.value = "Error";
        return;
      }

      try {
        expression =
          expression
            .replace(/\^/g, "**")
            .replace(
              /(\d+(?:\.\d+)?)%/g,
              "($1/100)"
            );

        const result =
          Function(
            `"use strict";return (${expression})`
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

    $$("[data-basic]").forEach(button => {
      button.addEventListener("click", () => {

        const value =
          button.dataset.basic;

        if (basicDisplay.value === "Error") {
          basicDisplay.value = "";
        }

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

        basicDisplay.value += value;
      });
    });

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
  }


  /* =====================================================
     SCIENTIFIC CALCULATOR
  ===================================================== */

  const scientificDisplay =
    $("scientificDisplay");

  let angleMode = "DEG";

  if (scientificDisplay) {

    const angleButton =
      $("angleMode");

    const clearButton =
      $("scientificClear");

    function getScientificNumber() {
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

    function applyFunction(fn, usesAngle = false) {
      try {
        const value =
          getScientificNumber();

        const result =
          fn(
            usesAngle
              ? toRadians(value)
              : value
          );

        if (!Number.isFinite(result)) {
          throw new Error();
        }

        scientificDisplay.value =
          formatNumber(result);

      } catch {
        scientificDisplay.value = "Error";
      }
    }

    function applyInverseTrig(fn) {
      try {
        const value =
          getScientificNumber();

        const result =
          fromRadians(fn(value));

        if (!Number.isFinite(result)) {
          throw new Error();
        }

        scientificDisplay.value =
          formatNumber(result);

      } catch {
        scientificDisplay.value = "Error";
      }
    }

    function calculateScientific() {
      let expression =
        scientificDisplay.value.trim();

      if (!expression) return;

      try {

        expression =
          expression
            .replace(/π/g, "Math.PI")
            .replace(/\be\b/g, "Math.E")
            .replace(/\^/g, "**");

        if (
          !/^[0-9+\-*/().\sA-Za-z]+$/.test(
            expression
          )
        ) {
          throw new Error();
        }

        const remaining =
          expression
            .replace(/Math\.PI/g, "")
            .replace(/Math\.E/g, "");

        if (/[A-Za-z]/.test(remaining)) {
          throw new Error();
        }

        const result =
          Function(
            `"use strict";return (${expression})`
          )();

        if (!Number.isFinite(result)) {
          throw new Error();
        }

        scientificDisplay.value =
          formatNumber(result);

      } catch {
        scientificDisplay.value = "Error";
      }
    }

    if (angleButton) {
      angleButton.addEventListener("click", () => {
        angleMode =
          angleMode === "DEG"
            ? "RAD"
            : "DEG";

        angleButton.textContent =
          angleMode;
      });
    }

    if (clearButton) {
      clearButton.addEventListener(
        "click",
        () => {
          scientificDisplay.value = "";
        }
      );
    }

    $$("[data-sci]").forEach(button => {

      button.addEventListener("click", () => {

        const value =
          button.dataset.sci;

        if (scientificDisplay.value === "Error") {
          scientificDisplay.value = "";
        }

        switch (value) {

          case "clear":
            scientificDisplay.value = "";
            break;

          case "=":
            calculateScientific();
            break;

          case "sin":
            applyFunction(Math.sin, true);
            break;

          case "cos":
            applyFunction(Math.cos, true);
            break;

          case "tan":
            applyFunction(Math.tan, true);
            break;

          case "asin":
            applyInverseTrig(Math.asin);
            break;

          case "acos":
            applyInverseTrig(Math.acos);
            break;

          case "atan":
            applyInverseTrig(Math.atan);
            break;

          case "sqrt":
            applyFunction(Math.sqrt);
            break;

          case "log":
            applyFunction(Math.log10);
            break;

          case "ln":
            applyFunction(Math.log);
            break;

          case "exp":
            applyFunction(Math.exp);
            break;

          case "square":
            scientificDisplay.value += "^2";
            break;

          case "power":
            scientificDisplay.value += "^";
            break;

          case "pi":
            scientificDisplay.value += "π";
            break;

          case "e":
            scientificDisplay.value += "e";
            break;

          case "open":
            scientificDisplay.value += "(";
            break;

          case "close":
            scientificDisplay.value += ")";
            break;

          default:
            scientificDisplay.value += value;
        }
      });
    });

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
    }
  
  /* =====================================================
     PERCENTAGE CALCULATOR
  ===================================================== */

  const percentOfBtn =
    $("percentOfBtn");

  if (percentOfBtn) {
    percentOfBtn.addEventListener(
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
          setText(
            "percentOfResult",
            "Please enter valid numbers."
          );
          return;
        }

        const result =
          percentage / 100 * number;

        setText(
          "percentOfResult",
          `${formatNumber(percentage)}% of ` +
          `${formatNumber(number)} = ` +
          `${formatNumber(result)}`
        );
      }
    );
  }


  /* =====================================================
     PERCENTAGE CHANGE
  ===================================================== */

  const changeBtn =
    $("changeBtn");

  if (changeBtn) {
    changeBtn.addEventListener(
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
          setText(
            "changeResult",
            "Enter valid values. Original value cannot be zero."
          );
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

        setText(
          "changeResult",
          `${formatNumber(
            Math.abs(percentage)
          )}% ${direction}`
        );
      }
    );
  }


  /* =====================================================
     DISCOUNT CALCULATOR
  ===================================================== */

  const discountBtn =
    $("discountBtn");

  if (discountBtn) {
    discountBtn.addEventListener(
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
          setText(
            "discountResult",
            "Enter a valid price and discount between 0% and 100%."
          );
          return;
        }

        const saved =
          price * discount / 100;

        const finalPrice =
          price - saved;

        setText(
          "discountResult",
          `You save ${formatNumber(saved)}. ` +
          `Final price: ${formatNumber(finalPrice)}`
        );
      }
    );
  }


  /* =====================================================
     AGE CALCULATOR
  ===================================================== */

  function parseLocalDate(value) {
    const parts =
      value.split("-").map(Number);

    if (parts.length !== 3) {
      return new Date(NaN);
    }

    const [year, month, day] = parts;

    const date =
      new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return new Date(NaN);
    }

    return date;
  }

  function dateToUTC(date) {
    return Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  const ageDate =
    $("ageDate");

  if (ageDate) {
    const today =
      new Date();

    ageDate.value =
      [
        today.getFullYear(),
        String(
          today.getMonth() + 1
        ).padStart(2, "0"),
        String(
          today.getDate()
        ).padStart(2, "0")
      ].join("-");
  }

  const ageBtn =
    $("ageBtn");

  if (ageBtn) {
    ageBtn.addEventListener(
      "click",
      () => {

        const birthInput =
          $("birthDate").value;

        const endInput =
          $("ageDate").value;

        if (!birthInput || !endInput) {
          setText(
            "ageResult",
            "Please enter both dates."
          );
          return;
        }

        const birth =
          parseLocalDate(birthInput);

        const end =
          parseLocalDate(endInput);

        if (
          Number.isNaN(birth.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          setText(
            "ageResult",
            "Please enter valid dates."
          );
          return;
        }

        if (birth > end) {
          setText(
            "ageResult",
            "Date of birth cannot be after the calculation date."
          );
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
              dateToUTC(end) -
              dateToUTC(birth)
            ) /
            86400000
          );

        const result =
          $("ageResult");

        if (result) {
          result.innerHTML =
            `<strong>${years} years, ` +
            `${months} months, ` +
            `${days} days</strong>` +
            `<br>` +
            `<small>${totalDays.toLocaleString()} total days</small>`;
        }
      }
    );
  }


  /* =====================================================
     BMI CALCULATOR
  ===================================================== */

  let bmiUnit = "metric";

  const unitTabs =
    $$(".unit-tab");

  const metricFields =
    $("metricFields");

  const imperialFields =
    $("imperialFields");

  unitTabs.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        bmiUnit =
          button.dataset.unit;

        unitTabs.forEach(tab => {
          tab.classList.toggle(
            "active",
            tab === button
          );
        });

        if (metricFields) {
          metricFields.classList.toggle(
            "hidden",
            bmiUnit !== "metric"
          );
        }

        if (imperialFields) {
          imperialFields.classList.toggle(
            "hidden",
            bmiUnit !== "imperial"
          );
        }

        setText(
          "bmiResult",
          "Enter your height and weight."
        );
      }
    );
  });


  const bmiBtn =
    $("bmiBtn");

  if (bmiBtn) {
    bmiBtn.addEventListener(
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
            setText(
              "bmiResult",
              "Enter a valid height and weight."
            );
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
            setText(
              "bmiResult",
              "Enter a valid height and weight."
            );
            return;
          }

          bmi =
            703 *
            weightLb /
            (heightIn * heightIn);
        }

        let category;

        if (bmi < 18.5) {
          category = "Below the standard adult BMI range";
        } else if (bmi < 25) {
          category = "Within the standard adult BMI range";
        } else if (bmi < 30) {
          category = "Above the standard adult BMI range";
        } else {
          category = "High BMI range";
        }

        setText(
          "bmiResult",
          `BMI: ${formatNumber(bmi)} — ${category}`
        );
      }
    );
  }

});
