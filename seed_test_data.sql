DO $$
DECLARE
  a_id  uuid := 'd45da063-1364-491b-aee7-0e9363c56117';
  b_std uuid; b_prm uuid; b_lgd uuid;
  p_std uuid; p_prm uuid; p_lgd uuid;
  lid   uuid;
  i     int;

  s_fn     text[] := ARRAY['Marcus','Tamara','Anil','Priya','Jamal'];
  s_ln     text[] := ARRAY['Williams','Joseph','Rampersad','Mohammed','Clarke'];
  s_parish text[] := ARRAY['Point Fortin','Sangre Grande','Chaguanas','Diego Martin','San Fernando'];
  s_inc    int[]  := ARRAY[6000,5500,10000,18000,9500];
  s_emp    text[] := ARRAY['Private','Self Employed','Private','Government','Private'];
  s_age    int[]  := ARRAY[28,55,38,42,31];
  s_int    text[] := ARRAY['fb_ad','fb_ad','fb_ad','eligibility_quiz','fb_ad'];
  s_hrs    int[]  := ARRAY[72,40,36,8,40];
  s_brk    text[] := ARRAY['5000-8000','5000-8000','8000-15000','15000-25000','8000-15000'];

  p_fn     text[] := ARRAY['Christelle','Rohan','Kezia','Devika','Ricardo','Sasha','Omari','Parbatee','Clint','Renata','Vikash','Aaliyah','Darius','Simone','Andre','Tricia','Nathan','Carla','Bryan','Felicia'];
  p_ln     text[] := ARRAY['Baptiste','Dhanraj','Andrews','Persad','Charles','Singh','Taylor','Ali','Maharaj','Sookdeo','Alexander','Khan','Wilson','Ramkhelawan','Joseph','Mohammed','Clarke','Williams','Rampersad','Singh'];
  p_parish text[] := ARRAY['Maraval','Valsayn','Chaguanas','Diego Martin','San Fernando','Chaguanas','Maraval','Sangre Grande','Chaguanas','San Fernando','Maraval','Chaguanas','Arima','San Fernando','Diego Martin','Couva','Chaguanas','Diego Martin','San Fernando','Maraval'];
  p_inc    int[]  := ARRAY[12000,22000,11000,19000,13000,10500,16000,7000,14000,9000,21000,12500,8500,15000,20000,7500,13500,17500,11500,22500];
  p_emp    text[] := ARRAY['Private','Government','Private','Government','Private','Private','Medical','Self Employed','Private','Private','Private','Government','Private','Private','Government','Self Employed','Private','Private','Private','Legal'];
  p_age    int[]  := ARRAY[35,44,29,41,36,33,38,52,46,31,40,34,27,43,39,48,37,41,30,43];
  p_int    text[] := ARRAY['fb_ad','eligibility_quiz','fb_ad','eligibility_quiz','fb_ad','fb_ad','eligibility_quiz','fb_ad','eligibility_quiz','fb_ad','eligibility_quiz','fb_ad','fb_ad','pdf_download','eligibility_quiz','fb_ad','fb_ad','eligibility_quiz','fb_ad','eligibility_quiz'];
  p_hrs    int[]  := ARRAY[24,12,30,6,28,32,10,48,20,36,8,22,40,16,14,72,26,18,34,4];
  p_brk    text[] := ARRAY['8000-15000','15000-25000','8000-15000','15000-25000','8000-15000','8000-15000','15000-25000','5000-8000','8000-15000','8000-15000','15000-25000','8000-15000','8000-15000','15000-25000','15000-25000','5000-8000','8000-15000','15000-25000','8000-15000','15000-25000'];

  l_fn     text[] := ARRAY['Wayne','Shenelle','Gregory','Natasha','Derek','Camille','Jason','Priscilla','Damian','Sabrina','Philip','Monique','Carlton','Yvette','Andrew','Chantel','Marcus','Ingrid','Bradley','Tara'];
  l_ln     text[] := ARRAY['Fairweather','Rajkumar','Mouttet','Cowie','Chin','Villafana','Ramoutar','Bengochea','Farrell','Maraj','Rajah','Cyrus','Hadeed','Ottley','Lee Fook','Noreiga','Aboud','Hamel-Smith','Huggins','Alcazar'];
  l_parish text[] := ARRAY['Westmoorings','Valsayn','Fairways','Glencoe','Westmoorings','Moka','Valsayn','Westmoorings','Maraval','Diego Martin','Westmoorings','Valsayn','Diego Martin','Maraval','Westmoorings','Glencoe','Valsayn','Fairways','Diego Martin','Westmoorings'];
  l_inc    int[]  := ARRAY[35000,28000,45000,32000,30000,27000,25500,38000,22000,19000,18000,21000,16000,17500,20000,15000,14000,26000,22500,13000];
  l_emp    text[] := ARRAY['Government','Medical','Legal','Government','Government','Government','Medical','Legal','Private','Government','Government','Private','Government','Medical','Private','Private','Private','Government','Government','Private'];
  l_age    int[]  := ARRAY[37,42,40,38,44,36,43,39,35,41,47,33,45,38,34,40,42,37,39,36];
  l_int    text[] := ARRAY['eligibility_quiz','eligibility_quiz','quote_request','eligibility_quiz','eligibility_quiz','eligibility_quiz','eligibility_quiz','quote_request','eligibility_quiz','fb_ad','eligibility_quiz','fb_ad','eligibility_quiz','eligibility_quiz','fb_ad','pdf_download','eligibility_quiz','eligibility_quiz','eligibility_quiz','fb_ad'];
  l_hrs    int[]  := ARRAY[1,1,0,1,1,1,1,0,6,8,12,10,4,8,14,20,6,1,10,24];
  l_brk    text[] := ARRAY['25000+','25000+','25000+','25000+','25000+','25000+','25000+','25000+','15000-25000','15000-25000','15000-25000','15000-25000','15000-25000','15000-25000','15000-25000','8000-15000','8000-15000','25000+','15000-25000','8000-15000'];
  l_lgd    bool[] := ARRAY[true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false,false,true,false,false];
BEGIN
  -- Wallet top-up to TT$10,000 (1,000,000 cents)
  UPDATE agents SET wallet_balance = 1000000 WHERE id = a_id;
  INSERT INTO wallet_transactions (agent_id, amount, tx_type, balance_after, gateway_ref)
    VALUES (a_id, 1000000, 'TOP_UP', 1000000, 'SEED-TOPUP-001');

  -- Lead batches
  INSERT INTO lead_batches (uploaded_by, income_tier) VALUES (a_id, 'STANDARD')  RETURNING id INTO b_std;
  INSERT INTO lead_batches (uploaded_by, income_tier) VALUES (a_id, 'STANDARD')  RETURNING id INTO b_prm;
  INSERT INTO lead_batches (uploaded_by, income_tier) VALUES (a_id, 'LEGENDARY') RETURNING id INTO b_lgd;

  -- Packs
  INSERT INTO packs (pack_label, pack_type, status, lead_batch_id, price_ttd, buyer_count, max_buyers, pack_name, pack_size)
    VALUES ('A','COMMUNITY','AVAILABLE',b_std, 15000,0,3,'STANDARD', 5)  RETURNING id INTO p_std;
  INSERT INTO packs (pack_label, pack_type, status, lead_batch_id, price_ttd, buyer_count, max_buyers, pack_name, pack_size)
    VALUES ('B','COMMUNITY','AVAILABLE',b_prm, 60000,0,3,'PREMIUM',  20) RETURNING id INTO p_prm;
  INSERT INTO packs (pack_label, pack_type, status, lead_batch_id, price_ttd, buyer_count, max_buyers, pack_name, pack_size)
    VALUES ('C','EXCLUSIVE','AVAILABLE',b_lgd,200000,0,1,'LEGENDARY',20) RETURNING id INTO p_lgd;

  -- Standard leads (5)
  FOR i IN 1..5 LOOP
    lid := gen_random_uuid();
    INSERT INTO leads (id, lead_batch_id, source, income_bracket, is_legendary, purchase_count, max_purchases, fact_find, lead_stats, calculated_ovr, created_at, status)
    VALUES (lid, b_std, s_int[i], s_brk[i], false, 0, 3,
      jsonb_build_object('first_name',s_fn[i],'last_name',s_ln[i],'parish',s_parish[i],
        'monthly_income',s_inc[i],'employer_type',s_emp[i],'age',s_age[i],'intent_source',s_int[i]),
      '{}', 0, NOW() - (s_hrs[i]::text || ' hours')::interval, 'in_pack');
    INSERT INTO pack_leads (pack_id, lead_id, position) VALUES (p_std, lid, i);
  END LOOP;

  -- Premium leads (20)
  FOR i IN 1..20 LOOP
    lid := gen_random_uuid();
    INSERT INTO leads (id, lead_batch_id, source, income_bracket, is_legendary, purchase_count, max_purchases, fact_find, lead_stats, calculated_ovr, created_at, status)
    VALUES (lid, b_prm, p_int[i], p_brk[i], false, 0, 3,
      jsonb_build_object('first_name',p_fn[i],'last_name',p_ln[i],'parish',p_parish[i],
        'monthly_income',p_inc[i],'employer_type',p_emp[i],'age',p_age[i],'intent_source',p_int[i]),
      '{}', 0, NOW() - (p_hrs[i]::text || ' hours')::interval, 'in_pack');
    INSERT INTO pack_leads (pack_id, lead_id, position) VALUES (p_prm, lid, i);
  END LOOP;

  -- Legendary leads (20: 8 Legendary-tier + 12 Gold-tier)
  FOR i IN 1..20 LOOP
    lid := gen_random_uuid();
    INSERT INTO leads (id, lead_batch_id, source, income_bracket, is_legendary, purchase_count, max_purchases, fact_find, lead_stats, calculated_ovr, created_at, status)
    VALUES (lid, b_lgd, l_int[i], l_brk[i], l_lgd[i], 0, 1,
      jsonb_build_object('first_name',l_fn[i],'last_name',l_ln[i],'parish',l_parish[i],
        'monthly_income',l_inc[i],'employer_type',l_emp[i],'age',l_age[i],'intent_source',l_int[i]),
      '{}', 0, NOW() - (l_hrs[i]::text || ' hours')::interval, 'in_pack');
    INSERT INTO pack_leads (pack_id, lead_id, position) VALUES (p_lgd, lid, i);
  END LOOP;

  RAISE NOTICE 'Seeded OK — wallet: TT$10,000 | std: % | prm: % | lgd: %', p_std, p_prm, p_lgd;
END;
$$;
