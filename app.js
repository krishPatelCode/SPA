
document.addEventListener('DOMContentLoaded', () => {
  new QuizApp();
});

class QuizApp {
  constructor() {
      this.apiBase = 'https://my-json-server.typicode.com/krishPatelCode/SPA';
      this.templates = {};
      this.state = {
          currentView: 'start',
          quiz: null,
          currentQuestionIndex: 0,
          score: 0,
          startTime: null,
          timer: null
      };
      
      this.initializeHandlebars();
      this.loadStartView();
  }

  initializeHandlebars() {
      // Register templates
      ['start', 'quiz', 'end'].forEach(template => {
          this.templates[template] = Handlebars.compile(
              document.getElementById(`${template}-template`).innerHTML
          );
      });
      Handlebars.registerPartial('text', Handlebars.compile(`
    <div class="text-question">
        <h4>{{question}}</h4>
        <input type="text" class="form-control answer-input" placeholder="Type your answer">
        <button class="btn btn-primary mt-2 submit-answer">Submit</button>
    </div>
`));
      

      // Register partials
      Handlebars.registerPartial('multiple_choice', Handlebars.compile(`
    <div class="multiple-choice">
        <h4>{{question}}</h4>
        {{#each options}}
        <button class="btn btn-outline-primary option" data-value="{{this}}">
            {{this}}
        </button>
        {{/each}}
    </div>
`));
    Handlebars.registerPartial('image', Handlebars.compile(`
    <div class="image-question">
        <h4>{{question}}</h4>
        <div class="d-flex flex-wrap gap-3 justify-content-center">
    {{#each images}}
    <img src="{{url}}" class="img-thumbnail option-image" data-value="{{id}}" style="width: 120px; height: auto; cursor: pointer;">
    {{/each}}
  </div>
</div>
`));
  }

  async loadStartView() {
      const quizzes = await this.fetchData('quizzes');
      const html = this.templates.start({ quizzes });
      this.render(html);
      document.getElementById('start-form').addEventListener('submit', this.startQuiz.bind(this));
  }

  async startQuiz(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const quizId = formData.get('quiz');
      
      this.state.quiz = await this.fetchData(`quizzes/${quizId}`);
      this.state.startTime = Date.now();
      this.startTimer();
      this.loadNextQuestion();
      this.state.name = formData.get('name');
  }

  async loadNextQuestion() {
      if (this.state.currentQuestionIndex >= this.state.quiz.questions.length) {
          return this.showResults();
      }
      
      const questionId = this.state.quiz.questions[this.state.currentQuestionIndex];
      const question = await this.fetchData(`questions/${questionId}`);
      this.renderQuestion(question);
  }

  renderQuestion(question) {
      const template = Handlebars.partials[question.type];
      const questionHtml = template(question);
      
      const html = this.templates.quiz({
          question: questionHtml,
          time: this.getElapsedTime(),
          score: this.calculateScore(),
          current: this.state.currentQuestionIndex + 1,
          total: this.state.quiz.questions.length
      });
      
      this.render(html);
      this.setupQuestionHandlers(question);
  }

  setupQuestionHandlers(question) {
      switch(question.type) {
          case 'multiple_choice':
              document.querySelectorAll('.option').forEach(btn => {
                  btn.addEventListener('click', () => this.checkAnswer(btn.dataset.value, question));
              });
              break;

              case 'text':
                  document.querySelector('.submit-answer').addEventListener('click', () => {
                      const input = document.querySelector('.answer-input');
                      this.checkAnswer(input.value.trim(), question);
                  });
                  break;
      
              case 'image':
                  document.querySelectorAll('.option-image').forEach(img => {
                      img.addEventListener('click', () => this.checkAnswer(img.dataset.value, question));
                  });
                  break;
          
      }
  }

  checkAnswer(answer, question) {
      if (answer === question.correct_answer) {
          this.state.score++;
          this.showFeedback('Correct!', true);
      } else {
          this.showFeedback(question.explanation, false);
      }
  }

  showFeedback(message, isCorrect) {
      const feedback = document.querySelector('.feedback');
      feedback.querySelector('p').textContent = message;
      feedback.style.display = 'block';
      
      if (isCorrect) {
          feedback.classList.add('alert-success');
          setTimeout(() => {
              feedback.style.display = 'none';
              this.state.currentQuestionIndex++;
              this.loadNextQuestion();
          }, 1000);
      } else {
          feedback.classList.add('alert-danger');
          feedback.querySelector('.got-it').addEventListener('click', () => {
              feedback.style.display = 'none';
              this.state.currentQuestionIndex++;
              this.loadNextQuestion();
          });
      }
  }
  showResults() {
    clearInterval(this.state.timer);
    const html = this.templates.end({
        name: this.state.name || 'Student',
        score: this.calculateScore(),
        time: this.getElapsedTime()
    });
    this.render(html);
    document.querySelector('.restart').addEventListener('click', () => {
        this.state.currentQuestionIndex = 0;
        this.state.score = 0;
        this.loadStartView();
    });
}
async fetchData(endpoint) {
    const response = await fetch(`${this.apiBase}/${endpoint}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
}
render(html) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = html;
}
 
startTimer() {
    this.state.timer = setInterval(() => {
        const timerEl = document.querySelector('.scoreboard span:nth-child(1)');
        if (timerEl) {
            timerEl.textContent = `Time: ${this.getElapsedTime()}`;
        }
    }, 1000);
}
getElapsedTime() {
    const now = Date.now();
    const seconds = Math.floor((now - this.state.startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
calculateScore() {
    const total = this.state.quiz.questions.length;
    const correct = this.state.score;
    const percent = Math.round((correct / total) * 100);
    return percent;
}
  // Add remaining helper methods for timer, score calculation, etc.
}

new QuizApp();