from sqlite3 import connect
import os
from ScryPy.scry_sqlite import logger, ID_MODEL_WHITELIST
import json

class ControlConfig:
    # DATABASE SCHEMA
    SCHEMA = """CREATE TABLE IF NOT EXISTS configModel (
        id_model TEXT PRIMARY KEY,
        temperature REAL DEFAULT 0.7, top_p REAL DEFAULT 0.9,
        top_k INTEGER DEFAULT 40, tokens INTEGER DEFAULT 2048,
        repeat_penalty REAL DEFAULT 1.1,
        frequency_penalty REAL DEFAULT 0.0,
        presence_penalty REAL DEFAULT 0.0,
        min_p REAL DEFAULT 0.05, tfs_z REAL DEFAULT 1.0,
        mirostat_tau REAL DEFAULT 5.0, seed INTEGER, stop TEXT)"""
    
    # SAFE DEFAULTS: Balanced for 1B-7B+ models
    SAFE_DEFAULTS = {
        'temperature': 0.7, 'top_p': 0.9, 'top_k': 40, 'tokens': 512,
        'repeat_penalty': 1.1, 'frequency_penalty': 0.0, 'presence_penalty': 0.0,
        'min_p': 0.05, 'tfs_z': 1.0, 'mirostat_tau': 5.0, 'seed': None, 'stop': None
    }
    
    # VALIDATION: Safety ranges for all parameters
    VALID = {
        'id_model': lambda v: isinstance(v, str) and v in ID_MODEL_WHITELIST,
        'temperature': lambda v: isinstance(v, (int, float)) and 0 <= v <= 2,
        'top_p': lambda v: isinstance(v, (int, float)) and 0 <= v <= 1,
        'top_k': lambda v: isinstance(v, int) and 0 <= v <= 100,
        'tokens': lambda v: isinstance(v, int) and 128 <= v <= 8192,
        'repeat_penalty': lambda v: isinstance(v, (int, float)) and 1.0 <= v <= 2.0,
        'frequency_penalty': lambda v: isinstance(v, (int, float)) and -2.0 <= v <= 2.0,
        'presence_penalty': lambda v: isinstance(v, (int, float)) and -2.0 <= v <= 2.0,
        'min_p': lambda v: isinstance(v, (int, float)) and 0 <= v <= 1,
        'tfs_z': lambda v: isinstance(v, (int, float)) and 0 <= v <= 1,
        'mirostat_tau': lambda v: isinstance(v, (int, float)) and 0 <= v <= 10,
        'seed': lambda v: v is None or (isinstance(v, int) and 0 <= v <= 2**32-1),
        'stop': lambda v: v is None or (isinstance(v, list) and all(isinstance(s, str) for s in v)),
    }
    
    # FIELD ORDER: Matches database column order (excluding id_model)
    FIELDS = ['temperature', 'top_p', 'top_k', 'tokens', 'repeat_penalty',
              'frequency_penalty', 'presence_penalty', 'min_p', 'tfs_z',
              'mirostat_tau', 'seed', 'stop']
    
    def __init__(self, configs=None):
        self.configs = configs or {}
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.__DB_FILE = os.path.join(current_dir, "config_model.sqlite")
    
    def _valid(self, key, value):
        return key in self.VALID and self.VALID[key](value)
    
    def _db(self, query, params=()):
        try:
            with connect(self.__DB_FILE) as conn:
                cur = conn.execute(query, params)
                conn.commit()
                return cur
        except Exception as e:
            logger.error(f"DB: {e}")
            return None
    
    def create(self):
        return bool(self._db(self.SCHEMA))
    
    def add(self):
        # Only id_model is required
        if 'id_model' not in self.configs:
            return False
        
        if not self._valid('id_model', self.configs['id_model']):
            return False
        
        # Validate only provided fields
        for k, v in self.configs.items():
            if k != 'id_model' and not self._valid(k, v):
                return False
        
        # Build values with defaults for missing fields
        values = [self.configs['id_model']]
        for field in self.FIELDS:
            if field in self.configs:
                if field == 'stop' and self.configs[field] is not None:
                    values.append(json.dumps(self.configs[field]))
                else:
                    values.append(self.configs[field])
            else:
                values.append(self.SAFE_DEFAULTS[field] if field != 'stop' else None)
        
        return bool(self._db(
            "INSERT INTO configModel VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            values
        ))
    
    def update(self):
        # Require id_model and at least one field to update
        if 'id_model' not in self.configs or len(self.configs) < 2:
            return False
        
        # Validate only provided fields
        for k, v in self.configs.items():
            if k != 'id_model' and not self._valid(k, v):
                return False
        
        # Build dynamic update query
        updates, params = [], []
        for field in self.FIELDS:
            if field in self.configs:
                updates.append(f"{field}=?")
                if field == 'stop':
                    params.append(json.dumps(self.configs[field]) if self.configs[field] is not None else None)
                else:
                    params.append(self.configs[field])
        
        if not updates:
            return False
        
        params.append(self.configs['id_model'])
        cur = self._db(
            f"UPDATE configModel SET {','.join(updates)} WHERE id_model=?",
            params
        )
        return bool(cur and cur.rowcount > 0)
    
    def delete(self):
        if 'id_model' not in self.configs:
            return False
        cur = self._db("DELETE FROM configModel WHERE id_model=?", 
                      (self.configs['id_model'],))
        return bool(cur and cur.rowcount > 0)
    
    def get(self):
        if 'id_model' not in self.configs:
            return None
        
        cur = self._db("SELECT * FROM configModel WHERE id_model=?", 
                      (self.configs['id_model'],))
        if not cur:
            return None
        
        row = cur.fetchone()
        if not row:
            return None
        
        cols = [d[0] for d in cur.description]
        result = dict(zip(cols, row))
        if result.get('stop'):
            result['stop'] = json.loads(result['stop'])
        return result