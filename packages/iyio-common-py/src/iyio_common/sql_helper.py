
def escape_sql_identifier(name:str):
    return '"'+name.replace('"','""')+'"'
