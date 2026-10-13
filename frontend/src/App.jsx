import { useState, useEffect, useMemo } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-de-reservas-642w.onrender.com';

// Nombres de campo posibles para la fecha de la función según cómo lo devuelva el backend
const CLAVES_HORARIO = ['horario', 'fechaHora', 'fecha_hora', 'fechaFuncion', 'fecha', 'inicio', 'fechaInicio'];

function App() {
  // --- ESTADOS GLOBALES ---
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [cines, setCines] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [funcionesGlobales, setFuncionesGlobales] = useState([])
  const [butacasOcupadas, setButacasOcupadas] = useState([]) // El backend manda números (ID de butaca)

  // --- ADMIN: FORMULARIOS ---
  const [activeTabAdmin, setActiveTabAdmin] = useState('cines')
  const [nuevoCineNombre, setNuevoCineNombre] = useState('')
  const [nuevoCineDireccion, setNuevoCineDireccion] = useState('')
  const [nuevaPeliTitulo, setNuevaPeliTitulo] = useState('')
  const [nuevaPeliIdioma, setNuevaPeliIdioma] = useState('')
  const [funcionCineId, setFuncionCineId] = useState('')
  const [funcionSalaId, setFuncionSalaId] = useState('')
  const [funcionPeliId, setFuncionPeliId] = useState('')
  const [funcionHorario, setFuncionHorario] = useState('')

  // --- ADMIN: FILTROS Y ESTADO DEL CRONOGRAMA ---
  const [filtroAdminPeli, setFiltroAdminPeli] = useState('')
  const [filtroAdminCine, setFiltroAdminCine] = useState('')
  const [peliculasColapsadas, setPeliculasColapsadas] = useState({})

  // --- ADMIN: EDITOR DE SALAS Y BUTACAS ---
  const [nuevaSalaNumero, setNuevaSalaNumero] = useState('')
  const [editandoMapaButacas, setEditandoMapaButacas] = useState(null)
  const [matrizLayout, setMatrizLayout] = useState([])
  const FILAS_MAX = 12;
  const COLS_MAX = 12;

  // --- CLIENTE: FLUJO DE NAVEGACIÓN ---
  const [modoBusqueda, setModoBusqueda] = useState('cine') // 'cine' | 'pelicula'
  const [pasoCliente, setPasoCliente] = useState(1)
  const [cineSeleccionado, setCineSeleccionado] = useState(null)
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null)
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null)
  const [butacasSeleccionadas, setButacasSeleccionadas] = useState([]) // Acá guardamos objetos { id: 1, etiqueta: 'A1' }

  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  // ==========================================
  // HELPERS GLOBALES BLINDADOS
  // ==========================================
  const getIdPeli = (p) => p ? (p.idPelicula || p.id) : null;
  const getIdCine = (c) => c ? (c.idCine || c.id) : null;
  const getIdFuncion = (f) => f ? (f.idFuncion || f.id) : null;

  // Busca el valor crudo de la fecha en cualquiera de los nombres de campo posibles
  const getHorarioRaw = (f) => {
    if (!f) return null;
    for (const k of CLAVES_HORARIO) {
      if (f[k] !== undefined && f[k] !== null && f[k] !== '') return f[k];
    }
    return null;
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  // PARSEADOR DE FECHAS: soporta array de Spring, timestamp, objeto, ISO, ISO con micros/zona, dd/mm/yyyy
  const parsearFecha = (cruda) => {
    if (cruda === null || cruda === undefined || cruda === '') return null;
    try {
      let dObj = null;

      if (cruda instanceof Date) {
        dObj = cruda;
      }
      // Spring Boot (LocalDateTime sin configurar): [año, mes, dia, hora, minuto, segundo]
      else if (Array.isArray(cruda)) {
        const [y, m, d, h = 0, min = 0, s = 0] = cruda.map(Number);
        dObj = new Date(y, m - 1, d, h, min, s); // en JS los meses van de 0 a 11
      }
      // Timestamp numérico (ms o segundos)
      else if (typeof cruda === 'number') {
        dObj = new Date(cruda < 1e11 ? cruda * 1000 : cruda);
      }
      // Objeto tipo { year, monthValue, dayOfMonth, hour, minute }
      else if (typeof cruda === 'object') {
        const y = cruda.year;
        const m = cruda.monthValue ?? cruda.month;
        const d = cruda.dayOfMonth ?? cruda.day;
        if (y && m && d) dObj = new Date(y, m - 1, d, cruda.hour || 0, cruda.minute || 0, cruda.second || 0);
      }
      else {
        const str = String(cruda).trim();

        // Solo fecha: 2026-10-13 (new Date() la tomaría como UTC y corre el día)
        let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
          dObj = new Date(+m[1], +m[2] - 1, +m[3]);
        } else {
          // ISO sin zona horaria: 2026-10-13T20:00 | 2026-10-13 20:00:00 | con fracciones
          m = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,]\d+)?$/);
          if (m) {
            dObj = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
          } else {
            // dd/mm/yyyy [hh:mm]
            m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T,]+(\d{1,2}):(\d{2}))?/);
            if (m) {
              dObj = new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
            } else {
              // ISO con zona (Z / -03:00): se convierte a hora local
              dObj = new Date(str.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1'));
            }
          }
        }
      }

      return dObj && !isNaN(dObj.getTime()) ? dObj : null;
    } catch (e) {
      return null;
    }
  };

  // yyyy-mm-dd en hora local
  const claveDia = (dateObj) => `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;

  // HH:MM manual (evita "08:00 p. m." según el navegador)
  const formatHora = (dateObj) => dateObj ? `${pad2(dateObj.getHours())}:${pad2(dateObj.getMinutes())}` : null;

  // 13/10/2026 20:00 hs
  const formatFechaHora = (dateObj) =>
    dateObj
      ? `${pad2(dateObj.getDate())}/${pad2(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${formatHora(dateObj)} hs`
      : null;

  // "martes, 13 de octubre"
  const formatDiaLargo = (diaString) => {
    if (!diaString || diaString === 'Fecha_Invalida') return '⚠️ Fecha inválida / A confirmar';
    const [y, m, d] = diaString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // ==========================================
  // 1. CARGA DE DATOS MASIVA
  // ==========================================
  const cargarDatos = async () => {
    try {
      const [resCines, resPelis] = await Promise.all([
        fetch(`${API_URL}/api/cines`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/peliculas`).catch(() => ({ ok: false }))
      ]);

      let cinesData = [];
      if (resCines.ok) {
        cinesData = await resCines.json();
        if (!Array.isArray(cinesData)) cinesData = [];
        setCines(cinesData);
      }

      if (resPelis.ok) {
        const pelisData = await resPelis.json();
        setPeliculas(Array.isArray(pelisData) ? pelisData : []);
      }

      let todasLasFunciones = [];
      for (const cine of cinesData) {
        const cid = getIdCine(cine);
        try {
          const resFunc = await fetch(`${API_URL}/api/funciones/cine/${cid}`);
          if (resFunc.ok) {
            const funcData = await resFunc.json();
            if (Array.isArray(funcData)) {
              const mapeadas = funcData.map(f => {
                const horarioRaw = getHorarioRaw(f);
                const dateObj = parsearFecha(horarioRaw);

                return {
                  ...f,
                  cineAsociado: cine,
                  horarioRaw,
                  fechaObj: dateObj,
                  diaString: dateObj ? claveDia(dateObj) : 'Fecha_Invalida'
                };
              });
              todasLasFunciones = [...todasLasFunciones, ...mapeadas];
            }
          }
        } catch (e) {}
      }
      setFuncionesGlobales(todasLasFunciones);
    } catch (e) {
      console.error("Error sincronizando datos centrales");
    }
  }

  useEffect(() => { if (usuario) cargarDatos(); }, [usuario])

  useEffect(() => {
    let timer;
    if (butacasSeleccionadas.length > 0 && tiempoRestante > 0 && !reservaExitosa) {
      timer = setInterval(() => setTiempoRestante(p => p - 1), 1000)
    } else if (tiempoRestante === 0) {
      alert("El tiempo de reserva ha expirado.")
      setButacasSeleccionadas([]); setTiempoRestante(300);
    }
    return () => clearInterval(timer)
  }, [butacasSeleccionadas, tiempoRestante, reservaExitosa])

  // ==========================================
  // 2. LÓGICA DE AUTENTICACIÓN
  // ==========================================
  const iniciarSesion = async (e) => {
    e.preventDefault()
    setErrorLogin('')
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      })
      if (res.ok) setUsuario(await res.json())
      else setErrorLogin('Credenciales incorrectas.')
    } catch (err) { setErrorLogin('Error de conexión con el backend.') }
  }

  const cerrarSesion = () => {
    setUsuario(null); reiniciarFlujoCliente();
  }

  const reiniciarFlujoCliente = () => {
    setPasoCliente(1); setCineSeleccionado(null); setPeliculaSeleccionada(null);
    setFuncionSeleccionada(null); setButacasSeleccionadas([]); setReservaExitosa(false); setTiempoRestante(300);
  }

  // ==========================================
  // 3. OPERACIONES CRUD ADMIN
  // ==========================================
  const crearCine = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/cines`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoCineNombre, ubicacion: { pais: "Argentina", direccion: nuevoCineDireccion }})
    });
    setNuevoCineNombre(''); setNuevoCineDireccion(''); cargarDatos();
  }
  const eliminarCine = async (id) => {
    if (window.confirm("¿Eliminar cine?")) { await fetch(`${API_URL}/api/cines/${id}`, { method: 'DELETE' }); cargarDatos(); }
  }
  const crearPelicula = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/peliculas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevaPeliTitulo, idioma: nuevaPeliIdioma, formato: "2D", duracionMinutos: 120 })
    });
    setNuevaPeliTitulo(''); setNuevaPeliIdioma(''); cargarDatos();
  }
  const eliminarPelicula = async (id) => {
    if (window.confirm("¿Eliminar película?")) { await fetch(`${API_URL}/api/peliculas/${id}`, { method: 'DELETE' }); cargarDatos(); }
  }
  const crearFuncion = async (e) => {
    e.preventDefault();
    // El input datetime-local manda "2026-10-13T20:00"; le agregamos segundos para que Spring (LocalDateTime) lo parsee sin problemas
    const horarioEnviar = funcionHorario.length === 16 ? `${funcionHorario}:00` : funcionHorario;
    const res = await fetch(`${API_URL}/api/funciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pelicula: { idPelicula: parseInt(funcionPeliId) },
        sala: { idSala: parseInt(funcionSalaId) },
        horario: horarioEnviar
      })
    });
    if (res.ok) { alert('Función programada!'); setFuncionCineId(''); setFuncionSalaId(''); setFuncionPeliId(''); setFuncionHorario(''); cargarDatos(); }
    else alert('Error programando la función.');
  }
  const eliminarFuncion = async (id) => {
    if (window.confirm("¿Eliminar función?")) { await fetch(`${API_URL}/api/funciones/${id}`, { method: 'DELETE' }); cargarDatos(); }
  }

  // --- EDITOR DE SALAS Y MAPA DE BUTACAS ---
  const abrirEditorButacas = (idCine) => {
    const initMatrix = Array(FILAS_MAX).fill(0).map(() => Array(COLS_MAX).fill(true));
    setMatrizLayout(initMatrix);
    setEditandoMapaButacas(idCine);
  }

  const toggleButacaLayout = (r, c) => {
    const nueva = matrizLayout.map(fila => [...fila]);
    nueva[r][c] = !nueva[r][c];
    setMatrizLayout(nueva);
  }

  const guardarSalaConLayout = async () => {
    if(!nuevaSalaNumero) return alert("Ingresá un número de sala.");
    const cap = matrizLayout.flat().filter(b => b === true).length;
    const layoutStr = JSON.stringify(matrizLayout);

    await fetch(`${API_URL}/api/salas/cine/${editandoMapaButacas}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: parseInt(nuevaSalaNumero),
        capacidad: cap,
        layoutPersonalizado: layoutStr
      })
    });
    setEditandoMapaButacas(null); setNuevaSalaNumero(''); cargarDatos();
  }

  const eliminarSala = async (idSala) => {
    if (window.confirm("¿Eliminar sala?")) { await fetch(`${API_URL}/api/salas/${idSala}`, { method: 'DELETE' }); cargarDatos(); }
  }

  // ==========================================
  // 4. LÓGICA DEL CLIENTE (FILTROS CRUZADOS)
  // ==========================================

  const peliculasConFuncionesActivas = useMemo(() => {
    const map = new Map();
    funcionesGlobales.forEach(f => { if(f.pelicula) map.set(getIdPeli(f.pelicula), f.pelicula) });
    return Array.from(map.values());
  }, [funcionesGlobales]);

  const obtenerCinesPorPelicula = (idPeli) => {
    const cinesMap = new Map();
    funcionesGlobales.filter(f => getIdPeli(f.pelicula) === idPeli)
                     .forEach(f => { if(f.cineAsociado) cinesMap.set(getIdCine(f.cineAsociado), f.cineAsociado) });
    return Array.from(cinesMap.values());
  }

  const obtenerFuncionesParaCliente = () => {
    return funcionesGlobales.filter(f =>
      getIdPeli(f.pelicula) === getIdPeli(peliculaSeleccionada) &&
      getIdCine(f.cineAsociado) === getIdCine(cineSeleccionado)
    );
  }

  const handleSeleccionarCine = (cine) => {
    setCineSeleccionado(cine);
    if(modoBusqueda === 'cine') setPasoCliente(2);
    if(modoBusqueda === 'pelicula') setPasoCliente(3);
  }

  const handleSeleccionarPelicula = (peli) => {
    setPeliculaSeleccionada(peli);
    if(modoBusqueda === 'pelicula') setPasoCliente(2);
    if(modoBusqueda === 'cine') setPasoCliente(3);
  }

  const handleSeleccionarFuncion = async (funcion) => {
    setFuncionSeleccionada(funcion); setButacasSeleccionadas([]); setTiempoRestante(300); setReservaExitosa(false);
    try {
      // El backend devuelve una lista de números (idSala / butaca ocupada)
      const res = await fetch(`${API_URL}/api/reservas/ocupadas/${getIdFuncion(funcion)}`);
      if (res.ok) setButacasOcupadas(await res.json());
      else setButacasOcupadas([]);
    } catch { setButacasOcupadas([]); }
    setPasoCliente(4);
  }

  // ==========================================
  // CORRECCIÓN DEFINITIVA DE LA RESERVA (ERROR 400)
  // ==========================================
  const confirmarReserva = async () => {
    const idU = Number(usuario.idUsuario || usuario.id || 1);
    const idS = Number(funcionSeleccionada.sala?.idSala || funcionSeleccionada.sala?.id);

    // Mapeamos a un array solo de enteros (ej: [1, 5, 8]) para que coincida con el backend List<Integer>
    const arrayNumerosButacas = butacasSeleccionadas.map(b => b.id);

    // Estructura EXACTA de tu ReservaRequestDTO en Spring Boot
    const payload = {
      idUsuario: idU,
      idSala: idS,
      butacasSeleccionadas: arrayNumerosButacas
    };

    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setButacasOcupadas(prev => [...prev, ...arrayNumerosButacas]);
        setReservaExitosa(true);
      } else {
        const errorText = await res.text();
        alert(`Error al reservar. El servidor dice: ${errorText}`);
      }
    } catch (error) { alert("Error de red."); }
  }

  // GENERADOR DINÁMICO MATRIZ CLIENTE (Soporta Layout Custom y Defecto)
  const letrasFilas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const generarMatrizCliente = () => {
    let layoutArray = null;
    const salaObj = funcionSeleccionada?.sala;

    if (salaObj?.layoutPersonalizado) {
      try { layoutArray = JSON.parse(salaObj.layoutPersonalizado); } catch(e){}
    }

    const asientos = [];
    let numeroGlobal = 1;
    const maxFilas = layoutArray ? layoutArray.length : Math.ceil((salaObj?.capacidad || 50) / 10);
    const maxCols = layoutArray ? layoutArray[0].length : 10;

    for (let f = 0; f < maxFilas; f++) {
      const letra = letrasFilas[f] || 'X';
      const filaData = [];
      for (let c = 0; c < maxCols; c++) {
        const esActiva = layoutArray ? (layoutArray[f][c] === true) : (numeroGlobal <= (salaObj?.capacidad || 50));
        if (esActiva) {
          filaData.push({ id: numeroGlobal, etiqueta: `${letra}${c+1}`, activa: true });
          numeroGlobal++;
        } else {
          filaData.push({ id: `vacio-${f}-${c}`, etiqueta: '', activa: false });
        }
      }
      asientos.push({ fila: letra, asientos: filaData });
    }
    return asientos;
  };

  // ==========================================
  // RENDERIZADO DE PANTALLAS
  // ==========================================
  if (!usuario) {
    return (
      <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#121212', borderRadius: '16px', border: '1px solid #222', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <h1 style={{ color: '#e50914', textAlign: 'center', fontSize: '2.5em', margin: '0 0 20px 0', fontWeight: '900' }}>CINEMAX</h1>
          {errorLogin && <div style={{ background: '#3a0000', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' }}>{errorLogin}</div>}
          <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
            <button type="submit" style={{ padding: '14px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Ingresar</button>
          </form>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // VISTA ADMINISTRADOR
  // ----------------------------------------------------
  if (usuario.rol === 'ADMIN') {
    const hoyStr = claveDia(new Date());

    // Filtros del cronograma
    const funcionesAdminFiltradas = funcionesGlobales.filter(f =>
      (!filtroAdminPeli || String(getIdPeli(f.pelicula)) === filtroAdminPeli) &&
      (!filtroAdminCine || String(getIdCine(f.cineAsociado)) === filtroAdminCine)
    );

    // Agrupación: Película > Día > Cine > funciones
    const cronogramaPorPelicula = {};
    funcionesAdminFiltradas.forEach(f => {
      const key = String(getIdPeli(f.pelicula) ?? 'desconocida');
      if (!cronogramaPorPelicula[key]) {
        cronogramaPorPelicula[key] = {
          key,
          titulo: f.pelicula?.titulo || 'Película desconocida',
          idioma: f.pelicula?.idioma || '',
          total: 0,
          dias: {}
        };
      }
      const grupo = cronogramaPorPelicula[key];
      grupo.total++;
      if (!grupo.dias[f.diaString]) grupo.dias[f.diaString] = [];
      grupo.dias[f.diaString].push(f);
    });
    const peliculasCronograma = Object.values(cronogramaPorPelicula).sort((a, b) => a.titulo.localeCompare(b.titulo));

    const ordenarDias = (dias) => Object.keys(dias).sort((a, b) => {
      if (a === 'Fecha_Invalida') return 1;
      if (b === 'Fecha_Invalida') return -1;
      return a.localeCompare(b);
    });

    const agruparPorCine = (funciones) => {
      const porCine = {};
      funciones.forEach(f => {
        const k = String(getIdCine(f.cineAsociado));
        if (!porCine[k]) porCine[k] = { nombre: f.cineAsociado?.nombre || 'Cine', funciones: [] };
        porCine[k].funciones.push(f);
      });
      Object.values(porCine).forEach(c => c.funciones.sort((a, b) => (a.fechaObj?.getTime() || 0) - (b.fechaObj?.getTime() || 0)));
      return Object.values(porCine).sort((a, b) => a.nombre.localeCompare(b.nombre));
    };

    const toggleColapsada = (key) => setPeliculasColapsadas(prev => ({ ...prev, [key]: !prev[key] }));
    const colapsarTodas = (valor) => {
      const nuevo = {};
      peliculasCronograma.forEach(p => { nuevo[p.key] = valor; });
      setPeliculasColapsadas(nuevo);
    };

    const estiloSelectAdmin = { padding: '10px', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '6px' };
    const estiloBotonChico = { padding: '8px 14px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85em' };

    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#f1f1f1', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '25px' }}>
            <h1 style={{ margin: 0, color: '#e50914', fontSize: '1.8em' }}>Panel Admin ⚙️</h1>
            <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer' }}>Salir</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom:'5px' }}>
            <button onClick={() => setActiveTabAdmin('cines')} style={{ padding: '10px 20px', background: activeTabAdmin === 'cines' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>📍 Complejos y Salas</button>
            <button onClick={() => setActiveTabAdmin('peliculas')} style={{ padding: '10px 20px', background: activeTabAdmin === 'peliculas' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>🎬 Películas</button>
            <button onClick={() => setActiveTabAdmin('funciones')} style={{ padding: '10px 20px', background: activeTabAdmin === 'funciones' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>🕒 Funciones (Cronograma)</button>
          </div>

          {/* TAB CINES */}
          {activeTabAdmin === 'cines' && (
            <div style={{ background: '#121212', borderRadius: '12px', padding: '20px', border: '1px solid #222' }}>
              <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap:'wrap' }}>
                <input type="text" placeholder="Nombre de Cine" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required style={{ flex: '1 1 200px', padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} />
                <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required style={{ flex: '1 1 200px', padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} />
                <button type="submit" style={{ padding: '10px 20px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', cursor:'pointer' }}>Crear Cine</button>
              </form>

              <div style={{ display: 'grid', gap: '20px' }}>
                {cines.map(c => {
                  const cid = getIdCine(c);
                  return (
                    <div key={cid} style={{ background: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#fff' }}>{c.nombre} <small style={{ color: '#888', fontWeight: 'normal' }}>- {c.ubicacion?.direccion}</small></h3>
                        <button onClick={() => eliminarCine(cid)} style={{ background: '#3a0000', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', cursor: 'pointer', padding:'4px 10px' }}>Borrar Complejo</button>
                      </div>

                      {/* DISEÑADOR DE SALA */}
                      {editandoMapaButacas === cid ? (
                        <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #444' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#3399ff' }}>Diseñador Visual de Butacas</h4>
                          <p style={{ fontSize: '0.85em', color: '#bbb', marginBottom: '15px' }}>Hacé click en los recuadros para eliminarlos (crear pasillos o espacios vacíos).</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {matrizLayout.map((fila, rIndex) => (
                              <div key={rIndex} style={{ display: 'flex', gap: '5px' }}>
                                {fila.map((activa, cIndex) => (
                                  <div key={cIndex} onClick={() => toggleButacaLayout(rIndex, cIndex)}
                                       style={{ width: '30px', height: '30px', background: activa ? '#0d6efd' : '#111', borderRadius: '4px', cursor: 'pointer', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {activa && <span style={{fontSize:'0.6em', color:'#fff'}}>{cIndex+1}</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
                            <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} style={{ padding: '10px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', width: '100px' }} required/>
                            <button onClick={guardarSalaConLayout} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar (Aforo: {matrizLayout.flat().filter(x=>x).length})</button>
                            <button onClick={() => setEditandoMapaButacas(null)} style={{ background: 'transparent', color: '#fff', border: '1px solid #666', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => abrirEditorButacas(cid)} style={{ background: '#2a2a2a', color: '#fff', border: '1px solid #444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '15px', fontSize: '0.85em' }}>+ Agregar Sala (Dibujar Mapa)</button>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {c.salas?.map(s => (
                          <div key={s.idSala || s.id} style={{ background: '#111', padding: '10px 15px', borderRadius: '6px', border: '1px solid #333', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap:'10px' }}>
                            <span>Sala {s.numero} — <strong>{s.capacidad} asientos</strong></span>
                            <button onClick={() => eliminarSala(s.idSala || s.id)} style={{ background: 'none', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB PELICULAS */}
          {activeTabAdmin === 'peliculas' && (
             <div style={{ background: '#121212', borderRadius: '12px', padding: '20px', border: '1px solid #222' }}>
              <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap:'wrap' }}>
                <input type="text" placeholder="Título" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required style={{ flex: '1 1 200px', padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} />
                <input type="text" placeholder="Idioma (Ej: Español, Sub)" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required style={{ flex: '1 1 150px', padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} />
                <button type="submit" style={{ padding: '10px 20px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', cursor:'pointer' }}>Agregar a Cartelera</button>
              </form>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {peliculas.map(p => (
                  <div key={getIdPeli(p)} style={{ background: '#181818', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h4 style={{ margin: '0 0 5px 0' }}>{p.titulo}</h4><span style={{ fontSize: '0.8em', color: '#888', background:'#111', padding:'3px 6px', borderRadius:'4px' }}>{p.idioma}</span></div>
                    <button onClick={() => eliminarPelicula(getIdPeli(p))} style={{ background: 'none', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize:'1.2em' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CRONOGRAMA */}
          {activeTabAdmin === 'funciones' && (
            <div style={{ background: '#121212', borderRadius: '12px', padding: '20px', border: '1px solid #222' }}>
              {/* FORMULARIO NUEVA FUNCIÓN */}
              <form onSubmit={crearFuncion} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '30px' }}>
                <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} style={estiloSelectAdmin} required>
                  <option value="">1. Complejo...</option>
                  {cines.map(c => <option key={getIdCine(c)} value={getIdCine(c)}>{c.nombre}</option>)}
                </select>
                <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} disabled={!funcionCineId} style={estiloSelectAdmin} required>
                  <option value="">2. Sala...</option>
                  {cines.find(c => String(getIdCine(c)) === funcionCineId)?.salas?.map(s => <option key={s.idSala || s.id} value={s.idSala || s.id}>Sala {s.numero}</option>)}
                </select>
                <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} style={estiloSelectAdmin} required>
                  <option value="">3. Película...</option>
                  {peliculas.map(p => <option key={getIdPeli(p)} value={getIdPeli(p)}>{p.titulo}</option>)}
                </select>
                <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} style={estiloSelectAdmin} required />
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor:'pointer', fontWeight: 'bold' }}>Programar Nueva Función</button>
              </form>

              {/* ENCABEZADO + FILTROS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>
                  Cartelera <small style={{ color: '#888', fontWeight: 'normal' }}>— {funcionesAdminFiltradas.length} función(es) en {peliculasCronograma.length} película(s)</small>
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select value={filtroAdminPeli} onChange={e => setFiltroAdminPeli(e.target.value)} style={estiloSelectAdmin}>
                    <option value="">Todas las películas</option>
                    {peliculas.map(p => <option key={getIdPeli(p)} value={String(getIdPeli(p))}>{p.titulo}</option>)}
                  </select>
                  <select value={filtroAdminCine} onChange={e => setFiltroAdminCine(e.target.value)} style={estiloSelectAdmin}>
                    <option value="">Todos los cines</option>
                    {cines.map(c => <option key={getIdCine(c)} value={String(getIdCine(c))}>{c.nombre}</option>)}
                  </select>
                  <button onClick={() => colapsarTodas(false)} style={estiloBotonChico}>Expandir todo</button>
                  <button onClick={() => colapsarTodas(true)} style={estiloBotonChico}>Colapsar todo</button>
                </div>
              </div>

              {/* PELÍCULA > DÍA > CINE > HORAS */}
              {peliculasCronograma.map(peli => {
                const colapsada = !!peliculasColapsadas[peli.key];
                const diasOrdenados = ordenarDias(peli.dias);

                return (
                  <div key={peli.key} style={{ marginBottom: '20px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                    {/* Cabecera de película */}
                    <div onClick={() => toggleColapsada(peli.key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#202020', borderBottom: colapsada ? 'none' : '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#888', fontSize: '0.9em' }}>{colapsada ? '▶' : '▼'}</span>
                        <h2 style={{ margin: 0, color: '#e50914', fontSize: '1.4em' }}>🎬 {peli.titulo}</h2>
                        {peli.idioma && <span style={{ fontSize: '0.75em', color: '#aaa', background: '#111', padding: '3px 8px', borderRadius: '4px' }}>{peli.idioma}</span>}
                      </div>
                      <span style={{ fontSize: '0.85em', color: '#ccc', background: '#111', padding: '5px 12px', borderRadius: '20px', border: '1px solid #333', whiteSpace: 'nowrap' }}>
                        {peli.total} función(es) · {diasOrdenados.length} día(s)
                      </span>
                    </div>

                    {/* Días */}
                    {!colapsada && (
                      <div style={{ padding: '10px 20px 20px' }}>
                        {diasOrdenados.map(dia => {
                          const invalido = dia === 'Fecha_Invalida';
                          let fechaBloque = { semana: '⚠️', numero: '?', mes: '' };
                          if (!invalido) {
                            const [y, m, d] = dia.split('-').map(Number);
                            const dt = new Date(y, m - 1, d);
                            fechaBloque = {
                              semana: dt.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
                              numero: d,
                              mes: dt.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
                            };
                          }
                          const esHoy = dia === hoyStr;
                          const gruposCine = agruparPorCine(peli.dias[dia]);

                          return (
                            <div key={dia} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '18px', padding: '16px 0', borderBottom: '1px dashed #2f2f2f' }}>
                              {/* Bloque de fecha tipo calendario */}
                              <div style={{ textAlign: 'center', background: invalido ? '#3a0000' : esHoy ? '#e50914' : '#111', border: `1px solid ${invalido ? '#ff4d4d' : esHoy ? '#e50914' : '#333'}`, borderRadius: '10px', padding: '10px 6px', alignSelf: 'start' }}>
                                <div style={{ fontSize: '0.75em', textTransform: 'uppercase', color: invalido ? '#ff8080' : esHoy ? '#fff' : '#ffc107', letterSpacing: '1px' }}>{fechaBloque.semana}</div>
                                <div style={{ fontSize: '1.9em', fontWeight: '800', lineHeight: 1.1, color: '#fff' }}>{fechaBloque.numero}</div>
                                <div style={{ fontSize: '0.75em', textTransform: 'uppercase', color: '#aaa' }}>{fechaBloque.mes}</div>
                                {esHoy && <div style={{ fontSize: '0.65em', marginTop: '4px', fontWeight: 'bold', color: '#fff' }}>HOY</div>}
                                {invalido && <div style={{ fontSize: '0.65em', marginTop: '4px', color: '#ff8080' }}>Sin fecha</div>}
                              </div>

                              {/* Cines y horarios del día */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {gruposCine.map(gc => (
                                  <div key={gc.nombre} style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: '160px', color: '#bbb', fontSize: '0.9em', fontWeight: '600' }}>📍 {gc.nombre}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {gc.funciones.map(f => {
                                        const hora = formatHora(f.fechaObj);
                                        return (
                                          <div key={getIdFuncion(f)} title={invalido ? `Valor recibido del backend: ${JSON.stringify(f.horarioRaw)}` : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#222', border: `1px solid ${invalido ? '#ff4d4d' : '#555'}`, borderRadius: '8px', padding: '8px 12px' }}>
                                            <div>
                                              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1em' }}>
                                                {hora ? `${hora} hs` : <span style={{ color: '#ff8080', fontSize: '0.8em' }}>{f.horarioRaw !== null ? `Raw: ${JSON.stringify(f.horarioRaw)}` : 'Sin horario'}</span>}
                                              </div>
                                              <div style={{ fontSize: '0.75em', color: '#999' }}>Sala {f.sala?.numero ?? '?'}</div>
                                            </div>
                                            <button onClick={() => eliminarFuncion(getIdFuncion(f))} title="Eliminar función" style={{ background: 'none', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize: '1.1em' }}>✕</button>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {peliculasCronograma.length === 0 && <p style={{ color: '#666' }}>No hay funciones que coincidan con los filtros.</p>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // VISTA CLIENTE
  // ----------------------------------------------------
  const agruparFuncionesCliente = () => {
    const funcionesValidas = obtenerFuncionesParaCliente();
    const agrupado = {};
    funcionesValidas.forEach(f => {
      const clave = f.diaString;
      if(!agrupado[clave]) agrupado[clave] = [];
      agrupado[clave].push(f);
    });
    return agrupado;
  };

  const funcionesAgrupadasCliente = pasoCliente === 3 ? agruparFuncionesCliente() : {};

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f1f1f1', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#e50914', fontSize: '2em', fontWeight: '900' }}>CINEMAX 🍿</h1>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8em', marginTop: '10px', color: '#666', flexWrap: 'wrap' }}>
              <span style={{ color: pasoCliente >= 1 ? '#e50914' : 'inherit', fontWeight:'bold' }}>1. Búsqueda</span> &gt;
              <span style={{ color: pasoCliente >= 2 ? '#e50914' : 'inherit', fontWeight:'bold' }}>2. Selección</span> &gt;
              <span style={{ color: pasoCliente >= 3 ? '#e50914' : 'inherit', fontWeight:'bold' }}>3. Función</span> &gt;
              <span style={{ color: pasoCliente >= 4 ? '#e50914' : 'inherit', fontWeight:'bold' }}>4. Asientos</span>
            </div>
          </div>
          <button onClick={cerrarSesion} style={{ background: '#121212', color: '#fff', border: '1px solid #333', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Salir</button>
        </div>

        {/* PASO 1 */}
        {pasoCliente === 1 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
              <button onClick={() => setModoBusqueda('pelicula')} style={{ padding: '12px 25px', fontSize: '1.1em', background: modoBusqueda === 'pelicula' ? '#e50914' : '#121212', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🎬 Buscar por Película</button>
              <button onClick={() => setModoBusqueda('cine')} style={{ padding: '12px 25px', fontSize: '1.1em', background: modoBusqueda === 'cine' ? '#e50914' : '#121212', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📍 Buscar por Cine</button>
            </div>

            {modoBusqueda === 'pelicula' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {peliculasConFuncionesActivas.map(p => (
                  <div key={getIdPeli(p)} onClick={() => handleSeleccionarPelicula(p)} style={{ background: '#121212', padding: '25px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '3em', marginBottom: '10px' }}>🍿</div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>{p.titulo}</h3>
                    <span style={{ fontSize: '0.8em', color: '#888', background: '#1a1a1a', padding: '4px 8px', borderRadius: '4px' }}>{p.idioma}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {cines.map(c => (
                  <div key={getIdCine(c)} onClick={() => handleSeleccionarCine(c)} style={{ background: '#121212', padding: '25px', borderRadius: '12px', border: '1px solid #2a2a2a', cursor: 'pointer', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>{c.nombre}</h3>
                    <p style={{ margin: 0, fontSize: '0.85em', color: '#888' }}>{c.ubicacion?.direccion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 2 */}
        {pasoCliente === 2 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <button onClick={() => setPasoCliente(1)} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', cursor: 'pointer', marginBottom: '20px', padding: '6px 12px', borderRadius:'6px' }}>← Atrás</button>

            {modoBusqueda === 'pelicula' ? (
              <>
                <h2 style={{ color: '#fff', marginBottom: '20px' }}>📍 ¿En qué cine querés ver <span style={{color:'#ffc107'}}>{peliculaSeleccionada?.titulo}</span>?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                  {obtenerCinesPorPelicula(getIdPeli(peliculaSeleccionada)).map(c => (
                    <div key={getIdCine(c)} onClick={() => handleSeleccionarCine(c)} style={{ background: '#121212', padding: '20px', borderRadius: '10px', border: '1px solid #333', cursor: 'pointer' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>{c.nombre}</h4>
                      <p style={{ margin: 0, fontSize: '0.8em', color: '#888' }}>{c.ubicacion?.direccion}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ color: '#fff', marginBottom: '20px' }}>🎬 Películas disponibles en <span style={{color:'#ffc107'}}>{cineSeleccionado?.nombre}</span></h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                  {Array.from(new Map(funcionesGlobales.filter(f => getIdCine(f.cineAsociado) === getIdCine(cineSeleccionado)).filter(f => f.pelicula).map(f => [getIdPeli(f.pelicula), f.pelicula])).values()).map(p => (
                    <div key={getIdPeli(p)} onClick={() => handleSeleccionarPelicula(p)} style={{ background: '#121212', padding: '20px', borderRadius: '10px', border: '1px solid #333', cursor: 'pointer', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>{p.titulo}</h4>
                      <span style={{ fontSize: '0.75em', color: '#888' }}>{p.idioma}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* PASO 3 */}
        {pasoCliente === 3 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <button onClick={() => setPasoCliente(2)} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', cursor: 'pointer', marginBottom: '20px', padding: '6px 12px', borderRadius:'6px' }}>← Atrás</button>
            <div style={{ background: '#121212', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.8em' }}>{peliculaSeleccionada?.titulo}</h2>
              <p style={{ margin: '0 0 25px 0', color: '#aaa', fontSize: '1em' }}>📍 {cineSeleccionado?.nombre}</p>

              {Object.keys(funcionesAgrupadasCliente).length === 0 ? (
                <p style={{ color: '#ff4d4d' }}>No hay horarios disponibles.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {Object.keys(funcionesAgrupadasCliente).sort((a, b) => a === 'Fecha_Invalida' ? 1 : b === 'Fecha_Invalida' ? -1 : a.localeCompare(b)).map(fechaCruda => (
                    <div key={fechaCruda} style={{ borderLeft: '3px solid #444', paddingLeft: '15px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#ffc107', textTransform: 'capitalize', fontSize: '1.2em' }}>📅 {formatDiaLargo(fechaCruda)}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        {funcionesAgrupadasCliente[fechaCruda].sort((a,b)=> (a.fechaObj?.getTime() || 0)-(b.fechaObj?.getTime() || 0)).map(f => (
                          <button key={getIdFuncion(f)} onClick={() => handleSeleccionarFuncion(f)} style={{ padding: '12px 25px', background: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2em', fontWeight: 'bold' }}>
                            {formatHora(f.fechaObj) || '?'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 4: MAPA CLIENTE */}
        {pasoCliente === 4 && funcionSeleccionada && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <button onClick={() => setPasoCliente(3)} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', cursor: 'pointer', marginBottom: '20px', padding: '6px 12px', borderRadius:'6px' }}>← Atrás</button>

            {reservaExitosa ? (
              <div style={{ padding: '40px 20px', background: '#121212', borderRadius: '12px', border: '2px dashed #28a745', textAlign: 'center' }}>
                <h1 style={{ color: '#28a745', margin: '0 0 10px 0' }}>¡Entradas Confirmadas! 🎉</h1>
                <h2 style={{ color: '#fff' }}>{peliculaSeleccionada?.titulo}</h2>
                <p style={{ color: '#aaa', fontSize: '1.1em' }}>📍 {cineSeleccionado?.nombre} | Sala {funcionSeleccionada.sala?.numero}</p>
                <p style={{ color: '#aaa', fontSize: '1.1em' }}>🕒 {formatFechaHora(funcionSeleccionada.fechaObj) || 'Horario a confirmar'}</p>
                <div style={{ margin: '20px 0', padding: '15px', background: '#1a1a1a', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8em', textTransform: 'uppercase' }}>Butacas</span>
                  <span style={{ color: '#ffc107', fontSize: '1.5em', fontWeight: 'bold' }}>{butacasSeleccionadas.map(b => b.etiqueta).join(', ')}</span>
                </div>
                <br/>
                <button onClick={reiniciarFlujoCliente} style={{ padding: '12px 30px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Comprar Otra</button>
              </div>
            ) : (
              <div style={{ background: '#121212', borderRadius: '12px', padding: '30px 20px', border: '1px solid #222', textAlign: 'center' }}>
                <h2 style={{ margin: '0 0 5px 0', color: '#fff' }}>{peliculaSeleccionada?.titulo}</h2>
                <p style={{ margin: '0 0 30px 0', color: '#888' }}>{formatFechaHora(funcionSeleccionada.fechaObj) || 'Horario a Confirmar'} — Sala {funcionSeleccionada.sala?.numero}</p>

                <div style={{ background: '#333', color: '#fff', width: '80%', maxWidth: '400px', height: '8px', margin: '0 auto 40px auto', borderRadius: '4px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingBottom: '20px' }}>
                  {generarMatrizCliente().map((grupo, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px', color: '#555', fontWeight: 'bold', fontSize: '0.8em' }}>{grupo.fila}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {grupo.asientos.map(asiento => {
                          if (!asiento.activa) {
                            return <div key={asiento.id} style={{ width: '30px', height: '30px' }} />
                          }
                          // Ocupada check robusto
                          const ocupada = butacasOcupadas.some(b => b === asiento.id || b === asiento.etiqueta || b?.id === asiento.id || b?.etiqueta === asiento.etiqueta);
                          const seleccionada = butacasSeleccionadas.some(b => b.id === asiento.id);

                          return (
                            <div key={asiento.id} onClick={() => {
                              if (!ocupada) {
                                seleccionada ? setButacasSeleccionadas(prev => prev.filter(b => b.id !== asiento.id))
                                             : setButacasSeleccionadas(prev => [...prev, asiento])
                              }
                            }}
                            style={{ width: '30px', height: '30px', background: ocupada ? '#dc3545' : seleccionada ? '#ffc107' : '#222', color: seleccionada ? '#000' : '#888', border: '1px solid #444', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65em', fontWeight: 'bold', cursor: ocupada ? 'not-allowed' : 'pointer' }}>
                              {asiento.etiqueta.replace(grupo.fila, '')}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.85em', color: '#aaa' }}>
                  <span><span style={{ display: 'inline-block', width:'12px', height:'12px', background:'#222', border:'1px solid #444', borderRadius:'3px', marginRight:'5px' }}/> Libre</span>
                  <span><span style={{ display: 'inline-block', width:'12px', height:'12px', background:'#ffc107', borderRadius:'3px', marginRight:'5px' }}/> Tu Selección</span>
                  <span><span style={{ display: 'inline-block', width:'12px', height:'12px', background:'#dc3545', borderRadius:'3px', marginRight:'5px' }}/> Ocupada</span>
                </div>

                {butacasSeleccionadas.length > 0 && (
                  <div style={{ marginTop: '30px' }}>
                    <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '14px 40px', fontSize: '1.2em', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Comprar Entradas ({Math.floor(tiempoRestante/60)}:{(tiempoRestante%60).toString().padStart(2, '0')})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default App