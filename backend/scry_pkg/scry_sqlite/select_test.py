from scry_pkg.scry_sqlite.control_config import ControlConfig

control = ControlConfig({"id_model":"deepseek-coder-6.7b-instruct.Q4_K_M.gguf"})
print(f"SELECT: {control.get()}")