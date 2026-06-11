const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('project/index.html', 'utf8');
const script = fs.readFileSync('project/app.js', 'utf8');

const dom = new JSDOM(html, { url: "http://localhost", runScripts: "dangerously" });
try {
    dom.window.eval(script);
    console.log("Script executed successfully without throwing top-level errors.");
    
    // Check if form submit listener is attached
    const form = dom.window.document.getElementById('cro-form');
    console.log("Form exists:", !!form);
} catch (e) {
    console.error("Error evaluating script:", e);
}
