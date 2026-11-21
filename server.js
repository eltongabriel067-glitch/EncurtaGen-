const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "encurtagen_links.json");
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const validUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  if (req.method === "GET" && (urlPath === "/" || mime[path.extname(urlPath)])) {
    const file = urlPath === "/" ? "index.html" : urlPath.slice(1);
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": mime[path.extname(file)] });
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  if (req.method === "POST" && urlPath === "/api/shorten") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { url } = JSON.parse(body || "{}");
        if (!validUrl(url)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "URL inválida! Use http:// ou https://" }));
        }

        const db = readDB();
        let code = crypto.randomBytes(3).toString("hex");
        while (db[code]) code = crypto.randomBytes(3).toString("hex");

        db[code] = { url, clicks: 0 };
        writeDB(db);

        const proto = req.headers["x-forwarded-proto"] || "http";
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code, shortUrl: `${proto}://${req.headers.host}/${code}` }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Erro nos dados enviados." }));
      }
    });
    return;
  }

  const code = urlPath.slice(1);
  const db = readDB();
  if (req.method === "GET" && db[code]) {
    db[code].clicks += 1;
    writeDB(db);
    res.writeHead(302, { Location: db[code].url });
    return res.end();
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Link não encontrado no EncurtaGen.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`EncurtaGen rodando na porta ${PORT}`);
});

