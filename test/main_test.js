import { describe, it, expect, makeDirname } from "https://taisukef.github.io/denolib/nodelikeassert.mjs"
const __dirname = makeDirname(import.meta.url)

import enrich from "../IMIEnrichmentContact.mjs";

const spec = __dirname + "/../spec";

const readdirSync = dir => {
  const i = Deno.readDirSync(dir);
  const files = [];
  for (const f of i) { files.push(f); }
  return files.map(f => f.name);
};

describe('imi-enrichment-contact', function() {

  describe("spec", function() {
    readdirSync(spec).filter(file => file.match(/json$/)).forEach(file => {
      describe(file, function() {
        const json = JSON.parse(Deno.readTextFileSync(`${spec}/${file}`))
        json.forEach(a => {
          it(a.name, function() {
            expect(enrich(a.input)).deep.equal(a.output);
          });
        });
      });
    });
  });
});
