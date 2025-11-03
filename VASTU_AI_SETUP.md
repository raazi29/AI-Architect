# 🕉️ Astrology-Powered Vastu Analysis - Setup Guide

## Overview

Your Vastu feature now uses **real astrology** (powered by Prokerala's Astrology API) to provide authentic, real-time Vedic Vastu Shastra analysis. No more mock data or fake responses!

## ✨ Features

- **Real-time Astrology Analysis**: Uses Prokerala's authentic Vedic astrology API for accurate Vastu insights
- **Expert Astrological Insights**: Real planetary influences and nakshatra-based analysis
- **Energy Analysis**: Detailed impact assessment based on current astrological conditions
- **Personalized Remedies**: Custom solutions including crystals, plants, colors, and astrological remedies
- **Streaming Support**: Real-time analysis with progressive loading
- **Authentic Vedic Analysis**: Based on traditional Vedic astrology principles

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Prokerala API Credentials

1. Go to [https://www.prokerala.com/api/](https://www.prokerala.com/api/)
2. Sign up for a free account
3. Get your API key and User ID from the dashboard
4. Copy both credentials (API key and User ID)

### Step 2: Add API Credentials to Your Project

Create a `.env` file in your **Backend** directory:

```bash
# Backend/.env
PROKERALA_SECRET_KEY=your_api_key_here
PROKERALA_CLIENT_ID=your_user_id_here
```

**Example:**
```bash
PROKERALA_SECRET_KEY=pk_test_abc123def456ghi789jkl012mno345pqr678
PROKERALA_CLIENT_ID=12345
```

### Step 3: Test the Integration

Run the test script to verify everything works:

```bash
python test_vastu_astrology.py
```

You should see:
```
🔮 Testing Prokerala Astrology API...
✅ Astrology API test successful!
🏠 Testing Vastu Service with Astrology...
✅ Vastu Service test successful!
🎉 All tests passed! Vastu Astrology Integration is working correctly.
```

### Step 4: Start Your Application

1. **Start the backend:**
   ```bash
   cd Backend
   python main.py
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Test the Vastu page:**
   - Navigate to `http://localhost:3000/vastu`
   - Select a room type and direction
   - Click "Analyze Vastu Compliance"
   - See real astrology-powered insights! Look for the "🔮 Astrology-Powered" badge

## 📊 What You'll Get

### Traditional Analysis (Fallback)
- Basic Vastu compliance score
- Ideal and avoid directions
- Standard recommendations
- Element information

### Astrology-Powered Analysis (With API Credentials)
- ✅ Everything from traditional analysis
- 💡 **Astrological Insights**: 
  - Current nakshatra information
  - Planetary strength analysis
  - Directional energy assessment
- ⚡ **Planetary Influences**: 
  - Detailed planetary analysis
  - Auspicious times for activities
  - Energy flow assessment
- 🎯 **Personalized Remedies**:
  - Astrology-based crystal recommendations
  - Plant suggestions based on planetary influences
  - Color corrections for energy balance
  - General astrological tips

## 🔧 API Endpoints

### Analyze Room (Astrology-Powered)
```bash
POST http://localhost:8001/vastu/analyze-room
Content-Type: application/json

{
  "room_type": "master_bedroom",
  "direction": "south-west",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "use_astrology": true
}
```

### Stream Analysis (Real-time)
```bash
POST http://localhost:8001/vastu/analyze-room-stream
Content-Type: application/json

{
  "room_type": "kitchen",
  "direction": "south-east"
}
```

### Analyze Entire House
```bash
POST http://localhost:8001/vastu/analyze-house
Content-Type: application/json

{
  "rooms": [
    {"type": "main_entrance", "direction": "north-east"},
    {"type": "master_bedroom", "direction": "south-west"},
    {"type": "kitchen", "direction": "south-east"}
  ],
  "house_facing": "north",
  "plot_shape": "rectangular",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "use_astrology": true
}
```

## 🎯 Example Response

```json
{
  "room_type": "master_bedroom",
  "direction": "south-west",
  "status": "excellent",
  "score": 92,
  "astrology_powered": true,
  "astrological_insights": {
    "current_nakshatra": {
      "name": "Rohini",
      "ruler": "Brahma"
    },
    "planetary_strength": "Strong",
    "directional_energy": "Positive"
  },
  "planetary_influences": [
    {
      "planet": "Jupiter",
      "influence": "Strong positive influence on prosperity and wisdom"
    },
    {
      "planet": "Venus",
      "influence": "Harmonious energy for relationships and comfort"
    }
  ],
  "auspicious_times": [
    {
      "type": "Best time for activities",
      "start": "06:00",
      "end": "08:00"
    },
    {
      "type": "Avoid activities",
      "start": "14:00",
      "end": "16:00"
    }
  ],
  "remedies": {
    "colors": ["Green", "Blue"],
    "elements": ["Water", "Wood"],
    "crystals": ["Emerald", "Blue Sapphire"],
    "general_tips": ["Keep bedroom door closed at night", "Use soft warm lighting"]
  },
  "energy_analysis": {
    "overall_energy": "Very positive",
    "prosperity_potential": "High",
    "health_indicators": "Excellent",
    "relationship_harmony": "Harmonious"
  },
  "recommendations": [
    "Place the bed in the SW corner with head towards south or east",
    "Use warm earth tones like beige, brown, or yellow",
    "Avoid mirrors facing the bed",
    "Keep heavy furniture in the south and west walls"
  ]
}
```

## 🆓 API Limits

Prokerala provides free tier limits:

- **Rate Limit**: Varies by plan
- **Daily Limit**: Limited requests per day on free tier
- **Context**: Full astrological calculations
- **Cost**: Free tier available with paid options for higher limits

This is **sufficient** for a Vastu analysis application!

## 🔄 Fallback Mechanism

The system automatically falls back to traditional Vastu analysis if:
- API credentials are not configured
- API is temporarily unavailable
- Rate limit is exceeded
- Network issues occur

**You'll never lose functionality** - users always get Vastu analysis, just with varying levels of astrological enhancement.

## 🐛 Troubleshooting

### Issue: "PROKERALA_SECRET_KEY not found"

**Solution:**
1. Make sure `.env` file is in the `Backend` directory
2. Verify the file contains both: `PROKERALA_SECRET_KEY=your_key_here` and `PROKERALA_CLIENT_ID=your_id_here`
3. Restart the backend server

### Issue: "Astrology analysis failed"

**Solution:**
1. Check your internet connection
2. Verify API credentials are valid at [https://www.prokerala.com/api/](https://www.prokerala.com/api/)
3. Check backend logs for detailed error messages
4. System will automatically use traditional analysis as fallback

### Issue: Rate limit exceeded

**Solution:**
1. Wait for the rate limit to reset
2. Consider upgrading your Prokerala plan
3. System automatically falls back to traditional analysis

## 📝 Development Tips

### Test Astrology Responses

```python
# Quick test in Python
import asyncio
from Backend.vastu_service import vastu_service

async def test():
    result = await vastu_service.analyze_room_with_astrology("kitchen", "south-east")
    print(result)

asyncio.run(test())
```

### Check Logs

Backend logs show astrology usage:
```
🔮 Analyzing kitchen in south-east direction with authentic astrology...
✅ Astrology Vastu analysis completed successfully
```

### Frontend Detection

The frontend shows an "🔮 Astrology-Powered" badge when astrology is active.

## 🎨 UI Components

The Vastu page now includes:

1. **Astrology-Powered Badge**: Shows when analysis uses astrology
2. **Astrological Insights Section**: Purple gradient card with astrological insights
3. **Planetary Influences**: Detailed planetary analysis
4. **Auspicious Times**: Best and avoid times for activities
5. **Astrology Remedies**: Amber-colored section with personalized solutions

## 🔐 Security Notes

- Never commit `.env` file to git (already in `.gitignore`)
- API credentials are server-side only (not exposed to frontend)
- Prokerala API provides authentic Vedic astrology data
- No sensitive data is sent to the API (only room types, directions, and coordinates)

## 📚 Additional Resources

- **Prokerala API Documentation**: [https://www.prokerala.com/api/](https://www.prokerala.com/api/)
- **Vastu Principles**: Traditional knowledge base is preserved in the code
- **Vedic Astrology**: [https://en.wikipedia.org/wiki/Hindu_astrology](https://en.wikipedia.org/wiki/Hindu_astrology)
- **API Reference**: Check `Backend/routes.py` for all endpoints

## ✅ Verification Checklist

- [ ] Created `.env` file in Backend directory
- [ ] Added valid PROKERALA_SECRET_KEY to `.env`
- [ ] Added valid PROKERALA_CLIENT_ID to `.env`
- [ ] Ran `python test_vastu_astrology.py` successfully
- [ ] Started backend server (port 8001)
- [ ] Started frontend (port 3000)
- [ ] Tested Vastu page and saw "🔮 Astrology-Powered" badge
- [ ] Verified astrological insights appear below recommendations
- [ ] Checked planetary influences section appears
- [ ] Confirmed auspicious times section shows up
- [ ] Verified remedies section shows up

---

## 🎉 You're All Set!

Your Vastu feature now provides **real, astrology-powered Vastu analysis** using authentic Vedic astrology principles combined with traditional Vastu Shastra wisdom.

**No mocks. No fake data. Just real Vedic wisdom enhanced by authentic astrology! 🕉️✨**




