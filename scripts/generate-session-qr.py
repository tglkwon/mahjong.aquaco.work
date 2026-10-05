import json
import os
import base64
import qrcode
from io import BytesIO

SESSION_FILE = "c:/Users/AquaCo/project/mahjong.aquaco.work/.test-session.json"
BRAIN_DIR = "C:/Users/AquaCo/.gemini/antigravity/brain/e56ee61b-90bf-47da-b5f6-511e5b87899a"
PROJECT_DIR = "c:/Users/AquaCo/project/mahjong.aquaco.work"

with open(SESSION_FILE, "r", encoding="utf-8") as f:
    session = json.load(f)

mobile_url = session["mobile_test_url"]
pin = session.get("pin", "")
device = session.get("device", "rex3")
web_tunnel = session.get("web_tunnel_url", "")
drop_tunnel = session.get("drop_tunnel_url", "")

qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,
    border=3,
)
qr.add_data(mobile_url)
qr.make(fit=True)
img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")

# Save PNGs
png_project_path = os.path.join(PROJECT_DIR, "mobile_test_qr.png")
png_brain_path = os.path.join(BRAIN_DIR, "mobile_test_qr.png")

img.save(png_project_path)
img.save(png_brain_path)

# Base64 for HTML embedding
buffered = BytesIO()
img.save(buffered, format="PNG")
img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>마작 점수판 모바일 테스트 세션 QR</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}
    .card {{
      background: #ffffff;
      color: #0f172a;
      border-radius: 20px;
      padding: 36px 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      text-align: center;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }}
    p.subtitle {{
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
    }}
    .qr-frame {{
      background: #f1f5f9;
      border: 3px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 20px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    }}
    .qr-frame img {{
      display: block;
      width: 260px;
      height: 260px;
      border-radius: 8px;
    }}
    .info-grid {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      text-align: left;
      font-size: 13px;
    }}
    .info-row {{
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
    }}
    .info-row:last-child {{ border-bottom: none; }}
    .info-label {{ color: #64748b; font-weight: 500; }}
    .info-value {{ font-weight: 700; color: #0f172a; font-family: monospace; }}
    .url-box {{
      background: #0f172a;
      color: #38bdf8;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: Consolas, monospace;
      font-size: 11px;
      word-break: break-all;
      margin-bottom: 16px;
      cursor: pointer;
      user-select: all;
    }}
    .btn {{
      display: inline-block;
      width: 100%;
      background: #2563eb;
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 12px 0;
      border-radius: 10px;
      transition: background 0.2s;
    }}
    .btn:hover {{ background: #1d4ed8; }}
    .badge {{
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">원격 접속 모바일 테스트 세션</div>
    <h1>🀄 점수판 스캐너 QR</h1>
    <p class="subtitle">스마트폰 기본 카메라로 아래 QR 코드를 비추면 즉시 접속됩니다.</p>
    
    <div class="qr-frame">
      <img src="data:image/png;base64,{img_b64}" alt="Mobile Test QR Code" />
    </div>

    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">타겟 기종</span>
        <span class="info-value">{device} (AMOS REXX 3)</span>
      </div>
      <div class="info-row">
        <span class="info-label">보안 PIN</span>
        <span class="info-value">{pin}</span>
      </div>
      <div class="info-row">
        <span class="info-label">웹 터널</span>
        <span class="info-value">{web_tunnel.replace("https://", "")}</span>
      </div>
    </div>

    <div class="url-box" title="클릭하여 전체 URL 선택">
      {mobile_url}
    </div>

    <a href="{mobile_url}" target="_blank" class="btn">모바일 테스트 페이지 바로 열기</a>
  </div>
</body>
</html>
"""

html_project_path = os.path.join(PROJECT_DIR, "mobile_test_qr.html")
with open(html_project_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"QR PNG saved: {png_project_path}")
print(f"QR HTML saved: {html_project_path}")
