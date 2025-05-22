import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL+'asistencias';
export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monitorSeleccionado, setMonitorSeleccionado] = useState("");
  const [monitores, setMonitores] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("2025-03-01");
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      navigate("/login");
      return;
    }

    axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setData(res.data);
        const nombresUnicos = [...new Set(res.data.map(item => item.monitor_nombre))];
        setMonitores(nombresUnicos);
      })
      .catch(err => {
        console.error("Error al cargar datos:", err);
        if (err.response && err.response.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const datosFiltrados = data.filter(d => {
    const fecha = new Date(d.fecha_asistencia);
    const desde = fechaInicio ? new Date(fechaInicio) : null;
    const hasta = fechaFin ? new Date(fechaFin) : null;

    return (
      (!monitorSeleccionado || d.monitor_nombre === monitorSeleccionado) &&
      (!desde || fecha >= desde) &&
      (!hasta || fecha <= hasta)
    );
  });

  const sortDesc = (arr) => arr.sort((a, b) => b.total - a.total);

  const asistenciasPorComuna = sortDesc(Object.entries(
    datosFiltrados.reduce((acc, cur) => {
      acc[cur.comuna_actividad] = (acc[cur.comuna_actividad] || 0) + 1;
      return acc;
    }, {})
  ).map(([comuna, total]) => ({ comuna, total })));

  const asistenciasPorMonitor = sortDesc(Object.entries(
    data.reduce((acc, cur) => {
      acc[cur.monitor_nombre] = (acc[cur.monitor_nombre] || 0) + 1;
      return acc;
    }, {})
  ).map(([monitor, total]) => ({ monitor, total })));

  const graficaParques = sortDesc(Object.entries(
    datosFiltrados.reduce((acc, cur) => {
      acc[cur.parque] = (acc[cur.parque] || 0) + 1;
      return acc;
    }, {})
  ).map(([parque, total]) => ({ parque, total })));

  return (
    <>
      <PageMeta title="Fitness" description="Asistencias" />

      <div className="grid grid-cols-12 gap-6 px-4 xl:px-8 mt-4">
        <div className="col-span-12">
          {loading ? (
            <div className="flex justify-center items-center h-[60vh]">
              <div className="text-xl text-gray-600 dark:text-white animate-pulse">
                🔄 Cargando datos...
              </div>
            </div>
          ) : (
            <section id="dashboard-pdf" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📊 Asistencias</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label htmlFor="monitor" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Selecciona un monitor:
                  </label>
                  <select
                    id="monitor"
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={monitorSeleccionado}
                    onChange={(e) => setMonitorSeleccionado(e.target.value)}
                  >
                    <option value="">Todos los monitores</option>
                    {monitores.map((nombre, idx) => (
                      <option key={idx} value={nombre}>{nombre}</option>
                    ))}
                  </select>
                  {monitorSeleccionado && (
                    <button
                      onClick={() => setMonitorSeleccionado("")}
                      className="mt-1 text-blue-600 underline text-sm"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Fecha inicial:
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Fecha final:
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              {(monitorSeleccionado || fechaInicio || fechaFin) && (
                <div className="mb-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <strong>🔍 Filtros activos:</strong><br />
                  {monitorSeleccionado && <div>• Monitor: {monitorSeleccionado}</div>}
                  {fechaInicio && <div>• Desde: {fechaInicio}</div>}
                  {fechaFin && <div>• Hasta: {fechaFin}</div>}
                </div>
              )}

              {!monitorSeleccionado && (
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">👤 Participación por Monitor</h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                      data={asistenciasPorMonitor}
                      onClick={(e) => {
                        if (e && e.activeLabel) {
                          setMonitorSeleccionado(e.activeLabel);
                        }
                      }}
                    >
                      <XAxis dataKey="monitor" angle={-90} textAnchor="end" interval={0} height={250} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#00C49F" radius={[5, 5, 0, 0]}>
                        <LabelList dataKey="total" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">📍 Asistencias por Comuna</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={asistenciasPorComuna}>
                    <XAxis dataKey="comuna" angle={-90} textAnchor="end" interval={0} height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8884d8" radius={[5, 5, 0, 0]}>
                      <LabelList dataKey="total" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">🏞️ Asistencias por Parque</h3>
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={graficaParques}>
                    <XAxis dataKey="parque" angle={-90} textAnchor="end" interval={0} height={300} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#ff8042" radius={[5, 5, 0, 0]}>
                      <LabelList dataKey="total" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}