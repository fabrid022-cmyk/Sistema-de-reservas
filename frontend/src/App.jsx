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

  // Formularios de Sala (dinámicos)
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
    fetch(`${API_URL}/api/funciones`).then(r => r.json()).then(d => setFunciones(Array.isArray(d) ? d : []));
  }

  useEffect(() => { if (usuario) cargarDatos(); }, [usuario])

  useEffect(() => {
    let timer;
    if (butacasSeleccionadas.length > 0 && tiempoRestante > 0 && !reservaExitosa) {
      timer = setInterval(() => setTiempoRestante(p => p - 1), 1000)
    } else if (tiempoRestante === 0) {
      alert("Tiempo de reserva expirado.")
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
      else setErrorLogin('Email o contraseña incorrectos')
    } catch (err) {
      setErrorLogin('Error de conexión con el servidor')
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
    if (window.confirm("¿Deseas eliminar este cine?")) {
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
    if (res.ok) {
      setEditandoSalaId(null);
      cargarDatos();
    } else {
      alert("No se pudo actualizar la capacidad.");
    }
  }

  const eliminarSala = async (idSala) => {
    if (window.confirm("¿Borrar sala?")) {
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
    const idPeli = parseInt(funcionPeliId);
    const idSala = parseInt(funcionSalaId);

    if (isNaN(idPeli) || isNaN(idSala)) {
      alert("Seleccioná un Cine, Sala y Película válidos.");
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
        alert("Error al procesar la reserva.")
      }
    } catch (error) {
      alert("Error de red al confirmar.")
    }
  }

  // --- LOGIN ---
  if (!usuario) {
    return (
      <div style={{ maxWidth: '380px', margin: '80px auto', padding: '30px', border: '1px solid #333', borderRadius: '12px', background: '#181818', color: '#fff', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px', color: '#e50914' }}>Sistema de Reservas 🎬</h2>
        {errorLogin && <p style={{ color: '#ff4d4d', fontSize: '0.9em' }}>{errorLogin}</p>}
        <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff' }} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff' }} />
          <button type="submit" style={{ padding: '12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Ingresar</button>
        </form>
      </div>
    )
  }

  // Capacidad de la sala seleccionada por el cliente
  const capacidadTotal = funcionSeleccionada?.sala?.capacidad || 50;

  // --- VISTA ADMIN ---
  if (usuario.rol === 'ADMIN') {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e50914', paddingBottom: '15px', marginBottom: '25px' }}>
          <h2>Panel Administrativo ⚙️</h2>
          <div>
            <span style={{ marginRight: '15px', color: '#aaa' }}>{usuario.email}</span>
            <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          {/* CINES Y SALAS */}
          <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', background: '#f8f9fa' }}>
            <h3>1. Cines y Ajuste de Capacidad de Salas</h3>
            <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Nombre Cine" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
              <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
              <button type="submit" style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>Crear Cine</button>
            </form>

            {cines.map(c => (
              <div key={c.idCine} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>📍 {c.nombre}</strong> 
                  <button onClick={() => eliminarCine(c.idCine)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Borrar Cine</button>
                </div>
                <small style={{ color: '#666', display: 'block', marginBottom: '8px' }}>{c.ubicacion?.direccion}</small>

                <ul style={{ margin: '5px 0', paddingLeft: '0', listStyle: 'none' }}>
                  {c.salas?.map(s => (
                    <li key={s.idSala} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', padding: '6px', background: '#f1f1f1', borderRadius: '4px' }}>
                      <span>Sala {s.numero} — 🪑 <strong>{s.capacidad || 50}</strong> asientos</span>
                      <div>
                        {editandoSalaId === s.idSala ? (
                          <>
                            <input type="number" value={editCapacidad} onChange={e => setEditCapacidad(e.target.value)} style={{ width: '60px', padding: '3px', marginRight: '5px' }} />
                            <button onClick={() => guardarCapacidadSala(s.idSala)} style={{ fontSize: '0.8em', background: '#28a745', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '3px' }}>OK</button>
                          </>
                        ) : (
                          <button onClick={() => { setEditandoSalaId(s.idSala); setEditCapacidad(s.capacidad || 50); }} style={{ fontSize: '0.8em', background: '#ffc107', color: '#000', border: 'none', padding: '3px 6px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>Editar Capacidad</button>
                        )}
                        <button onClick={() => eliminarSala(s.idSala)} style={{ fontSize: '0.8em', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </li>
                  ))}
                </ul>

                <form onSubmit={(e) => agregarSala(e, c.idCine)} style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                  <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} required style={{ width: '90px', padding: '5px' }}/>
                  <input type="number" placeholder="Asientos" value={nuevaSalaCapacidad} onChange={e => setNuevaSalaCapacidad(e.target.value)} required style={{ width: '90px', padding: '5px' }}/>
                  <button type="submit" style={{ fontSize: '0.8em', background: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>+ Agregar Sala</button>
                </form>
              </div>
            ))}
          </div>

          {/* PELÍCULAS */}
          <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', background: '#f8f9fa' }}>
            <h3>2. Películas</h3>
            <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Título" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
              <input type="text" placeholder="Idioma" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required style={{ width: '100px', padding: '8px' }} />
              <button type="submit" style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>Agregar</button>
            </form>
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {peliculas.map(p => (
                <li key={p.idPelicula} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff', marginBottom: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <span>🎬 <strong>{p.titulo}</strong> ({p.idioma})</span> 
                  <button onClick={() => eliminarPelicula(p.idPelicula)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* PROGRAMAR FUNCIONES */}
        <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', background: '#f8f9fa' }}>
          <h3>3. Programar Función</h3>
          <form onSubmit={crearFuncion} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} required style={{ padding: '8px' }}>
              <option value="">Seleccionar Cine...</option>
              {cines.map(c => <option key={c.idCine} value={c.idCine}>{c.nombre}</option>)}
            </select>

            <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} required disabled={!funcionCineId} style={{ padding: '8px' }}>
              <option value="">Seleccionar Sala...</option>
              {funcionCineId && cines.find(c => c.idCine.toString() === funcionCineId)?.salas.map(s => (
                <option key={s.idSala} value={s.idSala}>Sala {s.numero} ({s.capacidad || 50} butacas)</option>
              ))}
            </select>

            <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} required style={{ padding: '8px' }}>
              <option value="">Seleccionar Película...</option>
              {peliculas.map(p => <option key={p.idPelicula} value={p.idPelicula}>{p.titulo}</option>)}
            </select>

            <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} required style={{ padding: '8px' }} />
            <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Programar Función</button>
          </form>
        </div>
      </div>
    )
  }

  // --- VISTA CLIENTE ---
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e50914', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Cartelera de Cine 🍿</h2>
        <button onClick={cerrarSesion} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* LISTADO CINES Y FUNCIONES */}
        <div style={{ flex: 1, padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Seleccionar Cine</h3>
          {cines.map(c => (
            <button key={c.idCine} onClick={() => manejarClickCine(c)} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '8px', background: cineSeleccionado?.idCine === c.idCine ? '#e50914' : '#fff', color: cineSeleccionado?.idCine === c.idCine ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' }}>
              📍 {c.nombre} <br/><small style={{ fontWeight: 'normal' }}>{c.ubicacion?.direccion}</small>
            </button>
          ))}
          
          {cineSeleccionado && (
            <div style={{ marginTop: '20px' }}>
              <h3>Funciones Disponibles</h3>
              {funciones.length === 0 ? <p>No hay funciones cargadas en este cine.</p> : funciones.map(f => (
                <button key={f.idFuncion} onClick={() => seleccionarFuncion(f)} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '8px', background: funcionSeleccionada?.idFuncion === f.idFuncion ? '#007bff' : '#f8f9fa', color: funcionSeleccionada?.idFuncion === f.idFuncion ? '#fff' : '#333', border: '1px solid #007bff', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}>
                  🎬 <strong>{f.pelicula?.titulo}</strong> <br/>
                  <small>Sala {f.sala?.numero} ({f.sala?.capacidad || 50} asientos) — {new Date(f.horario).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAPA DE BUTACAS Y RESERVA */}
        {funcionSeleccionada && (
          <div style={{ flex: 2, padding: '25px', background: '#181818', color: '#fff', borderRadius: '8px', textAlign: 'center' }}>
            {reservaExitosa ? (
              <div style={{ padding: '20px', background: '#222', borderRadius: '8px', border: '1px solid #28a745' }}>
                <h2 style={{ color: '#28a745' }}>¡Reserva Confirmada! 🎉</h2>
                <div style={{ textTransform: 'uppercase', letterSpacing: '1px', borderTop: '1px dashed #555', borderBottom: '1px dashed #555', padding: '15px 0', margin: '15px 0' }}>
                  <p style={{ fontSize: '1.2em', margin: '5px 0' }}><strong>{funcionSeleccionada.pelicula?.titulo}</strong></p>
                  <p style={{ color: '#aaa', margin: '5px 0' }}>📍 {cineSeleccionado?.nombre} — {cineSeleccionado?.ubicacion?.direccion}</p>
                  <p style={{ color: '#aaa', margin: '5px 0' }}>🍿 Sala {funcionSeleccionada.sala?.numero} | 🕒 {new Date(funcionSeleccionada.horario).toLocaleString()}</p>
                  <p style={{ color: '#ffc107', fontSize: '1.1em', marginTop: '10px' }}>Butacas: {butacasSeleccionadas.join(', ')}</p>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 10px 0' }}>{funcionSeleccionada.pelicula?.titulo}</h3>
                
                {/* REPRESENTACIÓN DE LA PANTALLA */}
                <div style={{ margin: '15px auto 25px auto', width: '80%', background: 'linear-gradient(to bottom, #888, #333)', height: '18px', borderRadius: '4px', color: '#ddd', fontSize: '0.7em', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '3px', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
                  PANTALLA
                </div>

                {/* GRILLA DE BUTACAS DINÁMICA SEGÚN CAPACIDAD */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px', margin: '20px auto', maxWidth: '550px' }}>
                  {Array.from({ length: capacidadTotal }, (_, i) => i + 1).map(numero => {
                    const ocupada = butacasOcupadas.includes(numero);
                    const sel = butacasSeleccionadas.includes(numero);
                    return (
                      <div key={numero} onClick={() => { if (!ocupada) sel ? setButacasSeleccionadas(butacasSeleccionadas.filter(b => b !== numero)) : setButacasSeleccionadas([...butacasSeleccionadas, numero]) }}
                           style={{ height: '36px', background: ocupada ? '#dc3545' : sel ? '#ffc107' : '#333', color: sel ? '#000' : '#fff', borderRadius: '4px', cursor: ocupada ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85em', fontWeight: 'bold' }}>
                        {numero}
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0', fontSize: '0.85em', color: '#aaa' }}>
                  <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#333', borderRadius: '2px', marginRight: '5px' }}></span> Disponible</span>
                  <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffc107', borderRadius: '2px', marginRight: '5px' }}></span> Seleccionada</span>
                  <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dc3545', borderRadius: '2px', marginRight: '5px' }}></span> Ocupada</span>
                </div>

                {butacasSeleccionadas.length > 0 && (
                  <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '12px 24px', fontSize: '1.1em', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>
                    Confirmar Reserva ({Math.floor(tiempoRestante/60)}:{(tiempoRestante%60).toString().padStart(2, '0')})
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App