import os
import json
import urllib.request
import urllib.error

# Path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EN_JSON_PATH = os.path.join(BASE_DIR, 'en.json')
UR_JSON_PATH = os.path.join(BASE_DIR, 'ur.json')
BACKEND_ENV_PATH = os.path.join(BASE_DIR, '..', '..', 'backend', '.env')

def load_env(filepath):
    """Simple parser for .env files."""
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    env_vars[key.strip()] = val.strip().strip("'").strip('"')
    return env_vars

def get_api_key():
    """Retrieve Gemini API key from environment or .env file."""
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GEMINI_KEY')
    if not api_key:
        env_vars = load_env(BACKEND_ENV_PATH)
        api_key = env_vars.get('GEMINI_API_KEY') or env_vars.get('GEMINI_KEY')
    return api_key

def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def find_missing_translations(en_data, ur_data):
    """
    Recursively find keys in en_data that are missing in ur_data or have empty translations.
    Returns a dict of paths to text that needs translation.
    """
    missing = {}
    
    def recurse(en_node, ur_node, current_path):
        if isinstance(en_node, dict):
            for k, v in en_node.items():
                new_path = current_path + [k]
                ur_child = ur_node.get(k) if isinstance(ur_node, dict) else None
                recurse(v, ur_child, new_path)
        elif isinstance(en_node, str):
            # If string, check if ur_node is valid string
            if not isinstance(ur_node, str) or ur_node.strip() == "" or ur_node == en_node:
                # Mark as missing
                # Join path with a special delimiter
                key_path = "|||".join(current_path)
                missing[key_path] = en_node
                
    recurse(en_data, ur_data, [])
    return missing

def apply_translations(ur_data, translations_map):
    """
    Apply flat translation map back into the nested ur_data structure.
    """
    for key_path, translated_text in translations_map.items():
        parts = key_path.split("|||")
        current = ur_data
        for i, part in enumerate(parts[:-1]):
            if part not in current or not isinstance(current[part], dict):
                current[part] = {}
            current = current[part]
        current[parts[-1]] = translated_text

def translate_with_gemini(text_map, api_key):
    """
    Use Gemini API to translate a flat dictionary of texts.
    Returns a dictionary with identical keys but Urdu values.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = (
        "You are an expert English to Pakistani Urdu translator. "
        "Translate the following JSON string values to professional and natural Urdu. "
        "Keep the exact same JSON keys. Return ONLY valid JSON, without any markdown formatting like ```json or ```. "
        "Do NOT include any extra text.\n\n"
    )
    prompt += json.dumps(text_map, ensure_ascii=False, indent=2)

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    
    headers = {'Content-Type': 'application/json'}
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up potential markdown formatting just in case
            cleaned_text = text_response.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
                
            translated_map = json.loads(cleaned_text.strip())
            return translated_map
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error during translation: {e}")
        return None

def main():
    api_key = get_api_key()
    if not api_key:
        print("Error: GEMINI_API_KEY not found. Please set it in your environment or backend/.env file.")
        return

    print("Loading en.json and ur.json...")
    en_data = load_json(EN_JSON_PATH)
    ur_data = load_json(UR_JSON_PATH)
    
    if not en_data:
        print("Error: en.json is empty or not found.")
        return

    print("Finding missing translations...")
    missing_map = find_missing_translations(en_data, ur_data)
    
    if not missing_map:
        print("All text is already translated! ur.json is up to date.")
        return
        
    missing_count = len(missing_map)
    print(f"Found {missing_count} missing translation(s).")
    
    # We should batch if missing_count is too large
    # For now, Gemini can easily handle 100-200 short string translations in one shot
    # We will process in chunks of 50 just to be safe
    
    items = list(missing_map.items())
    chunk_size = 50
    total_translated = 0
    
    for i in range(0, len(items), chunk_size):
        chunk = dict(items[i:i+chunk_size])
        print(f"Translating chunk {i//chunk_size + 1} ({len(chunk)} items)...")
        
        translated_chunk = translate_with_gemini(chunk, api_key)
        
        if translated_chunk:
            # Add to ur_data
            apply_translations(ur_data, translated_chunk)
            total_translated += len(translated_chunk)
            
            # Save progress incrementally
            save_json(UR_JSON_PATH, ur_data)
            print(f"Successfully applied and saved {len(translated_chunk)} translations.")
        else:
            print("Failed to translate chunk. Stopping to prevent data corruption.")
            break
            
    print(f"\nDone! Successfully updated ur.json with {total_translated} new translations out of {missing_count} missing.")

if __name__ == "__main__":
    main()
