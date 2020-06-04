import { serve } from "https://deno.land/std@0.54.0/http/server.ts";
import { makeDirname } from "https://taisukef.github.io/denolib/nodelikeassert.mjs"
const __dirname = makeDirname(import.meta.url)

import enrichment from "../IMIEnrichmentContact.mjs";

if (Deno.args.length < 1 || !Deno.args[0].match(/^[1-9][0-9]*$/)) {
  console.error("Usage: deno run --allow-net --allow-read server.mjs [port number]");
  Deno.exit(1);
}

const port = parseInt(Deno.args[0]);

const s = serve({ port });
console.log(`imi-enrichment-contact-server is running on port ${port}`);
for await (const req of s) {
  const writeRes = function (code, headermap, body) {
    const headers = new Headers();
    for (const name in headermap) {
      headers.set(name, headermap[name]);
    }
    req.respond({ status: code, headers, body });
  };
  if (req.method === "GET") {
    writeRes(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      Deno.readTextFileSync(__dirname + "/server.html")
    );
    continue;
  }
  if (req.method !== "POST") {
    writeRes(405, {
        "Content-Type": "text/plain",
        "Allow": "POST",
        "Access-Control-Allow-Origin": "*"
      },
      "405 Method Not Allowed, only POST method is supported"
    );
    continue;
  }

  const isJSON = req.headers.get("content-type") && req.headers.get("content-type").indexOf("json") !== -1;

  const len = req.headers.get("content-length");
  const buf = new Uint8Array(len);
  await req.r.read(buf);
  const data = new TextDecoder().decode(buf);

  let input = data;
  if (isJSON) {
    try {
      input = JSON.parse(data);
    } catch (e) {
      writeRes(400, {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*"
        },
        `400 Bad Request, exception occurred during parsing POST body as JSON\n\n${e.toString()}`
      );
      continue;
    }
  }
  try {
    const done = enrichment(input);
    writeRes(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      JSON.stringify(done, null, 2)
    );
  } catch (e) {
    writeRes(500, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      },
      `500 Internal Server Error\n\n${e.toString()}`
    );
  }
}
