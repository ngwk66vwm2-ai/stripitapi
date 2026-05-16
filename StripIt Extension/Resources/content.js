 (function () {
   "use strict";

   browser.runtime.onMessage.addListener((message) => {
     if (message.action === "startPreview") {
       enterPrintModeDirectly();
     }
   });

   function enterPrintModeDirectly() {
     try {
       const pageTitle = document.title;
       const pageUrl = window.location.href;
       const host = window.location.hostname;

       if (host.includes("linkedin.com")) {
         showLoadingBanner();
         autoScrollAndExtract(pageTitle, pageUrl);
       } else {
         setTimeout(() => {
           const cleanContent = extractGenericArticle(pageTitle, pageUrl);
           showPrintOverlay(cleanContent, pageTitle, pageUrl);
         }, 1500);
       }
     } catch(e) {
       alert("Strip It error: " + e.message);
     }
   }

   function autoScrollAndExtract(pageTitle, pageUrl) {
     const banner = document.getElementById("strip-it-loading");
     if (banner) {
       banner.innerHTML = "⬇️ Scroll to bottom, then click here to Strip It!";
       banner.style.cursor = "pointer";
       banner.addEventListener("click", function() {
         banner.innerHTML = "✂️ Stripping the mess...";
         banner.style.cursor = "default";
         setTimeout(() => {
           const profileText = document.querySelector("main") ?
             document.querySelector("main").innerText : document.body.innerText;
           parseLinkedInWithAI(profileText, pageTitle, pageUrl);
         }, 500);
       }, { once: true });
     }
   }

   function showLoadingBanner() {
     const existing = document.getElementById("strip-it-loading");
     if (existing) existing.remove();
     const banner = document.createElement("div");
     banner.id = "strip-it-loading";
     banner.style.cssText = `
       position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
       background: #1a1a1a; padding: 28px 40px;
       display: flex; gap: 16px;
       align-items: center; justify-content: center;
       z-index: 2147483647;
       box-shadow: 0 8px 40px rgba(0,0,0,0.6); border-radius: 20px;
       white-space: nowrap; font-family: -apple-system, sans-serif;
       color: #10B981; font-size: 20px; font-weight: 700;
       cursor: pointer;
     `;
     banner.innerHTML = "✂️ Stripping the mess...";
     document.body.appendChild(banner);
   }

   async function parseLinkedInWithAI(profileText, pageTitle, pageUrl) {
     try {
       const response = await fetch("https://stripitapi.vercel.app/api/parse-linkedin", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ text: profileText.substring(0, 15000) })
       });

       const data = await response.json();

       const loading = document.getElementById("strip-it-loading");
       if (loading) loading.remove();

       if (data.error) throw new Error(data.error);

       const cleanContent = renderLinkedInProfile(data, pageUrl);
       enterPrintModeDocWrite(cleanContent, pageTitle, pageUrl);
     } catch(e) {
       const loading = document.getElementById("strip-it-loading");
       if (loading) loading.remove();
       alert("Strip It error: " + e.message);
     }
   }

   function renderLinkedInProfile(profile, pageUrl) {
     const html = [];
     html.push(`<div class="print-header">`);
     html.push(`<div class="print-name">${profile.name || ""}</div>`);
     if (profile.headline) html.push(`<div class="print-headline">${profile.headline}</div>`);
     if (profile.location) html.push(`<div class="print-location">${profile.location}</div>`);
     html.push(`<div class="print-url">${pageUrl}</div>`);
     html.push(`<div class="print-date">Printed ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>`);
     html.push(`</div>`);
     if (profile.about) {
       html.push(`<h2>About</h2><p>${profile.about}</p>`);
     }
     if (profile.experience && profile.experience.length > 0) {
       html.push(`<h2>Experience</h2>`);
       profile.experience.forEach(job => {
         html.push(`<div class="entry">`);
         html.push(`<div class="entry-title">${job.title || ""}</div>`);
         if (job.company) html.push(`<div class="entry-subtitle">${job.company}</div>`);
         if (job.dates || job.location) {
           const meta = [job.dates, job.location].filter(Boolean).join(" · ");
           html.push(`<div class="entry-meta">${meta}</div>`);
         }
         if (job.description) html.push(`<div class="entry-desc">${job.description}</div>`);
         html.push(`</div>`);
       });
     }
     if (profile.education && profile.education.length > 0) {
       html.push(`<h2>Education</h2>`);
       profile.education.forEach(edu => {
         html.push(`<div class="entry">`);
         html.push(`<div class="entry-title">${edu.school || ""}</div>`);
         if (edu.degree) html.push(`<div class="entry-subtitle">${edu.degree}</div>`);
         if (edu.dates) html.push(`<div class="entry-meta">${edu.dates}</div>`);
         if (edu.activities) html.push(`<div class="entry-desc">${edu.activities}</div>`);
         html.push(`</div>`);
       });
     }
     if (profile.skills && profile.skills.length > 0) {
       html.push(`<h2>Skills</h2><p>${profile.skills.join(" · ")}</p>`);
     }
     return html.join("\n");
   }

   function getOverlayStyles() {
     return `
       <style>
         #clean-print-overlay * { box-sizing: border-box; }
         #clean-print-toolbar {
           position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
           background: #1a1a1a; padding: 14px 28px; display: flex; gap: 16px;
           align-items: center; z-index: 2147483647;
           box-shadow: 0 4px 20px rgba(0,0,0,0.4); border-radius: 100px;
           white-space: nowrap;
         }
         #clean-print-toolbar .hint { color: #10B981; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 700; }
         #clean-print-toolbar .close-btn { background: rgba(255,255,255,0.12); color: white; border: none; border-radius: 100px; padding: 7px 18px; font-size: 13px; font-weight: 600; font-family: -apple-system, sans-serif; cursor: pointer; }
         #clean-print-content {
           max-width: 720px; margin: 0 auto; padding: 100px 48px 48px;
           font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.6; color: #000;
         }
         #clean-print-content h2 { font-family: -apple-system, sans-serif; font-size: 16pt; font-weight: 700; margin: 24px 0 8px; }
         #clean-print-content p { margin-bottom: 0.8em; }
         .print-header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; }
         .print-name { font-family: -apple-system, sans-serif; font-size: 20pt; font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
         .print-headline { font-family: -apple-system, sans-serif; font-size: 12pt; color: #333; margin-bottom: 2px; }
         .print-location { font-family: -apple-system, sans-serif; font-size: 10pt; color: #666; margin-bottom: 4px; }
         .print-url { font-family: -apple-system, sans-serif; font-size: 9pt; color: #666; }
         .print-date { font-family: -apple-system, sans-serif; font-size: 9pt; color: #666; margin-top: 2px; }
         @media print {
           body > *:not(#clean-print-overlay) { display: none !important; }
           #clean-print-overlay { position: static !important; overflow: visible !important; background: white !important; }
           #clean-print-toolbar { display: none !important; }
           #clean-print-content { padding: 24px !important; }
         }
       </style>
     `;
   }

   function showPrintOverlay(cleanContent, pageTitle, pageUrl) {
     const existing = document.getElementById("clean-print-overlay");
     if (existing) existing.remove();
     const overlay = document.createElement("div");
     overlay.id = "clean-print-overlay";
     overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 2147483646; overflow-y: auto;";
     overlay.innerHTML = `
       ${getOverlayStyles()}
       <div id="clean-print-toolbar">
         <div class="hint">✓ Ready — press ⌘P to print</div>
         <button class="close-btn" id="clean-close-btn">✕ Close</button>
       </div>
       <div id="clean-print-content">${cleanContent}</div>
     `;
     document.body.appendChild(overlay);
     document.getElementById("clean-close-btn").addEventListener("click", function() { overlay.remove(); });
   }

   function enterPrintModeDocWrite(cleanContent, pageTitle, pageUrl) {
     const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${pageTitle}</title><style>
   * { box-sizing: border-box; margin: 0; padding: 0; }
   body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; background: white; }
   #clean-print-banner { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); background: #1a1a1a; padding: 14px 28px; display: flex; gap: 16px; align-items: center; z-index: 99999; box-shadow: 0 4px 20px rgba(0,0,0,0.4); border-radius: 100px; white-space: nowrap; }
   #clean-print-banner .hint { color: #10B981; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 700; }
   #clean-print-banner .cancel { background: rgba(255,255,255,0.12); color: white; border-radius: 100px; padding: 7px 18px; font-size: 13px; font-weight: 600; font-family: -apple-system, sans-serif; text-decoration: none; }
   #clean-print-body { max-width: 720px; margin: 0 auto; padding: 100px 48px 48px; }
   h2 { font-family: -apple-system, sans-serif; font-size: 14pt; font-weight: 700; margin: 28px 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #000; }
   .entry { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
   .entry-title { font-family: -apple-system, sans-serif; font-weight: 700; font-size: 11pt; margin-bottom: 2px; }
   .entry-subtitle { font-family: -apple-system, sans-serif; font-size: 10pt; color: #333; margin-bottom: 2px; }
   .entry-meta { font-family: -apple-system, sans-serif; font-size: 9pt; color: #666; margin-bottom: 6px; }
   .entry-desc { font-size: 10pt; line-height: 1.5; }
   p { margin-bottom: 0.8em; font-size: 12pt; }
   .print-header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; }
   .print-name { font-family: -apple-system, sans-serif; font-size: 22pt; font-weight: 700; margin-bottom: 2px; line-height: 1.2; }
   .print-headline { font-family: -apple-system, sans-serif; font-size: 12pt; color: #333; margin-bottom: 2px; }
   .print-location { font-family: -apple-system, sans-serif; font-size: 10pt; color: #666; margin-bottom: 4px; }
   .print-url { font-family: -apple-system, sans-serif; font-size: 9pt; color: #666; }
   .print-date { font-family: -apple-system, sans-serif; font-size: 9pt; color: #666; margin-top: 2px; }
   img { display: none !important; } svg { display: none !important; }
   @media print { #clean-print-banner { display: none !important; } #clean-print-body { padding-top: 24px !important; } }
 </style></head><body>
 <div id="clean-print-banner"><div class="hint">✓ Ready — press ⌘P to print</div><a href="${pageUrl}" class="cancel">✕ Cancel</a></div>
 <div id="clean-print-body">${cleanContent}</div>
 </body></html>`;
     document.open(); document.write(printHTML); document.close();
   }

   function extractGenericArticle(pageTitle, pageUrl) {
     const html = [];
     html.push(`<div class="print-header"><div class="print-name">${pageTitle}</div><div class="print-url">${pageUrl}</div><div class="print-date">Printed ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div></div>`);
     const candidates = [
       document.querySelector("article"),
       document.querySelector(".mntl-sc-page"),
       document.querySelector(".RichTextStoryBody"),
       document.querySelector(".Article"),
       document.querySelector(".storytext"),
       document.querySelector(".story-body"),
       document.querySelector('[data-gu-name="body"]'),
       document.querySelector(".article__body"),
       document.querySelector("#main-content"),
       document.querySelector(".article-body"),
       document.querySelector(".article-content"),
       document.querySelector(".post-content"),
       document.querySelector(".entry-content"),
       document.querySelector(".content-body"),
       document.querySelector("#article-body"),
       document.querySelector('[role="main"]'),
       document.querySelector("main"),
       document.querySelector("#content"),
       document.querySelector("#main"),
     ];
     const el = candidates.find(c => c !== null);
     if (!el) { html.push(`<p>Could not extract article content.</p>`); return html.join("\n"); }
     const clone = el.cloneNode(true);
     const clutter = [
       "nav","header","footer","aside","figure",
       '[class*="nav"]','[class*="menu"]','[class*="sidebar"]','[class*="banner"]',
       '[class*="cookie"]','[class*="popup"]','[class*="modal"]','[class*="subscribe"]',
       '[class*="newsletter"]','[class*="social"]','[class*="share"]','[class*="related"]',
       '[class*="comment"]','[class*="footer"]','[class*="promo"]','[class*="recommended"]',
       '[class*="trending"]','[id*="nav"]','[id*="menu"]','[id*="sidebar"]',
       '[class*="ad-"]','[class*="-ad"]','[class*="advert"]','[class*="sponsor"]',
       '[class*="native-ad"]','[class*="native_ad"]','[id*="ad-"]','[data-ad]',
       '[class*="paywall"]','[class*="byline"]','[class*="author-bio"]',
       '.duet--ad-collection','.duet--newsletter','.duet--card','.c-native-ad',
       "script","style","iframe","video","button","form","svg"
     ];
     clutter.forEach(s => clone.querySelectorAll(s).forEach(e => e.remove()));
     const paragraphs = clone.querySelectorAll("p, h1, h2, h3, h4, blockquote");
     const seen = new Set();
     if (paragraphs.length > 0) {
       paragraphs.forEach(p => {
         const text = p.innerText.trim();
         if (text.length < 20) return;
         if (seen.has(text)) return;
         seen.add(text);
         const tag = p.tagName.toLowerCase();
         if (tag === "p") html.push(`<p>${text}</p>`);
         else if (tag.match(/h[1-4]/)) html.push(`<h2>${text}</h2>`);
         else if (tag === "blockquote") html.push(`<blockquote>${text}</blockquote>`);
       });
     } else { html.push(`<p>${clone.innerText.trim()}</p>`); }
     return html.join("\n");
   }

 })();
