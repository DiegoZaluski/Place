# kill python process

ps aux | grep python
pkill -f "python.\*llama_server"

print("SOCKET IN GLOBALS:", 'socket' in globals())
print("SOCKET IN BUILTINS:", 'socket' in **builtins**.**dict**)

# update requirements.txt

pip freeze > requirements.txt

# venv

source /home/zaluski/Documentos/Scry/backend/venv/bin/activate
