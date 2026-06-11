// Основен JavaScript файл за CRO Analyzer

document.addEventListener('DOMContentLoaded', () => {
    console.log('CRO Analyzer приложението е заредено и готово за работа!');
    
    const form = document.getElementById('cro-form');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('clear-history-btn');

    let currentAnalysisId = null;
    let activeAnalysisData = null;
    const regenerateBtn = document.getElementById('regenerate-btn');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const editBtn = document.getElementById('edit-btn');
    const inputSection = document.getElementById('input-section');
    const loadDemoBtn = document.getElementById('load-demo-btn');

    const DEMO_DATA = {
        url: "https://saas-example.com/pricing",
        businessDesc: "Ние продаваме софтуер за управление на задачи за отдалечени екипи. Продуктът ни помага за лесно проследяване на проекти, разпределение на натоварването и споделяне на файлове на едно централизирано място.",
        pageGoal: "Регистрация за безплатен 14-дневен пробен период (Free Trial)",
        targetAudience: "Мениджъри на проекти, тийм лидери и собственици на малък до среден бизнес с отдалечени екипи.",
        currentProblem: "Висок bounce rate на ценовата ни страница. Посетителите разглеждат плановете, но много малко от тях кликат върху бутона за стартиране на пробен период.",
        desiredAction: "Кликване върху бутона 'Стартирай безплатен пробен период' и попълване на формата за регистрация.",
        pageText: "Нашите планове са гъвкави и проектирани да растат заедно с вашия бизнес. Изберете най-доброто решение за вашия екип.\n\nПлан 'Старт': $9 на потребител/месец. Включва до 5 проекта, 10GB пространство за файлове и базови интеграции.\n\nПлан 'Про': $19 на потребител/месец. Неограничени проекти, 100GB пространство, разширени отчети, интеграция с Slack и Jira.\n\nПлан 'Ентърпрайс': Свържете се с продажбите за индивидуална оферта. Персонализирано внедряване, денонощна поддръжка, неограничено пространство.\n\nРегистрирайте се днес и получете 14 дни безплатен достъп до всички функции! Без изискване на кредитна карта."
    };

    // Елементи за валидация (Task 04)
    const businessDesc = document.getElementById('business-desc');
    const pageText = document.getElementById('page-text');
    const btnGenerate = document.getElementById('generate-btn');
    
    const businessCounter = document.getElementById('business-desc-counter');
    const textCounter = document.getElementById('page-text-counter');
    const businessError = document.getElementById('business-desc-error');
    const textError = document.getElementById('page-text-error');

    // Логика за валидация на формата
    function validateForm() {
        const busLength = businessDesc.value.trim().length;
        const textLength = pageText.value.trim().length;
        
        const isGoal = document.getElementById('page-goal').value.trim() !== '';
        const isAudience = document.getElementById('target-audience').value.trim() !== '';
        const isProblem = document.getElementById('current-problem').value.trim() !== '';
        const isAction = document.getElementById('desired-action').value.trim() !== '';

        const isValid = busLength >= 30 && busLength <= 500 && textLength >= 100 && textLength <= 10000 && isGoal && isAudience && isProblem && isAction;
        btnGenerate.disabled = !isValid;
    }

    function updateCounter(input, counterEl, errorEl, minLength, maxLength) {
        const len = input.value.trim().length;
        counterEl.innerText = `${len} / ${minLength} мин. (макс. ${maxLength})`;
        
        if (len >= minLength && len <= maxLength) {
            counterEl.classList.add('valid');
            counterEl.classList.remove('invalid');
            errorEl.innerText = '';
            
            // Оранжево предупреждение при наближаване на лимита (напр. 90%)
            if (len >= maxLength * 0.9) {
                counterEl.style.color = '#f59e0b'; // оранжев
                input.style.borderColor = '#f59e0b';
            } else {
                counterEl.style.color = ''; // по подразбиране зелен от класа .valid
                input.style.borderColor = '#10b981'; // зелен
            }
        } else {
            counterEl.classList.remove('valid');
            counterEl.classList.add('invalid');
            counterEl.style.color = ''; // по подразбиране червен от класа .invalid
            
            if (len > 0 && len < minLength) {
                errorEl.innerText = `Въведете още поне ${minLength - len} символа.`;
                input.style.borderColor = '#ef4444'; // червен
            } else if (len > maxLength) {
                errorEl.innerText = `Текстът е твърде дълъг. Моля, премахнете ${len - maxLength} символа.`;
                input.style.borderColor = '#ef4444'; // червен
            } else {
                errorEl.innerText = '';
                input.style.borderColor = '#d1d5db'; // неутрален
            }
        }
        
        validateForm();
    }

    function handleBlur(input, errorEl, minLength, maxLength) {
        const len = input.value.trim().length;
        if (len > 0 && len < minLength) {
            errorEl.innerText = `Въведете още поне ${minLength - len} символа.`;
        } else if (len > maxLength) {
            errorEl.innerText = `Текстът е твърде дълъг. Моля, премахнете ${len - maxLength} символа.`;
        }
    }

    businessDesc.addEventListener('input', () => updateCounter(businessDesc, businessCounter, businessError, 30, 500));
    pageText.addEventListener('input', () => updateCounter(pageText, textCounter, textError, 100, 10000));

    businessDesc.addEventListener('blur', () => handleBlur(businessDesc, businessError, 30, 500));
    pageText.addEventListener('blur', () => handleBlur(pageText, textError, 100, 10000));

    // Проверка на останалите полета за активиране на бутона
    ['page-goal', 'target-audience', 'current-problem', 'desired-action'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', validateForm);
    });

    // Управление на състоянията и изгледите (Task 12)
    function showInputView() {
        resultsSection.style.display = 'none';
        inputSection.style.display = 'block';
        
        inputSection.classList.remove('fade-in');
        void inputSection.offsetWidth; // Force reflow
        inputSection.classList.add('fade-in');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showResultsView() {
        inputSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
        resultsSection.classList.remove('fade-in');
        void resultsSection.offsetWidth; // Force reflow
        resultsSection.classList.add('fade-in');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearForm() {
        const fieldsToClear = ['page-url', 'business-desc', 'page-goal', 'target-audience', 'current-problem', 'desired-action', 'page-text'];
        fieldsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.style.borderColor = '#d1d5db';
            }
        });
        
        // Нулиране на броячи и валидация
        updateCounter(businessDesc, businessCounter, businessError, 30, 500);
        updateCounter(pageText, textCounter, textError, 100, 10000);
        validateForm();
        
        // Изчистване на черновата
        clearDraft();
    }

    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            clearForm();
            showInputView();
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (activeAnalysisData) {
                // Попълване на формата с текущите данни
                const urlInput = document.getElementById('page-url');
                if (urlInput) urlInput.value = activeAnalysisData.url || '';
                
                businessDesc.value = activeAnalysisData.businessDesc || '';
                
                const goalInput = document.getElementById('page-goal');
                if (goalInput) goalInput.value = activeAnalysisData.pageGoal || '';
                
                const audienceInput = document.getElementById('target-audience');
                if (audienceInput) audienceInput.value = activeAnalysisData.targetAudience || '';
                
                const problemInput = document.getElementById('current-problem');
                if (problemInput) problemInput.value = activeAnalysisData.currentProblem || '';
                
                const actionInput = document.getElementById('desired-action');
                if (actionInput) actionInput.value = activeAnalysisData.desiredAction || '';
                
                pageText.value = activeAnalysisData.pageText || '';
                
                // Ръчно оцветяване на полетата
                ['page-goal', 'target-audience', 'current-problem', 'desired-action'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.borderColor = el.value.trim() !== '' ? '#10b981' : '#d1d5db';
                });

                // Обновяване на броячи
                updateCounter(businessDesc, businessCounter, businessError, 30, 500);
                updateCounter(pageText, textCounter, textError, 100, 10000);
                validateForm();
                
                // Запазваме данните като нова активна чернова
                saveDraft();
            }
            showInputView();
        });
    }

    if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', () => {
            // Проверка дали някое от полетата на формата (без API Key) вече съдържа въведен от потребителя текст
            const fieldsToCheck = ['page-url', 'business-desc', 'page-goal', 'target-audience', 'current-problem', 'desired-action', 'page-text'];
            const hasExistingData = fieldsToCheck.some(id => {
                const el = document.getElementById(id);
                return el && el.value.trim() !== '';
            });

            if (hasExistingData) {
                const confirmPrefill = window.confirm("Сигурни ли сте, че искате да заредите примерния случай? Текущите ви промени във формата ще бъдат презаписани.");
                if (!confirmPrefill) return;
            }

            // Попълване на формата с примерни данни
            const urlInput = document.getElementById('page-url');
            if (urlInput) urlInput.value = DEMO_DATA.url;
            
            businessDesc.value = DEMO_DATA.businessDesc;
            
            const goalInput = document.getElementById('page-goal');
            if (goalInput) goalInput.value = DEMO_DATA.pageGoal;
            
            const audienceInput = document.getElementById('target-audience');
            if (audienceInput) audienceInput.value = DEMO_DATA.targetAudience;
            
            const problemInput = document.getElementById('current-problem');
            if (problemInput) problemInput.value = DEMO_DATA.currentProblem;
            
            const actionInput = document.getElementById('desired-action');
            if (actionInput) actionInput.value = DEMO_DATA.desiredAction;
            
            pageText.value = DEMO_DATA.pageText;

            // Обновяваме оцветяването на границите на текстовите полета
            ['page-goal', 'target-audience', 'current-problem', 'desired-action'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.borderColor = '#10b981'; // зелена валидна граница
            });

            // Обновяваме броячите и валидацията на формата
            updateCounter(businessDesc, businessCounter, businessError, 30, 500);
            updateCounter(pageText, textCounter, textError, 100, 10000);
            validateForm();

            // Автоматично запазване на новите данни като чернова
            saveDraft();
        });
    }

    // Динамични съобщения при зареждане (Task 09)
    const loadingText = document.getElementById('loading-text');
    let loadingInterval;
    const loadingMessages = [
        "Сканиране на съдържанието...",
        "Анализиране на целевата аудитория...",
        "Оценяване на Value Proposition...",
        "Проверка на визуалната йерархия...",
        "Търсене на точки на триене...",
        "Сравняване с CRO добрите практики...",
        "Форматиране на препоръките..."
    ];

    function startLoadingAnimation() {
        loadingIndicator.style.display = 'flex';
        let index = 0;
        loadingText.innerText = loadingMessages[0];
        loadingText.classList.remove('fade-out');
        
        loadingInterval = setInterval(() => {
            loadingText.classList.add('fade-out');
            setTimeout(() => {
                index++;
                if (index >= loadingMessages.length) {
                    index = loadingMessages.length - 1; // Задържаме последното съобщение
                } else {
                    loadingText.innerText = loadingMessages[index];
                }
                loadingText.classList.remove('fade-out');
            }, 500); // Изчакваме fade-out анимацията
        }, 3500); // Смяна на всеки 3.5 секунди
    }

    function stopLoadingAnimation() {
        clearInterval(loadingInterval);
        loadingIndicator.style.display = 'none';
        loadingText.classList.remove('fade-out');
    }

    // Автоматично запазване на чернова (Task 13)
    function saveDraft() {
        const draft = {
            url: document.getElementById('page-url').value,
            businessDesc: businessDesc.value,
            pageGoal: document.getElementById('page-goal').value,
            targetAudience: document.getElementById('target-audience').value,
            currentProblem: document.getElementById('current-problem').value,
            desiredAction: document.getElementById('desired-action').value,
            pageText: pageText.value
        };
        localStorage.setItem('cro_analyzer_draft', JSON.stringify(draft));
    }

    function loadDraft() {
        const draftStr = localStorage.getItem('cro_analyzer_draft');
        if (draftStr) {
            try {
                const draft = JSON.parse(draftStr);
                if (draft) {
                    const urlInput = document.getElementById('page-url');
                    if (urlInput) urlInput.value = draft.url || '';
                    businessDesc.value = draft.businessDesc || '';
                    const goalInput = document.getElementById('page-goal');
                    if (goalInput) goalInput.value = draft.pageGoal || '';
                    const audienceInput = document.getElementById('target-audience');
                    if (audienceInput) audienceInput.value = draft.targetAudience || '';
                    const problemInput = document.getElementById('current-problem');
                    if (problemInput) problemInput.value = draft.currentProblem || '';
                    const actionInput = document.getElementById('desired-action');
                    if (actionInput) actionInput.value = draft.desiredAction || '';
                    pageText.value = draft.pageText || '';

                    // Обновяваме броячите и оцветяването на границите
                    updateCounter(businessDesc, businessCounter, businessError, 30, 500);
                    updateCounter(pageText, textCounter, textError, 100, 10000);

                    ['page-goal', 'target-audience', 'current-problem', 'desired-action'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.style.borderColor = el.value.trim() !== '' ? '#10b981' : '#d1d5db';
                    });

                    validateForm();
                }
            } catch (e) {
                console.error("Грешка при зареждане на черновата:", e);
            }
        }
    }

    function clearDraft() {
        localStorage.removeItem('cro_analyzer_draft');
    }

    // Закачане на слушатели за автоматично запазване
    ['page-url', 'business-desc', 'page-goal', 'target-audience', 'current-problem', 'desired-action', 'page-text'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveDraft);
        }
    });

    // Зареждане на API ключа
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        const savedApiKey = localStorage.getItem('cro_api_key');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }
        apiKeyInput.addEventListener('input', () => {
            localStorage.setItem('cro_api_key', apiKeyInput.value);
        });
    }

    // Зареждане на историята и черновата при първоначално отваряне
    loadHistory();
    loadDraft();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const apiKey = document.getElementById('api-key').value;
        if (!apiKey) {
            alert('Моля, въведете OpenAI API Key.');
            return;
        }

        const formData = {
            url: document.getElementById('page-url').value,
            businessDesc: document.getElementById('business-desc').value,
            pageGoal: document.getElementById('page-goal').value,
            targetAudience: document.getElementById('target-audience').value,
            currentProblem: document.getElementById('current-problem').value,
            desiredAction: document.getElementById('desired-action').value,
            pageText: document.getElementById('page-text').value
        };

        // Запазваме състоянието за повторно генериране
        activeAnalysisData = formData;

        // Скриваме формата и показваме резултатите/зареждането
        showResultsView();
        resultsContainer.style.display = 'none';
        if (regenerateBtn) regenerateBtn.disabled = true;
        startLoadingAnimation();

        // Премахване на стари съобщения за грешка
        const oldError = document.getElementById('api-error');
        if (oldError) oldError.remove();

        try {
            const aiResponse = await callOpenAI(apiKey, formData);
            parseAndDisplayResults(aiResponse);
            
            // Запазване в Local Storage
            saveToHistory(formData, aiResponse);
            
            // Изчистване на черновата при успешна генерация
            clearDraft();
            
            stopLoadingAnimation();
            resultsContainer.style.display = 'block';
        } catch (error) {
            console.error(error);
            stopLoadingAnimation();
            resultsContainer.style.display = 'none';
            
            const errorDiv = document.createElement('div');
            errorDiv.id = 'api-error';
            errorDiv.style.color = '#b91c1c';
            errorDiv.style.backgroundColor = '#fee2e2';
            errorDiv.style.padding = '1rem';
            errorDiv.style.borderRadius = '6px';
            errorDiv.style.marginBottom = '1rem';
            errorDiv.innerHTML = `<strong>Възникна грешка при връзката с AI:</strong> ${error.message}`;
            resultsSection.insertBefore(errorDiv, resultsContainer);
        } finally {
            if (regenerateBtn) regenerateBtn.disabled = false;
        }
    });

    async function callOpenAI(apiKey, data) {
        const systemPrompt = `
You are a conversion rate optimization expert. Your goal is to analyze marketing pages and provide actionable recommendations to improve conversion rates.
Use the following principles:
- Focus on Value Proposition Clarity
- Check Headline Effectiveness
- Analyze CTA Placement and Copy
- Check Visual Hierarchy and Trust Signals
- Address Friction Points

IMPORTANT OUTPUT FORMAT:
You MUST return your analysis strictly as a valid JSON object. Do not add any text or markdown block outside the JSON object.
The JSON object must have exactly these keys:
- "summary": containing the markdown for "Обобщение на страницата"
- "problems": containing the markdown for "Основни CRO проблеми"
- "recommendations": containing the markdown for "Препоръки за подобрение"
- "structure": containing the markdown for "Предложена структура на страницата"
- "priorities": containing the markdown for "Приоритети"
- "next_steps": containing the markdown for "Next steps"

All values should be formatted as Markdown (e.g. using bullet points, bold text).
`;

        const userPrompt = `
Please analyze the following page context:
- URL: ${data.url || 'N/A'}
- Business Description: ${data.businessDesc}
- Page Goal: ${data.pageGoal}
- Target Audience: ${data.targetAudience}
- Current Problem: ${data.currentProblem}
- Desired Action: ${data.desiredAction}

Page Text/Content:
${data.pageText}
`;

        // Ако сме заредени от локалния сървър (или друг уеб сървър), пробваме през проксито
        if (window.location.protocol.startsWith('http')) {
            let useFallback = false;
            let errorToThrow = null;
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        apiKey: apiKey,
                        systemPrompt: systemPrompt,
                        userPrompt: userPrompt
                    })
                });

                if (response.ok) {
                    const json = await response.json();
                    return json.choices[0].message.content;
                } else {
                    if (response.status === 404) {
                        useFallback = true;
                    } else {
                        const errorData = await response.json();
                        errorToThrow = new Error(errorData.error?.message || 'Неизвестна грешка от сървъра');
                    }
                }
            } catch (err) {
                console.warn("Прокси заявката пропадна, опит за директна връзка...", err);
                useFallback = true;
            }

            if (errorToThrow) {
                throw errorToThrow;
            }
            if (!useFallback) {
                throw new Error('Неуспешно проксиране на заявката.');
            }
        }

        // Директна връзка (fallback за статично зареждане от файл)
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Неизвестна грешка от сървъра');
        }

        const json = await response.json();
        return json.choices[0].message.content;
    }

    function applyPriorityBadges(text) {
        if (!text) return text;
        // Regex за намиране на приоритети, използвайки граници, които поддържат кирилица
        return text
            .replace(/(^|[\s*.,:;!?>-])(висок|high)(?=$|[\s*.,:;!?<-])/gi, '$1<span class="badge-high">$2</span>')
            .replace(/(^|[\s*.,:;!?>-])(среден|medium)(?=$|[\s*.,:;!?<-])/gi, '$1<span class="badge-medium">$2</span>')
            .replace(/(^|[\s*.,:;!?>-])(нисък|low)(?=$|[\s*.,:;!?<-])/gi, '$1<span class="badge-low">$2</span>');
    }

    function parseAndDisplayResults(responseStr) {
        let data;
        try {
            data = typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr;
        } catch (error) {
            console.error('JSON Parse Error:', error);
            throw new Error('Възникна грешка при форматирането на анализа от AI (невалиден JSON). Моля, опитайте отново.');
        }

        document.getElementById('res-summary').innerHTML = marked.parse(data.summary || '<p><em>Няма данни</em></p>');
        document.getElementById('res-problems').innerHTML = marked.parse(data.problems || '<p><em>Няма данни</em></p>');
        document.getElementById('res-recommendations').innerHTML = marked.parse(applyPriorityBadges(data.recommendations) || '<p><em>Няма данни</em></p>');
        document.getElementById('res-structure').innerHTML = marked.parse(data.structure || '<p><em>Няма данни</em></p>');
        document.getElementById('res-priorities').innerHTML = marked.parse(applyPriorityBadges(data.priorities) || '<p><em>Няма данни</em></p>');
        document.getElementById('res-nextsteps').innerHTML = marked.parse(data.next_steps || '<p><em>Няма данни</em></p>');
    }

    // Функции за управление на историята (Task 03)
    function saveToHistory(formData, aiResponse) {
        let history = JSON.parse(localStorage.getItem('cro_history') || '[]');
        
        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            url: formData.url || 'Анализ без URL',
            businessDesc: formData.businessDesc,
            formData: formData,
            response: aiResponse
        };

        history.unshift(newEntry); // Добавяне най-отгоре
        if (history.length > 10) history = history.slice(0, 10); // Пазим само последните 10
        
        localStorage.setItem('cro_history', JSON.stringify(history));
        currentAnalysisId = newEntry.id;
        renderHistoryList(history);
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('cro_history') || '[]');
        renderHistoryList(history);
    }

    function renderHistoryList(history) {
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-history">Нямате предишни анализи</p>';
            if (btnClearHistory) btnClearHistory.style.display = 'none';
            return;
        }

        if (btnClearHistory) btnClearHistory.style.display = 'block';
        historyList.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            const dateStr = new Date(item.date).toLocaleDateString('bg-BG', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            // Заглавието ще бъде URL-ът или част от описанието, ако няма URL
            const desc = item.businessDesc ? item.businessDesc : 'Стар анализ';
            const shortTitle = item.url !== 'Анализ без URL' ? item.url : desc.substring(0, 30) + '...';

            div.innerHTML = `
                <div class="history-item-header">
                    <div class="history-date">${dateStr}</div>
                    <button class="delete-btn" title="Изтрий">&times;</button>
                </div>
                <div class="history-title" title="${item.url !== 'Анализ без URL' ? item.url : desc}">${shortTitle}</div>
            `;

            // Изтриване на конкретен запис
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Спира активирането на div-a отдолу
                deleteHistoryItem(item.id);
            });

            div.addEventListener('click', () => {
                try {
                    currentAnalysisId = item.id;
                    parseAndDisplayResults(item.response);
                    
                    // Запазваме активните данни за повторно генериране
                    if (item.formData) {
                        activeAnalysisData = item.formData;
                    } else {
                        // Fallback за записи, генерирани преди Task 11
                        activeAnalysisData = {
                            url: item.url === 'Анализ без URL' ? '' : item.url,
                            businessDesc: item.businessDesc || '',
                            pageGoal: '',
                            targetAudience: '',
                            currentProblem: '',
                            desiredAction: '',
                            pageText: ''
                        };
                    }

                    showResultsView();
                    resultsContainer.style.display = 'block';
                    loadingIndicator.style.display = 'none';
                } catch (e) {
                    alert('Неуспешно разчитане на този запис от историята. Може би е запазен в стар (Markdown) формат.');
                }
            });

            historyList.appendChild(div);
        });
    }

    function deleteHistoryItem(id) {
        let history = JSON.parse(localStorage.getItem('cro_history') || '[]');
        history = history.filter(item => item.id !== id);
        localStorage.setItem('cro_history', JSON.stringify(history));
        
        if (currentAnalysisId === id) {
            resetMainView();
        }
        
        renderHistoryList(history);
    }

    function resetMainView() {
        currentAnalysisId = null;
        activeAnalysisData = null;
        resultsSection.style.display = 'none';
        resultsContainer.style.display = 'none';
        loadingIndicator.style.display = 'none';
        showInputView();
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm('Сигурни ли сте, че искате да изтриете цялата история? Това действие е необратимо.')) {
                localStorage.removeItem('cro_history');
                resetMainView();
                renderHistoryList([]);
            }
        });
    }

    copyBtn.addEventListener('click', () => {
        const textToCopy = `
1. Обобщение на страницата
${document.getElementById('res-summary').innerText}

2. Основни CRO проблеми
${document.getElementById('res-problems').innerText}

3. Препоръки за подобрение
${document.getElementById('res-recommendations').innerText}

4. Предложена структура на страницата
${document.getElementById('res-structure').innerText}

5. Приоритети
${document.getElementById('res-priorities').innerText}

6. Next steps
${document.getElementById('res-nextsteps').innerText}
        `.trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Копирано!';
            copyBtn.style.backgroundColor = '#059669'; // по-тъмно зелено
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.backgroundColor = ''; // връщане към първоначалния цвят
            }, 2000);
        }).catch(err => {
            console.error('Неуспешно копиране: ', err);
            alert('Грешка при копиране на текста.');
        });
    });

    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Индивидуални бутони за копиране (Task 08)
    document.querySelectorAll('.section-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;

            const text = targetElement.innerText.trim();
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '✅';
                btn.classList.add('success');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('success');
                }, 2000);
            }).catch(err => {
                console.error('Error copying section:', err);
            });
        });
    });

    // Повторно генериране на анализ (Task 11)
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', async () => {
            if (!activeAnalysisData) {
                alert('Няма данни за повторно генериране.');
                return;
            }

            const apiKey = document.getElementById('api-key').value;
            if (!apiKey) {
                alert('Моля, въведете OpenAI API Key.');
                return;
            }

            // Скриваме предишни резултати и показваме зареждане
            resultsContainer.style.display = 'none';
            regenerateBtn.disabled = true;
            btnGenerate.disabled = true;
            startLoadingAnimation();
            resultsSection.scrollIntoView({ behavior: 'smooth' });

            // Премахване на стари съобщения за грешка
            const oldError = document.getElementById('api-error');
            if (oldError) oldError.remove();

            try {
                const aiResponse = await callOpenAI(apiKey, activeAnalysisData);
                parseAndDisplayResults(aiResponse);
                
                // Запазване в Local Storage като нов запис
                saveToHistory(activeAnalysisData, aiResponse);
                
                stopLoadingAnimation();
                resultsContainer.style.display = 'block';
            } catch (error) {
                console.error(error);
                stopLoadingAnimation();
                resultsContainer.style.display = 'none';
                
                const errorDiv = document.createElement('div');
                errorDiv.id = 'api-error';
                errorDiv.style.color = '#b91c1c';
                errorDiv.style.backgroundColor = '#fee2e2';
                errorDiv.style.padding = '1rem';
                errorDiv.style.borderRadius = '6px';
                errorDiv.style.marginBottom = '1rem';
                errorDiv.innerHTML = `<strong>Възникна грешка при връзката с AI:</strong> ${error.message}`;
                resultsSection.insertBefore(errorDiv, resultsContainer);
            } finally {
                regenerateBtn.disabled = false;
                validateForm();
            }
        });
    }
});
