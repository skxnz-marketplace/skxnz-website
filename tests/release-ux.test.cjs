require('./bootstrap.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { selectedProductPrice, cartUnitPrice } = require('@/lib/data/selected-price');
const { normalizeStoredWishlist, restoreWishlistSelection } = require('@/lib/data/wishlist');
const { buildCheckoutReviewSnapshot } = require('@/lib/checkout/checkout-review');
const { emptyCheckoutDraft } = require('@/lib/checkout/checkout-draft');
const { products } = require('@/lib/data/products');
const read = file => fs.readFileSync(path.resolve(file), 'utf8');
const product = { ...products[0], id: 'a3333333-3333-4333-8333-333333333332', dataSource: 'live', price: 3999,
  salePrice: null, status: 'Active Catalog', sizes: ['M','L'], colors:['Black'], stock:8, variantCount:2,
  variants: [{id:'m',size:'M',color:'Black',priceInr:null,stock:5,isActive:true},
    {id:'l',size:'L',color:'Black',priceInr:4299,stock:3,isActive:true}] };
function load(file, mocks={}) {
  const filename=path.resolve(file), mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;
  mod.require=request=>{
    if(request in mocks)return mocks[request];
    if(request.startsWith('@/components/') || request==='@/lib/cn') {
      const local=request.slice(2);
      return load(fs.existsSync(`${local}.tsx`)?`${local}.tsx`:`${local}.ts`,mocks);
    }
    return require(request);
  };
  mod._compile(ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
  return mod.exports;
}
function find(node,predicate) {
  if (!node || typeof node!=='object') return null;
  if(predicate(node)) return node;
  for(const child of React.Children.toArray(node.props?.children)){const match=find(child,predicate);if(match)return match;}
  return null;
}
function hooks(initial=[]) {
  const state=[...initial];let index=0;
  return {state,reset:()=>{index=0;},react:{...React,useMemo:fn=>fn(),useEffect:()=>{},
    useState:value=>{const i=index++;if(!(i in state))state[i]=typeof value==='function'?value():value;
      return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];}}};
}
const originalWindow=global.window;
afterEach(()=>{if(originalWindow===undefined)delete global.window;else global.window=originalWindow;});
function provider(fresh=product, initial=[]) {
  global.window={localStorage:{setItem:()=>{}}};
  const h=hooks(initial);
  const {MarketplaceProvider}=load('components/marketplace/marketplace-provider.tsx',{
    react:h.react,'@/lib/catalog/resolve-saved-product':{resolveSavedProduct:async()=>fresh instanceof Error ? Promise.reject(fresh) : {ok:true,product:fresh}},
  });
  return {...h,render(){h.reset();return MarketplaceProvider({children:null}).props.value;}};
}
for(const [label,id,expected] of [['M fallback','m',3999],['L override','l',4299],['no selection',null,3999]]) {
  test(`Price: ${label}`,()=>assert.equal(selectedProductPrice(product,id),expected));
}
test('Price: M → L → M changes deterministically',()=>assert.deepEqual(['m','l','m'].map(id=>selectedProductPrice(product,id)),[3999,4299,3999]));
test('Price: undefined override falls back, zero override is not lost',()=>{
  assert.equal(selectedProductPrice({...product,variants:[{...product.variants[1],priceInr:undefined}]},'l'),3999);
  assert.equal(selectedProductPrice({...product,variants:[{...product.variants[1],priceInr:0}]},'l'),0);
});
test('Price: stale snapshot amount cannot override known selected variant; quantity two matches checkout review',()=>{
  const line={product,productVariantId:'l',quantity:2,size:'L',color:'Black',unitPriceCents:399900};
  assert.equal(cartUnitPrice(line),4299);
  const review=buildCheckoutReviewSnapshot([line],emptyCheckoutDraft);
  assert.equal(review.lineItems[0].unitPriceCents,429900);assert.equal(review.subtotalCents,859800);
});
test('Price: actual PDP selection and add handler use L identity and display',()=>{
  const h=hooks(['L','Black',2,null]);let sent;
  const {ProductPurchasePanel}=load('components/buyer/product-purchase-panel.tsx',{react:h.react,
    '@/components/marketplace/marketplace-provider':{useMarketplace:()=>({addToCart:x=>(sent=x,{ok:true,message:'ok'}),isInWishlist:()=>false,toggleWishlist:()=>{}})}});
  const tree=ProductPurchasePanel({product});
  const price=find(tree,n=>n.type==='p' && n.props.className?.startsWith('product-price'));
  assert.match(renderToStaticMarkup(price),/4,299/);
  find(tree,n=>n.props.onClick?.name==='handleAddToCart').props.onClick();
  assert.equal(sent.variantId,'l');assert.equal(sent.quantity,2);
});
test('Cart: real provider stores selected price and refreshes stale merged line',()=>{
  const h=provider();let api=h.render();assert.equal(api.addToCart({productId:product.id,product,size:'L',color:'Black',variantId:'l',quantity:1}).ok,true);
  api=h.render();assert.equal(api.cartItems[0].unitPriceCents,429900);
  const newer={...product,variants:product.variants.map(v=>v.id==='l'?{...v,priceInr:4499}:v)};
  api.addToCart({productId:product.id,product:newer,size:'L',color:'Black',variantId:'l',quantity:1});
  const line=h.render().cartItems[0];assert.equal(line.quantity,2);assert.equal(line.unitPriceCents,449900);assert.equal(cartUnitPrice(line),4499);
});
for(const id of ['m','l']) test(`Wishlist: actual PDP save ${id} survives storage and provider move`,async()=>{
  const h=provider();let saved;
  const panelHooks=hooks([id==='l'?'L':'M','Black',1,null]);
  const {ProductPurchasePanel}=load('components/buyer/product-purchase-panel.tsx',{react:panelHooks.react,
    '@/components/marketplace/marketplace-provider':{useMarketplace:()=>({...h.render(),toggleWishlist:(...args)=>{saved=args;h.render().toggleWishlist(...args);}})}});
  const tree=ProductPurchasePanel({product});
  find(tree,n=>n.type==='button' && n.props.children==='Save').props.onClick();
  assert.equal(saved[2].productVariantId,id);
  const entries=normalizeStoredWishlist(JSON.parse(JSON.stringify(h.render().wishlistEntries)));
  assert.equal(entries[0].productVariantId,id);assert.equal(restoreWishlistSelection(entries[0],product).variantId,id);
  assert.equal((await h.render().moveWishlistItemToCart(product.id)).ok,true);
  const line=h.render().cartItems[0];assert.equal(line.productVariantId,id);assert.equal(line.size,id.toUpperCase());
  assert.equal(line.unitPriceCents,id==='l'?429900:399900);assert.equal(h.render().wishlistEntries.length,0);
});
test('Wishlist: existing one-entry-per-product model replaces selection rather than merging variants',()=>{
  const h=provider();h.render().addToWishlist(product.id,product,{productVariantId:'m',selectedSize:'M',selectedColor:'Black'});
  h.render().addToWishlist(product.id,product,{productVariantId:'l',selectedSize:'L',selectedColor:'Black'});
  assert.equal(h.render().wishlistEntries.length,1);assert.equal(h.render().wishlistEntries[0].productVariantId,'l');
});
test('Wishlist: restoring L does not merge into an existing M cart line',async()=>{
  const h=provider();h.render().addToCart({productId:product.id,product,size:'M',color:'Black',variantId:'m'});
  h.render().addToWishlist(product.id,product,{productVariantId:'l',selectedSize:'L',selectedColor:'Black'});
  assert.equal((await h.render().moveWishlistItemToCart(product.id)).ok,true);
  const lines=h.render().cartItems;assert.deepEqual(lines.map(x=>x.productVariantId),['m','l']);
  assert.equal(new Set(lines.map(x=>x.id)).size,2);assert.deepEqual(lines.map(x=>x.unitPriceCents),[399900,429900]);
});
for(const mode of ['missing','inactive','out-of-stock','removed-product']) test(`Wishlist: fresh ${mode} rejects without choosing M`,async()=>{
  const fresh=mode==='removed-product'?null:{...product,variants:mode==='missing'?[product.variants[0]]:product.variants.map(v=>v.id==='l'?{...v,isActive:mode!=='inactive',stock:mode==='out-of-stock'?0:3}:v)};
  const h=provider(fresh);h.render().addToWishlist(product.id,product,{productVariantId:'l',selectedSize:'L',selectedColor:'Black'});
  const result=await h.render().moveWishlistItemToCart(product.id);
  assert.equal(result.ok,false);assert.match(result.message,/unavailable|reselection/);assert.equal(h.render().cartItems.length,0);assert.equal(h.render().wishlistEntries.length,1);
});
test('Wishlist: legacy variant-backed bookmark requires selection',()=>{
  const saved=normalizeStoredWishlist([{productId:product.id,product,addedAt:'old'}])[0];
  assert.equal(restoreWishlistSelection(saved,product),null);
});
test('Wishlist: plain product behavior and saved labels remain',async()=>{
  const plain={...product,variants:[],variantCount:0,sizes:['One Size']};const h=provider(plain);
  h.render().addToWishlist(plain.id,plain);assert.equal((await h.render().moveWishlistItemToCart(plain.id)).ok,true);
  assert.equal(h.render().cartItems[0].productVariantId,null);assert.equal(h.render().cartItems[0].unitPriceCents,399900);
});
test('Wishlist: labels and price come from fresh exact variant, not stale saved labels',async()=>{
  const fresh={...product,variants:product.variants.map(v=>v.id==='l'?{...v,size:'Large',color:'Ink',priceInr:4599}:v)};
  const h=provider(fresh);h.render().addToWishlist(product.id,product,{productVariantId:'l',selectedSize:'L',selectedColor:'Black'});
  await h.render().moveWishlistItemToCart(product.id);const line=h.render().cartItems[0];
  assert.equal(line.productVariantId,'l');assert.equal(line.size,'Large');assert.equal(line.color,'Ink');assert.equal(line.unitPriceCents,459900);
});
test('Wishlist: catalogue transport failure keeps saved item and cart unchanged',async()=>{
  const h=provider(new Error('offline'));h.render().addToWishlist(product.id,product,{productVariantId:'l'});
  assert.equal((await h.render().moveWishlistItemToCart(product.id)).ok,false);assert.equal(h.render().cartItems.length,0);assert.equal(h.render().wishlistEntries.length,1);
});
test('Contrast: hero notice has a single semantic light foreground and responsive wrapping',()=>{
  const {PolicyNotice}=load('components/legal/policy-notice.tsx');
  const html=renderToStaticMarkup(PolicyNotice({tone:'hero',children:'Policy',className:'mt-7'}));
  assert.match(html,/text-pearlcream/);assert.doesNotMatch(html,/text-midnightbrown|text-sangria|text-pearlcream\/82/);
  assert.match(html,/min-w-0/);assert.doesNotMatch(html,/white-space:nowrap|whitespace-nowrap/);
  assert.match(read('components/legal/legal-page-shell.tsx'),/PolicyNotice tone="hero" className="mt-7"/);
});
test('Contrast: FAQ inverse normal/visited/hover/focus tokens and contrast exceed 4.5:1',()=>{
  const {buttonVariants}=load('components/ui/button.tsx');const css=buttonVariants({variant:'inverse',size:'lg'});
  for(const token of ['text-pearlcream','visited:text-pearlcream','hover:bg-pearlcream','hover:text-softblack','focus-visible:ring-2','focus-visible:ring-pearlcream'])assert.ok(css.split(' ').includes(token));
  assert.ok(!css.split(' ').includes('text-sangria'));assert.match(read('app/support/page.tsx'),/variant: "inverse", size: "lg"/);
  const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const cream=[255,254,250], dark=[58,8,24], panel=dark.map(v=>v*.95+255*.05);
  for(const bg of [dark,panel,[16,0,6]])assert.ok((lum(cream)+.05)/(lum(bg)+.05)>4.5);
});
test('Price: all buyer cart/checkout representations use selected price, no capture enabled',()=>{
  for(const file of ['components/buyer/cart-preview-table.tsx','components/checkout/checkout-draft-flow.tsx','components/checkout/place-draft-order.tsx','lib/checkout/checkout-review.ts'])assert.match(read(file),/cartUnitPrice\(item\)/);
  assert.match(read('components/checkout/checkout-draft-flow.tsx'),/disabled/);
});
test('Wishlist: public resolver preserves query failure versus unavailable and maps real variant prices',async()=>{
  let result={ok:false,error:{operation:'test'}},calls=0;
  const {resolveSavedProduct}=load('lib/catalog/resolve-saved-product.ts',{
    '@/lib/catalog/public-catalog':{findActiveProduct:async id=>{calls++;assert.equal(id,product.id);return result;}}
  });
  assert.deepEqual(await resolveSavedProduct('invalid'),{ok:true,product:null});assert.equal(calls,0);
  assert.deepEqual(await resolveSavedProduct(product.id),{ok:false,product:null});
  result={ok:true,data:null};assert.deepEqual(await resolveSavedProduct(product.id),{ok:true,product:null});
  result={ok:true,data:{id:product.id,name:'Jacket',slug:'jacket',price_inr:3999,images:[],tags:[],
    variants:product.variants.map(v=>({id:v.id,size:v.size,color:v.color,price_inr:v.priceInr,stock_quantity:v.stock,is_active:v.isActive}))}};
  const fresh=await resolveSavedProduct(product.id);assert.equal(fresh.ok,true);assert.equal(selectedProductPrice(fresh.product,'l'),4299);
});
test('Contrast: actual Tailwind compilation emits inverse hover, visited, focus and notice utilities',async()=>{
  const config=load('tailwind.config.ts').default;
  const {buttonVariants}=load('components/ui/button.tsx');
  const {PolicyNotice}=load('components/legal/policy-notice.tsx');
  const raw=buttonVariants({variant:'inverse',size:'lg'})+' '+PolicyNotice({tone:'hero',children:'Policy'}).props.className;
  const result=await require('postcss')([require('tailwindcss')({...config,content:[{raw,extension:'html'}]})]).process('@tailwind utilities;',{from:undefined});
  for(const selector of ['.text-pearlcream','.hover\\:text-softblack:hover','.visited\\:text-pearlcream:visited','.focus-visible\\:ring-pearlcream:focus-visible','.bg-white\\/5'])assert.ok(result.css.includes(selector),selector);
});
