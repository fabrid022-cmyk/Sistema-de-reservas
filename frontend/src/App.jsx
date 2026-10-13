import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-de-reservas-642w.onrender.com';

function App() {
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [cines, setCines] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [funcionesAdmin, setFuncionesAdmin] = useState([])
  const [funcionesCliente, setFuncionesCliente] = useState([])
  const [butacasOcupadas, setButacasOcupadas] = useState([])

  // Formularios Admin
  const [nuevoCineNombre, setNuevoCineNombre] = useState('')
  const [nuevoCineDireccion, setNuevoCineDireccion] = useState('')
  const [nuevaPeliTitulo, setNuevaPeliTitulo] = useState('')
  const [nuevaPeliIdioma, setNuevaPeliIdioma] = useState('')
  
  const [funcionCineId, setFuncionCineId] = useState('')
  const [funcionSalaId, setFuncionSalaId] = useState('')
  const [funcionPeliId, setFuncionPeliId] = useState('')
  const [funcionHorario, setFuncionHorario] = useState('')

  // Edición
  const [editandoFuncionId, setEditandoFuncionId] = useState(null)
  const [nuevoHorarioEdit, setNuevoHorarioEdit] = useState('')
  const [nuevaSalaNumero, setNuevaSalaNumero] = useState('')
  const [nuevaSalaCapacidad, setNuevaSalaCapacidad] = useState(50)
  const [editandoSalaId, setEditandoSalaId] = useState(null)
  const [editCapacidad, setEditCapacidad] = useState(50)

  // Cliente
  const [cineSeleccionado, setCineSeleccionado] = useState(null)
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null)
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null)
  const [butacasSeleccionadas, setButacasSeleccionadas] = useState([])
  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  const cargarDatos = () => {
    fetch(`${API_URL}/api/cines`).then(r => r.json()).then(d => setCines(Array.isArray(d) ? d : []));
    fetch(`${API_URL}/api/peliculas`).then(r => r.json()).then(d => setPeliculas(Array.isArray(d) ? d : []));
    fetch(`${API_URL}/api/funciones`).then(r => r.json()).then(d => setFuncionesAdmin(Array.isArray(d) ? d : []));
  }

  useEffect(() => { if (usuario) cargarDatos(); }, [usuario])

  useEffect(() => {
    let timer;
    if (butacasSeleccionadas.length > 0 && tiempoRestante > 0 && !reservaExitosa) {
      timer = setInterval(() => setTiempoRestante(p => p - 1), 1000)
    } else if (tiempoRestante === 0) {
      alert("El tiempo de reserva ha expirado.")
      setButacasSeleccionadas([])
      setTiempoRestante(300)
    }
    return () => clearInterval(timer)
  }, [butacasSeleccionadas, tiempoRestante, reservaExitosa])

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setErrorLogin('')
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      })
      if (res.ok) setUsuario(await res.json())
      else setErrorLogin('Credenciales incorrectas.')
    } catch (err) {
      setErrorLogin('Error de conexión con el servidor.')
    }
  }

  const cerrarSesion = () => {
    setUsuario(null); setCineSeleccionado(null); setPeliculaSeleccionada(null);
    setFuncionSeleccionada(null); setButacasSeleccionadas([]); setReservaExitosa(false);
  }

  // --- CRUD ADMIN ---
  const crearCine = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/cines`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoCineNombre, ubicacion: { pais: "Argentina", direccion: nuevoCineDireccion }})
    })
    if (res.ok) { setNuevoCineNombre(''); setNuevoCineDireccion(''); cargarDatos(); }
  }

  const eliminarCine = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cine?")) {
      await fetch(`${API_URL}/api/cines/${id}`, { method: 'DELETE' })
      cargarDatos()
    }
  }

  const agregarSala = async (e, idCine) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/salas/cine/${idCine}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: parseInt(nuevaSalaNumero), capacidad: parseInt(nuevaSalaCapacidad) || 50 })
    })
    if (res.ok) { setNuevaSalaNumero(''); setNuevaSalaCapacidad(50); cargarDatos(); }
    else alert('Error al crear sala')
  }

  const guardarCapacidadSala = async (idSala) => {
    const res = await fetch(`${API_URL}/api/salas/${idSala}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacidad: parseInt(editCapacidad) })
    })
    if (res.ok) { setEditandoSalaId(null); cargarDatos(); }
  }

  const eliminarSala = async (idSala) => {
    if (window.confirm("¿Eliminar sala?")) {
      await fetch(`${API_URL}/api/salas/${idSala}`, { method: 'DELETE' })
      cargarDatos()
    }
  }

  const crearPelicula = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/peliculas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevaPeliTitulo, idioma: nuevaPeliIdioma, formato: "2D", duracionMinutos: 120 })
    })
    if (res.ok) { setNuevaPeliTitulo(''); setNuevaPeliIdioma(''); cargarDatos(); }
  }

  const eliminarPelicula = async (id) => {
    if (window.confirm("¿Eliminar película?")) {
      await fetch(`${API_URL}/api/peliculas/${id}`, { method: 'DELETE' }); 
      cargarDatos();
    }
  }

  const crearFuncion = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/funciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        pelicula: { idPelicula: parseInt(funcionPeliId) }, 
        sala: { idSala: parseInt(funcionSalaId) }, 
        horario: funcionHorario 
      })
    })
    if (res.ok) {
      alert('¡Función programada con éxito!'); 
      setFuncionCineId(''); setFuncionSalaId(''); setFuncionPeliId(''); setFuncionHorario('');
      cargarDatos();
    } else {
      alert('Error al programar la función.');
    }
  }

  const guardarEdicionFuncion = async (idFuncion) => {
    if (!nuevoHorarioEdit) return alert("Ingresá un horario.");
    const res = await fetch(`${API_URL}/api/funciones/${idFuncion}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horario: nuevoHorarioEdit })
    })
    if (res.ok) {
      setEditandoFuncionId(null);
      setNuevoHorarioEdit('');
      cargarDatos();
    } else {
      alert("Error al actualizar la función.");
    }
  }

  const eliminarFuncion = async (idFuncion) => {
    if (window.confirm("¿Eliminar esta función?")) {
      await fetch(`${API_URL}/api/funciones/${idFuncion}`, { method: 'DELETE' });
      cargarDatos();
    }
  }

  // --- CLIENTE ---
  const manejarClickCine = async (cine) => {
    setCineSeleccionado(cine); setPeliculaSeleccionada(null); setFuncionSeleccionada(null); setButacasSeleccionadas([]);
    const res = await fetch(`${API_URL}/api/funciones/cine/${cine.idCine}`)
    const data = await res.json()
    setFuncionesCliente(Array.isArray(data) ? data : [])
  }

  const seleccionarFuncion = async (funcion) => {
    setFuncionSeleccionada(funcion); setButacasSeleccionadas([]); setTiempoRestante(300); setReservaExitosa(false);
    const idF = funcion.idFuncion || funcion.id;
    const res = await fetch(`${API_URL}/api/reservas/ocupadas/${idF}`)
    const data = await res.json()
    setButacasOcupadas(Array.isArray(data) ? data : [])
  }

  const confirmarReserva = async () => {
    const idF = funcionSeleccionada.idFuncion || funcionSeleccionada.id;
    const payload = {
      idUsuario: usuario.idUsuario || usuario.id,
      idSala: idF,
      butacasSeleccionadas: butacasSeleccionadas
    }

    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) {
        setButacasOcupadas(prev => [...prev, ...butacasSeleccionadas])
        setReservaExitosa(true)
      } else {
        alert("Error al procesar la reserva.")
      }
    } catch (error) {
      alert("Error de red.")
    }
  }

  // Agrupador en árbol para el cliente (Película -> Fechas/Horarios)
  const funcionesAgrupadasPorPelicula = funcionesCliente.reduce((acc, f) => {
    const peliTitulo = f.pelicula?.titulo || 'Película';
    if (!acc[peliTitulo]) acc[peliTitulo] = [];
    acc[peliTitulo].push(f);
    return acc;
  }, {});

  // --- LOGIN ---
  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: '#141414', borderRadius: '14px', border: '1px solid #262626', boxShadow: '0 16px 40px rgba(0,0,0,0.9)', color: '#fff' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#e50914', fontSize: '2.2em', margin: '0 0 5px 0', letterSpacing: '2px', fontWeight: '800' }}>CINEMAX 🍿</h1>
            <p style={{ color: '#888', fontSize: '0.9em' }}>Plataforma Oficial de Reservas</p>
          </div>
          {errorLogin && <div style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid #e50914', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85em', textAlign: 'center', fontWeight: '500' }}>{errorLogin}</div>}
          <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85em', color: '#aaa', fontWeight: '600' }}>Correo Electrónico</label>
              <input type="email" placeholder="admin@reservas.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#1f1f1f', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85em', color: '#aaa', fontWeight: '600' }}>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#1f1f1f', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" style={{ padding: '14px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1em', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 14px rgba(229,9,20,0.4)', transition: 'background 0.2s' }}>Iniciar Sesión</button>
          </form>
        </div>
      </div>
    )
  }

  const capacidadTotal = funcionSeleccionada?.sala?.capacidad || 50;

  // --- VISTA ADMIN ---
  if (usuario.rol === 'ADMIN') {
    // Agrupar funciones para el Admin en árbol (Cine -> Sala -> Película -> Horarios)
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f1f1', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: 0, color: '#e50914', fontSize: '2em', fontWeight: '800' }}>Panel de Administración ⚙️</h1>
              <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9em' }}>Gestión integral de complejos, salas, cartelera y funciones programadas.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#aaa', background: '#181818', padding: '8px 14px', borderRadius: '6px', border: '1px solid #333', fontSize: '0.9em' }}>{usuario.email}</span>
              <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#1e1e1e', color: '#ff4d4d', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
            
            {/* CINES Y SALAS */}
            <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '12px' }}>📍 Cines y Capacidad de Salas</h3>
              
              <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nombre Cine" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required style={{ flex: 1, padding: '10px 12px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required style={{ flex: 1, padding: '10px 12px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 18px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Cine</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {cines.map(c => (
                  <div key={c.idCine} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '1.1em', color: '#fff' }}>{c.nombre}</strong>
                      <button onClick={() => eliminarCine(c.idCine)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: '600', fontSize: '0.85em' }}>Eliminar Cine</button>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85em', color: '#888' }}>{c.ubicacion?.direccion}</p>

                    <div style={{ background: '#111', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Salas:</span>
                      {c.salas?.length === 0 ? <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#555' }}>Sin salas creadas.</p> : null}
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: '15px' }}>
                        {c.salas?.map(s => (
                          <li key={s.idSala} style={{ fontSize: '0.85em', margin: '5px 0', color: '#ccc' }}>
                            Sala {s.numero} — 🪑 <strong>{s.capacidad || 50}</strong> butacas 
                            {editandoSalaId === s.idSala ? (
                              <span style={{ marginLeft: '10px' }}>
                                <input type="number" value={editCapacidad} onChange={e => setEditCapacidad(e.target.value)} style={{ width: '55px', padding: '3px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} />
                                <button onClick={() => guardarCapacidadSala(s.idSala)} style={{ marginLeft: '5px', background: '#28a745', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>OK</button>
                              </span>
                            ) : (
                              <button onClick={() => { setEditandoSalaId(s.idSala); setEditCapacidad(s.capacidad || 50); }} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', marginLeft: '8px', fontWeight: '600' }}>[Editar]</button>
                            )}
                            <button onClick={() => eliminarSala(s.idSala)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginLeft: '6px', fontWeight: '600' }}>[X]</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <form onSubmit={(e) => agregarSala(e, c.idCine)} style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} required style={{ width: '80px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}/>
                      <input type="number" placeholder="Capacidad" value={nuevaSalaCapacidad} onChange={e => setNuevaSalaCapacidad(e.target.value)} required style={{ width: '80px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}/>
                      <button type="submit" style={{ flex: 1, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '600' }}>+ Sala</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            {/* PELÍCULAS */}
            <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '12px' }}>🎬 Catálogo de Películas</h3>
              
              <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Título" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required style={{ flex: 1, padding: '10px 12px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Idioma" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required style={{ width: '110px', padding: '10px 12px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 18px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Película</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '425px', overflowY: 'auto', paddingRight: '5px' }}>
                {peliculas.map(p => (
                  <div key={p.idPelicula} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '1.05em' }}>{p.titulo}</strong>
                      <span style={{ marginLeft: '10px', fontSize: '0.75em', background: '#262626', padding: '3px 8px', borderRadius: '4px', color: '#aaa', fontWeight: '600' }}>{p.idioma}</span>
                    </div>
                    <button onClick={() => eliminarPelicula(p.idPelicula)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: '600' }}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PROGRAMACIÓN Y FUNCIONES ACTIVAS */}
          <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '12px' }}>🕒 Programar y Gestionar Funciones Activas</h3>
            
            <form onSubmit={crearFuncion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '25px' }}>
              <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} required style={{ padding: '11px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}>
                <option value="">Seleccionar Cine...</option>
                {cines.map(c => <option key={c.idCine} value={c.idCine}>{c.nombre}</option>)}
              </select>

              <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} required disabled={!funcionCineId} style={{ padding: '11px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}>
                <option value="">Seleccionar Sala...</option>
                {funcionCineId && cines.find(c => c.idCine.toString() === funcionCineId)?.salas.map(s => (
                  <option key={s.idSala} value={s.idSala}>Sala {s.numero} ({s.capacidad || 50} butacas)</option>
                ))}
              </select>

              <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} required style={{ padding: '11px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}>
                <option value="">Seleccionar Película...</option>
                {peliculas.map(p => <option key={p.idPelicula} value={p.idPelicula}>{p.titulo}</option>)}
              </select>

              <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} required style={{ padding: '11px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
              
              <button type="submit" style={{ padding: '11px 24px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,123,255,0.4)' }}>Programar</button>
            </form>

            <h4 style={{ color: '#aaa', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.85em', letterSpacing: '1px' }}>Listado de Funciones Activas (Ordenadas en Árbol por Cine y Sala):</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
              {funcionesAdmin.length === 0 ? <p style={{ color: '#777' }}>No hay funciones programadas actualmente.</p> : funcionesAdmin.map(f => {
                const idF = f.idFuncion || f.id;
                return (
                  <div key={idF} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '18px', position: 'relative' }}>
                    <button onClick={() => eliminarFuncion(idF)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }}>✕</button>
                    
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '1.1em', color: '#fff' }}>🎬 {f.pelicula?.titulo || 'Película'}</h5>
                    <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#bbb' }}>📍 <strong>{f.sala?.cine?.nombre || 'Cine'}</strong> — Sala {f.sala?.numero}</p>
                    <p style={{ margin: '4px 0 14px 0', fontSize: '0.9em', color: '#ffc107', fontWeight: 'bold' }}>🕒 {f.horario ? new Date(f.horario).toLocaleString() : 'Sin horario'}</p>

                    {editandoFuncionId === idF ? (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <input type="datetime-local" value={nuevoHorarioEdit} onChange={e => setNuevoHorarioEdit(e.target.value)} style={{ padding: '8px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '0.85em', flex: 1 }} />
                        <button onClick={() => guardarEdicionFuncion(idF)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>OK</button>
                        <button onClick={() => setEditandoFuncionId(null)} style={{ background: '#444', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditandoFuncionId(idF); setNuevoHorarioEdit(f.horario ? f.horario.substring(0,16) : ''); }} style={{ background: '#262626', color: '#ffc107', border: '1px solid #444', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}>
                        ✏️ Editar Horario
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    )
  }

  // --- VISTA CLIENTE ---
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f1f1', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#e50914', fontSize: '2.2em', letterSpacing: '1px', fontWeight: '800' }}>CINEMAX 🍿</h1>
            <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9em' }}>Seleccioná tu complejo, elegí la función por fecha y viví la mejor experiencia.</p>
          </div>
          <button onClick={cerrarSesion} style={{ background: '#141414', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
        </div>

        <div style={{ display: 'flex', gap: '25px' }}>
          
          {/* Columna Izquierda: Árbol de Selección (Cine -> Película -> Día y Hora) */}
          <div style={{ flex: 1, background: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '12px' }}>1. Seleccioná tu Complejo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
              {cines.map(c => (
                <button key={c.idCine} onClick={() => manejarClickCine(c)} style={{ display: 'block', width: '100%', padding: '14px 16px', background: cineSeleccionado?.idCine === c.idCine ? '#e50914' : '#1f1f1f', color: cineSeleccionado?.idCine === c.idCine ? '#fff' : '#ddd', border: '1px solid #333', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  📍 {c.nombre} <br/><small style={{ fontWeight: 'normal', color: cineSeleccionado?.idCine === c.idCine ? '#ffcccc' : '#888' }}>{c.ubicacion?.direccion}</small>
                </button>
              ))}
            </div>
            
            {cineSeleccionado && (
              <div>
                <h3 style={{ color: '#fff', borderBottom: '1px solid #222', paddingBottom: '12px' }}>2. Cartelera y Funciones (por Día)</h3>
                {Object.keys(funcionesAgrupadasPorPelicula).length === 0 ? <p style={{ color: '#777', fontSize: '0.9em' }}>No hay funciones disponibles en este cine.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {Object.entries(funcionesAgrupadasPorPelicula).map(([tituloPeli, funcs]) => (
                      <div key={tituloPeli} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.05em' }}>🎬 {tituloPeli}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {funcs.map(f => {
                            const idF = f.idFuncion || f.id;
                            const fechaObj = f.horario ? new Date(f.horario) : null;
                            const fechaFormateada = fechaObj && !isNaN(fechaObj) ? fechaObj.toLocaleDateString() : 'Fecha a confirmar';
                            const horaFormateada = fechaObj && !isNaN(fechaObj) ? fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            const esSel = (funcionSeleccionada?.idFuncion || funcionSeleccionada?.id) === idF;

                            return (
                              <button key={idF} onClick={() => seleccionarFuncion(f)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', background: esSel ? '#007bff' : '#222', color: '#fff', border: '1px solid #383838', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}>
                                <span style={{ fontSize: '0.9em', fontWeight: '600' }}>📅 {fechaFormateada} — 🕒 {horaFormateada}</span>
                                <span style={{ fontSize: '0.75em', background: esSel ? '#0056b3' : '#333', padding: '3px 8px', borderRadius: '4px', color: '#ccc' }}>Sala {f.sala?.numero}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Mapa de Butacas y Ticket */}
          {funcionSeleccionada && (
            <div style={{ flex: 2, background: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {reservaExitosa ? (
                <div style={{ padding: '35px', background: '#1c1c1c', borderRadius: '12px', border: '2px dashed #28a745' }}>
                  <h2 style={{ color: '#28a745', marginTop: 0, fontSize: '1.8em' }}>¡Reserva Confirmada con Éxito! 🎉</h2>
                  <div style={{ textTransform: 'uppercase', letterSpacing: '1px', borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '20px 0', margin: '20px 0' }}>
                    <p style={{ fontSize: '1.4em', margin: '5px 0', color: '#fff', fontWeight: '800' }}>{funcionSeleccionada.pelicula?.titulo}</p>
                    <p style={{ color: '#aaa', margin: '6px 0', fontSize: '0.95em' }}>📍 {cineSeleccionado?.nombre} — {cineSeleccionado?.ubicacion?.direccion}</p>
                    <p style={{ color: '#aaa', margin: '6px 0', fontSize: '0.95em' }}>🍿 Sala {funcionSeleccionada.sala?.numero} | 🕒 {new Date(funcionSeleccionada.horario).toLocaleString()}</p>
                    <p style={{ color: '#ffc107', fontSize: '1.3em', marginTop: '15px', fontWeight: '800' }}>Butacas asignadas: {butacasSeleccionadas.join(', ')}</p>
                  </div>
                  <button onClick={() => { setFuncionSeleccionada(null); setReservaExitosa(false); }} style={{ padding: '12px 24px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1em' }}>Elegir otra función</button>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5em', color: '#fff', fontWeight: '800' }}>{funcionSeleccionada.pelicula?.titulo}</h3>
                  <p style={{ margin: '0 0 25px 0', color: '#888', fontSize: '0.9em' }}>Seleccioná tus butacas en la siguiente distribución de sala</p>
                  
                  {/* PANTALLA VISUAL */}
                  <div style={{ margin: '0 auto 35px auto', width: '80%', background: 'linear-gradient(to bottom, #666, #222)', height: '16px', borderRadius: '8px', color: '#ccc', fontSize: '0.7em', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '5px', boxShadow: '0 6px 20px rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                    PANTALLA CINEMATOGRÁFICA
                  </div>

                  {/* GRILLA DE BUTACAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px', margin: '0 auto', maxWidth: '540px' }}>
                    {Array.from({ length: capacidadTotal }, (_, i) => i + 1).map(numero => {
                      const ocupada = butacasOcupadas.includes(numero);
                      const sel = butacasSeleccionadas.includes(numero);
                      return (
                        <div key={numero} onClick={() => { if (!ocupada) sel ? setButacasSeleccionadas(butacasSeleccionadas.filter(b => b !== numero)) : setButacasSeleccionadas([...butacasSeleccionadas, numero]) }}
                             style={{ height: '40px', background: ocupada ? '#dc3545' : sel ? '#ffc107' : '#1f1f1f', color: sel ? '#000' : '#fff', border: '1px solid #383838', borderRadius: '8px', cursor: ocupada ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9em', fontWeight: 'bold', transition: 'all 0.1s' }}>
                          {numero}
                        </div>
                      )
                    })}
                  </div>

                  {/* LEYENDA */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '30px 0', fontSize: '0.9em', color: '#aaa' }}>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#1f1f1f', border: '1px solid #444', borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }}></span> Disponible</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffc107', borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }}></span> Seleccionada</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dc3545', borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }}></span> Ocupada</span>
                  </div>

                  {butacasSeleccionadas.length > 0 && (
                    <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '14px 32px', fontSize: '1.15em', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 20px rgba(40,167,69,0.4)' }}>
                      Confirmar Reserva ({Math.floor(tiempoRestante/60)}:{(tiempoRestante%60).toString().padStart(2, '0')})
                    </button>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App