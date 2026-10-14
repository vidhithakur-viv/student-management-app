import uvicorn

from app.config.settings import get_settings

if __name__ == "__main__":
    # 0.0.0.0 so a physical phone on the same Wi-Fi can reach the server
    uvicorn.run("app.main:app", host="0.0.0.0", port=get_settings().port, reload=True)
