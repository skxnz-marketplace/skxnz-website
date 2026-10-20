// LOCAL ONLY. Fixed loopback test cluster; never reads hosted credentials.
// node supabase/verification/0021_seller_order_lifecycle_test.mjs <external pg/lib/index.js>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const pg=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'pg'),Client=pg.Client??pg.default.Client;
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const migration=read('../migrations/0021_seller_order_lifecycle_allowlist.sql');
// Artifact pin is not user approval to apply this candidate.
const EXPECTED_MIGRATION_SHA256='4b290d28e67a796e2c731ee65aa061bd8494aaac49e1feb8c349c491af4f08ff';
const sha256=createHash('sha256').update(migration).digest('hex');
assert.equal(sha256,EXPECTED_MIGRATION_SHA256,'candidate bytes changed; review before updating pin');
assert.ok(!migration.includes('\r')&&!migration.startsWith('\uFEFF'),'LF, no BOM');
const names=['seller_active_return_indicators','seller_owns_post_payment_order_line','seller_update_line_fulfilment'];
assert.deepEqual([...migration.matchAll(/create or replace function public\.(\w+)/g)].map(x=>x[1]).sort(),names);
assert.doesNotMatch(migration,/\bexecute\s+(?:format|quote|v_|')/i);
const original=read('../migrations/0020_reconcile_missing_commerce_objects.sql'),oldHelper=read('../migrations/0006_fix_seller_order_item_rls.sql'),commerce=read('../migrations/0005_commerce_layer.sql'),users=read('../migrations/0001_user_layer.sql'),adminHelper=read('../migrations/0003_fix_admin_rls_helper.sql');
const fn=(text,name)=>{const m=text.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\$\\$;`));assert.ok(m,name);return m[0];};
const policy=(text,name)=>{const m=text.match(new RegExp(`create policy "${name}"[\\s\\S]*?;`));assert.ok(m,name);return m[0];};
const S='11111111-1111-4111-8111-111111111111',OTHER='22222222-2222-4222-8222-222222222222',B='33333333-3333-4333-8333-333333333333',A='44444444-4444-4444-8444-444444444444',MISSING='55555555-5555-4555-8555-555555555555';
const O='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O2='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',P='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',P2='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',P3='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd',L='cccccccc-cccc-4ccc-8ccc-cccccccccccc',L2='cccccccc-cccc-4ccc-8ccc-cccccccccccd',R='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const owner='skxnz_0021_owner',connections=new Set(),databases=[];const lockEvidence=[];let assertions=0,maintenance,report;
const check=(a,b,message)=>{assert.deepEqual(a,b,message);assertions++;};
async function connect(database,user='postgres',id=null){const c=new Client({host:'127.0.0.1',port:55421,database,user,connectionTimeoutMillis:3000});await c.connect();connections.add(c);await c.query("set statement_timeout='6s';set lock_timeout='5s';set idle_in_transaction_session_timeout='15s';set timezone='UTC'");if(user!=='postgres'){await c.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);check((await c.query('select current_user,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0],{current_user:user,rolsuper:false,rolbypassrls:false},'non-elevated session');}return c;}
async function end(c){await c.end();connections.delete(c);}
async function setup(database){const c=await connect(database);await c.query(`
revoke create on schema public from public;grant usage,create on schema public to ${owner};create schema auth;grant usage on schema auth to ${owner},authenticated,anon;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
set role ${owner};
-- Minimum typed contract fixture, not a replay of historical migrations.
create table users(id uuid primary key,role text);
create table products(id uuid primary key,seller_id uuid);
create table orders(id uuid primary key,buyer_id uuid,status text check(status in ('DRAFT','PAYMENT_PENDING','PAID','FULFILLING','SHIPPED','DELIVERED','CANCELLED','REFUNDED')));
create table order_items(id uuid primary key,order_id uuid references orders,product_id uuid references products,quantity integer default 3,seller_fulfilment_status text default 'PENDING',seller_fulfilment_note text,seller_fulfilment_updated_at timestamptz default '2000-01-01Z');
create table order_item_events(id uuid primary key default gen_random_uuid(),order_item_id uuid references order_items,event_type text,from_status text,to_status text,actor_user_id uuid,message text,metadata jsonb,created_at timestamptz default now());
create table order_events(id uuid primary key default gen_random_uuid(),order_id uuid,event_type text,message text,metadata jsonb);
create table return_requests(id uuid primary key default gen_random_uuid(),order_id uuid,buyer_id uuid,status text,reason text,note text,idempotency_key uuid,idempotency_fingerprint text);
create table return_request_items(order_item_id uuid references order_items,return_request_id uuid references return_requests,quantity integer,reason text);
${fn(adminHelper,'is_admin')}
${fn(oldHelper,'seller_owns_post_payment_order_line')}
${fn(original,'seller_update_line_fulfilment')}
${fn(original,'seller_active_return_indicators')}
${fn(original,'admin_update_order_status_atomic')}
${fn(original,'create_return_request_idempotent')}
reset role;
grant usage on schema public to authenticated,anon;grant select on all tables in schema public to authenticated,anon;grant update on orders to authenticated;
revoke all on function seller_update_line_fulfilment(uuid,text,text,text),seller_active_return_indicators(uuid[]),admin_update_order_status_atomic(uuid,text,text),create_return_request_idempotent(uuid,text,text,jsonb,uuid) from public,anon;
grant execute on function seller_update_line_fulfilment(uuid,text,text,text),seller_active_return_indicators(uuid[]),admin_update_order_status_atomic(uuid,text,text),create_return_request_idempotent(uuid,text,text,jsonb,uuid) to authenticated;
alter table users enable row level security;alter table products enable row level security;alter table orders enable row level security;alter table order_items enable row level security;alter table order_item_events enable row level security;
${policy(users,'users: owner can select')}
${policy(adminHelper,'users: admin can select all')}
${policy(commerce,'orders: buyer can select own')}
${policy(commerce,'orders: admin can manage all')}
${policy(commerce,'order_items: buyer can select own')}
${policy(oldHelper,'order_items: seller can select own product lines')}
${policy(commerce,'order_items: admin can manage all')}
${policy(original,'order_item_events: seller can select own')}
${policy(original,'order_item_events: buyer can select own')}
${policy(original,'order_item_events: admin can manage all')}
-- Catalogue schema is reduced to ownership columns; this fixture-only policy
-- models seller/admin product visibility. Commerce/user policies above are exact.
create policy "fixture products: own or admin" on products for select using(seller_id=auth.uid() or is_admin());`);return c;}
const fixtures=`insert into users values('${S}','SELLER'),('${OTHER}','SELLER'),('${B}','BUYER'),('${A}','ADMIN');insert into products values('${P}','${S}'),('${P2}','${OTHER}'),('${P3}','${A}');insert into orders values('${O}','${B}','PAID'),('${O2}','${B}','PAID');insert into order_items(id,order_id,product_id) values('${L}','${O}','${P}'),('${L2}','${O}','${P2}');insert into return_requests(id,order_id,buyer_id,status) values('${R}','${O}','${B}','APPROVED');insert into return_request_items values('${L}','${R}',1,null),('${L2}','${R}',1,null);`;
const inspect=async c=>(await c.query(`select p.oid::regprocedure::text as signature,pg_get_function_result(p.oid) as result,pg_get_userbyid(p.proowner) as owner,p.proacl::text,p.prosecdef,p.proconfig,obj_description(p.oid,'pg_proc') as comment,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by signature`)).rows;
const snapshot=async c=>(await c.query(`select jsonb_build_object('lines',(select jsonb_agg(to_jsonb(t) order by id) from order_items t),'events',(select jsonb_agg(to_jsonb(t) order by id) from order_item_events t),'orders',(select jsonb_agg(to_jsonb(t) order by id) from orders t)) as state`)).rows[0].state;
const helper=async(c,o=O,p=P)=>(await c.query('select seller_owns_post_payment_order_line($1,$2) as allowed',[o,p])).rows[0].allowed;
const action=(c,a='ADVANCE',next='ACCEPTED',note=null)=>c.query('select * from seller_update_line_fulfilment($1,$2,$3,$4)',[L,a,next,note]);
async function rejected(c,control,call,code){const before=await snapshot(control);let got;try{await call();}catch(e){got=e.code;}check(got,code,'exact SQLSTATE');check(await snapshot(control),before,'line/timestamp/event/parent unchanged');}
async function actor(c,id){await c.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);}
async function reset(c,status='PAID'){await c.query(`delete from order_item_events;delete from order_events;delete from return_request_items;delete from return_requests;update order_items set seller_fulfilment_status='PENDING',seller_fulfilment_note=null,seller_fulfilment_updated_at='2000-01-01Z'`);await c.query('update orders set status=$1',[status]);}
async function blocked(observer,waiter,holder){const deadline=Date.now()+3500;while(Date.now()<deadline){if((await observer.query('select $2::int=any(pg_blocking_pids($1)) as blocked',[waiter.processID,holder.processID])).rows[0].blocked){assertions++;lockEvidence.push({waiter:waiter.processID,holder:holder.processID,blocked:true});return;}await new Promise(r=>setTimeout(r,25));}throw Error('session did not block on expected backend');}
const success=p=>p.then(value=>({value}),error=>({error}));
try{
maintenance=await connect('postgres');await maintenance.query("set statement_timeout='60s'");
for(const role of ['authenticated','anon'])await maintenance.query(`do $$begin if not exists(select from pg_roles where rolname='${role}') then create role ${role} login nosuperuser nobypassrls;end if;end$$;`);
await maintenance.query(`do $$begin if not exists(select from pg_roles where rolname='${owner}') then create role ${owner} nologin nosuperuser bypassrls;end if;end$$;`);
async function database(suffix){const name=`skxnz_0021_${process.pid}_${suffix}`;assert.match(name,/^skxnz_0021_\d+_(rollback|concurrent)$/);await maintenance.query(`create database ${name}`);databases.push(name);return name;}
const db=await database('rollback'),c=await setup(db),before=await inspect(c);
// Reproduce immutable previous candidate in a rolled-back local transaction.
const previous=execFileSync('git',['show','826e7e4:supabase/migrations/0021_seller_order_lifecycle_allowlist.sql'],{encoding:'utf8'});
await c.query('begin');await c.query(fixtures);await c.query(previous);await actor(c,S);
const preNull=await snapshot(c);await action(c,null,'ACCEPTED');const postNull=await snapshot(c);assert.notDeepEqual(postNull,preNull);check(postNull.events[0].event_type,'NOTE_ADDED','old NULL false audit reproduced');
await c.query('update users set role=\'BUYER\' where id=$1',[S]);check(await helper(c),true,'old downgrade reproduced');check(await helper(c,O2),true,'old unrelated oracle reproduced');await c.query('rollback');check(await inspect(c),before,'reproduction rolled back');
await c.query('begin');await c.query(migration);const after=await inspect(c);
for(let i=0;i<after.length;i++){for(const attr of ['signature','result','owner','proacl','prosecdef'])check(after[i][attr],before[i][attr],attr+' unchanged');if(names.includes(after[i].signature.split('(')[0]))assert.ok(after[i].proconfig.includes('search_path=public, pg_temp'));else check(after[i],before[i],'unrelated function unchanged');}
await c.query(fixtures);await c.query(read('./0021_seller_order_lifecycle_verify.sql'));await c.query('rollback');check(await inspect(c),before,'definitions/ACLs/owners/configs restored');
for(const table of ['users','products','orders','order_items','order_item_events','return_requests','return_request_items','order_events'])check((await c.query(`select count(*)::int as n from ${table}`)).rows[0].n,0,'rollback empty '+table);
// Separate disposable DB: committed local fixtures allow real concurrent sessions.
// It is removed in finally. No sequential result is reported as concurrency proof.
const concurrent=await database('concurrent'),control=await setup(concurrent);await control.query('begin');await control.query(migration);await control.query(fixtures);await control.query('commit');
const seller=await connect(concurrent,'authenticated',S),other=await connect(concurrent,'authenticated',OTHER),buyer=await connect(concurrent,'authenticated',B),admin=await connect(concurrent,'authenticated',A),anon=await connect(concurrent,'anon');
check(await helper(seller),true,'current seller real relationship');check(await helper(other),false,'foreign seller');check(await helper(seller,O2),false,'unrelated paid order');await control.query('update products set seller_id=$1 where id=$2',[A,P]);check(await helper(admin),false,'admin owns matching line but not SELLER');await control.query('update products set seller_id=$1 where id=$2',[S,P]);check(await helper(anon),false,'anonymous');
await control.query('update products set seller_id=$1 where id=$2',[MISSING,P]);await actor(other,MISSING);check(await helper(other),false,'missing user');await rejected(other,control,()=>action(other),'42501');await actor(other,OTHER);await control.query('update products set seller_id=$1 where id=$2',[S,P]);
await control.query('update users set role=\'BUYER\' where id=$1',[S]);check(await helper(seller),false,'downgrade');check((await seller.query('select count(*)::int as n from order_items')).rows[0].n,0,'downgraded nonbuyer seller RLS');await rejected(seller,control,()=>action(seller),'42501');await control.query('update users set role=\'SELLER\' where id=$1',[S]);
for(const [who,n] of [[buyer,2],[admin,2],[seller,1],[anon,0]])check((await who.query('select count(*)::int as n from order_items')).rows[0].n,n,'real RLS caller');
for(const [who,code] of [[buyer,'42501'],[admin,'42501'],[anon,'42501'],[other,'P0002']])await rejected(who,control,()=>action(who),code);
for(const status of ['DRAFT','PAYMENT_PENDING','CANCELLED','REFUNDED','PAID','FULFILLING','SHIPPED','DELIVERED']){await control.query('update orders set status=$1',[status]);const allowed=['PAID','FULFILLING','SHIPPED','DELIVERED'].includes(status);check(await helper(seller),allowed,status+' helper');check((await seller.query('select count(*)::int as n from order_items')).rows[0].n,allowed?1:0,status+' RLS');if(!['PAID','FULFILLING'].includes(status))await rejected(seller,control,()=>action(seller),'P0002');}
for(const status of ['PAID','FULFILLING']){await control.query('update orders set status=$1',[status]);for(const a of [null,'INVALID'])await rejected(seller,control,()=>action(seller,a,'ACCEPTED','must not persist'),'22023');}
await reset(control);for(const note of [null,'','   ','x'.repeat(501)])await rejected(seller,control,()=>action(seller,'ADD_NOTE',null,note),'22023');await rejected(seller,control,()=>action(seller,'ADVANCE','PACKED'),'22023');await rejected(seller,control,()=>action(seller,'ADVANCE',null),'22023');
await control.query("update orders set status='FULFILLING'");await action(seller);check((await snapshot(control)).lines.find(x=>x.id===L).seller_fulfilment_status,'ACCEPTED','FULFILLING successful ADVANCE');await reset(control);
await action(seller,'ADD_NOTE',null,'x'.repeat(500));check((await snapshot(control)).lines.find(x=>x.id===L).seller_fulfilment_note.length,500,'500 accepted');const noteEvent=(await control.query('select * from order_item_events')).rows[0];for(const [key,value] of Object.entries({actor_user_id:S,event_type:'NOTE_ADDED',from_status:null,to_status:null,message:'Seller added a fulfilment note.',metadata:{source:'seller_update_line_fulfilment',action:'ADD_NOTE'}}))check(noteEvent[key],value,'ADD_NOTE '+key);await reset(control);
for(const next of ['ACCEPTED','PACKED','HANDED_TO_DELIVERY'])await action(seller,'ADVANCE',next,' QA note ');
const events=(await control.query('select * from order_item_events order by created_at,id')).rows;check(events.length,3,'ladder count');for(const [i,e] of events.entries()){check(e.actor_user_id,S,'actor');check(e.from_status,['PENDING','ACCEPTED','PACKED'][i],'from');check(e.to_status,['ACCEPTED','PACKED','HANDED_TO_DELIVERY'][i],'to');check(e.message,`Seller advanced line ${e.from_status} -> ${e.to_status}.`,'message');check(e.metadata,{source:'seller_update_line_fulfilment',action:'ADVANCE'},'metadata');}
for(const [who,n] of [[seller,3],[other,0],[buyer,3],[admin,3]])check((await who.query('select count(*)::int as n from order_item_events')).rows[0].n,n,'event history RLS');
await control.query('update users set role=\'BUYER\' where id=$1',[S]);check((await seller.query('select count(*)::int as n from order_item_events')).rows[0].n,0,'downgraded seller event RLS');await control.query('update users set role=\'SELLER\' where id=$1',[S]);
await control.query(`create function public.test_fail_audit() returns trigger language plpgsql as $$begin raise exception 'audit unavailable' using errcode='P0001';end$$;create trigger test_fail_audit before insert on order_item_events for each row execute function public.test_fail_audit()`);await rejected(seller,control,()=>action(seller,'ADD_NOTE',null,'must roll back'),'P0001');await control.query('drop trigger test_fail_audit on order_item_events;drop function public.test_fail_audit()');
await reset(control,'DELIVERED');await control.query(`insert into return_requests(id,order_id,buyer_id,status) values('${R}','${O}','${B}','APPROVED');insert into return_request_items values('${L}','${R}',1,null),('${L2}','${R}',1,null)`);
for(const who of [buyer,admin])check((await who.query('select * from seller_active_return_indicators($1)',[[L,L2]])).rows,[],'non-seller indicators');check((await other.query('select * from seller_active_return_indicators($1)',[[L,L2]])).rows.map(x=>x.order_item_id),[L2],'other seller own indicator only');
for(const status of ['REQUESTED','IN_REVIEW','APPROVED','PICKUP_PENDING','RECEIVED','REFUND_PENDING','REJECTED','CLOSED','REFUNDED']){await control.query('update return_requests set status=$1',[status]);const rows=(await seller.query('select * from seller_active_return_indicators($1)',[[L,L2]])).rows;check(rows.length,['REJECTED','CLOSED','REFUNDED'].includes(status)?0:1,'mixed-owner return '+status);if(rows.length)check(rows[0].order_item_id,L,'only own line');}
for(const ids of [null,[]])check((await seller.query('select * from seller_active_return_indicators($1)',[ids])).rows,[],'null/empty arrays');
await control.query('alter table order_items force row level security');check(await helper(seller),true,'FORCE with BYPASSRLS owner');await control.query('alter table order_items no force row level security');
await control.query(`begin;create role skxnz_0021_weak nologin nosuperuser nobypassrls;grant usage on schema public,auth to skxnz_0021_weak;grant select on users,products,orders,order_items to skxnz_0021_weak;alter function seller_owns_post_payment_order_line(uuid,uuid) owner to skxnz_0021_weak;select set_config('request.jwt.claim.sub','${S}',true);set local role authenticated`);
let weakCode;try{await helper(control);}catch(e){weakCode=e.code;}check(weakCode,'42501','non-bypass owner fails closed, no recursion');await control.query('rollback');
await control.query(`begin;alter role ${owner} nobypassrls;alter table order_items force row level security;select set_config('request.jwt.claim.sub','${S}',true);set local role authenticated`);let forcedOwnerCode;try{await helper(control);}catch(e){forcedOwnerCode=e.code;}check(forcedOwnerCode,'42501','table owner with FORCE and no BYPASS fails closed');await control.query('rollback');
for(const role of ['authenticated','anon']){check((await control.query("select has_schema_privilege($1,'public','CREATE') as public_create,has_schema_privilege($1,'auth','CREATE') as auth_create",[role])).rows[0],{public_create:false,auth_create:false},'schema CREATE denied');check((await control.query("select has_function_privilege($1,'seller_update_line_fulfilment(uuid,text,text,text)','EXECUTE') as allowed",[role])).rows[0].allowed,role==='authenticated','effective EXECUTE');}
check(seller.processID===admin.processID,false,'independent backend PIDs');
// Post-wait authorization must use current role/ownership, not lookup-time state.
for(const change of ['downgrade','transfer']){await reset(control);const unchanged=(await snapshot(control)).lines;await admin.query('begin');await admin.query('select id from orders where id=$1 for update',[O]);const waiting=success(action(seller));await blocked(control,seller,admin);if(change==='downgrade')await control.query('update users set role=\'BUYER\' where id=$1',[S]);else await control.query('update products set seller_id=$1 where id=$2',[OTHER,P]);await admin.query('commit');check((await waiting).error?.code,'P0002','post-wait '+change);check((await snapshot(control)).lines,unchanged,'post-wait line unchanged');check((await snapshot(control)).events,null,'post-wait no audit');await control.query('update users set role=\'SELLER\' where id=$1',[S]);await control.query('update products set seller_id=$1 where id=$2',[S,P]);}
const cancel=()=>admin.query('select * from admin_update_order_status_atomic($1,\'CANCELLED\',\'local concurrency test\')',[O]);
await reset(control);const beforeA=(await snapshot(control)).lines;await admin.query('begin');await cancel();let pending=success(action(seller));await blocked(control,seller,admin);await admin.query('commit');let done=await pending;check(done.error?.code,'P0002','A stale reject');let state=await snapshot(control);check(state.events,null,'A no seller event');check(state.orders.find(x=>x.id===O).status,'CANCELLED','A cancelled parent');check(state.lines,beforeA,'A no line/timestamp change');
await reset(control);await seller.query('begin');await action(seller);pending=success(cancel());await blocked(control,admin,seller);await seller.query('commit');done=await pending;assert.ifError(done.error);state=await snapshot(control);check(state.orders.find(x=>x.id===O).status,'CANCELLED','B cancelled after seller');check(state.lines.find(x=>x.id===L).seller_fulfilment_status,'ACCEPTED','B serialized line');check(state.events.length,1,'B one seller event');
await reset(control);await actor(other,S);await seller.query('begin');await action(seller);pending=success(action(other));await blocked(control,other,seller);await seller.query('commit');done=await pending;check(done.error?.code,'22023','C stale second action');check((await snapshot(control)).events.length,1,'C one event');check((await snapshot(control)).lines.find(x=>x.id===L).seller_fulfilment_status,'ACCEPTED','C final line');await actor(other,OTHER);
const requestReturn=()=>buyer.query('select create_return_request_idempotent($1,\'Local QA\',null,$2::jsonb,gen_random_uuid()) as result',[O,JSON.stringify([{order_item_id:L,quantity:1}])]);
await reset(control,'DELIVERED');await seller.query('begin');await action(seller,'ADD_NOTE',null,'local delivered note');pending=success(requestReturn());await blocked(control,buyer,seller);await seller.query('commit');done=await pending;assert.ifError(done.error);check(done.value.rows[0].result.ok,true,'D return after note');check((await snapshot(control)).events.length,1,'D one note');check((await snapshot(control)).lines.find(x=>x.id===L).seller_fulfilment_note,'local delivered note','D persisted note');check((await control.query("select count(*)::int as n from order_events where event_type='RETURN_REQUESTED'")).rows[0].n,1,'D return audit');check((await control.query('select count(*)::int as n from return_requests')).rows[0].n,1,'D one return');
await reset(control,'DELIVERED');await buyer.query('begin');check((await requestReturn()).rows[0].result.ok,true,'D reverse return');pending=success(action(seller,'ADD_NOTE',null,'note after return'));await blocked(control,seller,buyer);await buyer.query('commit');done=await pending;assert.ifError(done.error);check((await snapshot(control)).events.length,1,'D reverse note');check((await control.query('select buyer_id,status from return_requests')).rows,[{buyer_id:B,status:'REQUESTED'}],'D reverse persisted return');
report={result:'PASS',engine:(await control.query('select version() as v')).rows[0].v,sha256,hashPin:'PASS (integrity, not approval)',assertions,lockEvidence,originalSuite:'PASS',realRoles:'authenticated/anon LOGIN NOSUPERUSER NOBYPASSRLS',concurrency:{A:'PASS cancel first, zero seller mutations/events',B:'PASS seller first, cancellation waits',C:'PASS stale duplicate rejected, one event',D:'PASS real buyer-return RPC versus delivered ADD_NOTE, both orders'},rollback:'original functions/owners/ACL restored; all fixture rows/events rolled back',hostedMigrationApplied:false};
}finally{
for(const c of [...connections])if(c!==maintenance){try{await c.query('rollback');}catch{}await end(c);}
if(maintenance){for(const db of databases){assert.match(db,/^skxnz_0021_\d+_(rollback|concurrent)$/);await maintenance.query(`drop database ${db} with(force)`);check((await maintenance.query('select count(*)::int as n from pg_database where datname=$1',[db])).rows[0].n,0,'disposable DB removed');}await end(maintenance);}
}

console.log(JSON.stringify({...report,disposableDatabasesRemoved:true}));
