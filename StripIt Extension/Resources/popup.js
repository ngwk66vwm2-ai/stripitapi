console.log("Strip It popup loaded");

document.getElementById("printBtn").addEventListener("click", () => {
  const btn = document.getElementById("printBtn");

  // Visual feedback while we send the message
  btn.disabled = true;
  btn.style.background = "#0E9C6E";
  btn.textContent = "✂️ Stripping…";

  // Fire the action immediately — don't wait for cosmetic animation
  browser.runtime.sendMessage({ action: "openPreview" });

  // Give the button a moment so the user sees the state change,
  // then close the popup
  setTimeout(() => window.close(), 600);
});
