import type { Lang, Text } from "./types";

/** Pick the right side of a bilingual string. */
export const t = (v: Text | undefined | null, lang: Lang): string =>
  !v ? "" : lang === "zh" ? v.zh || v.en || "" : v.en || v.zh || "";

export const L = {
  // masthead
  home: { zh: "返回首页", en: "Back to home" },
  navDaily: { zh: "今日深度", en: "The Daily" },
  navColumns: { zh: "专栏", en: "Columns" },
  navResearch: { zh: "研究报告", en: "Research" },
  navAcademy: { zh: "学院", en: "Academy" },
  navGoGlobal: { zh: "出海", en: "Go Global" },
  primaryNav: { zh: "主导航", en: "Primary navigation" },
  library: { zh: "收藏", en: "BOOKSHELF" },
  signIn: { zh: "登录", en: "SIGN IN" },
  signOut: { zh: "退出", en: "SIGN OUT" },
  switchToNight: { zh: "切换到夜览", en: "Switch to night" },
  switchToDay: { zh: "切换到日间", en: "Switch to day" },
  tagline: { zh: "AI · 投资 · 教育", en: "AI · Investing · Education" },

  // cover screen
  dailyLabel: { zh: "今日日更", en: "TODAY’S ESSAY" },
  readToday: { zh: "今日文章", en: "TODAY’S ESSAY" },
  prevDay: { zh: "前一天", en: "PREVIOUS DAY" },
  nextDay: { zh: "后一天", en: "NEXT DAY" },
  verified: { zh: "AIFA 身份认证", en: "VERIFIED BY AIFA" },
  sectionsLabel: { zh: "栏目", en: "SECTIONS" },
  columnsLabel: { zh: "专栏", en: "COLUMNS" },
  columnistCount: { zh: "{count} 位作者", en: "{count} COLUMNISTS" },
  openToRead: { zh: "点开阅读", en: "Open to read" },
  scrollHint: { zh: "向下滑动", en: "SCROLL" },

  // reader
  contents: { zh: "目录", en: "Contents" },
  prevPage: { zh: "上一页", en: "Previous page" },
  nextPage: { zh: "下一页", en: "Next page" },
  hideControls: { zh: "隐藏控件", en: "Hide reader controls" },
  showControls: { zh: "显示控件", en: "Show reader controls" },
  share: { zh: "分享", en: "Share" },
  shareCopied: { zh: "已复制", en: "COPIED" },
  save: { zh: "收藏", en: "Save" },
  saved: { zh: "已收藏", en: "SAVED" },
  closeReader: { zh: "关闭阅读器", en: "Close the reader and go back" },
  comments: { zh: "留言", en: "COMMENTS" },
  commentsPlaceholder: { zh: "写下你的看法（300 字以内）", en: "Share your view (300 characters)" },
  commentsSend: { zh: "发送", en: "SEND" },
  commentsSignIn: { zh: "登录后留言", en: "SIGN IN TO COMMENT" },
  commentsEmpty: { zh: "还没有留言", en: "NO COMMENTS YET" },
  sources: { zh: "资料来源", en: "SOURCES" },
  signInToSave: { zh: "登录后收藏", en: "SIGN IN TO SAVE" },
  minutes: { zh: "分钟阅读", en: "MIN READ" },

  // shelf
  tabSaved: { zh: "文章", en: "ARTICLES" },
  tabResources: { zh: "资源", en: "RESOURCES" },
  tabSubscribed: { zh: "订阅作者", en: "SUBSCRIBED AUTHORS" },
  shelfTagline: { zh: "把值得重读的，留在这里。", en: "Keep what is worth rereading." },
  shelfHint: {
    zh: "在 AIFA 读到想留下的文章，点「收藏」，它就会出现在这里。",
    en: "Save an essay while reading AIFA and it appears here.",
  },
  shelfSignIn: { zh: "登录后查看收藏", en: "Sign in to see what you saved" },
  shelfSubscribedEmpty: { zh: "还没有订阅的作者", en: "NO SUBSCRIPTIONS YET" },
  shelfResourcesEmpty: {
    zh: "读杂志时点一块，选「收藏」，它就会出现在这里。",
    en: "Tap a block while reading and choose Save; it shows up here.",
  },
  remove: { zh: "取消收藏", en: "REMOVE" },
  unread: { zh: "未读", en: "UNREAD" },
  finished: { zh: "已读完", en: "FINISHED" },
  progress: { zh: "读到 {percent}%", en: "{percent}% READ" },
  resume: { zh: "继续读 →", en: "RESUME →" },
  emptyPrimary: { zh: "读今日深度", en: "READ THE DAILY" },

  // columns
  subscribe: { zh: "订阅", en: "SUBSCRIBE" },
  subscribed: { zh: "已订阅", en: "SUBSCRIBED" },
  articleCount: { zh: "文章", en: "ARTICLES" },
  updated: { zh: "更新时间", en: "UPDATED" },

  // login
  accountTitle: { zh: "AIFA 账户", en: "AIFA ACCOUNT" },
  signInTitle: { zh: "登录", en: "Sign in" },
  signInIntro: {
    zh: "输入邮箱，我们会发送 6 位验证码。邮箱就是你的账户：没有密码，首次登录即创建。",
    en: "Enter your email and we send a 6-digit code. Your email is your account: no password, and first-time sign-in creates it.",
  },
  emailLabel: { zh: "邮箱", en: "Email" },
  codeLabel: { zh: "验证码", en: "Code" },
  sendCode: { zh: "发送验证码", en: "Send code" },
  verify: { zh: "登录", en: "Sign in" },
  resend: { zh: "重新发送", en: "Send again" },
  devHint: { zh: "开发模式：验证码已显示在下方", en: "Dev mode: your code is shown below" },
  backHome: { zh: "返回首页", en: "Back to AIFA home" },

  // research
  featuredLabel: { zh: "精选报告", en: "FEATURED REPORT" },
  getTheResource: { zh: "获取资料", en: "GET THE RESOURCE" },
  viewResource: { zh: "查看这份资料", en: "VIEW THIS RESOURCE" },
  purpose: { zh: "用途", en: "PURPOSE" },
  scope: { zh: "范围", en: "SCOPE" },
  edition: { zh: "版本", en: "EDITION" },
  fileVersion: { zh: "文件", en: "FILE VERSION" },
  libraryTitle: { zh: "标准与实践工具", en: "Standards & practical tools" },
  newsletterEyebrow: { zh: "AIFA 研究", en: "AIFA RESEARCH" },
  newsletterTitle: { zh: "第一时间收到新报告", en: "Get new reports first" },
  email: { zh: "邮箱", en: "EMAIL" },
  notifyMe: { zh: "通知我", en: "Notify me" },
  formTitle: { zh: "留下信息即可下载", en: "Share your details to download" },
  name: { zh: "姓名", en: "NAME" },
  company: { zh: "公司", en: "COMPANY" },
  jobTitle: { zh: "职位", en: "JOB TITLE" },
  submit: { zh: "提交并下载", en: "SUBMIT & DOWNLOAD" },
  readyTitle: { zh: "资料已就绪", en: "YOUR RESOURCE IS READY" },

  // academy
  academyTitle1: { zh: "学 AI。", en: "Learn AI." },
  academyTitle2: { zh: "选对课程。", en: "Pick the right course." },
  browseByAudience: { zh: "按人群浏览", en: "BROWSE BY AUDIENCE" },
  onlineAdvisory: { zh: "在线咨询", en: "ONLINE ADVISERY" },
  viewProgram: { zh: "查看项目", en: "View program" },
  programs: { zh: "{count} 个项目", en: "{count} PROGRAMS" },
  audience: { zh: "适合人群", en: "AUDIENCE" },
  duration: { zh: "课长", en: "DURATION" },
  price: { zh: "价格", en: "PRICE" },
  swipe: { zh: "左右滑动 →", en: "SWIPE →" },

  // go global
  dispatches: { zh: "出海观察", en: "DISPATCHES" },
  departureDesk: { zh: "出海服务", en: "DEPARTURE DESK" },
  routeHighlights: { zh: "行程亮点", en: "ROUTE HIGHLIGHTS" },
  chatAdviser: { zh: "在线咨询", en: "CHAT WITH AN ADVISER" },
  photoCount: { zh: "{count} 张照片", en: "{count} PHOTOS" },

  // about
  aboutTitle: { zh: "关于 AIFA", en: "About AIFA" },
  relatedReading: { zh: "相关阅读", en: "Related reading" },
  feedbackTitle: { zh: "意见反馈", en: "Feedback" },
  feedbackPlaceholder: {
    zh: "告诉我们哪里坏了、哪里看不懂，或者你希望看到什么。",
    en: "Tell us what is broken, what is unclear, or what you would like to see.",
  },
  sendFeedback: { zh: "发送反馈", en: "Send feedback" },
  anonymous: { zh: "匿名", en: "Anonymous" },
  signed: { zh: "已登录", en: "Signed" },
  includeContext: { zh: "附带当前页面与设备信息", en: "Include this page and device" },

  // consult
  consultStatus: { zh: "AIFA 顾问 · 真人回复", en: "AIFA ADVISERS · REAL PEOPLE" },
  commonQuestions: { zh: "常见问题", en: "COMMON QUESTIONS" },
  consultPlaceholder: { zh: "输入你的问题…", en: "Ask a question…" },
  send: { zh: "发送", en: "SEND" },
  minimize: { zh: "最小化在线咨询", en: "Minimize online advisory" },
  restore: { zh: "展开在线咨询", en: "Expand online advisory" },
  startNew: { zh: "开始新咨询", en: "Start a new conversation" },
  closedNotice: {
    zh: "此咨询已关闭。需要继续时可以开始新咨询。",
    en: "This conversation is closed. Start a new conversation if you need more help.",
  },
};

export const label = (key: keyof typeof L, lang: Lang) => L[key][lang];

export const fill = (template: string, vars: Record<string, string | number>) =>
  Object.keys(vars).reduce((s, k) => s.replace(`{${k}}`, String(vars[k])), template);
