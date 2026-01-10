# kill python process
ps aux | grep python
pkill -f "python.\*llama_server"

print("SOCKET IN GLOBALS:", 'socket' in globals())
print("SOCKET IN BUILTINS:", 'socket' in **builtins**.**dict**)

# update requirements.txt

pip freeze > requirements.txt

# venv
source /home/zaluski/Documentos/HugLab/backend/fullpy/venv/bin/activate


# requires 
node-llama-cpp - create your own cpp library

# feature:
3. resolve theme problem 
4. change the name of the python packages files 

command util

pip install -e .