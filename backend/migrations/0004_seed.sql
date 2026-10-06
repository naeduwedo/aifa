-- 0004_seed.sql : demo content written for this clone (not copied from anywhere)

-- ------------------------------------------------------------------ users
INSERT INTO users (email, display_name, title, avatar_url, bio, role, verified, is_author, locale)
VALUES ('lin@aifa.one', '林知远', 'AIFA 研究负责人、专栏作者',
        '/media/authors/lin-zhiyuan.svg',
        '关注算力、模型与产业落地，长期记录 AI 基础设施的变化。',
        'author', TRUE, TRUE, 'zh')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, display_name, title, avatar_url, bio, role, verified, is_author, locale)
VALUES ('desk@aifa.one', 'AIFA 编辑部', 'AIFA EDITORIAL DESK',
        '/media/authors/editorial-desk.svg', '', 'author', TRUE, TRUE, 'en')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------------ articles
INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a1', u.id, DATE '2026-10-05', 'published', 1, '每日深度', 'THE DAILY',
       '小团队用上 AI 之后，分工怎么重排',
       'How Small Teams Redraw the Map of Work',
       '三个人的公司也能像三十个人那样运转，前提是把"谁做什么"重新写一遍。我们跟着两支团队记录了六周。',
       'Three people can move like thirty — but only after the map of who-does-what is redrawn. We followed two teams for six weeks.',
       '/images/covers/cover-a1.svg', '#12324a', 9, 11, now()
FROM users u WHERE u.email='lin@aifa.one';

INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a2', u.id, DATE '2026-10-06', 'published', 2, '每日深度', 'THE DAILY',
       '算力的账本：训练一次到底花在哪',
       'The Compute Ledger: Where Training Money Actually Goes',
       '把一次大规模训练拆成电费、机时、失败重跑三栏，账就清楚了。',
       'Split one large training run into power, machine time and failed restarts, and the bill suddenly makes sense.',
       '/images/covers/cover-a2.svg', '#2c2a20', 7, 9, now()
FROM users u WHERE u.email='lin@aifa.one';

INSERT INTO articles (slug, author_id, date, status, issue_no, kicker_zh, kicker_en,
                      title_zh, title_en, dek_zh, dek_en, cover_image, cover_accent,
                      reading_zh, reading_en, published_at)
SELECT 'a3', u.id, DATE '2026-10-07', 'published', 3, '每日深度', 'THE DAILY',
       '模型变便宜之后，产品该往哪儿长',
       'After Inference Got Cheap, Where Should the Product Grow?',
       '价格下降从来不是终点，它只是把问题推回到"用户到底要什么"。',
       'A price cut is never the finish line; it only pushes the question back to what people actually want.',
       '/images/covers/cover-a3.svg', '#4a1f2b', 8, 10, now()
FROM users u WHERE u.email='lin@aifa.one';

-- pages ------------------------------------------------------------------
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a1';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a1';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a1';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a1';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 5, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a1';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 6, 'back_cover', '', '' FROM articles a WHERE a.slug='a1';

INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a2';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a2';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a2';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'back_cover', '', '' FROM articles a WHERE a.slug='a2';

INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en, title_zh, title_en, dek_zh, dek_en)
SELECT a.id, 1, 'cover', a.kicker_zh, a.kicker_en, a.title_zh, a.title_en, a.dek_zh, a.dek_en
FROM articles a WHERE a.slug='a3';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 2, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a3';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 3, 'content', a.kicker_zh, a.kicker_en FROM articles a WHERE a.slug='a3';
INSERT INTO article_pages (article_id, page_no, role, section_zh, section_en)
SELECT a.id, 4, 'back_cover', '', '' FROM articles a WHERE a.slug='a3';

-- blocks: article a1 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'media', 'picture', 'image', 'full', 0, '',
       jsonb_build_object('alt', jsonb_build_object('zh','团队白板前的一次分工讨论','en','A team re-drawing ownership on a whiteboard'),
                          'asset', jsonb_build_object('kind','asset','assetId','asset-a1-hero'),
                          'imageSrc', '/images/articles/a1-hero.svg',
                          'caption', jsonb_build_object('zh','示意图：一次两小时的分工重排。','en','Illustration: a two-hour ownership reset.'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','先把"谁签字"写下来','en','Write down who signs off first'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','工具变强之后，第一件被冲掉的通常不是人，而是流程里那些"默认由某个人做"的环节。我们记录的第一支团队有三个人，他们花了两周才承认：原来每个人都在等别人先动手。',
                          'en','When the tool gets stronger, the first thing to break is rarely a person. It is the step that used to be "someone probably owns this". The first team we followed has three people, and it took them two weeks to admit that everyone was waiting for someone else to start.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','02',
                          'sentence', jsonb_build_object('zh','把失败也算进成本','en','Count the failures as a cost'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','第二支团队把每周五下午定为"重排时间"：谁这周被卡住、谁在做别人的工作、哪一步其实可以删掉。六周之后，他们的交付节奏没有变快，但返工少了一半。',
                          'en','The second team set aside Friday afternoons to redraw the map: who got stuck, who did someone else''s work, which step could simply be dropped. Six weeks later the delivery pace had not changed, but rework had halved.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','真正省下来的不是时间，是"决定谁来做"这件事本身的开销。',
                          'en','What actually gets cheaper is not time. It is the cost of deciding who does it.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-1', 1, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','把这两支团队放在一起看，会发现一个共同点：他们都先把"责任"改了，再换工具。顺序反过来的那支（我们也在记录）目前进展最慢。',
                          'en','Put the two teams side by side and one thing stands out: both changed ownership before they changed tools. The team that did it the other way round — we are following them too — is currently the slowest.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','所以下次有人问"这个工具能省多少人"，可以先换一个问题：你们上一次修改分工表是什么时候？',
                          'en','So the next time somebody asks how many people a tool can save, try a different question: when did you last change the table of who owns what?')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-1', 1, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','记录周期','en','Field window'), 'detail', jsonb_build_object('zh','六周','en','Six weeks')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','9 分钟','en','9 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a1';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '5-2', 2, 'comments', 'comment-box', 'interactive', 'full', 3, '',
       '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=5
WHERE a.slug='a1';

-- blocks: article a2 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','三栏账','en','Three columns of the bill'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','训练成本常被报成一个总数，但对做预算的人没有用。真正能决策的分法只有三种：电、机时、以及那些没跑完就被丢掉的实验。',
                          'en','Training cost is usually reported as a single number, which is useless to anyone setting a budget. There are only three ways to cut it that lead to a decision: power, machine time, and the experiments thrown away before they finished.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','02',
                          'sentence', jsonb_build_object('zh','失败重跑是最贵的一栏','en','Failed runs are the expensive column'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','我们看到的一支团队，把一成的机时用在了重复跑同一个配置上。把这一步挪到小规模验证之后，同样的预算多做了近三成的尝试。',
                          'en','One team we watched spent a tenth of its machine time re-running the same configuration. Moving that check to a small-scale pass first let the same budget cover almost a third more attempts.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'media', 'picture', 'image', 'full', 0, '',
       jsonb_build_object('alt', jsonb_build_object('zh','机时与电费的占比示意','en','A sketch of machine time against power cost'),
                          'asset', jsonb_build_object('kind','asset','assetId','asset-a2-chart'),
                          'imageSrc', '/images/articles/a2-chart.svg',
                          'caption', jsonb_build_object('zh','示意图，非真实数据。','en','Illustration, not real data.'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-1', 1, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','7 分钟','en','7 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a2';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '4-2', 2, 'comments', 'comment-box', 'interactive', 'full', 3, '', '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=4
WHERE a.slug='a2';

-- blocks: article a3 ------------------------------------------------------
INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '1-1', 1, 'heading', 'title', 'text', 'full', 0, 'kicker',
       jsonb_build_object('kicker', jsonb_build_object('zh', a.kicker_zh, 'en', a.kicker_en),
                          'text', jsonb_build_object('zh', a.title_zh, 'en', a.title_en),
                          'sub', jsonb_build_object('zh', a.dek_zh, 'en', a.dek_en))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=1
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-1', 1, 'chapter', 'chapter-head', 'text', 'full', 0, '',
       jsonb_build_object('ordinal','01',
                          'sentence', jsonb_build_object('zh','便宜之后的三个方向','en','Three directions after the price drop'))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '2-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','推理价格下降之后，产品通常会往三个方向长：把原来不敢开的默认打开、把原来只给一个人用的变成团队一起用、把原来一次性的变成每天跑的。',
                          'en','After inference gets cheaper, products tend to grow in three directions: turn on the defaults you used to be afraid of, move from one person to the whole team, and turn a one-off feature into something that runs every day.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=2
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-1', 1, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','这三个方向里，第一个最容易做也最容易被高估。默认打开会带来使用量，但不会带来留存；真正决定留存的是第二个方向——当一个工具从个人扩展到团队，权限、记录和协作会立刻变成新的门槛。',
                          'en','Of the three, the first is easiest to ship and easiest to overrate. Turning defaults on brings usage, but not retention. Retention lives in the second direction: the moment a tool spreads from one person to a team, permissions, history and collaboration become the new gate.')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-2', 2, 'body', 'paragraph', 'text', 'full', 0, '',
       jsonb_build_object('zh','所以判断一个 AI 产品是不是真的长大了，可以只看一件事：它有没有开始被第二个人打开。',
                          'en','So there is one test for whether an AI product has really grown up: does a second person ever open it?')::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-3', 3, 'colophon', 'imprint', 'text', 'full', 0, '',
       jsonb_build_array(
         jsonb_build_object('term', jsonb_build_object('zh','作者','en','Author'), 'detail', jsonb_build_object('zh','林知远','en','Zhiyuan Lin')),
         jsonb_build_object('term', jsonb_build_object('zh','阅读时间','en','Reading time'), 'detail', jsonb_build_object('zh','8 分钟','en','8 minutes')))::text::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a3';

INSERT INTO blocks (article_id, page_id, block_no, ord, type, variant, class_name, width, rows, preset, content)
SELECT a.id, p.id, '3-4', 4, 'comments', 'comment-box', 'interactive', 'full', 3, '', '{}'::jsonb
FROM articles a JOIN article_pages p ON p.article_id=a.id AND p.page_no=3
WHERE a.slug='a3';

-- sources ----------------------------------------------------------------
INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en, title_zh, title_en, published_at, ord)
SELECT a.id, 's01', 'https://example.com/field-notes', 'Field Notes', 'Field Notes',
       '团队分工记录方法', 'How we log ownership changes', '2026-08-14', 1
FROM articles a WHERE a.slug='a1';

INSERT INTO article_sources (article_id, source_key, url, name_zh, name_en, title_zh, title_en, published_at, ord)
SELECT a.id, 's01', 'https://example.com/power-prices', 'Power Watch', 'Power Watch',
       '数据中心电价季度表', 'Quarterly data-centre power prices', '2026-07-02', 1
FROM articles a WHERE a.slug='a2';

-- ------------------------------------------------------------------ research
INSERT INTO research_resources (slug, category_zh, category_en, title_zh, title_en, desc_zh, desc_en,
                                purpose_zh, purpose_en, scope_zh, scope_en, edition, published_at,
                                page_count, access_level, featured, cover, assets)
VALUES (
  'ai-education-evaluation-v1',
  '白皮书', 'WHITE PAPER',
  'AI 教学能力评估白皮书 V1.0',
  'AI Teaching Capability White Paper V1.0',
  '一套用于判断机构 AI 教学能力的框架：十项硬门槛、一个百分制综合分，以及一份可直接使用的评分表。',
  'A framework for judging an institution''s AI teaching capability: ten hard gates, a 100-point integrated score and a scorecard you can use as-is.',
  '帮助机构自查，也帮助家长与合作方看懂差异。',
  'So institutions can audit themselves, and families and partners can read the difference.',
  '覆盖课程设计、师资、评估与安全。',
  'Covers course design, faculty, assessment and safety.',
  'V1.0 · September 2026', DATE '2026-09-18', 12, 'free', TRUE,
  jsonb_build_object('background','#13253a','foreground','#f4efe5','accent','#a17836','motif','framework',
                     'image','/images/research/whitepaper-cover.svg')::text::jsonb,
  jsonb_build_array(jsonb_build_object('id','zh-pdf','label', jsonb_build_object('zh','中文白皮书','en','CHINESE WHITE PAPER'),
                     'language','zh','format','pdf','fileName','AIFA_AI教学能力评估白皮书_V1.0.pdf'))::text::jsonb
);


INSERT INTO research_resources (slug, category_zh, category_en, title_zh, title_en, desc_zh, desc_en,
                                purpose_zh, purpose_en, scope_zh, scope_en, edition, published_at,
                                page_count, access_level, featured, cover, assets)
VALUES (
  'provider-scorecard-v1',
  '评估工具', 'EVALUATION TOOL',
  '机构评估记分卡 V1.0',
  'Provider Evaluation Scorecard V1.0',
  '一页纸记分卡：把白皮书里的十个门槛变成可勾选的检查项，适合评审会现场使用。',
  'A one-page scorecard that turns the white paper''s ten gates into tickable checks, made for review meetings.',
  '让评审在一张纸上对齐。',
  'So a review can align on a single sheet.',
  '适用于自评与第三方评审。',
  'For self-review and third-party review alike.',
  'V1.0 · September 2026', DATE '2026-09-18', 4, 'free', FALSE,
  jsonb_build_object('background','#20211c','foreground','#efe9dd','accent','#a17836','motif','scoreGrid',
                     'image','/images/research/scorecard-cover.svg')::text::jsonb,
  jsonb_build_array(jsonb_build_object('id','en-pdf','label', jsonb_build_object('zh','英文记分卡','en','ENGLISH SCORECARD'),
                     'language','en','format','pdf','fileName','AIFA_Provider_Scorecard_V1.0.pdf'))::text::jsonb
);

-- ------------------------------------------------------------------ academy
INSERT INTO academy_shelves (id, idx, title_zh, title_en, desc_zh, desc_en, ord) VALUES
 ('youth','01','青少年','YOUTH',
  '面向中学生与家长：编程与算法、科研与项目制课程，由合作机构授课，费用按级别确认。',
  'For secondary-school students and parents: coding and algorithms, research and project courses, taught by partner institutions and priced by level.', 1),
 ('professional','02','成人','PROFESSIONAL',
  '面向职场人与创业者：行业圆桌、个人品牌课程与十二周通识课，其中两门可直接报名。',
  'For working people and founders: a roundtable membership, a personal-brand course and a twelve-week general program, two of them bookable directly.', 2),
 ('degree-credits','03','证书与学分','CERTIFICATES & CREDITS',
  '需要正式学习记录的人：这里颁发的是证书而非学位，学分与转学分条件以各项目说明为准。',
  'For learners who need a formal record: these programs award a certificate, not a degree, and credit transfer follows each program''s own rules.', 3);

INSERT INTO academy_courses (id, shelf_id, name_zh, name_en, inst_zh, inst_en, position_zh, position_en,
                             tag_zh, tag_en, fields, price, cover, action, relationship, ord) VALUES
('code-camp','youth','少年编程与算法营','Junior Coding & Algorithms Camp','合作机构','Partner institution',
 '从图形化编程过渡到算法竞赛入门，按级别编班。',
 'From block programming into the first rungs of competitive algorithms, grouped by level.',
 '青少年 · 编程','YOUTH · CODING',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','6–12 年级学生与家长','en','Students in grades 6–12 and their parents')),
   jsonb_build_object('key','length','label',jsonb_build_object('zh','课长','en','DURATION'),
     'value',jsonb_build_object('zh','按学期开班，具体时间咨询时确认','en','Term-based intakes; dates confirmed on enquiry')),
   jsonb_build_object('key','price','label',jsonb_build_object('zh','价格','en','PRICE'),
     'value',jsonb_build_object('zh','按级别报价，咨询时确认','en','Priced by course level; confirmed on enquiry'),'source','enquiry')
 )::text::jsonb,
 jsonb_build_object('amount',null,'currency','USD','display',jsonb_build_object('zh','咨询时确认','en','Confirmed on enquiry'))::text::jsonb,
 jsonb_build_object('src','/images/academy/code-camp.svg','alt',jsonb_build_object('zh','编程课示意图','en','Coding class illustration'),
                    'eyebrow',jsonb_build_object('zh','青少年 · 编程','en','YOUTH · CODING'))::text::jsonb,
 'consultation','certified-partner',1),

('research-camp','youth','科研与项目制课程','Research & Project Program','合作机构','Partner institution',
 '在导师带领下完成一个可展示的小课题与报告。',
 'A small, presentable study and report, supervised from question to draft.',
 '青少年 · 科研','YOUTH · RESEARCH',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','希望积累作品集的中学生','en','Secondary students building a portfolio')),
   jsonb_build_object('key','length','label',jsonb_build_object('zh','课长','en','DURATION'),
     'value',jsonb_build_object('zh','按项目周期','en','Project-length, by intake')),
   jsonb_build_object('key','price','label',jsonb_build_object('zh','价格','en','PRICE'),
     'value',jsonb_build_object('zh','按项目报价，咨询时确认','en','Priced by project; confirmed on enquiry'),'source','enquiry')
 )::text::jsonb,
 jsonb_build_object('amount',null,'currency','USD','display',jsonb_build_object('zh','咨询时确认','en','Confirmed on enquiry'))::text::jsonb,
 jsonb_build_object('src','/images/academy/research-camp.svg','alt',jsonb_build_object('zh','科研课示意图','en','Research class illustration'),
                    'eyebrow',jsonb_build_object('zh','青少年 · 科研','en','YOUTH · RESEARCH'))::text::jsonb,
 'consultation','certified-partner',2),

('roundtable','professional','行业圆桌会员','Industry Roundtable Membership','AIFA','AIFA',
 '每月一次闭门圆桌，围绕一个真实问题给出可执行的结论。',
 'A monthly closed-door roundtable that ends with an actionable answer to one real question.',
 '成人 · 会员','PROFESSIONAL · MEMBERSHIP',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','创始人与业务负责人','en','Founders and business leads')),
   jsonb_build_object('key','length','label',jsonb_build_object('zh','课长','en','DURATION'),
     'value',jsonb_build_object('zh','12 个月 · 24 场','en','12 months · 24 roundtables')),
   jsonb_build_object('key','price','label',jsonb_build_object('zh','价格','en','PRICE'),
     'value',jsonb_build_object('zh','US$360 / 年','en','US$360 a year'),'source','price')
 )::text::jsonb,
 jsonb_build_object('amount',360,'currency','USD','display',jsonb_build_object('zh','US$360','en','US$360'))::text::jsonb,
 jsonb_build_object('src','/images/academy/roundtable.svg','alt',jsonb_build_object('zh','圆桌会议示意图','en','Roundtable illustration'),
                    'eyebrow',jsonb_build_object('zh','成人 · 会员','en','PROFESSIONAL · MEMBERSHIP'))::text::jsonb,
 'direct-enrollment','first-party',1),

('personal-ip','professional','AI 个人品牌课','AI Personal IP Course','AIFA','AIFA',
 '六周内把一个专业方向做成可持续的内容与产品。',
 'Turn one area of expertise into a repeatable content and product loop in six weeks.',
 '成人 · 课程','PROFESSIONAL · COURSE',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','想建立个人品牌的从业者','en','Practitioners building a personal brand')),
   jsonb_build_object('key','length','label',jsonb_build_object('zh','课长','en','DURATION'),
     'value',jsonb_build_object('zh','6 周 · 12 次','en','6 weeks · 12 sessions')),
   jsonb_build_object('key','price','label',jsonb_build_object('zh','价格','en','PRICE'),
     'value',jsonb_build_object('zh','US$980','en','US$980'),'source','price')
 )::text::jsonb,
 jsonb_build_object('amount',980,'currency','USD','display',jsonb_build_object('zh','US$980','en','US$980'))::text::jsonb,
 jsonb_build_object('src','/images/academy/personal-ip.svg','alt',jsonb_build_object('zh','个人品牌课示意图','en','Personal IP illustration'),
                    'eyebrow',jsonb_build_object('zh','成人 · 课程','en','PROFESSIONAL · COURSE'))::text::jsonb,
 'direct-enrollment','first-party',2),

('general-12w','professional','十二周 AI 通识课','Twelve-Week AI General Program','AIFA','AIFA',
 '给非技术团队的系统入门：原理、边界、成本与落地。',
 'A systematic entry for non-technical teams: principles, limits, cost and rollout.',
 '成人 · 课程','PROFESSIONAL · COURSE',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','产品、运营与管理岗','en','Product, operations and management roles')),
   jsonb_build_object('key','length','label',jsonb_build_object('zh','课长','en','DURATION'),
     'value',jsonb_build_object('zh','12 周 · 24 次','en','12 weeks · 24 sessions')),
   jsonb_build_object('key','price','label',jsonb_build_object('zh','价格','en','PRICE'),
     'value',jsonb_build_object('zh','US$1,680','en','US$1,680'),'source','price')
 )::text::jsonb,
 jsonb_build_object('amount',1680,'currency','USD','display',jsonb_build_object('zh','US$1,680','en','US$1,680'))::text::jsonb,
 jsonb_build_object('src','/images/academy/general-12w.svg','alt',jsonb_build_object('zh','通识课示意图','en','General program illustration'),
                    'eyebrow',jsonb_build_object('zh','成人 · 课程','en','PROFESSIONAL · COURSE'))::text::jsonb,
 'consultation','first-party',3),

('certificate-12','degree-credits','十二学分证书项目','Twelve-Credit Certificate','合作院校','Partner institution',
 '修满十二学分并提交结业作品，颁发证书；学分是否转入他校由接收方审核。',
 'Twelve credits plus a capstone, ending in a certificate; transfer is decided by the receiving institution.',
 '证书与学分','CERTIFICATES & CREDITS',
 jsonb_build_array(
   jsonb_build_object('key','who','label',jsonb_build_object('zh','适合人群','en','AUDIENCE'),
     'value',jsonb_build_object('zh','需要正式学习记录的成人学习者','en','Adult learners needing a formal record')),
   jsonb_build_object('key','credential','label',jsonb_build_object('zh','凭证','en','CREDENTIAL'),
     'value',jsonb_build_object('zh','证书（非学位）','en','Certificate (not a degree)')),
   jsonb_build_object('key','credits','label',jsonb_build_object('zh','学分','en','CREDITS'),
     'value',jsonb_build_object('zh','12 学分','en','12 credits')),
   jsonb_build_object('key','creditTransfer','label',jsonb_build_object('zh','转学分','en','CREDIT TRANSFER'),
     'value',jsonb_build_object('zh','由接收院校审核，不自动转入','en','Reviewed by the receiving institution; never automatic'))
 )::text::jsonb,
 jsonb_build_object('amount',11760,'currency','USD','display',jsonb_build_object('zh','US$11,760 学费 + US$90 注册费','en','US$11,760 tuition + US$90 registration'))::text::jsonb,
 jsonb_build_object('src','/images/academy/certificate.svg','alt',jsonb_build_object('zh','证书项目示意图','en','Certificate program illustration'),
                    'eyebrow',jsonb_build_object('zh','证书与学分','en','CERTIFICATES & CREDITS'))::text::jsonb,
 'consultation','certified-partner',1);

-- ------------------------------------------------------------------ go global
INSERT INTO go_global_activities (id, ord, copy, services, hero, images) VALUES
('ces-2028', 1,
 jsonb_build_object(
   'en', jsonb_build_object(
     'edition','AIFA GLOBAL ROUTE · 01',
     'eyebrow','CES 2028 · LAS VEGAS · JANUARY 2028',
     'titleLead','AI GOES', 'titleTail','GLOBAL',
     'introduction','For teams heading into North America: one week on the show floor, inside companies and at investor tables.',
     'routeFrom','CHINA','routeTo','LAS VEGAS',
     'points', jsonb_build_array(
       'Three guided days on the CES floor',
       'Four company visits and one investor evening',
       'Two networking receptions with founders and funds'),
     'requestAdvice','CHAT WITH AN ADVISER',
     'routeManifest','ROUTE HIGHLIGHTS',
     'delegation','LED WITH THE CHINA ELECTRONICS CHAMBER OF COMMERCE',
     'partner','PARTNER: BAYPORT DIGITAL HUB',
     'stories','DISPATCHES','services','DEPARTURE DESK',
     'servicesIntroduction','Three ways to take part, from a single trip to a scoped advisory.',
     'complianceNote','Dates, venues and company visits are confirmed per intake.',
     'photoCount','{count} PHOTOS','galleryLabel','Exhibitions and industry visits'),
   'zh', jsonb_build_object(
     'edition','AIFA 出海路线 · 01',
     'eyebrow','CES 2028 · 美国拉斯维加斯 · 2028 年 1 月',
     'titleLead','AI 出海','titleTail','第一站',
     'introduction','面向准备进入北美的团队：一周时间，看展、进企业、坐到投资人桌上。',
     'routeFrom','中国','routeTo','拉斯维加斯',
     'points', jsonb_build_array(
       'CES 展馆三天带看',
       '四家企业参访与一场投资者之夜',
       '两场与创始人、基金的对接酒会'),
     'requestAdvice','在线咨询',
     'routeManifest','行程亮点',
     'delegation','联合带队：中国电子商会',
     'partner','合作伙伴：湾品汇 BayPort Digital Hub',
     'stories','出海观察','services','出海服务',
     'servicesIntroduction','三种参与方式，从一次随团到按项目范围的咨询。',
     'complianceNote','日期、场地与企业参访按批次确认。',
     'photoCount','{count} 张照片','galleryLabel','展会与产业现场'))::text::jsonb,
 jsonb_build_array(
   jsonb_build_object('id','ces',   'label', jsonb_build_object('zh','CES 参展与游学 · 三天在展馆、企业与投资人之间','en','CES EXHIBITION & STUDY TOUR · THREE DAYS ON THE FLOOR, INSIDE COMPANIES AND WITH INVESTORS')),
   jsonb_build_object('id','bootcamp','label', jsonb_build_object('zh','出海训练营 · 市场、渠道与合规，几天内讲清楚','en','GO-GLOBAL BOOTCAMP · MARKET, CHANNELS AND COMPLIANCE, WORKED THROUGH IN DAYS')),
   jsonb_build_object('id','advisory','label', jsonb_build_object('zh','企业出海咨询 · 按项目范围，从选市场到落地','en','ENTERPRISE ADVISORY · SCOPED TO YOUR PROJECT, FROM MARKET CHOICE TO SETUP'))
 )::text::jsonb,
 jsonb_build_object('src','/images/global/ces-hero.svg',
   'alt', jsonb_build_object('zh','展会现场的过道','en','An aisle on a trade-show floor'),
   'caption', jsonb_build_object('zh','科技展会现场','en','A technology trade show'),
   'credit', jsonb_build_object('zh','AIFA 编辑部','en','AIFA Editorial'))::text::jsonb,
 jsonb_build_array(
   jsonb_build_object('src','/images/global/shot-1.svg','caption',jsonb_build_object('zh','展前说明会','en','Pre-show briefing'),'credit',jsonb_build_object('zh','AIFA 编辑部','en','AIFA Editorial'),'alt',jsonb_build_object('zh','说明会现场','en','Briefing room')),
   jsonb_build_object('src','/images/global/shot-2.svg','caption',jsonb_build_object('zh','展馆参观','en','Floor walk'),'credit',jsonb_build_object('zh','AIFA 编辑部','en','AIFA Editorial'),'alt',jsonb_build_object('zh','展馆通道','en','Exhibition aisle')),
   jsonb_build_object('src','/images/global/shot-3.svg','caption',jsonb_build_object('zh','企业参访','en','Company visit'),'credit',jsonb_build_object('zh','AIFA 编辑部','en','AIFA Editorial'),'alt',jsonb_build_object('zh','企业会议室','en','Company meeting room')),
   jsonb_build_object('src','/images/global/shot-4.svg','caption',jsonb_build_object('zh','投资者之夜','en','Investor evening'),'credit',jsonb_build_object('zh','AIFA 编辑部','en','AIFA Editorial'),'alt',jsonb_build_object('zh','晚间交流','en','Evening networking'))
 )::text::jsonb);

-- ------------------------------------------------------------------ videos
INSERT INTO site_videos (id, ord, title_zh, title_en, summary_zh, summary_en, video, cover) VALUES
('creator-guide', 1, '创作者教程', 'A Guide for Creators',
 '登录后在编辑台里选版式、写正文并发布；也可以让自己的代理通过接口直接投稿。',
 'Sign in, pick a layout, write and publish — or let your own agent post through the API.',
 '', '/images/about/creator-cover.svg'),
('operator-guide', 2, '运营教程', 'A Guide for Operators',
 '如何安排出刊计划、管理作者与栏目，以及查看阅读数据。',
 'How to schedule issues, manage authors and sections, and read the analytics.',
 '', '/images/about/operator-cover.svg');
