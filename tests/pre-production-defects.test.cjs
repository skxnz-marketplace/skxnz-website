require('./bootstrap.cjs');
const {test, afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}) {
  const name=path.resolve(file),mod=new Module(name,module);mod.filename=name;mod.paths=module.paths;
  mod.require=id=>id in mocks ? mocks[id] : id.startsWith('@/components/')||id==='@/lib/cn'
    ? load(id.slice(2)+(fs.existsSync(id.slice(2)+'.tsx')?'.tsx':'.ts'),mocks) : require(id);
  mod._compile(ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,name);
  return mod.exports;
}
function find(n,p) {if(!n||typeof n!=='object')return null;if(p(n))return n;for(const c of React.Children.toArray(n.props?.children)){const r=find(c,p);if(r)return r;}return null;}
function hooks(state=[]) {let i=0;const effects=[];return {state,effects,reset(){i=0;effects.length=0;},react:{...React,useId:()=> 'qa-search',useMemo:f=>f(),useRef:v=>({current:v}),useEffect:f=>effects.push(f),useState:v=>{const x=i++;if(!(x in state))state[x]=typeof v==='function'?v():v;return [state[x],v=>state[x]=typeof v==='function'?v(state[x]):v];}}};}
function search() {
  const h=hooks(),routes=[];
  const {SiteSearchBar}=load('components/shared/site-search-bar.tsx',{react:h.react,'next/navigation':{useRouter:()=>({push:x=>routes.push(x)}),usePathname:()=>'/shop',useSearchParams:()=>new URLSearchParams()},'@/components/marketplace/marketplace-provider':{useMarketplace:()=>({approvedProducts:[]})}});
  const render=()=>{h.reset();return SiteSearchBar({});};
  const input=()=>find(render(),n=>n.type==='input');
  return {...h,routes,render,input};
}
const key=k=>({key:k,preventDefault(){},currentTarget:{value:'jacket'}});
test('Search: Enter closes; next focused edit reopens; empty stays closed',()=>{
  const s=search();s.input().props.onFocus();s.input().props.onChange({target:{value:'jacket'}});
  assert.equal(s.input().props['aria-expanded'],true);
  s.input().props.onKeyDown(key('Enter'));assert.deepEqual(s.routes,['/shop?q=jacket']);assert.equal(s.input().props['aria-expanded'],false);
  s.input().props.onChange({target:{value:'coat'}});assert.equal(s.input().props['aria-expanded'],true);
  s.input().props.onChange({target:{value:''}});assert.equal(s.input().props['aria-expanded'],false);
});
test('Search: Escape and external blur close; internal focus stays open',()=>{
  const s=search();s.input().props.onChange({target:{value:'jacket'}});
  s.render().props.onBlur({currentTarget:{contains:()=>true},relatedTarget:{}});assert.equal(s.input().props['aria-expanded'],true);
  s.render().props.onBlur({currentTarget:{contains:()=>false},relatedTarget:null});assert.equal(s.input().props['aria-expanded'],false);
  s.input().props.onChange({target:{value:'jacket'}});s.input().props.onKeyDown(key('Escape'));assert.equal(s.input().props['aria-expanded'],false);
});
test('Search: form submission closes suggestions and a new edit reopens them',()=>{
  const s=search();s.input().props.onChange({target:{value:'jacket'}});
  find(s.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.deepEqual(s.routes,['/shop?q=jacket']);assert.equal(s.input().props['aria-expanded'],false);
  s.input().props.onChange({target:{value:'coat'}});assert.equal(s.input().props['aria-expanded'],true);
});
test('Search: arrow selection Enter uses selected live result; ordinary Enter remains query submit',()=>{
  const s=search();s.input().props.onChange({target:{value:'jacket'}});
  s.state[4]={query:'jacket',items:[{type:'product',href:'/product/qa-jacket',label:'QA Jacket',score:100}]};
  s.input().props.onKeyDown(key('ArrowDown'));assert.match(s.input().props['aria-activedescendant'],/-0$/);
  s.input().props.onKeyDown(key('Enter'));assert.deepEqual(s.routes,['/product/qa-jacket']);
});
test('Search: stale query results are not displayed',()=>{
  const s=search();s.input().props.onChange({target:{value:'coat'}});
  s.state[4]={query:'jacket',items:[{type:'product',href:'/product/stale',label:'STALE',score:100}]};
  assert.doesNotMatch(renderToStaticMarkup(s.render()),/STALE/);
});
test('Search: aborted async response cannot replace newer response',async()=>{
  const s=search();let complete;const oldFetch=global.fetch,oldWindow=global.window;
  const timers=[];global.window={setTimeout:f=>(timers.push(f),timers.length),clearTimeout(){}};
  global.fetch=async()=>({ok:true,json:()=>new Promise(r=>complete=r)});
  try {
    s.input().props.onChange({target:{value:'jacket'}});s.render();const cleanup=s.effects.at(-1)();const pending=timers[0]();
    await Promise.resolve();cleanup();s.state[4]={query:'coat',items:[]};complete({live:true,suggestions:[{label:'OLD'}]});await pending;
    assert.deepEqual(s.state[4],{query:'coat',items:[]});
  }finally{global.fetch=oldFetch;if(oldWindow===undefined)delete global.window;else global.window=oldWindow;}
});
test('Assistant: launcher hidden while chat open; Send submits without closing; close and reopen',async()=>{
  const h=hooks([true,false,null,false,[], 'jacket',false,'']);
  const {FloatingSkxnzAssistant}=load('components/ai/floating-skxnz-assistant.tsx',{react:h.react,'@/lib/data/user':{getDemoUserProfile:()=>null},'@/components/marketplace/marketplace-provider':{useMarketplace:()=>({cartItems:[],wishlistProducts:[],isInWishlist:()=>false})}});
  const render=()=>{h.reset();return FloatingSkxnzAssistant();};
  let tree=render();let launcher=find(tree,n=>n.props?.['aria-label']==='Open SKXNZ AI Assistant');assert.equal(launcher.props.hidden,false);
  launcher.props.onKeyDown(key('Enter'));tree=render();launcher=find(tree,n=>n.props?.['aria-label']==='Open SKXNZ AI Assistant');assert.equal(launcher.props.hidden,true);assert.match(launcher.props.className,/\bhidden\b/);
  assert.equal(find(tree,n=>n.props?.['aria-label']==='Send message to SKXNZ AI').props.type,'submit');
  assert.match(find(tree,n=>n.type==='section').props.className,/100dvh/);
  const oldFetch=global.fetch;let sent;
  global.fetch=async(url,options)=>(sent={url,body:JSON.parse(options.body)},{ok:true,json:async()=>({reply:'Live catalogue response'})});
  try{find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(sent.url,'/api/ai-assistant');assert.equal(sent.body.message,'jacket');assert.equal(h.state[1],true);}finally{global.fetch=oldFetch;}
  find(tree,n=>n.props?.['aria-label']==='Close SKXNZ AI Assistant').props.onClick();assert.equal(h.state[1],false);
  find(render(),n=>n.props?.['aria-label']==='Open SKXNZ AI Assistant').props.onKeyDown(key('Enter'));assert.equal(h.state[1],true);
});
test('Claims: unavailable Stylist and explicit editorial imagery, no fabricated catalogue brands',()=>{
  const read=f=>fs.readFileSync(f,'utf8');
  assert.doesNotMatch(read('lib/home-data.ts'),/Live Beta|Rolling Out/);
  assert.doesNotMatch(read('components/home/ai-signal-panel.tsx'),/Chrome District|Signal Studio|Try the AI Stylist/);
  for(const f of ['featured-labels','luxury-finds','category-showcase'])assert.match(read(`components/home/${f}.tsx`),/[Ee]ditorial|[Ii]nspiration/);
  assert.doesNotMatch(read('app/seller/orders/page.tsx'),/· Paid/);
});
for(const [label,allowed,error] of [['cancelled/otherwise ineligible',false,null],['eligible owned line',true,null],['lookup failure',null,{code:'XX000',message:'test unavailable'}]]) {
  test(`Seller workspace: ${label} is checked beyond additive RLS`,async()=>{
    const {__setMockClient}=require('./mocks/supabase-server.cjs');
    const {getSellerOrders,getSellerOrderById}=require('@/lib/orders/read-seller-orders');
    const orderId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',productId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';let checked=0;
    const line={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',order_id:orderId,product_id:productId,product_slug:'qa',title_snapshot:'QA',unit_price_paise:429900,quantity:1,line_total_paise:429900,created_at:'2026-10-20T00:00:00Z',seller_fulfilment_status:'PENDING'};
    __setMockClient({auth:{getUser:async()=>({data:{user:{id:'seller'}},error:null})},from:table=>{
      const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,then:resolve=>resolve({data:table==='products'?[{id:productId}]:[line],error:null})};return q;
    },rpc:async(name,args)=>{
      if(name==='seller_owns_post_payment_order_line'){checked++;assert.deepEqual(args,{p_order_id:orderId,p_product_id:productId});return {data:allowed,error};}
      return {data:[],error:null};
    }});
    assert.equal((await getSellerOrders()).orders.length,allowed?1:0);
    assert.equal(Boolean((await getSellerOrderById(orderId)).order),Boolean(allowed));assert.equal(checked,2);
  });
}
