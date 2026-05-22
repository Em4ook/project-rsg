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

        const isValid = busLength >= 30 && textLength >= 100 && isGoal && isAudience && isProblem && isAction;
        btnGenerate.disabled = !isValid;
    }

    function updateCounter(input, counterEl, errorEl, minLength) {
        const len = input.value.trim().length;
        counterEl.innerText = `${len} / ${minLength} мин.`;
        
        if (len >= minLength) {
            counterEl.classList.add('valid');
            counterEl.classList.remove('invalid');
            errorEl.innerText = '';
            input.style.borderColor = '#10b981';
        } else {
            counterEl.classList.remove('valid');
            counterEl.classList.add('invalid');
            input.style.borderColor = len > 0 ? '#ef4444' : '#d1d5db';
        }
        
        validateForm();
    }

    function handleBlur(input, errorEl, minLength) {
        const len = input.value.trim().length;
        if (len > 0 && len < minLength) {
            errorEl.innerText = `Въведете още поне ${minLength - len} символа.`;
        }
    }

    businessDesc.addEventListener('input', () => updateCounter(businessDesc, businessCounter, businessError, 30));
    pageText.addEventListener('input', () => updateCounter(pageText, textCounter, textError, 100));

    businessDesc.addEventListener('blur', () => handleBlur(businessDesc, businessError, 30));
    pageText.addEventListener('blur', () => handleBlur(pageText, textError, 100));

    // Проверка на останалите полета за активиране на бутона
    ['page-goal', 'target-audience', 'current-problem', 'desired-action'].forEach(id => {
        document.getElementById(id).addEventListener('input', validateForm);
    });

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

    // Зареждане на историята при първоначално отваряне
    loadHistory();

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

        // Скриваме предишни резултати и показваме зареждане
        resultsSection.style.display = 'block';
        resultsContainer.style.display = 'none';
        startLoadingAnimation();
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Премахване на стари съобщения за грешка
        const oldError = document.getElementById('api-error');
        if (oldError) oldError.remove();

        try {
            const aiResponse = await callOpenAI(apiKey, formData);
            parseAndDisplayResults(aiResponse);
            
            // Запазване в Local Storage
            saveToHistory(formData, aiResponse);
            
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${apiKey}\`
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
            const shortTitle = item.url !== 'Анализ без URL' ? item.url : item.businessDesc.substring(0, 30) + '...';

            div.innerHTML = \`
                <div class="history-item-header">
                    <div class="history-date">\${dateStr}</div>
                    <button class="delete-btn" title="Изтрий">&times;</button>
                </div>
                <div class="history-title" title="\${item.url !== 'Анализ без URL' ? item.url : item.businessDesc}">\${shortTitle}</div>
            \`;

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
                    resultsSection.style.display = 'block';
                    resultsContainer.style.display = 'block';
                    loadingIndicator.style.display = 'none';
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
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
        resultsSection.style.display = 'none';
        resultsContainer.style.display = 'none';
        loadingIndicator.style.display = 'none';
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
                alert('Неуспешно копиране на секцията.');
            });
        });
    });
});
