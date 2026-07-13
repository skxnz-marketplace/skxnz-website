# Migration dependency graph

`0001 users/addresses -> external 0002 catalog (not tracked) -> 0003 admin helper -> 0004 seller policies -> 0005 commerce -> 0006 seller helper -> 0007 saved items -> 0008 returns RPC -> 0009 seller RPC -> 0010 admin RPC -> 0011 order intent RPC`.

Stop if the catalog baseline, products, variants, brands, seller_id, or 0005 tables are absent. 0008/0009/0010/0011 are draft-only and must not be partially applied.
