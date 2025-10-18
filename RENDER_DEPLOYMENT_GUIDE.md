# Render Deployment Guide - Using debug_server.py

## 🚀 Quick Setup

The configuration has been updated to use `debug_server.py` instead of `app.py` for Render deployment.

### Files Modified:
- ✅ `Procfile` - Updated to use `debug_server:app`
- ✅ `render.yaml` - Updated startup command and environment variables
- ✅ `debug_server.py` - Added production-ready configurations
- ✅ `build.sh` - Ensures model files are generated during build

---

## 📋 Deployment Options

### Option 1: Gunicorn (Recommended)
```bash
# Current Procfile configuration
web: gunicorn debug_server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --log-level info
```

### Option 2: Direct Python Execution
```bash
# Alternative - uncomment in Procfile if needed
web: python start_debug_server.py
```

---

## 🔧 Configuration Details

### Environment Variables Set:
- `PYTHON_VERSION`: 3.11.0
- `GEMINI_API_KEY`: Your API key
- `FLASK_ENV`: production
- `PRODUCTION`: true

### Build Process:
1. Install dependencies from `requirements.txt`
2. Generate synthetic training data (`data_generator.py`)
3. Train ML model (`model_trainer.py`)
4. Start debug server with enhanced logging

---

## 🎯 Key Features of debug_server.py

### Enhanced Logging & Debugging
- **Development**: Full debug logging and detailed console output
- **Production**: Info-level logging with essential information only
- **Debug Endpoint**: `/debug` - Shows all available routes and system status

### Additional Endpoints
- `/health` - Health check for monitoring
- `/debug` - System information and available routes
- All standard ADR prediction endpoints

### Production Optimizations
- Automatic environment detection
- Appropriate logging levels
- Graceful error handling
- Enhanced request/response logging

---

## 🚀 Deployment Steps

### 1. Push to Repository
```bash
git add .
git commit -m "Switch to debug_server.py for Render deployment"
git push origin main
```

### 2. Render Configuration
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Start Command**: `gunicorn debug_server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --log-level info`
- **Environment**: Python 3.11.0

### 3. Verify Deployment
- Check `/health` endpoint for system status
- Check `/debug` endpoint for detailed information
- Test form submission and AI report generation

---

## 🔍 Monitoring & Debugging

### Health Check
```
GET /health
```
Returns:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "endpoints_available": [...],
  "timestamp": "2024-01-01T00:00:00"
}
```

### Debug Information
```
GET /debug
```
Returns:
- Available routes
- Model status
- Gemini AI configuration
- System timestamp

### Log Monitoring
- **Production**: Info-level logs with request tracking
- **Development**: Debug-level logs with detailed information

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Model Loading Errors
- Check build logs for data generation and model training
- Verify `adr_model.pkl` and `adr_preprocessor.pkl` exist

#### 2. Gemini API Issues
- Verify API key in environment variables
- Check `/debug` endpoint for Gemini status

#### 3. Port Binding Issues
- Render automatically sets `$PORT` environment variable
- debug_server.py automatically uses this port

### Debug Commands
```bash
# Check if files exist
ls -la *.pkl

# Test Gemini API
python test_gemini.py

# Manual server start
python debug_server.py
```

---

## 📊 Performance Considerations

### Gunicorn Configuration
- **Workers**: 1 (suitable for ML model with memory requirements)
- **Timeout**: 120 seconds (allows for AI report generation)
- **Log Level**: Info (balanced logging for production)

### Memory Usage
- ML model: ~100-200MB
- Flask app: ~50-100MB
- Total: ~300-400MB (within Render free tier limits)

---

## 🔄 Switching Back to app.py

If you need to switch back to `app.py`:

1. **Update Procfile**:
   ```
   web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
   ```

2. **Update render.yaml**:
   ```yaml
   startCommand: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
   ```

3. **Redeploy**

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application starts without errors
- [ ] `/health` endpoint returns healthy status
- [ ] `/debug` endpoint shows all routes
- [ ] Form submission works with empty fields
- [ ] AI report generation works
- [ ] No JavaScript console errors
- [ ] Albumin field accepts values up to 600

---

## 🎉 Benefits of Using debug_server.py

1. **Enhanced Logging**: Better debugging and monitoring capabilities
2. **Debug Endpoint**: Easy system status checking
3. **Production Ready**: Automatic environment detection
4. **Error Handling**: Comprehensive error tracking and reporting
5. **Development Friendly**: Detailed console output for development

Your ADR Risk Predictor is now configured to run with `debug_server.py` on Render! 🚀