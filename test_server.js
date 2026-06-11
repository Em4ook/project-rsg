const http = require('http');
const fs = require('fs');
const path = require('path');
const server = http.createServer((req, res) => {
    // Разрешаване на CORS заявки за локалния сървър
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log_error') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            console.log('CLIENT ERROR:', JSON.parse(body));
            res.end('ok');
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/analyze') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { apiKey, systemPrompt, userPrompt } = JSON.parse(body);
                
                if (!apiKey) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: { message: "Липсва OpenAI API Key." } }));
                    return;
                }

                const postData = JSON.stringify({
                    model: 'gpt-4o-mini',
                    response_format: { type: "json_object" },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                });

                const https = require('https');
                const options = {
                    hostname: 'api.openai.com',
                    port: 443,
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const apiReq = https.request(options, (apiRes) => {
                    let resBody = '';
                    apiRes.on('data', d => resBody += d);
                    apiRes.on('end', () => {
                        res.statusCode = apiRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(resBody);
                    });
                });

                apiReq.on('error', (e) => {
                    console.error("OpenAI proxy request error:", e);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: { message: "Грешка при връзка с OpenAI: " + e.message } }));
                });

                apiReq.write(postData);
                apiReq.end();

            } catch (err) {
                console.error("Proxy endpoint error:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: { message: "Грешка в прокси сървъра: " + err.message } }));
            }
        });
        return;
    }
    
    let filePath = path.join(__dirname, 'project', req.url === '/' ? 'index.html' : req.url);
    if (fs.existsSync(filePath)) {
        res.end(fs.readFileSync(filePath));
    } else {
        res.statusCode = 404;
        res.end();
    }
});
server.listen(8081, () => {
    console.log("Test server running on 8081");
    // run headless chrome via native node if possible, or puppeteer
});
