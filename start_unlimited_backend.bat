@echo off
echo 🚀 Starting Backend with Unlimited Design Feed...
echo.

cd Backend

echo 📦 Installing/checking dependencies...
pip install httpx beautifulsoup4 fastapi uvicorn python-multipart aiofiles

echo.
echo 🧪 Testing unlimited design service...
python -c "from unlimited_design_service import unlimited_design_service; print('✅ Unlimited design service ready')"

echo.
echo 🌟 Starting FastAPI server with unlimited design feed...
echo 📍 Server will be available at: http://localhost:8001
echo 🎨 Design feed endpoint: http://localhost:8001/feed
echo 📊 API docs: http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn routes:app --host 0.0.0.0 --port 8001 --reload

pause