from sqlite3 import connect
from __init__ import logger, ID_MODEL_WHITELIST


class ConfigModel: 
    def __init__ (self, configs: dict = {}) -> None:
        self._configs = configs
        self._validators = {
            'id_model': lambda v: v in ID_MODEL_WHITELIST,
            'temperature': lambda v: isinstance(v, (int, float)) and 0 <= v <= 2,
            'top_p': lambda v: isinstance(v, (int, float)) and 0 <= v <= 1,
            'top_k': lambda v: isinstance(v, int) and 1 <= v <= 1000,
            'tokens': lambda v: isinstance(v, int) and 512 <= v <= 200000
        }
    def _validate(self) -> int:
        cont = 0 
        for key, value in self._configs.items():
            if key in self._validators and self._validators[key](value):
                cont += 1
        return cont 
    
    def addInTable(self) -> bool:
        """CREATE: Register new configuration in database"""
        if self ._validate() == 5:
            try:
                with connect("configModel.sqlite") as conn:
                    cursor = conn.cursor()
                    cursor.execute("INSERT INTO configModel (id_model, temperature, top_p, top_k, tokens) VALUES (?, ?, ?, ?, ?)",
                                   (self._configs['id_model'], self._configs['temperature'], self._configs['top_p'], self._configs['top_k'], self._configs['tokens']))
                    conn.commit()
                    return True
            except Exception as e:
                logger.error(f"Error adding to table: {e}")
                return False
    
    def updataInTable(self) -> bool:
        """UPDATE: Modify configuration in database"""
        if 2 <= self._validate() <= 5:
            if self._configs.get('id_model', "not_found") != 'not_found':
                pass
            else:
                return False
            try: 
                with connect("configModel.sqlite") as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                    UPDATE configModel
                    SET temperature = COALESCE(?, temperature), 
                        top_p = COALESCE(?, top_p), 
                        top_k = COALESCE(?, top_k), 
                        tokens = COALESCE(?, tokens)
                    WHERE id_model = ?
                    """,( 
                    self._configs.get('temperature'),  
                    self._configs.get('top_p'),
                    self._configs.get('top_k'),
                    self._configs.get('tokens'),
                    self._configs['id_model']
                     ))
                    conn.commit()
                    return True
                
            except Exception as e:
                logger.error(f"Error updating table: {e}")
                return False
        return False
    
    def deleteInTable(self) -> bool:
        """DELETE: Remove configuration from database"""
        try:
            with connect("configModel.sqlite") as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM configModel WHERE id_model = ?", (self._configs['id_model'],))
                if cursor.rowcount > 0:
                    conn.commit()
                    return True
                else:
                    logger.error(f"Error deleting from table - ROWCOUNT: {cursor.rowcount} - ZERO MODIFIED LINES")
                    return False
        except Exception as e:
            logger.error(f"Error deleting from table: {e}")
            return False
    
    def selectInTable(self) -> bool:
        """READ: Get configuration from database"""
        try:
            with connect("configModel.sqlite") as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM configModel WHERE id_model = ?", (self._configs['id_model'],))
                return cursor.fetchone()
        except Exception as e:
            logger.error(f"Error selecting from table: {e}")
            return False     
           
# :-- CREATE --:
# with connect("configModel.sqlite") as conn:
#     cursor = conn.cursor()
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS configModel (
#             id_model TEXT PRIMARY KEY,
#             temperature REAL NOT NULL,
#             top_p REAL NOT NULL, 
#             top_k REAL NOT NULL,
#             tokens INTEGER NOT NULL
#         )
#     """)

# :-- EX OF USE --:
# config = ConfigModel(configs ={
#     "id_model": "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
#     "temperature": 0.7,
#     "top_p": 0.9,
#     "top_k": 40,
#     "tokens": 4096
# })

# print(config.addInTable())