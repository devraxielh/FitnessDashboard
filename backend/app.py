from fastapi import FastAPI
import psycopg2
import os
from dotenv import load_dotenv
app = FastAPI()
load_dotenv()
def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT")
    )
@app.get("/asistencias")
def obtener_asistencias():
    conn = get_connection()
    cur = conn.cursor()

    query = """
    SELECT
      m.usuario AS monitor_usuario,
      dm.first_name AS monitor_nombre,
      u.usuario AS usuario_asistente,
      du.first_name AS usuario_nombre,
      a.fecha AS fecha_asistencia,
      act.descripcion AS actividad,
      ta.nombre AS tipo_actividad,
      p.nombre AS parque,
      b.nombre AS barrio_actividad,
      c.nombre AS comuna_actividad
    FROM security.users m
    JOIN public.datos_generales dm ON dm."userId" = m.id
    JOIN public.actividade act ON act."userId" = m.id
    JOIN public.tipo_actividad ta ON ta.id = act."tipoActividadId"
    JOIN public.parque p ON p.id = act."parqueId"
    JOIN public.barrio b ON b.id = p."barrioId"
    JOIN public.comuna_corregimiento c ON c.id = b."comunaCorregimientoId"
    JOIN public.asistencia a ON a."actividadId" = act.id
    JOIN public.datos_generales du ON du.document_number = a.documento
    JOIN security.users u ON u.id = du."userId"
    WHERE 'monitor' = ANY(m.role)
      AND 'user' = ANY(u.role)
      AND m.is_active = true
      AND u.is_active = true;
    """
    cur.execute(query)
    columns = [desc[0] for desc in cur.description]
    results = [dict(zip(columns, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return results