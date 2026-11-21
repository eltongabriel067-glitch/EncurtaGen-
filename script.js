document.getElementById("btnShorten").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  const result = document.getElementById("result");
  result.textContent = "EncurtaGen gerando link...";

  const res = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  result.textContent = res.ok ? data.shortUrl : data.error;
});

