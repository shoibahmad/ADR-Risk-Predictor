# Option 1: Use gunicorn with debug_server (recommended for production)
web: gunicorn debug_server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --log-level info

# Option 2: Direct Python execution (uncomment to use)
# web: python start_debug_server.py