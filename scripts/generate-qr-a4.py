import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

def create_sheet(base_url, out_path, sheet_title, domain_label):
    A4_WIDTH = 2480
    A4_HEIGHT = 3508
    
    img = Image.new("RGB", (A4_WIDTH, A4_HEIGHT), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    
    font_bold_path = "C:/Windows/Fonts/malgunbd.ttf"
    font_reg_path = "C:/Windows/Fonts/malgun.ttf"
    
    try:
        font_title = ImageFont.truetype(font_bold_path, 58)
        font_subtitle = ImageFont.truetype(font_reg_path, 28)
        font_box_title = ImageFont.truetype(font_bold_path, 44)
        font_badge = ImageFont.truetype(font_bold_path, 54)
        font_text_lg = ImageFont.truetype(font_bold_path, 32)
        font_text_md = ImageFont.truetype(font_reg_path, 27)
        font_text_sm = ImageFont.truetype(font_reg_path, 23)
        font_url = ImageFont.truetype(font_reg_path, 25)
        font_cut = ImageFont.truetype(font_reg_path, 22)
    except Exception:
        font_title = ImageFont.load_default()
        font_subtitle = font_box_title = font_badge = font_text_lg = font_text_md = font_text_sm = font_url = font_cut = font_title

    def draw_dashed_rect(x1, y1, x2, y2, color="#94A3B8", dash_len=14, gap_len=10):
        x = x1
        while x < x2:
            x_end = min(x + dash_len, x2)
            draw.line([(x, y1), (x_end, y1)], fill=color, width=3)
            draw.line([(x, y2), (x_end, y2)], fill=color, width=3)
            x += dash_len + gap_len
        y = y1
        while y < y2:
            y_end = min(y + dash_len, y2)
            draw.line([(x1, y), (x1, y_end)], fill=color, width=3)
            draw.line([(x2, y), (x2, y_end)], fill=color, width=3)
            y += dash_len + gap_len

    def make_qr(url, size):
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        return qr_img.resize((size, size), Image.Resampling.LANCZOS)

    # 1. Header Banner
    draw.rounded_rectangle([(100, 50), (2380, 250)], radius=20, fill="#0F172A")
    draw.text((150, 85), f"🀄 {sheet_title}", font=font_title, fill="#FFFFFF")
    draw.text((152, 175), f"스마트폰 카메라로 각 QR을 스캔하여 세션 접속  |  기준 서버: {domain_label}", font=font_subtitle, fill="#94A3B8")

    # 2. Step 1: Queue & Seat Draw QR (Top Half)
    q_x1, q_y1, q_x2, q_y2 = 100, 280, 2380, 1300
    draw.rounded_rectangle([(q_x1, q_y1), (q_x2, q_y2)], radius=24, fill="#F8FAFC", outline="#E2E8F0", width=4)
    draw_dashed_rect(q_x1 - 10, q_y1 - 10, q_x2 + 10, q_y2 + 10, color="#94A3B8")
    draw.text((q_x1 + 10, q_y1 - 38), "✂ 가위로 잘라서 대기석 또는 탁자 중앙에 배치", font=font_cut, fill="#64748B")

    queue_url = f"{base_url}/queue"
    qr_queue = make_qr(queue_url, 840)
    img.paste(qr_queue, (q_x1 + 60, q_y1 + 80))
    draw.rectangle([(q_x1 + 58, q_y1 + 78), (q_x1 + 60 + 842, q_y1 + 80 + 842)], outline="#CBD5E1", width=2)

    info_x = q_x1 + 960
    # Badge
    draw.rounded_rectangle([(info_x, q_y1 + 80), (info_x + 620, q_y1 + 160)], radius=14, fill="#2563EB")
    draw.text((info_x + 30, q_y1 + 95), "STEP 1. 대기열 & 자리 추첨", font=font_text_lg, fill="#FFFFFF")

    draw.text((info_x, q_y1 + 190), "【 4인 대기열 등록 및 자리 추첨 QR 】", font=font_box_title, fill="#0F172A")
    
    desc_lines = [
        "1. 4명의 플레이어가 각자 이 QR을 스캔하여 닉네임을 등록합니다.",
        "2. 4명 모두 접속 대기 상태가 되면, 1명만 [🎲 4인 자리 추첨] 터치!",
        "3. 4대 화면이 동시에 3D 바람패(동·남·서·북) 추첨 연출로 전환됩니다.",
        "4. 추첨 후 각자 배정받은 좌석의 /scan_score_test 점수판으로 이동합니다."
    ]
    cur_y = q_y1 + 280
    for line in desc_lines:
        draw.text((info_x, cur_y), line, font=font_text_md, fill="#334155")
        cur_y += 65

    cur_y += 30
    draw.rounded_rectangle([(info_x, cur_y), (info_x + 1240, cur_y + 110)], radius=12, fill="#E2E8F0")
    draw.text((info_x + 30, cur_y + 20), "대기열/추첨 접속 URL:", font=font_text_sm, fill="#475569")
    draw.text((info_x + 30, cur_y + 55), queue_url, font=font_url, fill="#1E293B")

    # 3. Step 2: 4 Seats (East, South, West, North) for /scan_score_test
    seats = [
        {
            "wind": "東", "name": "동(East)", "seat": "east", "badge_color": "#DC2626", "bg_color": "#FEF2F2",
            "desc": "동가(기주) 자리 탁자 모서리 부착",
            "url": f"{base_url}/scan_score_test?table=1&seat=east",
            "col": 0, "row": 0
        },
        {
            "wind": "南", "name": "남(South)", "seat": "south", "badge_color": "#16A34A", "bg_color": "#F0FDF4",
            "desc": "남가 자리 탁자 모서리 부착",
            "url": f"{base_url}/scan_score_test?table=1&seat=south",
            "col": 1, "row": 0
        },
        {
            "wind": "西", "name": "서(West)", "seat": "west", "badge_color": "#2563EB", "bg_color": "#EFF6FF",
            "desc": "서가 자리 탁자 모서리 부착",
            "url": f"{base_url}/scan_score_test?table=1&seat=west",
            "col": 0, "row": 1
        },
        {
            "wind": "北", "name": "북(North)", "seat": "north", "badge_color": "#9333EA", "bg_color": "#FAF5FF",
            "desc": "북가 자리 탁자 모서리 부착",
            "url": f"{base_url}/scan_score_test?table=1&seat=north",
            "col": 1, "row": 1
        },
    ]

    card_w = 1110
    card_h = 980
    grid_start_y = 1380

    for s in seats:
        bx1 = 100 + s["col"] * (card_w + 60)
        by1 = grid_start_y + s["row"] * (card_h + 60)
        bx2 = bx1 + card_w
        by2 = by1 + card_h

        draw.rounded_rectangle([(bx1, by1), (bx2, by2)], radius=20, fill=s["bg_color"], outline="#E2E8F0", width=3)
        draw_dashed_rect(bx1 - 8, by1 - 8, bx2 + 8, by2 + 8, color="#94A3B8")
        draw.text((bx1 + 10, by1 - 32), "✂ 가위로 잘라서 탁자 모서리에 부착", font=font_cut, fill="#64748B")

        # Wind Character Badge
        draw.rounded_rectangle([(bx1 + 40, by1 + 40), (bx1 + 160, by1 + 160)], radius=18, fill=s["badge_color"])
        draw.text((bx1 + 65, by1 + 52), s["wind"], font=font_badge, fill="#FFFFFF")

        # Title
        draw.text((bx1 + 185, by1 + 55), f"Table 1 : {s['name']} 테스트 점수판", font=font_box_title, fill="#0F172A")
        draw.text((bx1 + 185, by1 + 120), s["desc"], font=font_text_sm, fill="#64748B")

        # QR Code (Size: 580x580)
        qr_seat = make_qr(s["url"], 580)
        img.paste(qr_seat, (bx1 + 40, by1 + 200))
        draw.rectangle([(bx1 + 38, by1 + 198), (bx1 + 40 + 582, by1 + 200 + 582)], outline="#CBD5E1", width=2)

        # Right side guide
        side_x = bx1 + 660
        draw.text((side_x, by1 + 220), "【 /scan_score_test 진입 】", font=font_text_lg, fill="#1E293B")
        
        seat_desc = [
            "• 테스트 모드 즉시 가동",
            "• 다기종 디버그 패널 활성",
            "• 손으로 폰을 들고 촬영",
            "• 0/8 번짐 필터링 적용",
            "• 4인 텔레메트리 합의",
            "• 10만점 역추적 수렴 검증"
        ]
        sy = by1 + 290
        for l in seat_desc:
            draw.text((side_x, sy), l, font=font_text_md, fill="#334155")
            sy += 46

        # URL box
        draw.rounded_rectangle([(side_x, by1 + 640), (bx2 - 25, by1 + 780)], radius=10, fill="#FFFFFF", outline="#E2E8F0", width=2)
        draw.text((side_x + 15, by1 + 655), "URL 경로 (/scan_score_test):", font=font_text_sm, fill="#64748B")
        url_display = f"/scan_score_test?table=1&seat={s['seat']}"
        draw.text((side_x + 15, by1 + 695), url_display, font=font_text_sm, fill="#0284C7")
        draw.text((side_x + 15, by1 + 735), domain_label, font=font_cut, fill="#94A3B8")

    img.save(out_path, "PNG", dpi=(300, 300))
    print(f"SAVED: {out_path} ({A4_WIDTH}x{A4_HEIGHT}, 300 DPI)")

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # 1. Cloudflare Live Tunnel Version (현재 열려있는 터널)
    cf_tunnel = "https://favor-greater-cheap-hong.trycloudflare.com"
    cf_out = os.path.join(project_root, "mahjong_qr_a4_print.png")
    create_sheet(
        base_url=cf_tunnel,
        out_path=cf_out,
        sheet_title="마작 점수판 현장 테스트 QR 세트 (/scan_score_test 기준)",
        domain_label="Cloudflare Tunnel (favor-greater-cheap-hong.trycloudflare.com)"
    )

    # 2. Production Domain Version (mahjong.aquaco.work)
    prod_domain = "https://mahjong.aquaco.work"
    prod_out = os.path.join(project_root, "mahjong_qr_a4_test_prod.png")
    create_sheet(
        base_url=prod_domain,
        out_path=prod_out,
        sheet_title="마작 점수판 공식 도메인 테스트 QR 세트 (/scan_score_test)",
        domain_label="Official Domain (mahjong.aquaco.work)"
    )

if __name__ == "__main__":
    main()
