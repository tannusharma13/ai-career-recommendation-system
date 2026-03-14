"""
Simple file-based storage for Career AI
Replaces MongoDB for portability
"""
import json
import os
import uuid
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "db"
DB_PATH.mkdir(exist_ok=True)

def _load(collection):
    path = DB_PATH / f"{collection}.json"
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)

def _save(collection, data):
    path = DB_PATH / f"{collection}.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)

def insert_one(collection, doc):
    data = _load(collection)
    doc_id = str(uuid.uuid4())
    doc['_id'] = doc_id
    doc['created_at'] = datetime.utcnow().isoformat()
    data[doc_id] = doc
    _save(collection, data)
    return doc_id

def find_one(collection, query):
    data = _load(collection)
    for doc in data.values():
        if all(doc.get(k) == v for k, v in query.items()):
            return doc
    return None

def find_all(collection, query=None):
    data = _load(collection)
    if not query:
        return list(data.values())
    return [d for d in data.values() if all(d.get(k) == v for k, v in query.items())]

def update_one(collection, query, update):
    data = _load(collection)
    for doc_id, doc in data.items():
        if all(doc.get(k) == v for k, v in query.items()):
            doc.update(update)
            doc['updated_at'] = datetime.utcnow().isoformat()
            data[doc_id] = doc
            _save(collection, data)
            return True
    return False

def upsert_one(collection, query, update):
    if find_one(collection, query):
        return update_one(collection, query, update)
    else:
        new_doc = {**query, **update}
        return insert_one(collection, new_doc)

def delete_one(collection, query):
    data = _load(collection)
    for doc_id, doc in list(data.items()):
        if all(doc.get(k) == v for k, v in query.items()):
            del data[doc_id]
            _save(collection, data)
            return True
    return False
