document.addEventListener('DOMContentLoaded', async () => {
    // Determinar la URL base dinámicamente (si abres el HTML directo usa localhost, si es por servidor usa su origen)
    const API_BASE_URL = window.location.protocol === 'file:' 
        ? 'http://localhost:3000' 
        : window.location.origin;

    let surveyData = [];
    let currentQuestionIndex = 0;

    const profiles = [
        { title: "ALMA AVENTURERA Y ENERGÉTICA 🚀", desc: "Eres el alma de la fiesta y un espíritu inquieto. Buscas constantemente el movimiento, la novedad y rodearte de personas. ¡Allí donde vayas llevas la luz de la alegría y te adaptas fácilmente al cambio!" },
        { title: "ALMA CREATIVA Y BOHEMIA 🎨", desc: "Observas el mundo de manera distinta. Valoras el arte, los pequeños detalles, evitas la rutina cuadrada y te dejas llevar por tus grandes emociones. Tienes una sensibilidad especial que te hace único/a." },
        { title: "ALMA SERENA Y ANALÍTICA ☕", desc: "Eres la voz de la sensatez. Valoras profundamente la calma, tu tiempo sagrado a solas y los ambientes cálidos. Piensas con prudencia y encuentras el punto lógico y racional en un mundo cada vez más ruidoso." }
    ];

    const welcomeSection = document.getElementById('welcome-section');
    const startBtn = document.getElementById('start-btn');
    const mainContainer = document.getElementById('main-container');
    const surveyContainer = document.getElementById('survey-questions-container');
    const resultsContainer = document.getElementById('results-container');
    const form = document.getElementById('survey-form');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const votingSection = document.getElementById('voting-section');
    const resultsSection = document.getElementById('results-section');
    const detailedResultsSection = document.getElementById('detailed-results-section');
    const personalityResultSection = document.getElementById('personality-result');

    // Deshabilitar botón de inicio hasta configurar todo
    startBtn.style.opacity = '0.5';
    startBtn.style.pointerEvents = 'none';
    startBtn.innerHTML = 'Cargando preguntas de la Base de Datos...';

    // Cargar las preguntas dinámicas desde SQLite
    try {
        const response = await fetch(`${API_BASE_URL}/api/questions?t=${new Date().getTime()}`, { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            surveyData = data.questions;
            renderSurvey();
            
            startBtn.style.opacity = '1';
            startBtn.style.pointerEvents = 'auto';
            startBtn.innerHTML = 'Comenzar Test ➔';
        } else {
            console.error("Error al cargar las preguntas");
        }
    } catch (err) {
        console.error("No se pudo conectar al backend", err);
    }

    function renderSurvey() {
        surveyContainer.innerHTML = '';
        currentQuestionIndex = 0;
        
        surveyData.forEach((item, qIndex) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'question-block';
            qDiv.id = `question-${qIndex}`;
            
            if (qIndex !== 0) qDiv.style.display = 'none';
            
            qDiv.innerHTML = `
                <p style="font-size: 0.9rem; color: #ff6b81; font-weight: bold; margin-bottom: 5px;">Pregunta ${qIndex + 1} de ${surveyData.length}</p>
                <p class="question" style="font-size: 1.3rem; line-height: 1.4;">${item.q}</p>
            `;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options-wrapper';
            
            item.options.forEach((optText, oIndex) => {
                optionsDiv.innerHTML += `
                    <label class="option-label">
                        <input type="radio" name="q${qIndex}" value="${oIndex}">
                        <span class="custom-radio"></span>
                        <span class="option-text">${optText}</span>
                    </label>
                `;
            });
            
            qDiv.appendChild(optionsDiv);
            surveyContainer.appendChild(qDiv);
        });

        submitBtn.type = 'button'; 
        submitBtn.innerHTML = 'Selecciona una opción';
        submitBtn.classList.remove('active');
    }

    form.addEventListener('change', () => {
        const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        if (selected) {
            submitBtn.classList.add('active');
            if (currentQuestionIndex < surveyData.length - 1) {
                submitBtn.innerHTML = 'Siguiente pregunta <span class="arrow">→</span>';
            } else {
                submitBtn.innerHTML = 'Finalizar y ver mi Personalidad <span class="arrow">→</span>';
            }
        }
    });

    startBtn.addEventListener('click', () => {
        welcomeSection.style.opacity = '0';
        welcomeSection.style.pointerEvents = 'none';
        welcomeSection.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            welcomeSection.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mainContainer.style.animation = 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
        }, 500);
    });

    submitBtn.addEventListener('click', async (e) => {
        const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        if (!selected) return;

        if (currentQuestionIndex < surveyData.length - 1) {
            const currentDiv = document.getElementById(`question-${currentQuestionIndex}`);
            currentQuestionIndex++;
            const nextDiv = document.getElementById(`question-${currentQuestionIndex}`);

            currentDiv.style.opacity = '0';
            currentDiv.style.transform = 'translateY(-20px)';
            currentDiv.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                currentDiv.style.display = 'none';
                nextDiv.style.display = 'block';
                nextDiv.style.opacity = '0';
                nextDiv.style.transform = 'translateY(20px)';
                
                void nextDiv.offsetWidth; 
                
                nextDiv.style.transition = 'all 0.3s ease';
                nextDiv.style.opacity = '1';
                nextDiv.style.transform = 'translateY(0)';

                submitBtn.classList.remove('active');
                submitBtn.innerHTML = 'Selecciona una opción';
            }, 300);

        } else {
            const userChoicesRaw = [];
            const answersApiPayload = [];
            
            for (let i = 0; i < surveyData.length; i++) {
                const sel = document.querySelector(`input[name="q${i}"]:checked`);
                const val = parseInt(sel.value);
                userChoicesRaw.push(val);
                answersApiPayload.push({
                    questionId: surveyData[i].id,
                    optionIndex: val
                });
            }

            submitBtn.style.opacity = '0.5';
            submitBtn.style.pointerEvents = 'none';
            submitBtn.innerHTML = 'Guardando tus votos en SQLite...';

            try {
                const response = await fetch(`${API_BASE_URL}/api/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: answersApiPayload })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.updatedVotes) {
                        surveyData.forEach(q => {
                            if (data.updatedVotes[q.id]) {
                                q.votes = data.updatedVotes[q.id];
                            }
                        });
                    }
                    showResults(userChoicesRaw);
                }
            } catch (err) {
                console.error(err);
                alert('No se pudo conectar a la API. Mostrando cálculos locales.');
                showResults(userChoicesRaw); 
            }
        }
    });

    function calculatePersonality(userAnswers) {
        const counts = [0, 0, 0];
        userAnswers.forEach(ans => counts[ans]++);
        const maxIndex = counts.indexOf(Math.max(...counts));
        
        // Aplicar clase de efecto especial al body
        document.body.classList.remove('effect-0', 'effect-1', 'effect-2');
        document.body.classList.add(`effect-${maxIndex}`);
        
        personalityResultSection.innerHTML = `
            <h2 style="color: #000; font-style: italic;">SEGÚN TUS OPINIONES ERES UN...</h2>
            <h1 style="color: #ff0f7b; font-size: 2.2rem; margin: 20px 0; line-height: 1.2;">${profiles[maxIndex].title}</h1>
            <p style="font-size: 1.15rem; color: #000; font-style: italic; font-weight: 600; line-height: 1.6; padding: 0 10px; margin-bottom: 30px;">${profiles[maxIndex].desc}</p>
            <button type="button" class="submit-btn active" id="show-details-btn" style="width: 100%; justify-content: center; background: linear-gradient(135deg, #00d2ff 0%, #0abde3 100%); font-size: 1.1rem; padding: 18px;">Ver Resultados y Sugerencias <span class="arrow">→</span></button>
        `;

        document.getElementById('show-details-btn').addEventListener('click', () => {
            resultsSection.classList.add('hidden');
            detailedResultsSection.classList.remove('hidden');
            
            detailedResultsSection.style.opacity = '0';
            detailedResultsSection.style.transform = 'translateY(20px)';
            void detailedResultsSection.offsetWidth;
            detailedResultsSection.style.transition = 'all 0.4s ease';
            detailedResultsSection.style.opacity = '1';
            detailedResultsSection.style.transform = 'translateY(0)';
            
            animateBars();
        });
    }

    function animateBars() {
        setTimeout(() => {
            const resultItems = document.querySelectorAll('.result-item');
            resultItems.forEach(item => {
                const bg = item.querySelector('.result-background');
                const percentText = item.querySelector('.result-percent');
                const targetWidth = bg.getAttribute('data-width');
                bg.style.width = targetWidth;

                let i = 0;
                const targetPercentNum = parseInt(targetWidth);
                if (targetPercentNum === 0) {
                    percentText.textContent = '0%';
                } else {
                    const step = targetPercentNum / 30;
                    const counterId = setInterval(() => {
                        i += step;
                        if (i >= targetPercentNum) {
                            i = targetPercentNum;
                            clearInterval(counterId);
                        }
                        percentText.textContent = Math.round(i) + '%';
                    }, 20);
                }
            });
        }, 100);
    }

    function showResults(userAnswers) {
        votingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        if(detailedResultsSection) detailedResultsSection.classList.add('hidden');
        
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(20px)';
        void resultsSection.offsetWidth;
        resultsSection.style.transition = 'all 0.4s ease';
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';

        // Render Personality profile
        if (userAnswers && userAnswers.length > 0) {
            calculatePersonality(userAnswers);
        }

        resultsContainer.innerHTML = '';

        surveyData.forEach((item, qIndex) => {
            const qResultBlock = document.createElement('div');
            qResultBlock.className = 'question-result-block';
            qResultBlock.innerHTML = `<p class="question-header">${qIndex + 1}. ${item.q}</p>`;
            
            const qVotes = item.votes || [0,0,0];
            const totalQVotes = qVotes.reduce((a, b) => a + b, 0);
            const userChoice = userAnswers !== null ? userAnswers[qIndex] : null;

            let maxVotes = 0;
            let maxIndex = 0;
            qVotes.forEach((v, i) => { if (v > maxVotes) { maxVotes = v; maxIndex = i; } });

            item.options.forEach((optText, oIndex) => {
                const percentage = totalQVotes === 0 ? 0 : Math.round((qVotes[oIndex] / totalQVotes) * 100);
                const isWinner = oIndex === maxIndex && totalQVotes > 0;
                const isUserChoice = oIndex === userChoice;
                const userPill = isUserChoice ? ' <span class="user-pill">Tu voto</span>' : '';

                const resultItem = document.createElement('div');
                resultItem.className = `result-item ${isWinner ? 'winner' : ''}`;
                resultItem.innerHTML = `
                    <div class="result-background" style="width: 0%" data-width="${percentage}%"></div>
                    <div class="result-content">
                        <span class="result-text">${optText}${userPill}</span>
                        <span class="result-percent">0%</span>
                    </div>
                `;
                qResultBlock.appendChild(resultItem);
            });
            resultsContainer.appendChild(qResultBlock);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            // Quitar clase de efecto especial al reiniciar
            document.body.classList.remove('effect-0', 'effect-1', 'effect-2');
            
            // Refetch questions to get new random 10
            surveyContainer.innerHTML = '<p style="text-align: center;">Generando nuevas preguntas aleatorias...</p>';
            
            resultsSection.classList.add('hidden');
            if(detailedResultsSection) detailedResultsSection.classList.add('hidden');
            votingSection.classList.remove('hidden');
            
            votingSection.style.opacity = '0';
            votingSection.style.transform = 'translateY(-20px)';
            void votingSection.offsetWidth;
            votingSection.style.opacity = '1';
            votingSection.style.transform = 'translateY(0)';
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/questions?t=${new Date().getTime()}`, { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    surveyData = data.questions;
                    renderSurvey();
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    const suggestionForm = document.getElementById('suggestion-form');
    const suggestBtn = document.getElementById('suggest-btn');
    const suggestSuccess = document.getElementById('suggest-success');

    if (suggestionForm) {
        suggestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('sug-name').value;
            const text = document.getElementById('sug-text').value;

            suggestBtn.innerHTML = 'Enviando...';
            suggestBtn.style.opacity = '0.5';
            suggestBtn.style.pointerEvents = 'none';

            try {
                const response = await fetch(`${API_BASE_URL}/api/suggest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, text })
                });

                if (response.ok) {
                    suggestionForm.reset();
                    suggestionForm.style.display = 'none';
                    suggestSuccess.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            } finally {
                suggestBtn.innerHTML = 'Enviar sugerencia';
                suggestBtn.style.opacity = '1';
                suggestBtn.style.pointerEvents = 'auto';
            }
        });
    }
});
