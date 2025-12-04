import os
import httpx
from fastapi import FastAPI, HTTPException, Query
from starlette.responses import RedirectResponse
from dotenv import load_dotenv

# โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env (ถ้ามี)
load_dotenv()

# --- 1. กำหนดค่า Global Variables ---
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID_HERE")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_CLIENT_SECRET_HERE")
# **ต้องตรงกับ URL ที่ลงทะเบียนไว้ใน Replit Console ทุกประการ**
# ตัวอย่าง: ถ้าแอปของคุณรันที่ domain.com
REDIRECT_URI = "http://localhost:8000/api/auth/callback"
TOKEN_URL = "https://replit.com/oauth/token"
AUTH_URL = "https://replit.com/oauth/authorize"

# ตรวจสอบว่า Environment Variables มีค่าหรือไม่
if CLIENT_ID == "YOUR_CLIENT_ID_HERE" or CLIENT_SECRET == "YOUR_CLIENT_SECRET_HERE":
  print(
      "⚠️ WARNING: กรุณาตั้งค่า CLIENT_ID และ CLIENT_SECRET ในไฟล์ .env หรือ Environment Variables"
  )

# เริ่มต้นแอปพลิเคชัน FastAPI
app = FastAPI()
# เริ่มต้น Async HTTP Client
http_client = httpx.AsyncClient()

# ------------------------------------------------------------------


@app.get("/")
def start_auth_flow():
  """
    Route สำหรับเริ่มต้น: Redirect ผู้ใช้ไปยังหน้าอนุญาตของ Replit
    """
  # สร้าง URL สำหรับส่งผู้ใช้ไปที่ Replit เพื่อขออนุญาต
  auth_redirect_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"

  print(f"Redirecting user to: {auth_redirect_url}")
  return RedirectResponse(url=auth_redirect_url)


# ------------------------------------------------------------------


@app.get("/api/auth/callback")
async def handle_replit_callback(
    # FastAPI จะดึง 'code' หรือ 'error' จาก Query String ให้โดยอัตโนมัติ
    code: str = Query(None, description="Authorization code from Replit"),
    error: str = Query(None, description="Error message from Replit")):
  """
    Route สำหรับ Callback: รับ Code และแลกเปลี่ยนเป็น Access Token
    """
  if error or not code:
    # อาจเกิดข้อผิดพลาดในการอนุญาตตั้งแต่แรก (เช่น ผู้ใช้ยกเลิก)
    error_msg = error if error else "No code received."
    print(f"Authentication failed. Replit Error: {error_msg}")
    raise HTTPException(status_code=400,
                        detail=f"Authentication failed: {error_msg}")

  # 1. เตรียม Payload สำหรับ Request
  payload = {
      "client_id": CLIENT_ID,
      "client_secret": CLIENT_SECRET,
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": REDIRECT_URI
  }

  # 2. ส่ง POST Request เพื่อแลกเปลี่ยน Token
  try:
    response = await http_client.post(TOKEN_URL,
                                      data=payload,
                                      headers={"Accept": "application/json"})

    # 3. ตรวจสอบสถานะการตอบกลับ
    response.raise_for_status()

    token_data = response.json()
    access_token = token_data.get("access_token")

    if not access_token:
      print(f"Error: Missing access_token in response. Raw data: {token_data}")
      raise HTTPException(status_code=500,
                          detail="Missing access_token in response.")

    # 4. Success: แสดง Access Token
    print(f"✅ Token Exchange Success! Access Token: {access_token[:10]}...")

    # **ใน Production ควร Redirect ผู้ใช้ไปที่ Frontend**
    # และส่ง Token ผ่าน Cookie หรือ URL Hash/Query (อย่างปลอดภัย)

    return {
        "message": "Authentication Successful!",
        "access_token": access_token,
        "token_type": token_data.get("token_type"),
        "expires_in": token_data.get("expires_in")
    }

  except httpx.HTTPStatusError as e:
    # ดึงรายละเอียด Error จาก Replit API (มักเป็น 400 Bad Request)
    error_detail = {}
    try:
      error_detail = response.json()
    except:
      error_detail = {"raw_text": response.text}

    print(
        f"🚨 Replit API Error ({e.response.status_code}): {e}. Details: {error_detail}"
    )
    raise HTTPException(
        status_code=e.response.status_code,
        detail=
        f"Token Exchange Failed. Replit Detail: {error_detail.get('error_description', error_detail.get('error', 'Check server logs'))}"
    )
  except Exception as e:
    print(f"❌ Internal Server Error: {e}")
    raise HTTPException(status_code=500,
                        detail="Internal Server Error during token exchange.")


# ------------------------------------------------------------------

# คำสั่งสำหรับรัน:
# ใน terminal ใช้: uvicorn <filename>:app --reload
# (เช่น ถ้าไฟล์นี้ชื่อ main.py ให้รัน: uvicorn main:app --reload)
if __name__ == "__main__":
  import uvicorn
  # รันบนพอร์ต 8000 ซึ่งตรงกับ REDIRECT_URI ด้านบน
  uvicorn.run(app, host="0.0.0.0", port=8001)
