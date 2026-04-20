<?php
/**
 * 奇妙日 AI 客服 Webhook
 * 
 * 放置路径（后端项目）：/api/customer-service/webhook
 * 或根据你后端框架路由配置对应控制器位置。
 * 
 * 功能：
 *   1. GET  - 验证微信服务器（Token 握手）
 *   2. POST - 接收用户消息 → 调 Claude AI → 调微信客服接口回复
 * 
 * 依赖：
 *   - PHP 7.4+，开启 curl
 *   - 微信小程序后台已配置消息推送，Token 与此处 WX_MSG_TOKEN 一致
 *   - 微信小程序后台已配置客服（有客服账号），或仅使用消息接口回复
 */

// ============================================================
// 配置区（建议移到 .env 或配置文件）
// ============================================================
define('WX_MSG_TOKEN',    'qimiaori_cs_2024');          // 微信后台消息推送 Token，自定义
define('WX_APP_ID',       'your_mp_appid');             // 小程序 AppID
define('WX_APP_SECRET',   'your_mp_appsecret');         // 小程序 AppSecret

define('CLAUDE_API_KEY',  'sk-ant-oat01-18a87482f37e8119c27d86dbd071e1073da86f6ed143cd442f9744d70784238e');
define('CLAUDE_BASE_URL', 'https://gaccode.com/claudecode');
define('CLAUDE_MODEL',    'claude-3-5-haiku-20241022'); // 性价比最高，适合客服

// 对话历史缓存目录（需要 PHP 可写权限，或改用 Redis/MySQL）
define('SESSION_DIR',     __DIR__ . '/cs_sessions/');

// AI 客服系统提示词
define('SYSTEM_PROMPT', <<<'PROMPT'
你是"奇妙日"小程序的专属智能客服助手，名字叫"奇妙小助手"。

【产品介绍】
奇妙日是一款情感化时间管理工具，核心功能包括：
- 倒数日/纪念日创建与管理
- 分类管理（可自定义颜色和图标）
- 提醒功能（服务号提醒）
- 数据归档与备份导出
- 关怀模式（适合中老年用户的大字模式）
- 微信分享与海报生成

【常见问题回答指引】
- 如何登录：使用微信授权登录，点击首页"登录"按钮
- 如何创建倒数日：点击首页右下角"+"按钮，填写标题、日期、分类
- 如何设置提醒：编辑倒数日时开启"服务号提醒"开关，需关注服务号
- 如何归档：在倒数日详情页点击"归档"，归档后在个人中心可查看
- 如何导出数据：个人中心 → 数据管理 → 导出，数据会复制到剪贴板
- 如何开启关怀模式：个人中心 → 应用设置 → 关怀模式开关
- 数据丢失问题：检查是否登录同一微信账号，可尝试退出重新登录

【回答原则】
1. 回答简洁友好，不超过 200 字
2. 遇到无法解答的技术问题，告知用户："这个问题我帮你记录下来，稍后人工客服会跟进处理～"
3. 不讨论与奇妙日无关的话题
4. 使用中文回答
5. 语气温暖，可以适当使用 emoji
PROMPT);

// ============================================================
// 入口路由
// ============================================================
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    handleVerify();
} elseif ($method === 'POST') {
    handleMessage();
} else {
    http_response_code(405);
    exit('Method Not Allowed');
}

// ============================================================
// 1. 微信服务器验证（GET）
// ============================================================
function handleVerify(): void
{
    $signature = $_GET['signature'] ?? '';
    $timestamp  = $_GET['timestamp']  ?? '';
    $nonce      = $_GET['nonce']      ?? '';
    $echostr    = $_GET['echostr']    ?? '';

    $arr = [WX_MSG_TOKEN, $timestamp, $nonce];
    sort($arr, SORT_STRING);
    $str = implode('', $arr);

    if (sha1($str) === $signature) {
        echo $echostr;
    } else {
        http_response_code(403);
        echo 'Forbidden';
    }
}

// ============================================================
// 2. 接收并处理用户消息（POST）
// ============================================================
function handleMessage(): void
{
    $xml = file_get_contents('php://input');
    if (empty($xml)) {
        // 微信服务器有时发 GET 形式的验证，直接返回空串即可
        echo '';
        return;
    }

    libxml_use_internal_errors(true);
    $data = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$data) {
        echo '';
        return;
    }

    $msgType   = (string)($data->MsgType   ?? '');
    $fromUser  = (string)($data->FromUserName ?? '');
    $content   = (string)($data->Content   ?? '');
    $event     = (string)($data->Event     ?? '');

    // 只处理文本消息；其他类型（事件、图片等）直接返回空
    if ($msgType !== 'text') {
        echo '';
        return;
    }

    if (empty($content) || empty($fromUser)) {
        echo '';
        return;
    }

    // 获取 access_token
    $accessToken = getAccessToken();
    if (!$accessToken) {
        sendTextReply($fromUser, '客服系统临时不可用，请稍后再试～', $accessToken ?? '');
        echo '';
        return;
    }

    // 调用 Claude AI 获取回复
    $history  = loadSession($fromUser);
    $aiReply  = callClaude($content, $history);
    saveSession($fromUser, $content, $aiReply);

    // 通过微信客服消息接口回复（异步推送，不在 XML 响应里回）
    sendCustomerServiceMessage($fromUser, $aiReply, $accessToken);

    // 返回空串，告知微信服务器已处理
    echo '';
}

// ============================================================
// 3. 获取微信 access_token（简单文件缓存）
// ============================================================
function getAccessToken(): ?string
{
    $cacheFile = sys_get_temp_dir() . '/qimiaori_wx_token.json';

    if (file_exists($cacheFile)) {
        $cache = json_decode(file_get_contents($cacheFile), true);
        if (!empty($cache['token']) && $cache['expire'] > time() + 60) {
            return $cache['token'];
        }
    }

    $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential"
         . "&appid=" . WX_APP_ID
         . "&secret=" . WX_APP_SECRET;

    $res = httpGet($url);
    $json = json_decode($res, true);

    if (empty($json['access_token'])) {
        error_log('[QimiaoriCS] 获取 access_token 失败: ' . $res);
        return null;
    }

    file_put_contents($cacheFile, json_encode([
        'token'  => $json['access_token'],
        'expire' => time() + (int)($json['expires_in'] ?? 7200),
    ]));

    return $json['access_token'];
}

// ============================================================
// 4. 调用 Claude API
// ============================================================
function callClaude(string $userMessage, array $history): string
{
    // 构造 messages（带历史，最多保留最近 6 轮）
    $messages = array_slice($history, -12); // 最近 6 轮 = 12 条
    $messages[] = ['role' => 'user', 'content' => $userMessage];

    $payload = [
        'model'      => CLAUDE_MODEL,
        'max_tokens' => 512,
        'system'     => SYSTEM_PROMPT,
        'messages'   => $messages,
    ];

    $response = httpPost(
        CLAUDE_BASE_URL . '/v1/messages',
        json_encode($payload),
        [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01',
        ]
    );

    $json = json_decode($response, true);

    if (!empty($json['content'][0]['text'])) {
        return trim($json['content'][0]['text']);
    }

    error_log('[QimiaoriCS] Claude 调用失败: ' . $response);
    return '抱歉，我暂时无法回答这个问题，请稍后再试，或者等待人工客服为您服务～';
}

// ============================================================
// 5. 通过微信客服消息接口发送回复
// ============================================================
function sendCustomerServiceMessage(string $openid, string $text, string $accessToken): void
{
    $url = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token={$accessToken}";

    $payload = json_encode([
        'touser'  => $openid,
        'msgtype' => 'text',
        'text'    => ['content' => $text],
    ], JSON_UNESCAPED_UNICODE);

    $res = httpPost($url, $payload, ['Content-Type: application/json']);
    $json = json_decode($res, true);

    if (!empty($json['errcode']) && $json['errcode'] !== 0) {
        error_log('[QimiaoriCS] 发送客服消息失败: ' . $res);
    }
}

// ============================================================
// 6. 对话历史（基于文件，可替换为 Redis）
// ============================================================
function loadSession(string $openid): array
{
    if (!is_dir(SESSION_DIR)) {
        @mkdir(SESSION_DIR, 0755, true);
    }
    $file = SESSION_DIR . md5($openid) . '.json';
    if (!file_exists($file)) {
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    // 超过 1 小时的会话重置
    if (!empty($data['updated_at']) && time() - $data['updated_at'] > 3600) {
        return [];
    }
    return $data['messages'] ?? [];
}

function saveSession(string $openid, string $userMsg, string $aiMsg): void
{
    if (!is_dir(SESSION_DIR)) {
        @mkdir(SESSION_DIR, 0755, true);
    }
    $file = SESSION_DIR . md5($openid) . '.json';

    $existing = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if (!empty($data['messages'])) {
            $existing = $data['messages'];
        }
    }

    $existing[] = ['role' => 'user',      'content' => $userMsg];
    $existing[] = ['role' => 'assistant', 'content' => $aiMsg];

    // 最多保留 20 条
    if (count($existing) > 20) {
        $existing = array_slice($existing, -20);
    }

    file_put_contents($file, json_encode([
        'messages'   => $existing,
        'updated_at' => time(),
    ], JSON_UNESCAPED_UNICODE));
}

// ============================================================
// 工具函数
// ============================================================
function httpGet(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res ?: '';
}

function httpPost(string $url, string $body, array $headers = []): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    if ($res === false) {
        error_log('[QimiaoriCS] cURL error: ' . curl_error($ch));
    }
    curl_close($ch);
    return $res ?: '';
}

function sendTextReply(string $toUser, string $text, string $accessToken): void
{
    if ($accessToken) {
        sendCustomerServiceMessage($toUser, $text, $accessToken);
    }
}
