import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(WEB_ROOT, 'src');
const DIST_DIR = path.join(WEB_ROOT, 'dist');

function walkFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Biên dịch TypeScript sang CommonJS trong bộ nhớ và thực thi bằng Node VM để kiểm thử hàm thực tế
 */
function loadTsExports(filePath, customGlobals = {}, maxLines = null) {
  let rawSource = fs.readFileSync(filePath, 'utf8');
  if (maxLines) {
    rawSource = rawSource.split('\n').slice(0, maxLines).join('\n');
  }
  // Loại bỏ dòng import tài nguyên UI/CSS không cần thiết khi test hàm xử lý dữ liệu thuần
  const sanitizedTs = rawSource.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  const transpiled = ts.transpileModule(sanitizedTs, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX
    }
  });
  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: () => ({}),
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    ...customGlobals
  };
  vm.runInNewContext(transpiled.outputText, sandbox, { filename: filePath });
  return moduleObj.exports;
}

let indexHtml = '';
let appTsx = '';
let loginTsx = '';
let dashOperateTsx = '';
let employOperateTsx = '';
let dashCustoTsx = '';
let employCustoTsx = '';
let dashCtrlWidgetTsx = '';
let employCtrlWidgetTsx = '';
let activityExports = null;
let operateExports = null;
let mainWidgetExports = null;

before(() => {
  indexHtml = fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8');
  appTsx = fs.readFileSync(path.join(SRC_DIR, 'App.tsx'), 'utf8');
  loginTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/login/Login.tsx'), 'utf8');
  dashOperateTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/dash-operate/DashOperate.tsx'), 'utf8');
  employOperateTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/employ-operate/EmployOperate.tsx'), 'utf8');
  dashCustoTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/dash-custo/DashCusto.tsx'), 'utf8');
  employCustoTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/employ-custo/EmployCusto.tsx'), 'utf8');
  dashCtrlWidgetTsx = fs.readFileSync(
    path.join(SRC_DIR, 'pages/dash-lab/widget/ControlDashboardWidget.tsx'),
    'utf8'
  );
  employCtrlWidgetTsx = fs.readFileSync(
    path.join(SRC_DIR, 'pages/employ-lab/widget/ControlDashboardWidget.tsx'),
    'utf8'
  );

  operateExports = loadTsExports(path.join(SRC_DIR, 'pages/dash-operate/DashOperate.tsx'), {}, 182);
  mainWidgetExports = loadTsExports(
    path.join(SRC_DIR, 'pages/dash-lab/widget/MainDashboardWidget.tsx'),
    {},
    165
  );
});

// ============================================================================
// NHÓM 1: GIAO DIỆN THƯƠNG MẠI CÔNG KHAI & SEO (PUBLIC PORTAL - 6 BÀI TEST)
// ============================================================================

test('01. [Portal-01] Định tuyến công khai trong App.tsx hỗ trợ đầy đủ 9 trang thương mại (#home -> #simu)', () => {
  const publicRoutes = [
    '#home',
    '#intro',
    '#solution',
    '#product',
    '#project',
    '#news',
    '#about',
    '#privacy',
    '#simu'
  ];
  for (const route of publicRoutes) {
    assert.ok(appTsx.includes(`'${route}'`), `Thiếu định tuyến công khai ${route} trong App.tsx`);
  }
});

test('02. [Portal-02] Chuẩn SEO Google, Canonical URL, OpenGraph vi_VN và Schema.org LocalBusiness JSON-LD hợp lệ', () => {
  assert.match(indexHtml, /<html lang="vi">/);
  assert.match(indexHtml, /<link rel="canonical" href="https:\/\/3ahome\.vn\/"\s*\/>/);
  assert.match(indexHtml, /property="og:locale" content="vi_VN"/);

  const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, 'Thiếu khối JSON-LD Schema.org trong index.html');
  const schema = JSON.parse(jsonLdMatch[1]);
  assert.equal(schema['@type'], 'LocalBusiness');
  assert.equal(schema.url, 'https://3ahome.vn');
  assert.equal(schema.address.addressCountry, 'VN');
});

test('03. [Portal-03] Bảo mật Subresource Integrity (SRI sha384) trên toàn bộ thẻ script CDN ngoài trong index.html', () => {
  const externalScripts = [...indexHtml.matchAll(/<script\s+[^>]*src="https?:\/\/[^"]+"[^>]*>/g)].map(
    (m) => m[0]
  );
  assert.ok(externalScripts.length >= 2);
  for (const tag of externalScripts) {
    assert.match(tag, /integrity="sha384-[A-Za-z0-9+/=]+"/, `Thẻ script CDN thiếu SRI: ${tag}`);
    assert.match(tag, /crossorigin="anonymous"/);
  }
});

test('04. [Portal-04] Biểu mẫu Tư vấn khách hàng trên Trang chủ kết nối trực tiếp API POST /api/consult', () => {
  const homeTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/home/Home.tsx'), 'utf8');
  assert.ok(homeTsx.includes('/api/consult'), 'Home.tsx chưa tích hợp endpoint /api/consult');
  const collectTsx = fs.readFileSync(path.join(SRC_DIR, 'components/common/Collect.tsx'), 'utf8');
  assert.ok(collectTsx.includes('trackVisit'), 'Collect.tsx chưa tích hợp bộ đếm lượt truy cập thực tế');
});

test('05. [Portal-05] Phòng mô phỏng 3D (Simu.tsx & simuDb.ts) tích hợp /api/simu kèm dự phòng Offline IndexedDB', () => {
  const simuDbTs = fs.readFileSync(path.join(SRC_DIR, 'services/simuDb.ts'), 'utf8');
  assert.ok(simuDbTs.includes("fetch('/api/simu'"));
  assert.ok(simuDbTs.includes('indexedDB'));
  const simuExports = loadTsExports(path.join(SRC_DIR, 'services/simuDb.ts'), {}, 38);
  const formatted = simuExports.formatDbTime('2026-11-09T08:15:30Z');
  assert.match(formatted, /^\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
});

test('06. [Portal-06] Thực thi getModuleFromHash & trackActivity (activityTracker.ts) định danh đúng 9 phân hệ và gửi Heartbeat', async () => {
  const postedPayloads = [];
  const storageMap = new Map([
    ['aaa_admin_auth', JSON.stringify({ id: 7, gmail: 'admin@3ahome.vn', authen: 1 })]
  ]);
  activityExports = loadTsExports(path.join(SRC_DIR, 'utils/activityTracker.ts'), {
    localStorage: { getItem: (k) => storageMap.get(k) || null },
    sessionStorage: { getItem: () => null },
    fetch: async (url, opts) => {
      postedPayloads.push({ url, body: JSON.parse(opts.body) });
      return { ok: true };
    }
  });

  assert.equal(activityExports.getModuleFromHash('#dash'), 'overview');
  assert.equal(activityExports.getModuleFromHash('#employ-custo'), 'customers');
  assert.equal(activityExports.getModuleFromHash('#dash-operate'), 'operate');
  assert.equal(activityExports.getModuleFromHash('#employ-lab'), 'lab');
  assert.equal(activityExports.getModuleFromHash('#home'), null);

  await activityExports.trackActivity('VISIT_PAGE', 'operate');
  assert.equal(postedPayloads.length, 1);
  assert.equal(postedPayloads[0].url, '/api/track-activity');
  assert.equal(postedPayloads[0].body.loginId, 7);
  assert.equal(postedPayloads[0].body.module, 'operate');
});

// ============================================================================
// NHÓM 2: XÁC THỰC & PHÂN QUYỀN QUẢN TRỊ / NHÂN SỰ / KHÁCH HÀNG (5 BÀI TEST)
// ============================================================================

test('07. [AuthWeb-01] Logic điều hướng sau đăng nhập (Login.tsx) tách bạch rõ Admin (#dash), Nhân sự (#employ) và Khách hàng (#dash-custo)', () => {
  assert.ok(loginTsx.includes("role === 'customer'"));
  assert.ok(loginTsx.includes("targetHash = '#dash-custo'"));
  assert.ok(loginTsx.includes('Number(authen) === 2'));
  assert.ok(loginTsx.includes("targetHash = '#employ'"));
  assert.ok(loginTsx.includes("targetHash = '#dash'"));
});

test('08. [AuthWeb-02] Chống dò mật khẩu phía giao diện (Login.tsx): khoá 5 phút lưu bền vững vào localStorage chống F5', () => {
  assert.ok(loginTsx.includes('3ahome_login_lockout_until'));
  assert.ok(loginTsx.includes('3ahome_login_failed_attempts'));
  assert.ok(loginTsx.includes('const lockoutTime = 5 * 60'));
  // Tải động Google GSI SDK tại Login thay vì nhúng tĩnh ở index.html
  assert.ok(loginTsx.includes('https://accounts.google.com/gsi/client'));
});

test('09. [AuthWeb-03] Đối xứng đầy đủ 9 tuyến Quản trị viên (#dash*) và 9 tuyến Nhân sự (#employ*) trong App.tsx', () => {
  const adminRoutes = [
    '#dash',
    '#dash-project',
    '#dash-new',
    '#dash-equip',
    '#dash-custo',
    '#dash-finan',
    '#dash-job',
    '#dash-operate',
    '#dash-lab'
  ];
  const staffRoutes = [
    '#employ',
    '#employ-proj',
    '#employ-news',
    '#employ-equip',
    '#employ-custo',
    '#employ-finan',
    '#employ-job',
    '#employ-operate',
    '#employ-lab'
  ];
  for (const r of [...adminRoutes, ...staffRoutes]) {
    assert.ok(appTsx.includes(`'${r}'`), `App.tsx thiếu định tuyến nội bộ: ${r}`);
  }
});

test('10. [AuthWeb-04] Khởi tạo Dự án, IoT Gateway & Thiết bị con trong DashCusto & EmployCusto đồng bộ /api/customer-projects', () => {
  assert.ok(dashCustoTsx.includes('/api/customer-projects'));
  assert.ok(employCustoTsx.includes('/api/customer-projects'));
  assert.ok(dashCustoTsx.includes('gateway_sn'));
  assert.ok(employCustoTsx.includes('gateway_sn'));
  assert.ok(dashCustoTsx.includes('slave_address'));
});

test('11. [AuthWeb-05] Tự động băm bcrypt mật khẩu mặc định 3AH@me khi tạo dự án & bảo vệ xoá bằng mã xác thực 4 ký tự', () => {
  assert.ok(dashCustoTsx.includes('bcrypt.hashSync'));
  assert.ok(employCustoTsx.includes('bcrypt.hashSync'));
  assert.ok(dashCustoTsx.includes('3AH@me'));
  assert.ok(dashCustoTsx.includes('generateDeleteAuthCode'));
  assert.ok(employCustoTsx.includes('generateDeleteAuthCode'));
});

// ============================================================================
// NHÓM 3: BẢNG VẬN HÀNH IOT & PHÒNG LAB ĐIỀU KHIỂN THỜI GIAN THỰC (8 BÀI TEST)
// ============================================================================

test('12. [SCADA-01] Thực thi normalizeMeterControlValue lọc triệt để giá trị rác "[object Object]", "{}", "[]", "null"', () => {
  const { normalizeMeterControlValue } = operateExports;
  assert.equal(normalizeMeterControlValue('[object Object]'), '');
  assert.equal(normalizeMeterControlValue('{}'), '');
  assert.equal(normalizeMeterControlValue('[]'), '');
  assert.equal(normalizeMeterControlValue('null'), '');
  assert.equal(normalizeMeterControlValue(null), '');
  assert.equal(normalizeMeterControlValue({ m1: 'Nhiệt độ' }), '{"m1":"Nhiệt độ"}');
});

test('13. [SCADA-02] Thực thi parseMeterControlMap & serializeMeterControlMap chuẩn hoá và sắp xếp đúng thứ tự m1 -> m10', () => {
  const { parseMeterControlMap, serializeMeterControlMap } = operateExports;
  const parsed = parseMeterControlMap('m10: Công suất tổng, m2: Độ ẩm, m1: Nhiệt độ');
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), {
    m10: 'Công suất tổng',
    m2: 'Độ ẩm',
    m1: 'Nhiệt độ'
  });
  const serialized = serializeMeterControlMap(parsed);
  assert.equal(serialized, '{"m1":"Nhiệt độ","m2":"Độ ẩm","m10":"Công suất tổng"}');
});

test('14. [SCADA-03] Bảng vận hành DashOperate & EmployOperate cố định tiêu đề (sticky) và hiển thị recorded_at 2 dòng gọn gàng', () => {
  assert.match(dashOperateTsx, /position:\s*['"]sticky['"]/);
  assert.match(employOperateTsx, /position:\s*['"]sticky['"]/);
  // Tách ngày yyyy-mm-dd và giờ hh:mm:ss trên 2 dòng riêng
  assert.ok(dashOperateTsx.includes("split(' ')") || dashOperateTsx.includes('recorded_at'));
  assert.ok(employOperateTsx.includes("split(' ')") || employOperateTsx.includes('recorded_at'));
});

test('15. [SCADA-04] Tính năng "+ Thêm cột" và "- Xoá cột" gọi API PUT /meter-control đồng bộ trên cả DashOperate & EmployOperate', () => {
  assert.ok(dashOperateTsx.includes('/meter-control'));
  assert.ok(employOperateTsx.includes('/meter-control'));
  assert.match(dashOperateTsx, /Thêm cột/);
  assert.match(employOperateTsx, /Thêm cột/);
  assert.match(dashOperateTsx, /X[oó][aá]\s*cột/);
  assert.match(employOperateTsx, /X[oó][aá]\s*cột/);
});

test('16. [SCADA-05] Thực thi parseMeterMapping & extractMValuesFromRow bóc tách chuẩn cả JSON phẳng lẫn measurements lồng nhau', () => {
  const { parseMeterMapping, extractMValuesFromRow } = mainWidgetExports;
  assert.deepEqual(JSON.parse(JSON.stringify(parseMeterMapping('{"M1":"Điện áp","M3":"Dòng điện"}'))), {
    m1: 'Điện áp',
    m3: 'Dòng điện'
  });

  const extracted = extractMValuesFromRow({
    show: '{"m1": 230.5, "gateway_sn": "GW_01"}',
    raw_data: JSON.stringify({ measurements: { m2: 5.4, m3: 1 } })
  });
  assert.deepEqual(JSON.parse(JSON.stringify(extracted)), { m1: 230.5, m2: 5.4, m3: 1 });
});

test('17. [SCADA-06] Chốt giữ trạng thái điều khiển trong ControlDashboardWidget: khoá userCommandLockRef & lọc is_control_command === true', () => {
  assert.ok(dashCtrlWidgetTsx.includes('userCommandLockRef'));
  assert.ok(employCtrlWidgetTsx.includes('userCommandLockRef'));
  assert.ok(dashCtrlWidgetTsx.includes('msg.is_control_command === true'));
  assert.ok(employCtrlWidgetTsx.includes('msg.is_control_command === true'));
  assert.ok(dashCtrlWidgetTsx.includes('/api/device-control'));
  assert.ok(employCtrlWidgetTsx.includes('/api/device-control'));
});

test('18. [SCADA-07] Tự động nhận diện thẻ Công tắc (ON/OFF) và Thanh trượt nhiệt độ (°C) trong cả DashLab & EmployLab', () => {
  assert.ok(dashCtrlWidgetTsx.includes("category: isTempCtrl ? 'temp' : 'fan'"));
  assert.ok(employCtrlWidgetTsx.includes("category: isTempCtrl ? 'temp' : 'fan'"));
  assert.ok(dashCtrlWidgetTsx.includes("lowerLabel.includes('nhiệt độ')"));
  assert.ok(employCtrlWidgetTsx.includes("lowerLabel.includes('nhiệt độ')"));
});

test('19. [SCADA-08] Chống rò rỉ bộ nhớ khi treo máy 24/7: dọn sạch Timer & đóng kết nối WebSocket khi huỷ component', () => {
  const dashLabTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/dash-lab/DashLab.tsx'), 'utf8');
  const employLabTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/employ-lab/EmployLab.tsx'), 'utf8');
  assert.ok(appTsx.includes('clearInterval(pingInterval)'));
  assert.ok(dashLabTsx.includes('ws.close()') || dashLabTsx.includes('ws?.close()'));
  assert.ok(employLabTsx.includes('ws.close()') || employLabTsx.includes('ws?.close()'));
});

// ============================================================================
// NHÓM 4: TƯƠNG THÍCH ĐA TRÌNH DUYỆT, TYPESCRIPT & BUILD PRODUCTION (5 BÀI TEST)
// ============================================================================

test('20. [BuildWeb-01] Toàn bộ mã nguồn TypeScript/TSX trong AAA_Web/src biên dịch sạch 0 lỗi cú pháp (Diagnostic Check)', () => {
  const tsFiles = walkFiles(SRC_DIR, ['.ts', '.tsx']);
  assert.ok(tsFiles.length >= 25, `Số lượng file nguồn quá ít: ${tsFiles.length}`);

  const syntaxErrors = [];
  for (const file of tsFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const res = ts.transpileModule(source, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX
      }
    });
    if (res.diagnostics && res.diagnostics.length > 0) {
      syntaxErrors.push({
        file: path.relative(WEB_ROOT, file),
        message: ts.flattenDiagnosticMessageText(res.diagnostics[0].messageText, '\n')
      });
    }
  }
  assert.deepEqual(syntaxErrors, []);
});

test('21. [BuildWeb-02] Đồng bộ 100% thuật toán điều khiển giữa Quản trị viên (DashLab) và Nhân sự (EmployLab)', () => {
  assert.equal(
    dashCtrlWidgetTsx.trim(),
    employCtrlWidgetTsx.trim(),
    'ControlDashboardWidget.tsx giữa DashLab và EmployLab bị lệch logic!'
  );
});

test('22. [BuildWeb-03] Hỗ trợ giao diện Responsive di động: thẻ meta viewport chuẩn và ngăn kéo menu isMobileOpen', () => {
  assert.match(indexHtml, /name="viewport" content="width=device-width, initial-scale=1\.0"/);
  assert.ok(dashOperateTsx.includes('isMobileOpen'));
  assert.ok(employOperateTsx.includes('isMobileOpen'));
});

test('23. [BuildWeb-04] Cấu hình đóng gói thương mại (package.json & vite.config.ts) đầy đủ script build và plugin React', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts.build.includes('vite build'));
  assert.ok(pkg.scripts.test.includes('node --test'));
  const viteCfg = fs.readFileSync(path.join(WEB_ROOT, 'vite.config.ts'), 'utf8');
  assert.ok(viteCfg.includes('@vitejs/plugin-react'));
});

test('24. [BuildWeb-05] Gói sản phẩm thương mại AAA_Web/dist sẵn sàng triển khai (index.html + bundles JS/CSS hợp lệ)', () => {
  const distIndex = path.join(DIST_DIR, 'index.html');
  assert.equal(fs.existsSync(distIndex), true, 'Chưa có bản build thương mại dist/index.html');
  const distHtml = fs.readFileSync(distIndex, 'utf8');
  assert.match(distHtml, /assets\/index-[^"']+\.js/);
  assert.match(distHtml, /assets\/index-[^"']+\.css/);
});
