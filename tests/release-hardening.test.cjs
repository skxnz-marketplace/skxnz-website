require("./bootstrap.cjs");
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");
const { serializeJsonLd } = require("@/lib/security/json-ld");
const { validateProductImage, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_MAX_LABEL, PRODUCT_IMAGE_UPLOAD_RETRY_MESSAGE } = require("@/lib/catalog/image-upload-contract");
const { uploadProductImage } = require("@/lib/catalog/upload-actions");
const { __setMockClient } = require("./mocks/supabase-server.cjs");
const { createSkxnzAssistantResponse, demoAssistantCatalog } = require("@/src/lib/skxnzAssistant");
const { mapCatalogProductToBuyerProduct } = require("@/lib/catalog/mappers");
const { isDemoCatalogueEnabled } = require("@/lib/catalog/demo-fallback");
const publicTurnstile = require("@/lib/security/turnstile-public");
const { verifyTurnstileToken } = require("@/lib/security/turnstile");
const read = file => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const envNames = ["NODE_ENV", "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", "CLOUDFLARE_TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE"];
let savedEnv;
beforeEach(() => {
  savedEnv = Object.fromEntries(envNames.map(key => [key, process.env[key]]));
  process.env.NODE_ENV = "test";
  delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  __setMockClient(null);
});
afterEach(() => {
  for (const key of envNames) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

const payloads = [
  "</script><script>window.__skxnz_probe=1</script>",
  "</ScRiPt><script src=//example.invalid/probe></script>",
  "<!--<script><script></script>",
  'Quotes " & < >, Unicode \u2028\u2029 and emoji 🧥',
];
for (const schema of ["Product", "Product BreadcrumbList", "Brand BreadcrumbList", "Category BreadcrumbList", "Organization", "WebSite"]) {
  test(`B01: ${schema} keeps values and cannot create a second script node`, () => {
    for (const payload of payloads) {
      const value = { "@context": "https://schema.org", "@type": schema.includes("BreadcrumbList") ? "BreadcrumbList" : schema,
        name: payload, description: payload, itemListElement: [{ name: payload, item: `https://skxnz.com/${payload}` }], [payload]: payload };
      const serialized = serializeJsonLd(value);
      assert.deepEqual(JSON.parse(serialized), value, "valid JSON and exact data round-trip");
      assert.equal(serialized.includes("<"), false);
      const html = renderToStaticMarkup(React.createElement("script", {type:"application/ld+json", dangerouslySetInnerHTML:{__html:serialized}}));
      assert.equal((html.match(/<script\b/gi) || []).length, 1);
      assert.equal((html.match(/<\/script\s*>/gi) || []).length, 1);
      assert.equal(html.includes("</script><script>window.__skxnz_probe=1"), false);
    }
  });
}
test("B01: test trigger breaks unsafe serializer and all six runtime sinks use the safe helper", () => {
  const unsafe = renderToStaticMarkup(React.createElement("script", {type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify({name:payloads[0]})}}));
  assert.equal((unsafe.match(/<script\b/gi) || []).length, 2, "positive control detects actual breakout");
  let count = 0;
  for (const dir of ["app", "components", "lib", "src"]) {
    for (const entry of walk(dir)) {
      const source = read(entry);
      const sinks = source.match(/type=["']application\/ld\+json["']/g) || [];
      if (!sinks.length) continue;
      count += sinks.length;
      assert.equal((source.match(/__html:\s*serializeJsonLd\(/g) || []).length, sinks.length, entry);
      assert.doesNotMatch(source, /__html:\s*JSON\.stringify\(/, entry);
    }
  }
  assert.equal(count, 6);
});
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (/\.tsx?$/.test(file)) yield file;
  }
}

const item = {...demoAssistantCatalog.products[0], id:"00000000-0000-4000-8000-000000000001",slug:"signal-black-hoodie",name:"Signal Black Hoodie",stock:5,price:3999,priceCents:399900,category:"Streetwear",subcategory:"Hoodies",sizes:["M"],colors:["Black"],brandName:"SIGNAL",shortDescription:"Black hoodie",tags:["hoodie"],collections:[]};
const recommendations = product => createSkxnzAssistantResponse("Show me a hoodie under 5000", {products: product ? [product] : [],brands:[{name:"SIGNAL",slug:"signal"}],categorySlugs:["streetwear"]}).recommendedProducts;
test("H01: real mapper's ACTIVE in-stock live item is recommended", () => {
  const mapped = mapCatalogProductToBuyerProduct({id:item.id,slug:item.slug,name:item.name,description:"Black hoodie",subtitle:"Hoodies",status:"ACTIVE",price_inr:3999,
    brand:{slug:"signal",name:"SIGNAL"},category:{slug:"streetwear",name:"Streetwear"},images:[],variants:[{id:"v1",size:"M",color:"Black",stock_quantity:5,is_active:true}],tags:["hoodie"]});
  assert.equal(mapped.status,"Active Catalog");
  assert.equal(mapped.dataSource,"live");
  assert.deepEqual(recommendations(mapped).map(p=>p.id),[item.id]);
});
test("H01: intentionally supported approved legacy fixtures still recommend", () => {
  assert.equal(recommendations({...item,status:"Approved Preview",dataSource:"demo"}).length,1);
});
for (const patch of [{status:"ARCHIVED"},{status:"INACTIVE"},{status:"Pending Review"},{status:"Approved Preview"},{stock:0},{stock:-1},{stock:NaN},{price:NaN},{price:0},{name:""},{id:""}]) {
  test(`H01: ineligible live item excluded (${Object.keys(patch)[0]}=${String(Object.values(patch)[0])})`, () => {
    assert.equal(recommendations({...item,status:"Active Catalog",dataSource:"live",...patch}).length,0);
  });
}
test("H01: production cannot enable demo fallback and empty live catalogue stays empty", () => {
  process.env.NODE_ENV="production";
  process.env.NEXT_PUBLIC_SKXNZ_DEMO_CATALOGUE="true";
  assert.equal(isDemoCatalogueEnabled(),false);
  assert.equal(recommendations(null).length,0);
  assert.match(read("app/api/ai-assistant/route.ts"),/isDemoCatalogueEnabled\(\)/);
});

test("H02: shared contract accepts exactly 768 KiB and rejects larger/invalid files", () => {
  assert.equal(PRODUCT_IMAGE_MAX_LABEL,"768 KiB");
  for (const type of ["image/jpeg","image/png","image/webp"]) assert.equal(validateProductImage({size:PRODUCT_IMAGE_MAX_BYTES,type}),null);
  assert.match(validateProductImage({size:PRODUCT_IMAGE_MAX_BYTES+1,type:"image/png"}),/768 KiB/);
  assert.match(validateProductImage({size:20,type:"text/html"}),/JPEG, PNG, or WebP/);
  assert.match(validateProductImage({size:0,type:"image/png"}),/Choose/);
});
test("H02: rejected action uploads do not contact auth, Storage or product data", async () => {
  for (const [size,type] of [[PRODUCT_IMAGE_MAX_BYTES+1,"image/png"],[10,"text/html"],[0,"image/png"]]) {
    const form=new FormData();form.set("productId",item.id);form.set("file",new File([new Uint8Array(size)],"image",{type}));
    const result=await uploadProductImage(form); // mock client is null: any attempted DB/auth call throws
    assert.equal(result.ok,false);assert.equal(result.code,"VALIDATION_FAILED");
  }
});
test("H02: normal bounded multipart upload leaves ample room below unchanged 1 MiB transport", async () => {
  const form=new FormData();form.set("productId",item.id);form.set("file",new File([new Uint8Array(PRODUCT_IMAGE_MAX_BYTES)],"product-image",{type:"image/png"}));
  const bytes=(await new Request("https://example.invalid",{method:"POST",body:form}).arrayBuffer()).byteLength;
  assert.ok(bytes<800*1024);assert.ok(bytes<1024*1024);
  assert.doesNotMatch(read("next.config.ts"),/bodySizeLimit/);
});

// Load just the component under test with mocked hooks/action transport. This
// exercises its actual handler; no browser, network or live storage is used.
function loadTsx(file, mocks) {
  const filename=path.resolve(file);const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;
  mod.require=request=>request in mocks?mocks[request]:require(request);
  mod._compile(ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
  return mod.exports;
}
function findElement(node, predicate) {
  if (!node || typeof node!=="object") return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found=findElement(child,predicate);if(found)return found;
  }
  return null;
}
test("H02: thrown upload transport error is recoverable and leaves gallery unchanged", async () => {
  const states=[];const transitions=[];let calls=0;
  const hooks={...React,useState:initial=>{const index=states.length;states.push(initial);return [initial,value=>states[index]=typeof value==="function"?value(states[index]):value];},useRef:()=>({current:null}),useTransition:()=>[false,fn=>transitions.push(fn())]};
  const {ProductGalleryManager}=loadTsx("components/catalog/product-gallery-manager.tsx",{
    react:hooks,"next/image":{default:()=>null},"@/components/ui/button":{Button:"button"},"@/components/ui/card":{Card:"div"},
    "@/lib/catalog/upload-actions":{uploadProductImage:async()=>{calls++;throw new Error("413 transport failure");}},
    "@/lib/catalog/image-upload-contract":require("@/lib/catalog/image-upload-contract"),
  });
  const tree=ProductGalleryManager({productId:item.id,initialImages:[]});
  const form=findElement(tree,node=>node.type==="form");
  const oversize=new FormData();oversize.set("file",new File([new Uint8Array(PRODUCT_IMAGE_MAX_BYTES+1)],"image",{type:"image/png"}));
  form.props.action(oversize);assert.equal(calls,0);assert.match(states[1],/768 KiB/);
  const valid=new FormData();valid.set("file",new File(["ok"],"image",{type:"image/png"}));
  form.props.action(valid);await Promise.all(transitions);
  assert.equal(calls,1);assert.deepEqual(states[0],[]);assert.equal(states[1],PRODUCT_IMAGE_UPLOAD_RETRY_MESSAGE);
});

test("H03: production page returns unavailable panel, never demo gate/studio", () => {
  process.env.NODE_ENV="production";
  const unavailable=()=>null;
  const imports={"next/link":{default:()=>null},"@/components/ui/button":{buttonVariants:()=>""},"@/components/ai/stylist-unavailable":{StylistUnavailable:unavailable},"@/components/ai/stylist-access-gate":{StylistAccessGate:()=>assert.fail("demo gate reached")},"@/components/ai/ai-phase-one-studio":{AiPhaseOneStudio:()=>assert.fail("studio reached")}};
  const page=loadTsx("app/ai/stylist/page.tsx",imports);
  assert.equal(page.default().type,unavailable);
  const panel=loadTsx("components/ai/stylist-unavailable.tsx",{"next/link":"a","@/components/ui/button":{buttonVariants:()=>""},"@/components/ui/card":{Card:"div"}});
  const html=renderToStaticMarkup(panel.StylistUnavailable());
  assert.match(html,/not enabled for this release/);assert.match(html,/href="\/shop"/);assert.doesNotMatch(html,/<button|<form|href="\/login"|Enter Guest Preview/);
});
test("H03: production API role-header rejection remains intact", () => {
  assert.match(read("src/lib/ai/safety.ts"),/NODE_ENV === "production"[\s\S]*?return null/);
});

test("H04: dummy fallback exists only in explicit development/test contexts", () => {
  for (const mode of ["development","test"]) {process.env.NODE_ENV=mode;assert.match(publicTurnstile.turnstileSiteKey(),/^1x0/);assert.equal(publicTurnstile.isTurnstileTestMode(),true);}
  delete process.env.NODE_ENV;assert.equal(publicTurnstile.turnstileSiteKey(),"");
  process.env.NODE_ENV="production";assert.equal(publicTurnstile.turnstileSiteKey(),"");assert.equal(publicTurnstile.isTurnstileTestMode(),false);
});
test("H04: real-looking public production key works without reading server secret", () => {
  process.env.NODE_ENV="production";process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY="0xREAL_PUBLIC_KEY";
  assert.equal(publicTurnstile.turnstileSiteKey(),"0xREAL_PUBLIC_KEY");assert.equal(publicTurnstile.isTurnstileTestMode(),false);
  assert.doesNotMatch(read("lib/security/turnstile-public.ts"),/SECRET|fetch\(/);
  const client=read("components/auth/access-form.tsx");
  assert.match(client,/@\/lib\/security\/turnstile-public/);assert.doesNotMatch(client,/SECRET|from ["']@\/lib\/security\/turnstile["']/);
  assert.match(read("lib/security/turnstile.ts"),/import "server-only"/);
});
test("H04: missing/dummy production public key blocks widget and submission clearly", () => {
  process.env.NODE_ENV="production";
  for(const key of ["","1x00000000000000000000AA","2x00000000000000000000AB","3x00000000000000000000FF"]) {
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=key;assert.equal(publicTurnstile.turnstileSiteKey(),"");assert.equal(publicTurnstile.isTurnstileTestMode(),false);
  }
  const source=read("components/auth/access-form.tsx");
  assert.match(source,/needsCaptcha && !siteKey/);assert.match(source,/disabled=\{loading \|\| \(needsCaptcha && !siteKey\)\}/);
  assert.match(source,/needsCaptcha && siteKey &&/);
});
test("H04: production missing/dummy server verification secret fails closed before network", async () => {
  process.env.NODE_ENV="production";process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY="0xREAL_PUBLIC_KEY";
  const original=global.fetch;global.fetch=()=>assert.fail("configuration failure must not call Siteverify");
  try {
    for (const key of ["","1x0000000000000000000000000000000AA","2x0000000000000000000000000000000AA"]) {
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY=key;
      assert.deepEqual(await verifyTurnstileToken("token"),{success:false,testMode:false,reason:"configuration-error"});
    }
  } finally {global.fetch=original;}
});
test("H04: CAPTCHA token remains forwarded once to Supabase auth", () => {
  assert.deepEqual(publicTurnstile.captchaOptions("token"),{captchaToken:"token"});
  assert.doesNotMatch(read("components/auth/access-form.tsx"),/verifyTurnstileToken\s*\(/);
});
