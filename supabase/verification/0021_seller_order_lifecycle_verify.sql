-- LOCAL DISPOSABLE POSTGRES ONLY. Runner opens BEGIN, loads exact 0021, then runs
-- this suite and ROLLBACK. Never run against production/QA to apply candidate DDL.
DO $test$
DECLARE s text; n integer; failed boolean; before_events integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
  FOREACH s IN ARRAY ARRAY['DRAFT','PAYMENT_PENDING','CANCELLED','REFUNDED'] LOOP
    UPDATE orders SET status=s;
    IF seller_owns_post_payment_order_line('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') THEN RAISE EXCEPTION 'ineligible read admitted: %',s; END IF;
    SELECT count(*) INTO n FROM seller_active_return_indicators(ARRAY['cccccccc-cccc-4ccc-8ccc-cccccccccccc']::uuid[]);
    IF n<>0 THEN RAISE EXCEPTION 'ineligible return indicator admitted: %',s; END IF;
    failed:=false;
    BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN SQLSTATE 'P0002' THEN failed:=true; END;
    IF NOT failed THEN RAISE EXCEPTION 'ineligible action admitted: %',s; END IF;
  END LOOP;
  FOREACH s IN ARRAY ARRAY['PAID','FULFILLING','SHIPPED','DELIVERED'] LOOP
    UPDATE orders SET status=s;
    IF NOT seller_owns_post_payment_order_line('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') THEN RAISE EXCEPTION 'eligible read denied: %',s; END IF;
    SELECT count(*) INTO n FROM seller_active_return_indicators(ARRAY['cccccccc-cccc-4ccc-8ccc-cccccccccccc']::uuid[]);
    IF n<>1 THEN RAISE EXCEPTION 'eligible return indicator denied: %',s; END IF;
    IF s IN ('SHIPPED','DELIVERED') THEN
      failed:=false;
      BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN SQLSTATE 'P0002' THEN failed:=true; END;
      IF NOT failed THEN RAISE EXCEPTION 'late fulfilment admitted: %',s; END IF;
    END IF;
  END LOOP;
  UPDATE orders SET status='PAID';
  PERFORM set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
  IF seller_owns_post_payment_order_line('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') THEN RAISE EXCEPTION 'foreign seller read'; END IF;
  failed:=false;
  BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN SQLSTATE 'P0002' THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'foreign seller action'; END IF;
  FOREACH s IN ARRAY ARRAY['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'] LOOP
    PERFORM set_config('request.jwt.claim.sub',s,true);failed:=false;
    BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN insufficient_privilege THEN failed:=true; END;
    IF NOT failed THEN RAISE EXCEPTION 'buyer/admin action admitted'; END IF;
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub','',true); failed:=false;
  BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN insufficient_privilege THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'anonymous admitted'; END IF;
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
  SELECT count(*) INTO before_events FROM order_item_events;
  FOREACH s IN ARRAY ARRAY['ACCEPTED','PACKED','HANDED_TO_DELIVERY'] LOOP
    PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE',s,'QA local lifecycle');
  END LOOP;
  SELECT count(*) INTO n FROM order_item_events;
  IF n<>before_events+3 THEN RAISE EXCEPTION 'event count'; END IF;
  failed:=false;
  BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADVANCE','ACCEPTED',NULL); EXCEPTION WHEN invalid_parameter_value THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'invalid ladder'; END IF;
  PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADD_NOTE',NULL,'Local note');
  UPDATE orders SET status='CANCELLED'; failed:=false;
  BEGIN PERFORM seller_update_line_fulfilment('cccccccc-cccc-4ccc-8ccc-cccccccccccc','ADD_NOTE',NULL,'Cannot mutate cancelled'); EXCEPTION WHEN SQLSTATE 'P0002' THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'cancelled note admitted'; END IF;
END $test$;
