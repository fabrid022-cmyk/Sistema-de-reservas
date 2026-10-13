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
  const [funciones, setFunciones] = useState([])
  const [funcionesAdmin, setFuncionesAdmin] = useState([])
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

  // Edición de Funciones
  const [editandoFuncionId, setEditandoFuncionId] = useState(null)
  const [nuevoHorarioEdit, setNuevoHorarioEdit] = useState('')

  // Formularios de Sala
  const [nuevaSalaNumero, setNuevaSalaNumero] = useState('')
  const [nuevaSalaCapacidad, setNuevaSalaCapacidad] = useState(50)
  const [editandoSalaId, setEditandoSalaId] = useState(null)
  const [editCapacidad, setEditCapacidad] = useState(50)

  // Cliente
  const [cineSeleccionado, setCineSeleccionado] = useState(null)
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
      else setErrorLogin('Credenciales incorrectas. Verificá tu email y contraseña.')
    } catch (err) {
      setErrorLogin('Error de conexión con el servidor.')
    }
  }

  const cerrarSesion = () => {
    setUsuario(null); setCineSeleccionado(null); setFuncionSeleccionada(null); 
    setButacasSeleccionadas([]); setReservaExitosa(false);
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
    if (window.confirm("¿Estás seguro de eliminar este cine y sus dependencias?")) {
      await fetch(`${API_URL}/api/cines/${id}`, { method: 'DELETE' })
      cargarDatos()
    }
  }

  const agregarSala = async (e, idCine) => {
    e.preventDefault()
    const cap = parseInt(nuevaSalaCapacidad) || 50;
    const res = await fetch(`${API_URL}/api/salas/cine/${idCine}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: parseInt(nuevaSalaNumero), capacidad: cap })
    })
    if (res.ok) { setNuevaSalaNumero(''); setNuevaSalaCapacidad(50); cargarDatos(); }
    else alert('Error al crear la sala')
  }

  const guardarCapacidadSala = async (idSala) => {
    const res = await fetch(`${API_URL}/api/salas/${idSala}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacidad: parseInt(editCapacidad) })
    })
    if (res.ok) { setEditandoSalaId(null); cargarDatos(); }
    else alert("No se pudo actualizar.");
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
    if (window.confirm("¿Eliminar película del sistema?")) {
      await fetch(`${API_URL}/api/peliculas/${id}`, { method: 'DELETE' }); 
      cargarDatos();
    }
  }

  const crearFuncion = async (e) => {
    e.preventDefault()
    const idPeli = parseInt(funcionPeliId);
    const idSala = parseInt(funcionSalaId);

    if (isNaN(idPeli) || isNaN(idSala)) {
      alert("Seleccioná un cine, una sala y una película válidos.");
      return;
    }

    const res = await fetch(`${API_URL}/api/funciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        pelicula: { idPelicula: idPeli }, 
        sala: { idSala: idSala }, 
        horario: funcionHorario 
      })
    })
    if (res.ok) {
      alert('¡Función programada con éxito!'); 
      setFuncionCineId(''); setFuncionSalaId(''); setFuncionPeliId(''); setFuncionHorario('');
      cargarDatos();
    }
  }

  const guardarEdicionFuncion = async (idFuncion) => {
    if (!nuevoHorarioEdit) return alert("Ingresá un horario válido.");
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
    if (window.confirm("¿Deseas cancelar y eliminar esta función?")) {
      await fetch(`${API_URL}/api/funciones/${idFuncion}`, { method: 'DELETE' });
      cargarDatos();
    }
  }

  // --- CLIENTE ---
  const manejarClickCine = async (cine) => {
    setCineSeleccionado(cine); setFuncionSeleccionada(null); setButacasSeleccionadas([]);
    const res = await fetch(`${API_URL}/api/funciones/cine/${cine.idCine}`)
    const data = await res.json()
    setFunciones(Array.isArray(data) ? data : [])
  }

  const seleccionarFuncion = async (funcion) => {
    setFuncionSeleccionada(funcion); setButacasSeleccionadas([]); setTiempoRestante(300); setReservaExitosa(false);
    const res = await fetch(`${API_URL}/api/reservas/ocupadas/${funcion.idFuncion}`)
    const data = await res.json()
    setButacasOcupadas(Array.isArray(data) ? data : [])
  }

  const confirmarReserva = async () => {
    const payload = {
      idUsuario: usuario.idUsuario,
      idSala: funcionSeleccionada.idFuncion,
      butacasSeleccionadas: butacasSeleccionadas
    }

    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setButacasOcupadas(prev => [...prev, ...butacasSeleccionadas])
        setReservaExitosa(true)
      } else {
        alert("Error al procesar la reserva en las butacas elegidas.")
      }
    } catch (error) {
      alert("Error de red al confirmar.")
    }
  }

  // --- LOGIN VISTA ---
  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#181818', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', color: '#fff' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#e50914', fontSize: '1.8em', letterSpacing: '1px' }}>CINEMA 🎬</h2>
          {errorLogin && <div style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid #e50914', color: '#ff4d4d', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85em', textAlign: 'center' }}>{errorLogin}</div>}
          <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85em', color: '#aaa' }}>Correo electrónico</label>
              <input type="email" placeholder="ejemplo@reservas.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85em', color: '#aaa' }}>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1em', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' }}>Iniciar Sesión</button>
          </form>
        </div>
      </div>
    )
  }

  const capacidadTotal = funcionSeleccionada?.sala?.capacidad || 50;

  // --- VISTA ADMIN MODERNA ---
  if (usuario.rol === 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', background: '#121212', color: '#f1f1f1', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: 0, color: '#e50914', fontSize: '1.8em' }}>Panel de Control ⚙️</h1>
              <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9em' }}>Administración general de cines, salas, películas y programación.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#aaa', fontSize: '0.9em' }}>{usuario.email}</span>
              <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#2b2b2b', color: '#ff4d4d', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
            </div>
          </div>

          {/* Grilla Superior: Cines/Salas y Películas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
            
            {/* 1. CINES Y SALAS */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📍 Cines y Gestión de Salas</h3>
              
              <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nombre del Cine" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required style={{ flex: 1, padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required style={{ flex: 1, padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 15px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Cine</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                {cines.map(c => (
                  <div key={c.idCine} style={{ background: '#222', border: '1px solid #383838', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1.05em', color: '#fff' }}>{c.nombre}</strong>
                      <button onClick={() => eliminarCine(c.idCine)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85em' }}>Eliminar Cine</button>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85em', color: '#999' }}>{c.ubicacion?.direccion}</p>

                    {/* Salas Adentro del Cine */}
                    <div style={{ background: '#181818', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8em', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Salas habilitadas:</span>
                      {c.salas?.length === 0 ? <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>No hay salas creadas.</p> : null}
                      <ul style={{ margin: '6px 0 0 0', paddingLeft: '15px' }}>
                        {c.salas?.map(s => (
                          <li key={s.idSala} style={{ fontSize: '0.85em', margin: '4px 0', color: '#ddd' }}>
                            Sala {s.numero} — 🪑 {s.capacidad || 50} asientos 
                            {editandoSalaId === s.idSala ? (
                              <span style={{ marginLeft: '10px' }}>
                                <input type="number" value={editCapacidad} onChange={e => setEditCapacidad(e.target.value)} style={{ width: '50px', padding: '2px', background: '#333', color: '#fff', border: '1px solid #555' }} />
                                <button onClick={() => guardarCapacidadSala(s.idSala)} style={{ marginLeft: '4px', background: '#28a745', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}>OK</button>
                              </span>
                            ) : (
                              <button onClick={() => { setEditandoSalaId(s.idSala); setEditCapacidad(s.capacidad || 50); }} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', marginLeft: '8px', fontSize: '0.9em' }}>[Editar]</button>
                            )}
                            <button onClick={() => eliminarSala(s.idSala)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginLeft: '6px', fontSize: '0.9em' }}>[X]</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <form onSubmit={(e) => agregarSala(e, c.idCine)} style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} required style={{ width: '80px', padding: '6px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}/>
                      <input type="number" placeholder="Asientos" value={nuevaSalaCapacidad} onChange={e => setNuevaSalaCapacidad(e.target.value)} required style={{ width: '80px', padding: '6px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}/>
                      <button type="submit" style={{ flex: 1, background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em' }}>+ Agregar Sala</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. PELÍCULAS */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🎬 Catálogo de Películas</h3>
              
              <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Título de la película" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required style={{ flex: 1, padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Idioma" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required style={{ width: '100px', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 15px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Película</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
                {peliculas.map(p => (
                  <div key={p.idPelicula} style={{ background: '#222', border: '1px solid #383838', borderRadius: '6px', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#fff' }}>{p.titulo}</strong>
                      <span style={{ marginLeft: '10px', fontSize: '0.8em', background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#aaa' }}>{p.idioma}</span>
                    </div>
                    <button onClick={() => eliminarPelicula(p.idPelicula)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 3. PROGRAMACIÓN Y GESTIÓN DE FUNCIONES (Adentro de Cines y Salas) */}
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🕒 Programar y Administrar Funciones</h3>
            
            <form onSubmit={crearFuncion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '25px' }}>
              <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} required style={{ padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}>
                <option value="">Seleccionar Cine...</option>
                {cines.map(c => <option key={c.idCine} value={c.idCine}>{c.nombre}</option>)}
              </select>

              <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} required disabled={!funcionCineId} style={{ padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}>
                <option value="">Seleccionar Sala...</option>
                {funcionCineId && cines.find(c => c.idCine.toString() === funcionCineId)?.salas.map(s => (
                  <option key={s.idSala} value={s.idSala}>Sala {s.numero} ({s.capacidad || 50} butacas)</option>
                ))}
              </select>

              <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} required style={{ padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}>
                <option value="">Seleccionar Película...</option>
                {peliculas.map(p => <option key={p.idPelicula} value={p.idPelicula}>{p.titulo}</option>)}
              </select>

              <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} required style={{ padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }} />
              
              <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Programar</button>
            </form>

            <h4 style={{ color: '#ccc', marginBottom: '15px' }}>Funciones Programadas Actuales:</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {funcionesAdmin.length === 0 ? <p style={{ color: '#777' }}>No hay funciones activas en este momento.</p> : funcionesAdmin.map(f => (
                <div key={f.idFuncion} style={{ background: '#222', border: '1px solid #383838', borderRadius: '8px', padding: '15px', position: 'relative' }}>
                  <button onClick={() => eliminarFuncion(f.idFuncion)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                  
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '1.05em', color: '#fff' }}>🎬 {f.pelicula?.titulo}</h5>
                  <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#aaa' }}>📍 {f.sala?.cine?.nombre || 'Cine'} — Sala {f.sala?.numero}</p>
                  <p style={{ margin: '4px 0 12px 0', fontSize: '0.9em', color: '#ffc107', fontWeight: 'bold' }}>🕒 {new Date(f.horario).toLocaleString()}</p>

                  {editandoFuncionId === f.idFuncion ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <input type="datetime-local" value={nuevoHorarioEdit} onChange={e => setNuevoHorarioEdit(e.target.value)} style={{ padding: '6px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.8em', flex: 1 }} />
                      <button onClick={() => guardarEdicionFuncion(f.idFuncion)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>OK</button>
                      <button onClick={() => setEditandoFuncionId(null)} style={{ background: '#555', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditandoFuncionId(f.idFuncion); setNuevoHorarioEdit(f.horario.substring(0,16)); }} style={{ background: '#333', color: '#ffc107', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}>
                      Editar Horario
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    )
  }

  // --- VISTA CLIENTE MODERNA ---
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f1f1f1', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Cliente */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#e50914', fontSize: '2em', letterSpacing: '1px' }}>CINEMA 🍿</h1>
            <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '0.9em' }}>Seleccioná tu complejo y viví el cine al máximo.</p>
          </div>
          <button onClick={cerrarSesion} style={{ background: '#181818', color: '#fff', border: '1px solid #333', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>

        <div style={{ display: 'flex', gap: '25px' }}>
          
          {/* Columna Izquierda: Cines y Funciones */}
          <div style={{ flex: 1, background: '#161616', border: '1px solid #282828', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '10px' }}>1. Seleccioná un Complejo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
              {cines.map(c => (
                <button key={c.idCine} onClick={() => manejarClickCine(c)} style={{ display: 'block', width: '100%', padding: '14px', background: cineSeleccionado?.idCine === c.idCine ? '#e50914' : '#1f1f1f', color: cineSeleccionado?.idCine === c.idCine ? '#fff' : '#ddd', border: '1px solid #333', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  📍 {c.nombre} <br/><small style={{ fontWeight: 'normal', color: cineSeleccionado?.idCine === c.idCine ? '#ffd6d6' : '#888' }}>{c.ubicacion?.direccion}</small>
                </button>
              ))}
            </div>
            
            {cineSeleccionado && (
              <div>
                <h3 style={{ color: '#fff', borderBottom: '1px solid #222', paddingBottom: '10px' }}>2. Funciones en {cineSeleccionado.nombre}</h3>
                {funciones.length === 0 ? <p style={{ color: '#777', fontSize: '0.9em' }}>No hay funciones programadas en este cine actualmente.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {funciones.map(f => (
                      <button key={f.idFuncion} onClick={() => seleccionarFuncion(f)} style={{ display: 'block', width: '100%', padding: '14px', background: funcionSeleccionada?.idFuncion === f.idFuncion ? '#007bff' : '#1f1f1f', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        🎬 <strong style={{ fontSize: '1.05em' }}>{f.pelicula?.titulo}</strong> <br/>
                        <span style={{ fontSize: '0.85em', color: '#aaa' }}>Sala {f.sala?.numero} ({f.sala?.capacidad || 50} asientos) — 🕒 {new Date(f.horario).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Mapa de Butacas y Comprobante */}
          {funcionSeleccionada && (
            <div style={{ flex: 2, background: '#161616', border: '1px solid #282828', borderRadius: '10px', padding: '30px', textAlign: 'center' }}>
              {reservaExitosa ? (
                <div style={{ padding: '30px', background: '#1f1f1f', borderRadius: '10px', border: '2px dashed #28a745' }}>
                  <h2 style={{ color: '#28a745', marginTop: 0 }}>¡Reserva Confirmada con Éxito! 🎉</h2>
                  <div style={{ textTransform: 'uppercase', letterSpacing: '1px', borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '20px 0', margin: '20px 0' }}>
                    <p style={{ fontSize: '1.3em', margin: '5px 0', color: '#fff' }}><strong>{funcionSeleccionada.pelicula?.titulo}</strong></p>
                    <p style={{ color: '#aaa', margin: '6px 0', fontSize: '0.9em' }}>📍 {cineSeleccionado?.nombre} — {cineSeleccionado?.ubicacion?.direccion}</p>
                    <p style={{ color: '#aaa', margin: '6px 0', fontSize: '0.9em' }}>🍿 Sala {funcionSeleccionada.sala?.numero} | 🕒 {new Date(funcionSeleccionada.horario).toLocaleString()}</p>
                    <p style={{ color: '#ffc107', fontSize: '1.2em', marginTop: '15px', fontWeight: 'bold' }}>Butacas asignadas: {butacasSeleccionadas.join(', ')}</p>
                  </div>
                  <button onClick={() => { setFuncionSeleccionada(null); setReservaExitosa(false); }} style={{ padding: '10px 20px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Elegir otra función</button>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4em', color: '#fff' }}>{funcionSeleccionada.pelicula?.titulo}</h3>
                  <p style={{ margin: '0 0 25px 0', color: '#888', fontSize: '0.9em' }}>Seleccioná tus ubicaciones disponibles en la sala</p>
                  
                  {/* PANTALLA VISUAL */}
                  <div style={{ margin: '0 auto 35px auto', width: '75%', background: 'linear-gradient(to bottom, #555, #222)', height: '14px', borderRadius: '6px', color: '#bbb', fontSize: '0.65em', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '4px', boxShadow: '0 6px 16px rgba(255,255,255,0.08)' }}>
                    PANTALLA CINEMATOGRÁFICA
                  </div>

                  {/* GRILLA DE BUTACAS DINÁMICA */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px', margin: '0 auto', maxWidth: '520px' }}>
                    {Array.from({ length: capacidadTotal }, (_, i) => i + 1).map(numero => {
                      const ocupada = butacasOcupadas.includes(numero);
                      const sel = butacasSeleccionadas.includes(numero);
                      return (
                        <div key={numero} onClick={() => { if (!ocupada) sel ? setButacasSeleccionadas(butacasSeleccionadas.filter(b => b !== numero)) : setButacasSeleccionadas([...butacasSeleccionadas, numero]) }}
                             style={{ height: '38px', background: ocupada ? '#dc3545' : sel ? '#ffc107' : '#222', color: sel ? '#000' : '#fff', border: '1px solid #383838', borderRadius: '6px', cursor: ocupada ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85em', fontWeight: 'bold', transition: 'transform 0.1s' }}>
                          {numero}
                        </div>
                      )
                    })}
                  </div>

                  {/* LEYENDA */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', margin: '25px 0', fontSize: '0.85em', color: '#aaa' }}>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#222', border: '1px solid #444', borderRadius: '3px', marginRight: '6px', verticalAlign: 'middle' }}></span> Disponible</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffc107', borderRadius: '3px', marginRight: '6px', verticalAlign: 'middle' }}></span> Seleccionada</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dc3545', borderRadius: '3px', marginRight: '6px', verticalAlign: 'middle' }}></span> Ocupada</span>
                  </div>

                  {butacasSeleccionadas.length > 0 && (
                    <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '14px 28px', fontSize: '1.1em', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 14px rgba(40,167,69,0.4)' }}>
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