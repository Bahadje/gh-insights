const toggle = document.getElementById("enabledToggle");
const tokenInput = document.getElementById("ghTokenInput");
const tokenSaveBtn = document.getElementById("ghTokenSave");
const tokenStatus = document.getElementById("ghTokenStatus");

chrome.storage.sync.get({ ghip_enabled: true, gh_token: "" }, (res) => {
  toggle.checked = res.ghip_enabled;
  tokenInput.value = res.gh_token;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ ghip_enabled: toggle.checked });
});

tokenSaveBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();
  chrome.storage.sync.set({ gh_token: token }, () => {
    tokenStatus.textContent = "تم الحفظ بنجاح!";
    tokenStatus.style.color = "#34d399";
    setTimeout(() => { tokenStatus.textContent = ""; }, 2000);
  });
});
