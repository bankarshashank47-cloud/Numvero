"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     HELPERS
  ===================================================== */

  const $ = (id) => document.getElementById(id);

  const $$ = (selector) =>
    document.querySelectorAll(selector);

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";

    return Number(value.toPrecision(12)).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 10
      }
    );
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

    themeBtn.addEventListener(
      "click",
      () => {

        const newTheme =
          document.body.classList.contains("dark")
            ? "light"
            : "dark";

        localStorage.setItem(
          "numvero-theme",
          newTheme
        );

        applyTheme(newTheme);

      }
    );
  }


  /* =====================================================
     CALCULATOR NAVIGATION
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

      view.setAttribute(
        "aria-hidden",
        "true"
      );

    });
  }


  function showMenu() {

    hideAllCalculators();

    if (menu) {
      menu.classList.remove("hidden");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function showCalculator(name, updateURL = true) {

    const target =
      $(`view-${name}`);

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

      const newURL =
        `${window.location.pathname}` +
        `${window.location.search}` +
        `#${name}`;

      history.pushState(
        { calculator: name },
        "",
        newURL
      );

    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  openButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const calculator =
          button.dataset.open;

        showCalculator(
          calculator,
          true
        );

      }
    );

  });


  backButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (window.location.hash) {
          history.pushState(
            {},
            "",
            window.location.pathname +
            window.location.search
          );
        }

        showMenu();

      }
    );

  });


  function loadFromHash() {

    const hash =
      window.location.hash
        .replace("#", "")
        .toLowerCase();

    const validCalculators = [
      "basic",
      "scientific",
      "percentage",
      "age",
      "bmi"
    ];

    if (
      validCalculators.includes(hash)
    ) {

      showCalculator(
        hash,
        false
      );

    } else {

      showMenu();

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

    $$("[data-basic]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const value =
              button.dataset.basic;

            if (
              basicDisplay.value === "Error"
            ) {
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

          }
        );

      });


    function calculateBasic() {

      let expression =
        basicDisplay.value.trim();

      if (!expression) return;


      /*
        Only permit calculator characters.
        Function() is used only after this strict
        whitelist is applied.
      */

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
          expression.replace(
            /\^/g,
            "**"
          );


        expression =
          expression.replace(
            /(\d+(?:\.\d+)?)%/g,
            "($1/100)"
          );


        const result =
          Function(
            `"use strict"; return (${expression})`
          )();


        if (
          !Number.isFinite(result)
        ) {
          throw new Error();
        }


        basicDisplay.value =
          formatNumber(result);

      } catch {

        basicDisplay.value =
          "Error";

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


    if (angleButton) {

      angleButton.addEventListener(
        "click",
        () => {

          angleMode =
            angleMode === "DEG"
              ? "RAD"
              : "DEG";

          angleButton.textContent =
            angleMode;

        }
      );

    }


    const clearButton =
      $("scientificClear");


    if (clearButton) {

      clearButton.addEventListener(
        "click",
        () => {

          scientificDisplay.value = "";

        }
      );

    }


    $$("[data-sci]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const value =
              button.dataset.sci;


            if (
              scientificDisplay.value ===
              "Error"
            ) {

              scientificDisplay.value = "";

            }


            if (value === "clear") {

              scientificDisplay.value = "";

              return;
            }


            if (value === "=") {

              calculateScientific();

              return;
            }


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


            if (value === "asin") {

              applyInverseTrig(
                Math.asin
              );

              return;
            }


            if (value === "acos") {

              applyInverseTrig(
                Math.acos
              );

              return;
            }


            if (value === "atan") {

              applyInverseTrig(
                Math.atan
              );

              return;
            }


            if (value === "sqrt") {

              applyScientificFunction(
                Math.sqrt,
                false
              );

              return;
            }


            if (value === "square") {

              scientificDisplay.value += "^2";

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


            if (value === "power") {

              scientificDisplay.value += "^";

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


            scientificDisplay.value += value;

          }
        );

      });


    function getNumber() {

      const value =
        Number(
          scientificDisplay.value
        );

      if (
        !Number.isFinite(value)
      ) {

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
          getNumber();

        const result =
          fn(
            usesAngle
              ? toRadians(value)
              : value
          );


        if (
          !Number.isFinite(result)
        ) {

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
          getNumber();

        const result =
          fromRadians(
            fn(value)
          );


        if (
          !Number.isFinite(result)
        ) {

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


      try {

        expression =
          expression
            .replace(
              /π/g,
              "Math.PI"
            )
            .replace(
              /\be\b/g,
              "Math.E"
            )
            .replace(
              /\^/g,
              "**"
            );


        if (
          !/^[0-9+\-*/().\sA-Za-z]+$/.test(
            expression
          )
        ) {

          throw new Error();

        }


        const remaining =
          expression
            .replace(
              /Math\.PI/g,
              ""
            )
            .replace(
              /Math\.E/g,
              ""
            );


        if (
          /[A-Za-z]/.test(
            remaining
          )
        ) {

          throw new Error();

        }


        const result =
          Function(
            `"use strict"; return (${expression})`
          )();


        if (
          !Number.isFinite(result)
        ) {

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
          Number(
            $("percentX").value
          );

        const number =
          Number(
            $("percentY").value
          );


        if (
          !Number.isFinite(percentage) ||
          !Number.isFinite(number)
        ) {

          $("percentOfResult")
            .textContent =
            "Please enter valid numbers.";

          return;
        }


        const result =
          percentage / 100 * number;


        $("percentOfResult")
          .textContent =
          `${formatNumber(percentage)}% of ` +
          `${formatNumber(number)} = ` +
          `${formatNumber(result)}`;

      }
    );

  }


  const changeBtn =
    $("changeBtn");


  if (changeBtn) {

    changeBtn.addEventListener(
      "click",
      () => {

        const original =
          Number(
            $("originalValue").value
          );

        const current =
          Number(
            $("newValue").value
          );


        if (
          !Number.isFinite(original) ||
          !Number.isFinite(current) ||
          original === 0
        ) {

          $("changeResult")
            .textContent =
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


        $("changeResult")
          .textContent =
          `${formatNumber(
            Math.abs(percentage)
          )}% ${direction}`;

      }
    );

  }


  const discountBtn =
    $("discountBtn");


  if (discountBtn) {

    discountBtn.addEventListener(
      "click",
      () => {

        const price =
          Number(
            $("price").value
          );

        const discount =
          Number(
            $("discount").value
          );


        if (
          !Number.isFinite(price) ||
          !Number.isFinite(discount) ||
          price < 0 ||
          discount < 0 ||
          discount > 100
        ) {

          $("discountResult")
            .textContent =
            "Enter a valid price and discount between 0% and 100%.";

          return;
        }


        const saved =
          price * discount / 100;


        const finalPrice =
          price - saved;


        $("discountResult")
          .textContent =
          `You save ${formatNumber(saved)}. ` +
          `Final price: ${formatNumber(finalPrice)}`;

      }
    );

  }


  /* =====================================================
     AGE CALCULATOR
  ===================================================== */

  const ageDate =
    $("ageDate");


  if (ageDate) {

    const today =
      new Date();


    const localToday =
      [
        today.getFullYear(),
        String(
          today.getMonth() + 1
        ).padStart(2, "0"),
        String(
          today.getDate()
        ).padStart(2, "0")
      ].join("-");


    ageDate.value =
      localToday;

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


        if (
          !birthInput ||
          !endInput
        ) {

          $("ageResult")
            .textContent =
            "Please enter both dates.";

          return;
        }


        const birth =
          parseLocalDate(
            birthInput
          );

        const end =
          parseLocalDate(
            endInput
          );


        if (
          birth > end
        ) {

          $("ageResult")
            .textContent =
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
              end - birth
            ) /
            86400000
          );


        $("ageResult")
          .innerHTML =
          `<strong>
             ${years} years,
             ${months} months,
             ${days} days
           </strong>
           <br>
           <small>
             ${totalDays.toLocaleString()}
             total days
           </small>`;

      }
    );

  }


  function parseLocalDate(value) {

    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);


    return new Date(
      year,
      month - 1,
      day
    );

  }


  /* =====================================================
     BMI CALCULATOR
  ===================================================== */

  let bmiUnit = "metric";


  $$(".unit-tab")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$(".unit-tab")
            .forEach(btn =>
              btn.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          bmiUnit =
            button.dataset.unit;


          const metricFields =
            $("metricFields");

          const imperialFields =
            $("imperialFields");


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


          if ($("bmiResult")) {

            $("bmiResult")
              .textContent =
              "Enter your height and weight.";

          }

      
