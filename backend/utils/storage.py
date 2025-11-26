import os
import json

# Storage paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "storage"))
PICTURES_DIR = os.path.join(STORAGE_DIR, "pictures")
INFORMATION_DIR = os.path.join(STORAGE_DIR, "information")

# Data files
REQUESTS_FILE = os.path.join(INFORMATION_DIR, "requests.json")
WORKORDERS_FILE = os.path.join(INFORMATION_DIR, "workorders.json")
IMAGES_FILE = os.path.join(INFORMATION_DIR, "images.json")


def init_storage():
    """Initialize storage directories and files if they don't exist"""
    # Create directories
    directories = [STORAGE_DIR, PICTURES_DIR, INFORMATION_DIR]
    for dir_path in directories:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            print(f"[Storage] Created directory: {dir_path}")
        else:
            print(f"[Storage] Directory exists: {dir_path}")
    
    # Initialize JSON files with empty arrays if they don't exist
    json_files = [REQUESTS_FILE, WORKORDERS_FILE, IMAGES_FILE]
    for file_path in json_files:
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump([], f)
            print(f"[Storage] Created file: {file_path}")


# Auto-initialize on import
init_storage()


def load_json(filepath: str) -> list:
    """Load data from JSON file"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_json(filepath: str, data: list):
    """Save data to JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
