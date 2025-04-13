class QuizApp {
  constructor() {
      this.apiBase = 'https://my-json-server.typicode.com/<USER>/<REPO>';
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

      // Register partials
      Handlebars.registerPartial('multipleChoice', `
          <div class="multiple-choice">
              <h4>{{question}}</h4>
              {{#each options}}
              <button class="btn btn-outline-primary option" data-value="{{this}}">
                  {{this}}
              </button>
              {{/each}}
          </div>
      `);
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
          // Add handlers for other question types
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

  // Add remaining helper methods for timer, score calculation, etc.
}

new QuizApp();