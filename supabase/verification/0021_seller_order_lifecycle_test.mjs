// Disposable local Postgres only. No URL, credentials, or hosted connection.
// Install @electric-sql/pglite outside this repo and pass its ESM index path as arg1.
// node supabase/verification/0021_seller_order_lifecycle_test.mjs <pglite/dist/index.js>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {PGlite}=await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite');
const db=new PGlite();
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const migration=read('../migrations/0021_seller_order_lifecycle_allowlist.sql');
const original=read('../migrations/0020_reconcile_missing_commerce_objects.sql');
const helper=read('../migrations/0006_fix_seller_order_item_rls.sql').match(/create or replace function public\.seller_owns_post_payment_order_line\([\s\S]*?\$\$;/)[0];
const functions=original.match(/create or replace function public\.(seller_update_line_fulfilment|seller_active_return_indicators)\([\s\S]*?\$\$;/g);
try {
  // Minimum typed contract fixture, not a replay of historical migrations.
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table users(id uuid primary key,role text);
    create table products(id uuid primary key,seller_id uuid);
    create table orders(id uuid primary key,status text);
    create table order_items(id uuid primary key,order_id uuid,product_id uuid,seller_fulfilment_status text default 'PENDING',seller_fulfilment_note text,seller_fulfilment_updated_at timestamptz);
    create table order_item_events(order_item_id uuid,event_type text,from_status text,to_status text,actor_user_id uuid,message text,metadata jsonb);
    create table return_requests(id uuid primary key,status text);
    create table return_request_items(order_item_id uuid,return_request_id uuid,quantity integer);
    insert into users values('11111111-1111-4111-8111-111111111111','SELLER'),('22222222-2222-4222-8222-222222222222','SELLER'),('33333333-3333-4333-8333-333333333333','BUYER'),('44444444-4444-4444-8444-444444444444','ADMIN');
    insert into products values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111');
    insert into orders values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','CANCELLED');
    insert into order_items(id,order_id,product_id) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    insert into return_requests values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','APPROVED');
    insert into return_request_items values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','dddddddd-dddd-4ddd-8ddd-dddddddddddd',1);`);
  await db.exec(helper+'\n'+functions.join('\n'));
  await db.exec(`revoke all on function seller_update_line_fulfilment(uuid,text,text,text) from public,anon;
    grant execute on function seller_update_line_fulfilment(uuid,text,text,text) to authenticated;
    revoke all on function seller_active_return_indicators(uuid[]) from public,anon;
    grant execute on function seller_active_return_indicators(uuid[]) to authenticated;
    grant usage on schema public,auth to authenticated;
    grant select on order_items to authenticated;
    alter table order_items enable row level security;
    create policy seller_read on order_items for select to authenticated using(seller_owns_post_payment_order_line(order_id,product_id));
    create policy admin_read on order_items for select to authenticated using(auth.uid()='44444444-4444-4444-8444-444444444444');
    select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
  const identities="'seller_owns_post_payment_order_line','seller_update_line_fulfilment','seller_active_return_indicators'";
  const inspect=()=>db.query(`select proname,proacl::text,pg_get_userbyid(proowner) as owner,prosecdef,proconfig,pg_get_functiondef(oid) as definition from pg_proc where proname in (${identities}) order by proname`);
  const before=(await inspect()).rows;
  assert.equal((await db.query("select seller_owns_post_payment_order_line('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') as admitted")).rows[0].admitted,true);
  await db.exec('begin');
  await db.exec(migration); // In-memory DB only, inside rollback transaction.
  const after=(await inspect()).rows;
  for(let i=0;i<after.length;i++){
    assert.equal(after[i].proacl,before[i].proacl);assert.equal(after[i].owner,before[i].owner);
    assert.equal(after[i].prosecdef,true);assert.deepEqual(after[i].proconfig,['search_path=public, pg_temp']);
  }
  await db.exec(read('./0021_seller_order_lifecycle_verify.sql'));
  // Exercise the actual RLS policy under authenticated, not superuser bypass.
  for(const status of ['DRAFT','PAYMENT_PENDING','CANCELLED','REFUNDED','PAID','FULFILLING','SHIPPED','DELIVERED']){
    await db.query('update orders set status=$1',[status]);
    await db.exec("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);set local role authenticated");
    assert.equal((await db.query('select count(*)::int as n from order_items')).rows[0].n,['PAID','FULFILLING','SHIPPED','DELIVERED'].includes(status)?1:0,status);
    await db.exec('reset role');
  }
  await db.exec("update orders set status='CANCELLED'; select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);set local role authenticated");
  assert.equal((await db.query('select count(*)::int as n from order_items')).rows[0].n,1,'admin policy unchanged');
  await db.exec('reset role;rollback');
  assert.deepEqual((await inspect()).rows,before,'function definitions and ACLs restored after rollback');
  assert.equal((await db.query('select count(*)::int as n from order_item_events')).rows[0].n,0,'events rolled back');
  console.log(JSON.stringify({result:'PASS',engine:'local PGlite PostgreSQL',sha256:createHash('sha256').update(migration).digest('hex'),checks:['baseline cancelled admission reproduced','four ineligible states','four eligible read states','late-state advance denied','owned transitions and audit','other seller denied','buyer/admin/anon action denied','cancelled notes denied','actual RLS status matrix','admin read policy retained','SECURITY DEFINER/search_path/ACL/owner','rollback definitions/events restored'],hostedMigrationApplied:false}));
}finally{await db.close();}
