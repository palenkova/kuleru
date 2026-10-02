(() => {
  "use strict";
  const modal = document.getElementById("buildModal");
  const passwordForm = document.getElementById("passwordForm"), buildForm = document.getElementById("downloadForm");
  const password = document.getElementById("downloadPassword"), note = document.getElementById("buildNote");
  const verifyButton = document.getElementById("passwordSubmit"), downloadButton = document.getElementById("buildSubmit"), backButton = document.getElementById("buildBack");
  let verifiedPassword = "", lastFocus, activeRequest = null;
  function message(text = "", error = false) { note.textContent = text; note.classList.toggle("is-error", error); }
  function step(second) {
    passwordForm.hidden = second; buildForm.hidden = !second;
    document.getElementById("buildTitle").textContent = second ? "Choose your build." : "Your journey starts here.";
    document.getElementById("buildSubtitle").textContent = second ? "One last stop before the gates." : "Enter your demo password to continue.";
    document.getElementById("downloadProgress").textContent = second ? "02 / CHOOSE YOUR BUILD" : "01 / DEMO ACCESS";
    message(); (second ? document.getElementById("downloadInviter") : password).focus();
  }
  function busy(value) {
    verifyButton.disabled = downloadButton.disabled = backButton.disabled = value;
    password.readOnly = value; modal.setAttribute("aria-busy", String(value));
    verifyButton.textContent = value ? "Checking…" : "Continue";
    downloadButton.textContent = value ? "Preparing download…" : "Download for Windows";
  }
  function close() {
    if (activeRequest) activeRequest.abort();
    activeRequest = null; verifiedPassword = "";
    passwordForm.reset(); buildForm.reset(); password.removeAttribute("aria-invalid");
    modal.hidden = true; modal.classList.remove("show"); document.body.style.overflow = "";
    busy(false); if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('[data-modal="build"]').forEach(button => button.addEventListener("click", () => {
    lastFocus = document.activeElement; modal.hidden = false; modal.classList.add("show");
    document.body.style.overflow = "hidden"; step(false);
  }));
  document.getElementById("buildClose").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  backButton.addEventListener("click", () => { verifiedPassword = ""; step(false); });
  password.addEventListener("input", () => { password.removeAttribute("aria-invalid"); message(); });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    if (event.key !== "Tab") return;
    const all = [...modal.querySelectorAll('button,input,a[href]')].filter(el => !el.disabled && el.offsetParent !== null);
    const first = all[0], last = all[all.length - 1];
    if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
    else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
  });
  async function request(payload, onSuccess) {
    if (activeRequest) return;
    const controller = new AbortController(); activeRequest = controller; busy(true); message();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const endpoint = new URL(modal.dataset.workerUrl);
      if (endpoint.protocol !== "index.html") throw Error();
      const response = await fetch(endpoint.href, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", signal: controller.signal, body: JSON.stringify(payload) });
      const result = await response.json();
      if (activeRequest !== controller || modal.hidden) return;
      if (!response.ok) {
        if (result.error === "wrong_pass") {
          verifiedPassword = ""; step(false); password.setAttribute("aria-invalid", "true");
          message("That password isn't right. Please try again.", true); password.select();
        } else {
          const errors = { forbidden: "Downloads are not configured for this website.", invalid_payload: "Please check your details and try again.", service_unavailable: "Downloads are temporarily unavailable. Please try again later." };
          message(errors[result.error] || "Unable to continue. Please try again.", true);
        }
        return;
      }
      onSuccess(result);
    } catch { if (activeRequest === controller && !modal.hidden) message("Could not reach the download service. Please try again.", true); }
    finally { clearTimeout(timer); if (activeRequest === controller) { activeRequest = null; busy(false); } }
  }
  passwordForm.addEventListener("submit", event => {
    event.preventDefault(); if (!passwordForm.reportValidity()) return;
    const value = password.value;
    request({ check: true, password: value }, result => {
      if (result.ok !== true) throw Error();
      verifiedPassword = value; password.value = ""; password.removeAttribute("aria-invalid"); step(true);
    });
  });
  buildForm.addEventListener("submit", event => {
    event.preventDefault(); if (!verifiedPassword) { step(false); return; }
    if (!buildForm.reportValidity()) return;
    const user = buildForm.elements.user.value.trim();
    if (!user) { message("Please enter your username.", true); buildForm.elements.user.focus(); return; }
    request({ password: verifiedPassword, inviter: buildForm.elements.inviter.value.trim(), user, version: buildForm.elements.version.value }, result => {
      const url = new URL(result.downloadUrl);
      if (url.protocol !== "https:" || url.username || url.password) throw Error();
      message("Your download is being prepared…"); window.location.assign(url.href);
    });
  });
})();
