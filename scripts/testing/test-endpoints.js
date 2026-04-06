const http = require("http");
function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(d) }),
        );
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}
function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: d.substring(0, 800) }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}
(async () => {
  const login = await post("http://localhost:3001/api/auth/login", {
    email: "test-vitrine@demo.com",
    password: "Test1234!",
  });
  const token = login.body.accessToken;
  console.log("Token OK:", !!token);

  const endpoints = [
    "/api/mandates",
    "/api/mandates/stats",
    "/api/prospects",
    "/api/properties",
  ];
  for (const ep of endpoints) {
    const r = await get("http://localhost:3001" + ep, token);
    console.log(
      `${ep}: ${r.status} ${r.status >= 400 ? r.body.substring(0, 200) : "(ok, " + r.body.length + " chars)"}`,
    );
  }
})();
