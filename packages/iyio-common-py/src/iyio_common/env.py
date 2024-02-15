import os

def getEnvVar(name:str)->str|None:
    if name.startswith('NX_'):
        name=name[3:]
    return os.getenv(name) or os.getenv('NX_'+name)
