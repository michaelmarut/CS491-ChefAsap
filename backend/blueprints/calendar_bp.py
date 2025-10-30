from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import os, json, time, requests

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

calendar_bp = Blueprint('calendar_bp', __name__)

TOKEN_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'google_tokens')
os.makedirs(TOKEN_DIR, exist_ok=True)

GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')       # Web client ID
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')  # Web client secret

def token_path(user_id: str):
    return os.path.join(TOKEN_DIR, f'{user_id}.json')

def load_tokens(user_id: str):
    p = token_path(user_id)
    if not os.path.exists(p):
        return None
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_tokens(user_id: str, tok: dict):
    with open(token_path(user_id), 'w', encoding='utf-8') as f:
        json.dump(tok, f)

def ensure_access_token(user_id: str):
    data = load_tokens(user_id)
    if not data:
        return None, 'Not connected'
    # Refresh if expired (pad 60s)
    if data.get('expires_at', 0) <= time.time() + 60:
        r = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'grant_type': 'refresh_token',
            'refresh_token': data.get('refresh_token'),
        }, timeout=15)
        if r.status_code != 200:
            return None, f"Refresh failed: {r.text}"
        nd = r.json()
        data['access_token'] = nd['access_token']
        data['expires_at'] = time.time() + int(nd.get('expires_in', 3600))
        save_tokens(user_id, data)
    return data, None

@calendar_bp.route('/google/exchange', methods=['POST'])
def google_exchange():
    body = request.get_json(silent=True) or {}
    user_id = str(body.get('user_id') or '').strip()
    code = body.get('code')
    code_verifier = body.get('code_verifier')
    redirect_uri = body.get('redirect_uri')

    if not (user_id and code and code_verifier and redirect_uri):
        return jsonify({'error': 'Missing required fields'}), 400
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        return jsonify({'error': 'Server missing GOOGLE_CLIENT_ID/SECRET'}), 500

    # Exchange authorization code for tokens
    r = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'code_verifier': code_verifier,
        'redirect_uri': redirect_uri,
    }, timeout=20)

    if r.status_code != 200:
        return jsonify({'error': 'Exchange failed', 'detail': r.text}), 400

    tok = r.json()
    # Persist tokens (expect refresh_token on first consent)
    stored = {
        'access_token': tok.get('access_token'),
        'refresh_token': tok.get('refresh_token'),
        'scope': tok.get('scope'),
        'token_type': tok.get('token_type'),
        'expires_at': time.time() + int(tok.get('expires_in', 3600)),
    }
    save_tokens(user_id, stored)
    return jsonify({'success': True})

@calendar_bp.route('/google/sync', methods=['GET'])
def google_sync():
    user_id = request.args.get('user_id', '').strip()
    days = int(request.args.get('days', '30'))
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    data, err = ensure_access_token(user_id)
    if err:
        return jsonify({'error': err}), 400

    creds = Credentials(
        token=data['access_token'],
        refresh_token=data.get('refresh_token'),
        token_uri=GOOGLE_TOKEN_ENDPOINT,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=['https://www.googleapis.com/auth/calendar.readonly'],
    )

    service = build('calendar', 'v3', credentials=creds)
    now = datetime.utcnow()
    time_min = now.isoformat() + 'Z'
    time_max = (now + timedelta(days=days)).isoformat() + 'Z'

    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    events = events_result.get('items', [])
    # TODO: upsert events into the bookings database
    return jsonify({'success': True, 'count': len(events), 'events': events})

@calendar_bp.route('/ics/upload', methods=['POST'])
def ics_upload():
    # Simple .ics import; parse events and return count; not integrated yet
    from icalendar import Calendar
    if 'ics' not in request.files:
        return jsonify({'error': 'ics file required'}), 400
    f = request.files['ics']
    try:
        cal = Calendar.from_ical(f.read())
        count = 0
        for comp in cal.walk():
            if comp.name == "VEVENT":
                count += 1
                # TODO: upsert each VEVENT into your DB
        return jsonify({'success': True, 'imported': count})
    except Exception as e:
        return jsonify({'error': f'Failed to parse .ics: {e}'}), 400