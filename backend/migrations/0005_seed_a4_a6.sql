-- 0005_seed_a4_a6.sql : demo content written for this clone (not copied from anywhere)

-- ------------------------------------------------------------------ articles
INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a4', u.id, DATE '2026-10-08', 'published', 4, '每日深度', 'THE DAILY',
       '数据飞轮还是数据债',
       'Data Flywheel or Data Debt',
       '每家公司都在收集数据，但只有少数几家把它变成了资产，其余的只是把账记在了未来。',
       'Every company collects data, but only a few turn it into an asset. The rest file the bill for later.',
       '/images/covers/cover-a4.svg', '#123f35', 10, 12, now()
FROM users u WHERE u.email='lin@aifa.one';

INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a5', u.id, DATE '2026-10-09', 'published', 5, '每日深度', 'THE DAILY',
       '小模型的反击：边缘端的算力账',
       'The Small Model Strikes Back',
       '当一个 3B 模型能干八成的活，架构师的问题就从"用哪个模型"变成了"放在哪跑"。',
       'When a 3B model does four fifths of the work, the architect''s question shifts from which model to where it runs.',
       '/images/covers/cover-a5.svg', '#3d2b4f', 8, 10, now()
FROM users u WHERE u.email='lin@aifa.one';

INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a6', u.id, DATE '2026-10-10', 'published', 6, '每日深度', 'THE DAILY',
       '订阅制之后，AI 的下一个收费姿势',
       'After Subscriptions: How AI Charges Next',
       '按席位、按结果、按省下的时间，三种定价正在同一年里抢同一批预算。',
       'Per seat, per outcome, per hour saved: three pricing models are chasing the same budget in the same year.',
       '/images/covers/cover-a6.svg', '#5c3018', 9, 11, now()
FROM users u WHERE u.email='lin@aifa.one';

-- pages ------------------------------------------------------------------
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a4';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a4';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a4';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a4';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 5, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a4';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 6, 'back_cover', '', '' FROM articles a WHERE a.slug='a4';

INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a5';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a5';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a5';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a5';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 5, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a5';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 6, 'back_cover', '', '' FROM articles a WHERE a.slug='a5';

INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a6';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a6';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a6';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a6';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 5, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a6';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 6, 'back_cover', '', '' FROM articles a WHERE a.slug='a6';

-- blocks: article a4 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'media', 'picture', 'image', 'full', 0, '',
       jsonb_build_object('alt', jsonb_build_object('zh','一张账簿上并排的两列：资产与债','en','A ledger with two columns side by side: asset and debt'),
                          'asset', jsonb_build_object('kind','asset','assetId','asset-a4-hero'),
                          'imageSrc', '/images/articles/a4-hero.svg',
                          'caption', jsonb_build_object('zh','示意图：同一份数据的两种记法。','en','Illustration: two ways of filing the same data.'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','飞轮只在回路闭合时转','en','The flywheel turns only when the loop closes'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','我们看了一家把"数据飞轮"写进融资材料的公司：它确实收集了每一单的全量日志，但三个月后回看，能直接喂给模型的不到百分之一。飞轮不是采集，是回路——采集、清洗、进训练、回到产品，四步少一步都不转。',
                          'en','We looked at a company that wrote "data flywheel" into its deck. It did log every transaction in full; three months later, less than one percent of it was fit to feed a model. A flywheel is not collection, it is a loop — collect, clean, train, ship back. Miss one step and it does not turn.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','02',
                          'sentence', jsonb_build_object('zh','多数团队欠的是标注的债','en','Most teams owe a labelling debt'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','第二步最常被跳过。日志堆在那里，没人定义什么叫"好样本"，于是每到要训练的时候，就得回头补三个月前的标注——这三个月的利息，就是一次又一次的手工返工。',
                          'en','The second step is the one most often skipped. Logs pile up, nobody defines what a good sample looks like, and so every training round means going back to label three months of history — the interest on that loan, paid in manual rework.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','把标注规则前置的团队，样本池通常小一半，但可用率高得多。数据债和现金债一样：不违约不等于没有利息。',
                          'en','Teams that write labelling rules up front usually keep a pool half the size, with a far higher usable rate. Data debt behaves like any other: not defaulting is not the same as paying no interest.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-1', 1, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','另一个信号是回流速度：从线上发现一个坏 case，到它出现在下一轮训练集里，花了多久？我们见到的中位数是十一周。',
                          'en','Another signal is turnaround: how long from spotting a bad case in production to seeing it in the next training set? The median we observed was eleven weeks.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','所以判断一家公司有没有飞轮，不必看它采集了多少，只要问一句：上周有多少条线上数据真的回到了模型里？',
                          'en','So you do not need to know how much a company collects to tell whether it has a flywheel. One question suffices: how much production data actually reached the model last week?')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-1', 1, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','样本','en','Sample'), 'detail', jsonb_build_object('zh','一家公司 · 三个月','en','One company · three months')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','10 分钟','en','10 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a4';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-2', 2, 'comments', 'comment-box', 'interactive', 'full', 3, '', '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a4';

-- blocks: article a5 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','边缘端的账本只有三行','en','The edge ledger has three lines'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','把一个 3B 模型放到设备侧，账只有三行：延迟、功耗、以及不再上云的那份数据。三行都变好，方案才成立；只好了两行，就要说清楚牺牲的那一行给了谁。',
                          'en','Put a 3B model on the device and the ledger has three lines: latency, power, and the data that no longer leaves the device. The case works only when all three improve; improve two and you must say who paid for the third.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','我们在一台旧款笔记本上跑了两周的本地摘要：响应从一点二秒降到两百毫秒，电池每小时多掉百分之四，而会议原文一次都没上云。',
                          'en','We ran local summarisation on an older laptop for two weeks: response fell from 1.2 seconds to 200 milliseconds, battery drain rose four points an hour, and not one transcript went to the cloud.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'media', 'picture', 'image', 'full', 0, '',
       jsonb_build_object('alt', jsonb_build_object('zh','设备侧与云端的延迟对比示意','en','Sketch: device-side latency against the cloud'),
                          'asset', jsonb_build_object('kind','asset','assetId','asset-a5-hero'),
                          'imageSrc', '/images/articles/a5-hero.svg',
                          'caption', jsonb_build_object('zh','示意图，非真实数据。','en','Illustration, not real data.'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','02',
                          'sentence', jsonb_build_object('zh','不是替换，是分工','en','Not a replacement, a division of labour'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','小模型没有赢大模型，它们赢的是"这一段"。路由层决定哪句话在哪跑，成本曲线才从阶梯变成斜坡——真正的工程量都在路由上，不在权重里。',
                          'en','Small models did not beat large ones; they won this one stretch. A routing layer decides where each sentence runs, and the cost curve turns from a staircase into a slope — the real engineering lives in the routing, not the weights.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-1', 1, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','风险也换了位置：设备侧的错误更难被看见，因为没有集中的日志。上线前要先想好，坏答案怎么回来。',
                          'en','The risk moves too: device-side errors are harder to see, because there is no central log. Decide before launch how a bad answer gets back to you.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','所以边缘部署的验收标准，不该是"能不能跑"，而是"坏了怎么知道"。',
                          'en','So the acceptance test for an edge deployment is not whether it runs, but how you find out when it breaks.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-1', 1, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','环境','en','Rig'), 'detail', jsonb_build_object('zh','一台旧款笔记本 · 两周','en','One older laptop · two weeks')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','8 分钟','en','8 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a5';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-2', 2, 'comments', 'comment-box', 'interactive', 'full', 3, '', '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a5';

-- blocks: article a6 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','三种定价，同一年','en','Three prices, one year'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','按席位收费最简单，也最先撞墙：当软件替人干活，席位数就不再等于产出。今年我们见到的迁移大多从这里开始——不是厂商想改，是客户先把账算明白了。',
                          'en','Per seat is the simplest price and hits the wall first: when software does the work, seats stop meaning output. Most migrations we saw this year start here — not because vendors wanted a change, but because customers did the arithmetic.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','按结果收费听起来最公平，但它要求两件事：结果可测量，以及责任可归属。缺任何一件，合同就会滑回按量计费。',
                          'en','Per outcome sounds fairest, but it demands two things: measurable outcomes and attributable responsibility. Lose either and the contract slides back to usage-based pricing.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','02',
                          'sentence', jsonb_build_object('zh','按省下的时间收费','en','Charging for hours returned'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','第三种是按省下的时间收费。它比按结果温和，比按席位诚实，但需要客户自己承认"这事以前要花四小时"——定价谈判因此变成了一场关于基线的谈判。',
                          'en','The third model charges for hours returned. It is gentler than per outcome and more honest than per seat, but it requires the customer to admit that this used to take four hours — so pricing becomes a negotiation about the baseline.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','三种模式不会互相消灭，它们会按部门分层：采购要席位，业务要结果，工程要用量。',
                          'en','The three will not kill each other; they will stratify by department. Procurement wants seats, the business wants outcomes, engineering wants usage.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-1', 1, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','对买方来说，可切换的合同才是好合同：先按席位起步，六个月后带着真实使用数据重谈一次。',
                          'en','For buyers, a contract you can switch is the good one: start per seat, then reopen it in six months with real usage data.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','对卖方来说，最难的从来不是定价本身，而是愿意在下一次续费时把价格改回去。',
                          'en','For sellers, the hard part was never the pricing — it is being willing to change the price back at renewal.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-1', 1, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','样本','en','Sample'), 'detail', jsonb_build_object('zh','十二份续费合同','en','Twelve renewal contracts')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','9 分钟','en','9 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a6';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-2', 2, 'comments', 'comment-box', 'interactive', 'full', 3, '', '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a6';

-- sources ----------------------------------------------------------------
INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en, title_zh, title_en, published_at, ord)
SELECT a.id, 's01', 'https://example.com/data-audit', 'Data Audit', 'Data Audit',
       '内部数据审计方法', 'How we run a data audit', '2026-08-30', 1
FROM articles a WHERE a.slug='a4';

INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en, title_zh, title_en, published_at, ord)
SELECT a.id, 's01', 'https://example.com/edge-notes', 'Edge Notes', 'Edge Notes',
       '设备侧推理测试记录', 'Notes from device-side inference tests', '2026-09-12', 1
FROM articles a WHERE a.slug='a5';

INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en, title_zh, title_en, published_at, ord)
SELECT a.id, 's01', 'https://example.com/pricing-notes', 'Pricing Notes', 'Pricing Notes',
       'AI 产品续费条款摘记', 'Notes on AI renewal terms', '2026-09-25', 1
FROM articles a WHERE a.slug='a6';
