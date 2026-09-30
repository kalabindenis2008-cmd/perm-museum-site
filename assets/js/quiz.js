/* Викторина о музеях Перми: последовательные вопросы,
   мгновенная проверка с объяснением и итоговый результат. */

(function () {
  "use strict";

  var root = document.getElementById("quizRoot");
  if (!root || typeof QUIZ === "undefined") return;

  var KEYS = ["А", "Б", "В", "Г", "Д", "Е"];

  var state = {
    index: 0,
    score: 0,
    answered: false,
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function progressHTML() {
    var pct = (state.index / QUIZ.length) * 100;
    return (
      '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:' +
      pct +
      '%"></div></div>' +
      '<p class="quiz-progress-text">Вопрос ' +
      (state.index + 1) +
      " из " +
      QUIZ.length +
      "</p>"
    );
  }

  function renderQuestion() {
    var q = QUIZ[state.index];
    state.answered = false;

    var options = q.options
      .map(function (text, i) {
        return (
          '<button class="quiz-option" type="button" data-index="' +
          i +
          '"><span class="opt-key">' +
          KEYS[i] +
          "</span><span>" +
          esc(text) +
          "</span></button>"
        );
      })
      .join("");

    root.innerHTML =
      progressHTML() +
      '<div class="quiz-card">' +
      '<h2 class="quiz-question">' +
      esc(q.question) +
      "</h2>" +
      '<div class="quiz-options">' +
      options +
      "</div>" +
      '<div class="quiz-feedback" id="quizFeedback"></div>' +
      '<div class="quiz-actions"><button class="btn btn-primary" id="quizNext" type="button" hidden>Далее →</button></div>' +
      "</div>";

    var optionButtons = root.querySelectorAll(".quiz-option");
    Array.prototype.forEach.call(optionButtons, function (btn) {
      btn.addEventListener("click", function () {
        answer(parseInt(btn.getAttribute("data-index"), 10));
      });
    });

    var next = document.getElementById("quizNext");
    if (next) {
      next.addEventListener("click", function () {
        if (state.index < QUIZ.length - 1) {
          state.index += 1;
          renderQuestion();
        } else {
          renderResult();
        }
      });
    }
  }

  function answer(choice) {
    if (state.answered) return;
    state.answered = true;

    var q = QUIZ[state.index];
    var isCorrect = choice === q.correct;
    if (isCorrect) state.score += 1;

    var optionButtons = root.querySelectorAll(".quiz-option");
    Array.prototype.forEach.call(optionButtons, function (btn) {
      var i = parseInt(btn.getAttribute("data-index"), 10);
      btn.disabled = true;
      if (i === q.correct) btn.classList.add("correct");
      if (i === choice && !isCorrect) btn.classList.add("wrong");
    });

    var feedback = document.getElementById("quizFeedback");
    if (feedback) {
      feedback.className = "quiz-feedback show " + (isCorrect ? "ok" : "no");
      feedback.innerHTML =
        "<strong>" +
        (isCorrect ? "Верно!" : "Не совсем.") +
        "</strong>" +
        esc(q.explanation);
    }

    var next = document.getElementById("quizNext");
    if (next) {
      next.hidden = false;
      next.textContent = state.index < QUIZ.length - 1 ? "Далее →" : "Показать результат →";
    }
  }

  function levelFor(percent) {
    if (percent >= 90) return { level: "Знаток музеев Перми", badge: "🏆" };
    if (percent >= 70) return { level: "Любитель искусства", badge: "🥇" };
    if (percent >= 50) return { level: "Начинающий краевед", badge: "🧭" };
    return { level: "Стоит сходить в музей", badge: "📖" };
  }

  function renderResult() {
    var total = QUIZ.length;
    var percent = Math.round((state.score / total) * 100);
    var info = levelFor(percent);

    root.innerHTML =
      '<div class="quiz-card quiz-result">' +
      '<div class="result-badge" aria-hidden="true">' +
      info.badge +
      "</div>" +
      '<div class="result-score">' +
      state.score +
      " / " +
      total +
      "</div>" +
      '<div class="result-level">' +
      esc(info.level) +
      "</div>" +
      '<p class="result-text">Правильных ответов: ' +
      percent +
      "%. " +
      (percent >= 70
        ? "Отличный результат — вы хорошо знаете музеи Перми!"
        : "Загляните в каталог музеев, чтобы узнать больше интересного.") +
      "</p>" +
      '<div class="result-actions">' +
      '<button class="btn btn-primary" id="quizRestart" type="button">Пройти заново</button>' +
      '<a class="btn btn-outline" href="museums.html">В каталог музеев</a>' +
      "</div>" +
      "</div>";

    var restart = document.getElementById("quizRestart");
    if (restart) {
      restart.addEventListener("click", function () {
        state.index = 0;
        state.score = 0;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  renderQuestion();
})();
