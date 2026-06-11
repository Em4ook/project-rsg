const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('project/index.html', 'utf8');
const script = fs.readFileSync('project/app.js', 'utf8');

const dom = new JSDOM(html, { url: "http://localhost", runScripts: "dangerously" });
try {
    dom.window.eval(script);
    
    const doc = dom.window.document;
    
    // Simulate user typing in pageText
    const pageText = doc.getElementById('page-text');
    const textCounter = doc.getElementById('page-text-counter');
    
    console.log("Initial counter:", textCounter.innerText);
    
    pageText.value = "A".repeat(100);
    const event = new dom.window.Event('input');
    pageText.dispatchEvent(event);
    
    console.log("Counter after 100 chars:", textCounter.innerText);
    console.log("Is invalid?", textCounter.classList.contains('invalid'));
    console.log("Is valid?", textCounter.classList.contains('valid'));
    
    // Fill other fields to see if button enables
    doc.getElementById('business-desc').value = "A".repeat(30);
    doc.getElementById('business-desc').dispatchEvent(new dom.window.Event('input'));
    
    doc.getElementById('page-goal').value = "goal";
    doc.getElementById('page-goal').dispatchEvent(new dom.window.Event('input'));
    
    doc.getElementById('target-audience').value = "audience";
    doc.getElementById('target-audience').dispatchEvent(new dom.window.Event('input'));
    
    doc.getElementById('current-problem').value = "problem";
    doc.getElementById('current-problem').dispatchEvent(new dom.window.Event('input'));
    
    doc.getElementById('desired-action').value = "action";
    doc.getElementById('desired-action').dispatchEvent(new dom.window.Event('input'));
    
    const btn = doc.getElementById('generate-btn');
    console.log("Is generate btn disabled?", btn.disabled);
    
} catch (e) {
    console.error("Error evaluating script:", e);
}
