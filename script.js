"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);
  const $$ = selector => document.querySelectorAll(selector);

  const formatNumber = value => {
    if (!Number.isFinite(value)) return "Error";
    return Number(value.toPrecision(12)).toLocaleString(undefined, {
      maximumFractionDigits: 10
    });
  };

  const setText = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };

  /* =========================
     THEME
  ========================= */

  const themeBtn = $("themeBtn");

  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");

    if (themeBtn) {
      themeBtn.textContent = theme === "dark" ? "☀" : "◐";
      themeBtn.setAttribute(
        "aria-label",
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      );
    }
  }

  const savedTheme = localStorage.getItem("numvero-theme");
  applyTheme(savedTheme === "dark" ? "dark" : "light");

  themeBtn?.addEventListener("click", () => {
    const theme = document.body.classList.contains("dark")
      ? "light"
      : "dark";

    localStorage.setItem("numvero-theme", theme);
    applyTheme(theme);
  });


  /* =========================
     NAVIGATION
  ========================= */

  const menu = document.querySelector(".calculator-menu");
  const views = $$(".calculator-view");

  function hideViews() {
    views.forEach(view => {
      view.classList.remove("active");
      view.setAttribute("aria-hidden", "true");
    });
  }

  function showMenu() {
    hideViews();
    menu?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showCalculator(name, updateURL = true) {
    const target = $(`view-${name}`);

    if (!target) {
      showMenu();
      return;
    }

    menu?.classList.add("hidden");
    hideViews();

    target.classList.add("active");
    target.setAttribute("aria-hidden", "false");

    if (updateURL) {
      history.pushState(
        { calculator: name },
        "",
        `${location.pathname}${location.search}#${name}`
      );
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$(".open-calculator").forEach(button => {
    button.addEventListener("click", () => {
      showCalculator(button.dataset.open);
    });
  });

  $$("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      if (location.hash) {
        history.pushState(
          {},
          "",
          location.pathname + location.search
        );
      }
      showMenu();
    });
  });

  function loadFromHash() {
    const hash = location.hash.replace("#", "").toLowerCase();

    const valid = [
      "basic",
      "scientific",
      "percentage",
      "age",
      "bmi"
    ];

    valid.includes(hash)
      ? showCalculator(hash, false)
      : showMenu();
  }

  addEventListener("popstate", loadFromHash);
  addEventListener("hashchange", loadFromHash);

  loadFromHash();


  /* =========================
     BASIC CALCULATOR
  ========================= */

  const basicDisplay = $("basicDisplay");

  if (basicDisplay) {

    function calculateBasic() {
      let expression = basicDisplay.value.trim();

      if (!expression) return;

      if (!/^[0-9+\-*/().^%\s]+$/.test(expression)) {
        basicDisplay.value = "Error";
        return;
      }

      try {
        expression = expression
          .replace(/\^/g, "**")
          .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

        const result = Function(
          `"use strict";return(${expression})`
        )();

        if (!Number.isFinite(result)) throw new Error();

        basicDisplay.value = formatNumber(result);

      } catch {
        basicDisplay.value = "Error";
      }
    }

    $$("[data-basic]").forEach(button => {
      button.addEventListener("click", () => {

        const value = button.dataset.basic;

        if (basicDisplay.value === "Error")
          basicDisplay.value = "";

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

    basicDisplay.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        calculateBasic();
      }

      if (event.key === "Escape")
        basicDisplay.value = "";
    });
  }


  /* =========================
     SCIENTIFIC CALCULATOR
  ========================= */

  const sciDisplay = $("scientificDisplay");
  let angleMode = "DEG";

  if (sciDisplay) {

    const angleButton = $("angleMode");

    angleButton?.addEventListener("click", () => {
      angleMode = angleMode === "DEG" ? "RAD" : "DEG";
      angleButton.textContent = angleMode;
    });

    $("scientificClear")?.addEventListener("click", () => {
      sciDisplay.value = "";
    });

    const getNumber = () => {
      const n = Number(sciDisplay.value);
      if (!Number.isFinite(n)) throw new Error();
      return n;
    };

    const toRad = n =>
      angleMode === "DEG" ? n * Math.PI / 180 : n;

    const fromRad = n =>
      angleMode === "DEG" ? n * 180 / Math.PI : n;

    function applyFunction(fn, angle = false) {
      try {
        const value = getNumber();
        const result = fn(angle ? toRad(value) : value);

        if (!Number.isFinite(result)) throw new Error();

        sciDisplay.value = formatNumber(result);

      } catch {
        sciDisplay.value = "Error";
      }
    }

    function inverseTrig(fn) {
      try {
        const result = fromRad(fn(getNumber()));

        if (!Number.isFinite(result)) throw new Error();

        sciDisplay.value = formatNumber(result);

      } catch {
        sciDisplay.value = "Error";
      }
    }

    function calculateScientific() {
      let expression = sciDisplay.value.trim();

      if (!expression) return;

      try {
        expression = expression
          .replace(/π/g, "Math.PI")
          .replace(/\be\b/g, "Math.E")
          .replace(/\^/g, "**");

        if (!/^[0-9+\-*/().\sA-Za-z]+$/.test(expression))
          throw new Error();

        const remaining = expression
          .replace(/Math\.PI/g, "")
          .replace(/Math\.E/g, "");

        if (/[A-Za-z]/.test(remaining))
          throw new Error();

        const result = Function(
          `"use strict";return(${expression})`
        )();

        if (!Number.isFinite(result))
          throw new Error();

        sciDisplay.value = formatNumber(result);

      } catch {
        sciDisplay.value = "Error";
      }
    }

    $$("[data-sci]").forEach(button => {
      button.addEventListener("click", () => {

        const value = button.dataset.sci;

        if (sciDisplay.value === "Error")
          sciDisplay.value = "";

        if (value === "clear") {
          sciDisplay.value = "";
          return;
        }

        if (value === "=") {
          calculateScientific();
          return;
        }

        if (value === "sin") {
          applyFunction(Math.sin, true);
          return;
        }

        if (value === "cos") {
          applyFunction(Math.cos, true);
          return;
        }

        if (value === "tan") {
          applyFunction(Math.tan, true);
          return;
        }

        if (value === "asin") {
          inverseTrig(Math.asin);
          return;
        }

        if (value === "acos") {
          inverseTrig(Math.acos);
          return;
        }

        if (value === "atan") {
          inverseTrig(Math.atan);
          return;
        }

        if (value === "sqrt") {
          applyFunction(Math.sqrt);
          return;
        }

        if (value === "square") {
          sciDisplay.value += "^2";
          return;
        }

        if (value === "log") {
          applyFunction(Math.log10);
          return;
        }

        if (value === "ln") {
          applyFunction(Math.log);
          return;
        }

        if (value === "exp") {
          applyFunction(Math.exp);
          return;
        }

        if (value === "power") {
          sciDisplay.value += "^";
          return;
        }

        if (value === "pi") {
          sciDisplay.value += "π";
          return;
        }

        if (value === "e") {
          sciDisplay.value += "e";
          return;
        }

        if (value === "open") {
          sciDisplay.value += "(";
          return;
        }

        if (value === "close") {
          sciDisplay.value += ")";
          return;
        }

        sciDisplay.value += value;
      });
    });

    sciDisplay.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        calculateScientific();
      }

      if (event.key === "Escape")
        sciDisplay.value = "";
    });
  }


  /* =========================
     PERCENTAGE
  ========================= */

  $("percentOfBtn")?.addEventListener("click", () => {

    const x = Number($("percentX")?.value);
    const y = Number($("percentY")?.value);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setText("percentOfResult", "Please enter valid numbers.");
      return;
    }

    setText(
      "percentOfResult",
      `${formatNumber(x)}% of ${formatNumber(y)} = ${formatNumber(x * y / 100)}`
    );
  });


  $("changeBtn")?.addEventListener("click", () => {

    const original = Number($("originalValue")?.value);
    const current = Number($("newValue")?.value);

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

    const difference = current - original;
    const percentage =
      difference / Math.abs(original) * 100;

    const direction =
      difference > 0
        ? "increase"
        : difference < 0
          ? "decrease"
          : "no change";

    setText(
      "changeResult",
      `${formatNumber(Math.abs(percentage))}% ${direction}`
    );
  });


  $("discountBtn")?.addEventListener("click", () => {

    const price = Number($("price")?.value);
    const discount = Number($("discount")?.value);

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

    const saved = price * discount / 100;
    const finalPrice = price - saved;

    setText(
      "discountResult",
      `You save ${formatNumber(saved)}. Final price: ${formatNumber(finalPrice)}`
    );
  });


  /* =========================
     AGE CALCULATOR
  ========================= */

  function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const ageDate = $("ageDate");

  if (ageDate) {
    const today = new Date();

    ageDate.value = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
  }

  $("ageBtn")?.addEventListener("click", () => {

    const birthInput = $("birthDate")?.value;
    const endInput = $("ageDate")?.value;

    if (!birthInput || !endInput) {
      setText("ageResult", "Please enter both dates.");
      return;
    }

    const birth = parseLocalDate(birthInput);
    const end = parseLocalDate(endInput);

    if (
      Number.isNaN(birth.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setText("ageResult", "Please enter valid dates.");
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
      end.getFullYear() - birth.getFullYear();

    let months =
      end.getMonth() - birth.getMonth();

    let days =
      end.getDate() - birth.getDate();

    if (days < 0) {
      months--;

      const previousMonth = new Date(
        end.getFullYear(),
        end.getMonth(),
        0
      );

      days += previousMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor(
      (end - birth) / 86400000
    );

    const result = $("ageResult");

    if (result) {
      result.innerHTML =
        `<strong>${years} years, ${months} months, ${days} days</strong>` +
        `<br><small>${totalDays.toLocaleString()} total days</small>`;
    }
  });


  /* =========================================================
     PART 2 STARTS HERE
  ========================================================= */  /* =========================
     BMI CALCULATOR
  ========================= */

  let bmiUnit = "metric";

  const bmiResult = $("bmiResult");
  const metricFields = $("metricFields");
  const imperialFields = $("imperialFields");

  function updateBMIFields() {
    metricFields?.classList.toggle(
      "hidden",
      bmiUnit !== "metric"
    );

    imperialFields?.classList.toggle(
      "hidden",
      bmiUnit !== "imperial"
    );
  }

  $$(".unit-tab").forEach(button => {

    button.addEventListener("click", () => {

      $$(".unit-tab").forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      bmiUnit = button.dataset.unit || "metric";

      updateBMIFields();

      if (bmiResult) {
        bmiResult.textContent =
          "Enter your height and weight.";
      }
    });
  });

  updateBMIFields();


  $("bmiBtn")?.addEventListener("click", () => {

    let height;
    let weight;
    let bmi;

    if (bmiUnit === "metric") {

      height = Number($("heightCm")?.value);
      weight = Number($("weightKg")?.value);

      if (
        !Number.isFinite(height) ||
        !Number.isFinite(weight) ||
        height <= 0 ||
        weight <= 0
      ) {
        setText(
          "bmiResult",
          "Enter valid height and weight."
        );
        return;
      }

      bmi =
        weight /
        Math.pow(height / 100, 2);

    } else {

      const feet =
        Number($("heightFeet")?.value);

      const inches =
        Number($("heightInches")?.value);

      weight =
        Number($("weightLbs")?.value);

      if (
        !Number.isFinite(feet) ||
        !Number.isFinite(inches) ||
        !Number.isFinite(weight) ||
        feet < 0 ||
        inches < 0 ||
        weight <= 0 ||
        (feet === 0 && inches <= 0)
      ) {
        setText(
          "bmiResult",
          "Enter valid height and weight."
        );
        return;
      }

      const totalInches =
        feet * 12 + inches;

      bmi =
        703 *
        weight /
        Math.pow(totalInches, 2);
    }

    if (!Number.isFinite(bmi)) {
      setText(
        "bmiResult",
        "Unable to calculate BMI."
      );
      return;
    }

    let category;

    if (bmi < 18.5) {
      category = "Underweight";
    } else if (bmi < 25) {
      category = "Normal range";
    } else if (bmi < 30) {
      category = "Overweight";
    } else {
      category = "Obesity range";
    }

    if (bmiResult) {
      bmiResult.innerHTML =
        `<strong>BMI: ${formatNumber(bmi)}</strong>` +
        `<br><small>${category}</small>`;
    }
  });


  /* =========================
     ENTER KEY SUPPORT
  ========================= */

  $$("input[type='number']").forEach(input => {

    input.addEventListener("keydown", event => {

      if (event.key !== "Enter") return;

      const calculator =
        input.closest(".calculator-view");

      if (!calculator) return;

      const button =
        calculator.querySelector(
          "button.primary-btn:not(.back-btn), button[data-calculate]"
        );

      button?.click();
    });
  });


  /* =========================
     INITIAL ARIA STATE
  ========================= */

  views.forEach(view => {

    if (!view.classList.contains("active")) {
      view.setAttribute("aria-hidden", "true");
    }

  });

});
