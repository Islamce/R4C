const path = require("node:path");
const { createRequire } = require("node:module");
const http = require("node:http");

const webDir = path.join(__dirname, "apps", "web");
const webRequire = createRequire(path.join(webDir, "package.json"));
const next = webRequire("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, dir: webDir, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));
  server.listen(port, hostname, () => {
    console.log(`R4C web server listening on http://${hostname}:${port}`);
  });
});
