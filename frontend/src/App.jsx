import { useState, useEffect, useMemo } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-de-reservas-642w.onrender.com';

function App() {
  // --- ESTADOS GLOBALES ---
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [cines, setCines] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [funcionesGlobales, setFuncionesGlobales] = useState([])
  const [butacasOcupadas, setButacasOcupadas] = useState([])

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
  const [butacasSeleccionadas, setButacasSeleccionadas] = useState([])
  
  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  // ==========================================
  // HELPERS GLOBALES BLINDADOS
  // ==========================================
  const getIdPeli = (p) => p ? (p.idPelicula || p.id) : null;
  const getIdCine = (c) => c ? (c.idCine || c.id) : null;
  const getIdFuncion = (f) => f ? (f.idFuncion || f.id) : null;

  // PARSEADOR INFALIBLE DE FECHAS DE SPRING BOOT
  const parsearFecha = (fechaCruda) => {
    if (!fechaCruda) return null;
    try {
      if (typeof fechaCruda === 'string' && fechaCruda.startsWith('[')) {
        fechaCruda = JSON.parse(fechaCruda);
      }
      if (Array.isArray(fechaCruda)) {
        const [y, m, d, h = 0, min = 0, s = 0] = fechaCruda;
        return new Date(y, m - 1, d, h, min, s);
      }
      
      let str = String(fechaCruda).trim();
      
      // Capturar formatos DD/MM/YYYY o DD-MM-YYYY
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(str)) {
        const parts = str.split(/[\/\- \T]/);
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const h = parts[3] ? parseInt(parts[3].split(':')[0] || 0, 10) : 0;
        const min = parts[3] ? parseInt(parts[3].split(':')[1] || 0, 10) : 0;
        return new Date(y, m, d, h, min);
      }
      
      str = str.replace(' ', 'T'); 
      const dObj = new Date(str);
      if (!isNaN(dObj.getTime())) return dObj;
      return null;
    } catch (e) {
      return null;
    }
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
        setCines(Array.isArray(cinesData) ? cinesData : []);
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
                const dateObj = parsearFecha(f.horario);
                let diaString = 'Fecha_Invalida';
                
                if (dateObj) {
                  const y = dateObj.getFullYear();
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const d = String(dateObj.getDate()).padStart(2, '0');
                  diaString = `${y}-${m}-${d}`;
                }

                return { 
                  ...f, 
                  cineAsociado: cine,
                  fechaObj: dateObj,
                  diaString: diaString
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
    } catch (err) { setErrorLogin('Error de comunicación con el backend.') }
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
    const res = await fetch(`${API_URL}/api/funciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        pelicula: { idPelicula: parseInt(funcionPeliId) }, 
        sala: { idSala: parseInt(funcionSalaId) }, 
        horario: funcionHorario 
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
    const nueva = [...matrizLayout];
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
      const res = await fetch(`${API_URL}/api/reservas/ocupadas/${getIdFuncion(funcion)}`);
      if (res.ok) setButacasOcupadas(await res.json());
      else setButacasOcupadas([]);
    } catch { setButacasOcupadas([]); }
    setPasoCliente(4);
  }

  const confirmarReserva = async () => {
    const idU = Number(usuario.idUsuario || usuario.id || 1);
    const idF = Number(getIdFuncion(funcionSeleccionada));

    // Formato estándar (ID numéricos puros)
    const payload = { idUsuario: idU, idFuncion: idF, butacasSeleccionadas: butacasSeleccionadas };

    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setButacasOcupadas(prev => [...prev, ...butacasSeleccionadas]); setReservaExitosa(true);
      } else {
        // Fallback Formato Relacional por si Spring Boot lo pide
        const payloadAnidado = { usuario: { idUsuario: idU }, funcion: { idFuncion: idF }, butacasSeleccionadas: butacasSeleccionadas };
        const res2 = await fetch(`${API_URL}/api/reservas`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadAnidado)
        });
        
        if (res2.ok) { setButacasOcupadas(prev => [...prev, ...butacasSeleccionadas]); setReservaExitosa(true); } 
        else { alert(`El servidor rechazó la compra. Revisá si el método POST en Reservas usa los campos correctos.`); }
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
    // Agrupar funciones para Admin sin ocultar las rotas
    const cronogramaAdminAgrupado = funcionesGlobales.reduce((acc, f) => {
      const peliTitulo = f.pelicula?.titulo || 'Desconocida';
      const fechaClave = f.diaString; // Si falló, será 'Fecha_Invalida'
      
      if (!acc[peliTitulo]) acc[peliTitulo] = {};
      if (!acc[peliTitulo][fechaClave]) acc[peliTitulo][fechaClave] = [];
      acc[peliTitulo][fechaClave].push(f);
      return acc;
    }, {});

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
              <form onSubmit={crearFuncion} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} style={{ padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} required>
                  <option value="">1. Complejo...</option>
                  {cines.map(c => <option key={getIdCine(c)} value={getIdCine(c)}>{c.nombre}</option>)}
                </select>
                <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} disabled={!funcionCineId} style={{ padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} required>
                  <option value="">2. Sala...</option>
                  {cines.find(c => getIdCine(c).toString() === funcionCineId)?.salas.map(s => <option key={s.idSala || s.id} value={s.idSala || s.id}>Sala {s.numero}</option>)}
                </select>
                <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} style={{ padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} required>
                  <option value="">3. Película...</option>
                  {peliculas.map(p => <option key={getIdPeli(p)} value={getIdPeli(p)}>{p.titulo}</option>)}
                </select>
                <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} style={{ padding: '10px', background: '#1a1a1a', color:'#fff', border:'1px solid #333', borderRadius:'6px' }} required />
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor:'pointer', fontWeight: 'bold' }}>Programar Nueva Función</button>
              </form>

              <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', color: '#fff' }}>Organización de Cartelera</h3>
              
              {Object.keys(cronogramaAdminAgrupado).sort().map(peliTitulo => (
                <div key={peliTitulo} style={{ marginBottom: '30px', background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                  <h2 style={{ margin: '0 0 15px 0', color: '#e50914', fontSize: '1.5em' }}>🎬 {peliTitulo}</h2>
                  
                  {Object.keys(cronogramaAdminAgrupado[peliTitulo]).sort().map(fechaCruda => {
                    const funcionesDelDia = cronogramaAdminAgrupado[peliTitulo][fechaCruda];
                    
                    let fechaFormat = "⚠️ Fecha Inválida / A Confirmar";
                    if (fechaCruda !== 'Fecha_Invalida') {
                      const [y, m, d] = fechaCruda.split('-');
                      fechaFormat = new Date(y, m-1, d).toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
                    }
                    
                    return (
                      <div key={fechaCruda} style={{ marginLeft: '15px', marginBottom: '20px', borderLeft: '3px solid #444', paddingLeft: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: fechaCruda === 'Fecha_Invalida' ? '#ff4d4d' : '#ffc107', textTransform: 'capitalize', fontSize: '1.1em' }}>📅 {fechaFormat}</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                          {funcionesDelDia.sort((a,b) => (a.fechaObj?.getTime() || 0) - (b.fechaObj?.getTime() || 0)).map(f => {
                            const hora = f.fechaObj ? f.fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : (f.horario || 'Sin Hora');
                            return (
                              <div key={getIdFuncion(f)} style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong style={{ color: '#fff', fontSize: '1.2em' }}>🕒 {hora} hs</strong>
                                  <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '4px' }}>{f.cineAsociado?.nombre} — Sala {f.sala?.numero}</div>
                                </div>
                                <button onClick={() => eliminarFuncion(getIdFuncion(f))} style={{ background: 'none', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}>✕</button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {Object.keys(cronogramaAdminAgrupado).length === 0 && <p style={{ color: '#666' }}>No hay funciones en sistema.</p>}
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
      // Las mostramos aunque sean invalidas para que no desaparezcan misteriosamente
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
                  {Object.keys(funcionesAgrupadasCliente).sort().map(fechaCruda => {
                    let fechaFormat = "⚠️ Fecha a Confirmar";
                    if (fechaCruda !== 'Fecha_Invalida') {
                      const [y, m, d] = fechaCruda.split('-');
                      fechaFormat = new Date(y, m-1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                    }
                    
                    return (
                      <div key={fechaCruda} style={{ borderLeft: '3px solid #444', paddingLeft: '15px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#ffc107', textTransform: 'capitalize', fontSize: '1.2em' }}>📅 {fechaFormat}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                          {funcionesAgrupadasCliente[fechaCruda].sort((a,b)=> (a.fechaObj?.getTime() || 0)-(b.fechaObj?.getTime() || 0)).map(f => {
                            const hora = f.fechaObj ? f.fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : (f.horario || '?');
                            return (
                              <button key={getIdFuncion(f)} onClick={() => handleSeleccionarFuncion(f)} style={{ padding: '12px 25px', background: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2em', fontWeight: 'bold' }}>
                                {hora}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
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
                <p style={{ color: '#aaa', fontSize: '1.1em' }}>🕒 {funcionSeleccionada.fechaObj ? funcionSeleccionada.fechaObj.toLocaleString('es-AR') : 'Horario a confirmar'}</p>
                <div style={{ margin: '20px 0', padding: '15px', background: '#1a1a1a', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ color: '#888', display: 'block', fontSize: '0.8em', textTransform: 'uppercase' }}>Butacas</span>
                  <span style={{ color: '#ffc107', fontSize: '1.5em', fontWeight: 'bold' }}>{butacasSeleccionadas.join(', ')}</span>
                </div>
                <br/>
                <button onClick={reiniciarFlujoCliente} style={{ padding: '12px 30px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Comprar Otra</button>
              </div>
            ) : (
              <div style={{ background: '#121212', borderRadius: '12px', padding: '30px 20px', border: '1px solid #222', textAlign: 'center' }}>
                <h2 style={{ margin: '0 0 5px 0', color: '#fff' }}>{peliculaSeleccionada?.titulo}</h2>
                <p style={{ margin: '0 0 30px 0', color: '#888' }}>{funcionSeleccionada.fechaObj ? funcionSeleccionada.fechaObj.toLocaleString('es-AR') : 'Horario a Confirmar'} — Sala {funcionSeleccionada.sala?.numero}</p>

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
                          const ocupada = butacasOcupadas.some(b => b === asiento.id || b === asiento.etiqueta || b.id === asiento.id || b.etiqueta === asiento.etiqueta);
                          const seleccionada = butacasSeleccionadas.includes(asiento.etiqueta);
                          
                          return (
                            <div key={asiento.id} onClick={() => {
                              if (!ocupada) {
                                seleccionada ? setButacasSeleccionadas(prev => prev.filter(b => b !== asiento.etiqueta))
                                             : setButacasSeleccionadas(prev => [...prev, asiento.etiqueta])
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