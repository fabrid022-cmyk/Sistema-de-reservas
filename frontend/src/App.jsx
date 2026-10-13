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

  // Edición Admin
  const [editandoCineId, setEditandoCineId] = useState(null)
  const [editCineNombre, setEditCineNombre] = useState('')
  const [editCineDireccion, setEditCineDireccion] = useState('')
  const [editandoFuncionId, setEditandoFuncionId] = useState(null)
  const [nuevoHorarioEdit, setNuevoHorarioEdit] = useState('')
  const [nuevaSalaNumero, setNuevaSalaNumero] = useState('')
  const [nuevaSalaCapacidad, setNuevaSalaCapacidad] = useState(50)
  const [editandoSalaId, setEditandoSalaId] = useState(null)
  const [editCapacidad, setEditCapacidad] = useState(50)

  // Cliente (Flujo Progresivo Paso a Paso)
  const [pasoCliente, setPasoCliente] = useState(1); // 1: Cines, 2: Películas, 3: Horarios, 4: Butacas
  const [cineSeleccionado, setCineSeleccionado] = useState(null)
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null)
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null)
  const [butacasSeleccionadas, setButacasSeleccionadas] = useState([])
  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [reservaExitosa, setReservaExitosa] = useState(false)
  const [activeTabAdmin, setActiveTabAdmin] = useState('cines')

  const cargarDatos = async () => {
    try {
      const resCines = await fetch(`${API_URL}/api/cines`);
      if (resCines.ok) setCines(await resCines.json());
    } catch (e) { console.error("Error cines:", e); }

    try {
      const resPelis = await fetch(`${API_URL}/api/peliculas`);
      if (resPelis.ok) setPeliculas(await resPelis.json());
    } catch (e) { console.error("Error pelis:", e); }

    try {
      const resFunc = await fetch(`${API_URL}/api/funciones`);
      if (resFunc.ok) {
        const data = await resFunc.json();
        setFuncionesAdmin(Array.isArray(data) ? data : []);
      } else {
        setFuncionesAdmin([]);
      }
    } catch (e) { setFuncionesAdmin([]); }
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
    setUsuario(null); setPasoCliente(1); setCineSeleccionado(null);
    setPeliculaSeleccionada(null); setFuncionSeleccionada(null); setButacasSeleccionadas([]); setReservaExitosa(false);
  }

  // --- CRUD ADMIN ---
  const crearCine = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/cines`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoCineNombre, ubicacion: { pais: "Argentina", direccion: nuevoCineDireccion }})
    })
    if (res.ok) { setNuevoCineNombre(''); setNuevoCineDireccion(''); cargarDatos(); }
    else alert("No se pudo crear el cine.");
  }

  const guardarEdicionCine = async (id) => {
    const res = await fetch(`${API_URL}/api/cines/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editCineNombre, ubicacion: { pais: "Argentina", direccion: editCineDireccion }})
    })
    if (res.ok) { setEditandoCineId(null); cargarDatos(); }
    else alert("Error al actualizar el cine.");
  }

  const eliminarCine = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cine?")) {
      const res = await fetch(`${API_URL}/api/cines/${id}`, { method: 'DELETE' });
      if (res.ok) cargarDatos();
      else alert("No se pudo eliminar el complejo.");
    }
  }

  const agregarSala = async (e, idCine) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/salas/cine/${idCine}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: parseInt(nuevaSalaNumero), capacidad: parseInt(nuevaSalaCapacidad) || 50 })
    })
    if (res.ok) { setNuevaSalaNumero(''); setNuevaSalaCapacidad(50); cargarDatos(); }
    else alert("Error al agregar sala.");
  }

  const guardarCapacidadSala = async (idSala) => {
    const res = await fetch(`${API_URL}/api/salas/${idSala}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacidad: parseInt(editCapacidad) })
    })
    if (res.ok) { setEditandoSalaId(null); cargarDatos(); }
    else alert("Error al actualizar capacidad.");
  }

  const eliminarSala = async (idSala) => {
    if (window.confirm("¿Eliminar sala?")) {
      const res = await fetch(`${API_URL}/api/salas/${idSala}`, { method: 'DELETE' });
      if (res.ok) cargarDatos();
      else alert("No se pudo eliminar la sala.");
    }
  }

  const crearPelicula = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/api/peliculas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevaPeliTitulo, idioma: nuevaPeliIdioma, formato: "2D", duracionMinutos: 120 })
    })
    if (res.ok) { setNuevaPeliTitulo(''); setNuevaPeliIdioma(''); cargarDatos(); }
    else alert("Error al crear la película.");
  }

  const eliminarPelicula = async (id) => {
    if (window.confirm("¿Eliminar película?")) {
      const res = await fetch(`${API_URL}/api/peliculas/${id}`, { method: 'DELETE' });
      if (res.ok) cargarDatos();
      else alert("No se pudo eliminar la película.");
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
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horario: nuevoHorarioEdit })
    })
    if (res.ok) {
      setEditandoFuncionId(null); setNuevoHorarioEdit(''); cargarDatos();
    } else {
      alert("Error al actualizar la función.");
    }
  }

  const eliminarFuncion = async (idFuncion) => {
    if (window.confirm("¿Eliminar esta función?")) {
      const res = await fetch(`${API_URL}/api/funciones/${idFuncion}`, { method: 'DELETE' });
      if (res.ok) cargarDatos();
      else alert("No se pudo eliminar la función.");
    }
  }

  // --- CLIENTE (FLUJO PROGRESIVO) ---
  const seleccionarCineCliente = async (cine) => {
    setCineSeleccionado(cine); setPeliculaSeleccionada(null); setFuncionSeleccionada(null); setButacasSeleccionadas([]);
    const cid = cine.idCine || cine.id;
    try {
      const res = await fetch(`${API_URL}/api/funciones/cine/${cid}`)
      if (res.ok) {
        const data = await res.json();
        setFuncionesCliente(Array.isArray(data) ? data : []);
      } else {
        setFuncionesCliente([]);
      }
    } catch {
      setFuncionesCliente([]);
    }
    setPasoCliente(2);
  }

  const seleccionarPeliculaCliente = (pelicula) => {
    setPeliculaSeleccionada(pelicula); setFuncionSeleccionada(null); setButacasSeleccionadas([]);
    setPasoCliente(3);
  }

  const seleccionarFuncionCliente = async (funcion) => {
    setFuncionSeleccionada(funcion); setButacasSeleccionadas([]); setTiempoRestante(300); setReservaExitosa(false);
    const idF = funcion.idFuncion || funcion.id;
    try {
      const res = await fetch(`${API_URL}/api/reservas/ocupadas/${idF}`)
      if (res.ok) {
        const data = await res.json()
        setButacasOcupadas(Array.isArray(data) ? data : [])
      } else {
        setButacasOcupadas([])
      }
    } catch {
      setButacasOcupadas([])
    }
    setPasoCliente(4);
  }

  const confirmarReserva = async () => {
    const idF = funcionSeleccionada.idFuncion || funcionSeleccionada.id;
    const payload = {
      idUsuario: usuario.idUsuario || usuario.id || 1,
      idSala: funcionSeleccionada.sala?.idSala || funcionSeleccionada.sala?.id || idF,
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

  // Generador de Matriz con distribución variable (Atrás más amplia / Adelante más corta si se desea)
  const capacidadTotal = funcionSeleccionada?.sala?.capacidad || 50;
  const columnasPorFila = 10;
  const letrasFilas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  
  const generarMatrizAsientos = () => {
    const asientos = [];
    const totalFilas = Math.ceil(capacidadTotal / columnasPorFila);
    for (let f = 0; f < totalFilas; f++) {
      const letraFila = letrasFilas[f] || 'X';
      const filaAsientos = [];
      for (let c = 1; c <= columnasPorFila; c++) {
        const numeroGlobal = f * columnasPorFila + c;
        if (numeroGlobal <= capacidadTotal) {
          filaAsientos.push({ id: numeroGlobal, etiqueta: `${letraFila}${c}` });
        }
      }
      asientos.push({ fila: letraFila, asientos: filaAsientos });
    }
    return asientos;
  };

  const peliculasDisponiblesEnCine = Array.from(
    new Map(
      funcionesCliente
        .filter(f => f.pelicula)
        .map(f => [f.pelicula.idPelicula || f.pelicula.id, f.pelicula])
    ).values()
  );

  const funcionesDePeliculaSeleccionada = peliculaSeleccionada 
    ? funcionesCliente.filter(f => (f.pelicula?.idPelicula || f.pelicula?.id) === (peliculaSeleccionada.idPelicula || peliculaSeleccionada.id))
    : [];

  // --- LOGIN ---
  if (!usuario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', background: '#121212', borderRadius: '16px', border: '1px solid #222', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', color: '#fff' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#e50914', fontSize: '2.3em', margin: '0 0 8px 0', fontWeight: '900', letterSpacing: '1px' }}>CINEMAX 🍿</h1>
            <p style={{ color: '#888', fontSize: '0.85em' }}>Portal Oficial de Reservas</p>
          </div>
          {errorLogin && <div style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid #e50914', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85em', textAlign: 'center', fontWeight: '600' }}>{errorLogin}</div>}
          <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8em', color: '#bbb', fontWeight: '600' }}>Correo Electrónico</label>
              <input type="email" placeholder="admin@reservas.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8em', color: '#bbb', fontWeight: '600' }}>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button type="submit" style={{ padding: '12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1em', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(229,9,20,0.4)' }}>Iniciar Sesión</button>
          </form>
        </div>
      </div>
    )
  }

  // --- VISTA ADMIN ---
  if (usuario.rol === 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', color: '#f1f1f1', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: 0, color: '#e50914', fontSize: '1.8em', fontWeight: '900' }}>Panel Admin ⚙️</h1>
              <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85em' }}>Gestión completa de complejos, salas, aforos y cartelera.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#ccc', background: '#121212', padding: '6px 12px', borderRadius: '6px', border: '1px solid #222', fontSize: '0.85em' }}>{usuario.email}</span>
              <button onClick={cerrarSesion} style={{ padding: '7px 14px', background: '#1a1a1a', color: '#ff4d4d', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>Salir</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTabAdmin('cines')} style={{ padding: '8px 16px', background: activeTabAdmin === 'cines' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📍 Cines y Salas</button>
            <button onClick={() => setActiveTabAdmin('peliculas')} style={{ padding: '8px 16px', background: activeTabAdmin === 'peliculas' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🎬 Películas</button>
            <button onClick={() => setActiveTabAdmin('funciones')} style={{ padding: '8px 16px', background: activeTabAdmin === 'funciones' ? '#e50914' : '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🕒 Funciones</button>
          </div>

          {activeTabAdmin === 'cines' && (
            <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Registrar Complejo Nuevo</h3>
              <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Nombre" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required style={{ flex: '1 1 150px', padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required style={{ flex: '1 1 150px', padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 20px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Añadir Complejo</button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {cines.map(c => {
                  const cid = c.idCine || c.id;
                  return (
                    <div key={cid} style={{ background: '#181818', border: '1px solid #2c2c2c', borderRadius: '10px', padding: '15px' }}>
                      {editandoCineId === cid ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input type="text" value={editCineNombre} onChange={e => setEditCineNombre(e.target.value)} style={{ padding: '6px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} />
                          <input type="text" value={editCineDireccion} onChange={e => setEditCineDireccion(e.target.value)} style={{ padding: '6px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }} />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => guardarEdicionCine(cid)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
                            <button onClick={() => setEditandoCineId(null)} style={{ background: '#444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#fff', fontSize: '1.05em' }}>{c.nombre}</strong>
                            <div>
                              <button onClick={() => { setEditandoCineId(cid); setEditCineNombre(c.nombre); setEditCineDireccion(c.ubicacion?.direccion || ''); }} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', marginRight: '8px', fontSize: '0.85em' }}>Editar</button>
                              <button onClick={() => eliminarCine(cid)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85em' }}>Borrar</button>
                            </div>
                          </div>
                          <small style={{ color: '#888', display: 'block', marginBottom: '10px' }}>📍 {c.ubicacion?.direccion}</small>
                          
                          <div style={{ background: '#111', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.75em', color: '#777', textTransform: 'uppercase', fontWeight: 'bold' }}>Salas:</span>
                            <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px', fontSize: '0.85em', color: '#ccc' }}>
                              {c.salas?.map(s => (
                                <li key={s.idSala || s.id} style={{ margin: '4px 0' }}>
                                  Sala {s.numero} ({s.capacidad || 50} butacas)
                                  <button onClick={() => eliminarSala(s.idSala || s.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: '6px', cursor: 'pointer' }}>[X]</button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <form onSubmit={(e) => agregarSala(e, cid)} style={{ display: 'flex', gap: '6px' }}>
                            <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} required style={{ width: '70px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '0.85em' }}/>
                            <input type="number" placeholder="Cap." value={nuevaSalaCapacidad} onChange={e => setNuevaSalaCapacidad(e.target.value)} required style={{ width: '70px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '0.85em' }}/>
                            <button type="submit" style={{ flex: 1, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.8em', cursor: 'pointer' }}>+ Sala</button>
                          </form>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTabAdmin === 'peliculas' && (
            <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Cartelera de Películas</h3>
              <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Título" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required style={{ flex: '1 1 180px', padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <input type="text" placeholder="Idioma" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required style={{ flex: '1 1 100px', padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px 20px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Película</button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {peliculas.map(p => {
                  const pid = p.idPelicula || p.id;
                  return (
                    <div key={pid} style={{ background: '#181818', border: '1px solid #2c2c2c', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', display: 'block' }}>{p.titulo}</strong>
                        <span style={{ fontSize: '0.75em', color: '#888' }}>{p.idioma}</span>
                      </div>
                      <button onClick={() => eliminarPelicula(pid)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTabAdmin === 'funciones' && (
            <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Programar Nueva Función</h3>
              <form onSubmit={crearFuncion} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} required style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                  <option value="">Seleccionar Complejo...</option>
                  {cines.map(c => <option key={c.idCine || c.id} value={c.idCine || c.id}>{c.nombre}</option>)}
                </select>
                <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} required disabled={!funcionCineId} style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                  <option value="">Seleccionar Sala...</option>
                  {funcionCineId && cines.find(c => (c.idCine || c.id).toString() === funcionCineId)?.salas.map(s => (
                    <option key={s.idSala || s.id} value={s.idSala || s.id}>Sala {s.numero} ({s.capacidad} butacas)</option>
                  ))}
                </select>
                <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} required style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                  <option value="">Seleccionar Película...</option>
                  {peliculas.map(p => <option key={p.idPelicula || p.id} value={p.idPelicula || p.id}>{p.titulo} ({p.idioma})</option>)}
                </select>
                <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} required style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                <button type="submit" style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Programar</button>
              </form>

              <h4 style={{ color: '#aaa', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '1px' }}>Cronograma de Funciones Activas:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {funcionesAdmin.map(f => {
                  const idF = f.idFuncion || f.id;
                  const d = f.horario ? new Date(f.horario) : null;
                  const fechaStr = d && !isNaN(d) ? d.toLocaleString('es-AR') : 'Horario No Definido';
                  return (
                    <div key={idF} style={{ background: '#181818', border: '1px solid #2c2c2c', borderRadius: '8px', padding: '15px', position: 'relative' }}>
                      <button onClick={() => eliminarFuncion(idF)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      <h5 style={{ margin: '0 0 5px 0', fontSize: '1.05em', color: '#fff' }}>🎬 {f.pelicula?.titulo || 'Película'}</h5>
                      <p style={{ margin: '3px 0', fontSize: '0.85em', color: '#bbb' }}>📍 {f.sala?.cine?.nombre || 'Complejo'} — Sala {f.sala?.numero}</p>
                      <p style={{ margin: '3px 0 12px 0', fontSize: '0.9em', color: '#ffc107', fontWeight: 'bold' }}>🕒 {fechaStr}</p>
                      
                      {editandoFuncionId === idF ? (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                          <input type="datetime-local" value={nuevoHorarioEdit} onChange={e => setNuevoHorarioEdit(e.target.value)} style={{ padding: '6px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '0.8em', flex: 1 }} />
                          <button onClick={() => guardarEdicionFuncion(idF)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>OK</button>
                          <button onClick={() => setEditandoFuncionId(null)} style={{ background: '#444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditandoFuncionId(idF); setNuevoHorarioEdit(f.horario ? f.horario.substring(0,16) : ''); }} style={{ background: '#242424', color: '#ffc107', border: '1px solid #444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}>Modificar Horario</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  // --- VISTA CLIENTE (FLUJO PROGRESIVO Y RESPONSIVE) ---
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f1f1f1', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        
        {/* Header con Stepper de Pasos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', borderBottom: '1px solid #222', paddingBottom: '18px', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#e50914', fontSize: '2.1em', fontWeight: '900', letterSpacing: '1px' }}>CINEMAX 🍿</h1>
            <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85em' }}>Seleccioná tu película y reservá en segundos.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.75em', background: '#121212', padding: '6px 10px', borderRadius: '6px', border: '1px solid #222' }}>
              <span style={{ color: pasoCliente >= 1 ? '#e50914' : '#555', fontWeight: 'bold' }}>1. Cine</span> &gt; 
              <span style={{ color: pasoCliente >= 2 ? '#e50914' : '#555', fontWeight: 'bold' }}>2. Película</span> &gt; 
              <span style={{ color: pasoCliente >= 3 ? '#e50914' : '#555', fontWeight: 'bold' }}>3. Horario</span> &gt; 
              <span style={{ color: pasoCliente >= 4 ? '#e50914' : '#555', fontWeight: 'bold' }}>4. Butacas</span>
            </div>
            <button onClick={cerrarSesion} style={{ background: '#121212', color: '#fff', border: '1px solid #333', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>Salir</button>
          </div>
        </div>

        {/* PASO 1: CINES */}
        {pasoCliente === 1 && (
          <div>
            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.2em' }}>📍 Seleccioná tu Complejo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
              {cines.map(c => (
                <div key={c.idCine || c.id} onClick={() => seleccionarCineCliente(c)} style={{ background: '#121212', border: '1px solid #282828', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = '#e50914'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#282828'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.1em' }}>{c.nombre}</h4>
                  <p style={{ margin: 0, color: '#888', fontSize: '0.85em' }}>📍 {c.ubicacion?.direccion}</p>
                </div>
              ))}
            </div>
            {cines.length === 0 && <p style={{ color: '#666' }}>Cargando complejos...</p>}
          </div>
        )}

        {/* PASO 2: PELÍCULAS */}
        {pasoCliente === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2em' }}>🎬 Películas en {cineSeleccionado?.nombre}</h3>
              <button onClick={() => setPasoCliente(1)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em' }}>← Volver a Cines</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
              {peliculasDisponiblesEnCine.map(p => (
                <div key={p.idPelicula || p.id} onClick={() => seleccionarPeliculaCliente(p)} style={{ background: '#121212', border: '1px solid #282828', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = '#007bff'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#282828'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🎥</div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.05em' }}>{p.titulo}</h4>
                  <span style={{ fontSize: '0.75em', background: '#1f1f1f', padding: '3px 8px', borderRadius: '4px', color: '#aaa' }}>{p.idioma}</span>
                </div>
              ))}
            </div>
            {peliculasDisponiblesEnCine.length === 0 && <p style={{ color: '#777' }}>No hay películas programadas en este cine actualmente.</p>}
          </div>
        )}

        {/* PASO 3: DÍA Y HORA */}
        {pasoCliente === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2em' }}>🕒 Horarios para: {peliculaSeleccionada?.titulo}</h3>
              <button onClick={() => setPasoCliente(2)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em' }}>← Volver a Películas</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '650px' }}>
              {funcionesDePeliculaSeleccionada.map(f => {
                const idF = f.idFuncion || f.id;
                const d = f.horario ? new Date(f.horario) : null;
                const fechaStr = d && !isNaN(d) ? d.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha a confirmar';
                const horaStr = d && !isNaN(d) ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div key={idF} onClick={() => seleccionarFuncionCliente(f)} style={{ background: '#121212', border: '1px solid #282828', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                       onMouseEnter={e => e.currentTarget.style.borderColor = '#28a745'}
                       onMouseLeave={e => e.currentTarget.style.borderColor = '#282828'}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '1em', display: 'block', marginBottom: '4px' }}>📅 {fechaStr}</strong>
                      <span style={{ color: '#ffc107', fontSize: '0.95em', fontWeight: 'bold' }}>🕒 Horario: {horaStr} hs</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: '#1f1f1f', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8em', color: '#aaa', fontWeight: '600' }}>Sala {f.sala?.numero || '1'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 4: MAPA DE BUTACAS Y TICKET */}
        {pasoCliente === 4 && funcionSeleccionada && (
          <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '25px 20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
              <button onClick={() => setPasoCliente(3)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em' }}>← Volver a Horarios</button>
            </div>

            {reservaExitosa ? (
              <div style={{ padding: '30px 15px', background: '#181818', borderRadius: '10px', border: '2px dashed #28a745', marginTop: '10px' }}>
                <h2 style={{ color: '#28a745', marginTop: 0, fontSize: '1.6em' }}>¡Reserva Confirmada! 🎉</h2>
                <div style={{ textTransform: 'uppercase', letterSpacing: '1px', borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '15px 0', margin: '15px 0' }}>
                  <p style={{ fontSize: '1.3em', margin: '5px 0', color: '#fff', fontWeight: '900' }}>{funcionSeleccionada.pelicula?.titulo}</p>
                  <p style={{ color: '#aaa', margin: '5px 0', fontSize: '0.9em' }}>📍 {cineSeleccionado?.nombre} ({cineSeleccionado?.ubicacion?.direccion})</p>
                  <p style={{ color: '#aaa', margin: '5px 0', fontSize: '0.9em' }}>🍿 Sala {funcionSeleccionada.sala?.numero || '1'} | 🕒 {new Date(funcionSeleccionada.horario).toLocaleString()}</p>
                  <p style={{ color: '#ffc107', fontSize: '1.2em', marginTop: '12px', fontWeight: '900' }}>Asientos Seleccionados: {butacasSeleccionadas.join(', ')}</p>
                </div>
                <button onClick={() => { setPasoCliente(1); setCineSeleccionado(null); setReservaExitosa(false); }} style={{ padding: '10px 24px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hacer otra reserva</button>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4em', color: '#fff', fontWeight: '900' }}>{funcionSeleccionada.pelicula?.titulo}</h3>
                <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '0.85em' }}>Seleccioná tus ubicaciones por fila (Ej: B4)</p>
                
                {/* PANTALLA */}
                <div style={{ margin: '0 auto 30px auto', width: '90%', maxWidth: '400px', background: 'linear-gradient(to bottom, #666, #1c1c1c)', height: '14px', borderRadius: '6px', color: '#ccc', fontSize: '0.65em', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '4px', fontWeight: 'bold' }}>
                  PANTALLA CINEMATOGRÁFICA
                </div>

                {/* MATRIZ DE BUTACAS POR FILAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingBottom: '10px' }}>
                  {generarMatrizAsientos().map(grupo => (
                    <div key={grupo.fila} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '20px', color: '#888', fontSize: '0.8em', fontWeight: 'bold' }}>{grupo.fila}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {grupo.asientos.map(asiento => {
                          const ocupada = butacasOcupadas.includes(asiento.id);
                          const sel = butacasSeleccionadas.includes(asiento.etiqueta);
                          return (
                            <div key={asiento.id} onClick={() => { 
                              if (!ocupada) {
                                sel ? setButacasSeleccionadas(butacasSeleccionadas.filter(b => b !== asiento.etiqueta)) 
                                    : setButacasSeleccionadas([...butacasSeleccionadas, asiento.etiqueta]);
                              }
                            }}
                                 style={{ width: '32px', height: '34px', background: ocupada ? '#dc3545' : sel ? '#ffc107' : '#1a1a1a', color: sel ? '#000' : '#fff', border: '1px solid #333', borderRadius: '6px', cursor: ocupada ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', fontWeight: 'bold', boxSizing: 'border-box' }}
                                 title={`${asiento.etiqueta}${ocupada ? ' (Ocupada)' : ''}`}>
                              {asiento.etiqueta.replace(grupo.fila, '')}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* LEYENDA */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', fontSize: '0.8em', color: '#aaa', flexWrap: 'wrap' }}>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#1a1a1a', border: '1px solid #444', borderRadius: '3px', marginRight: '5px', verticalAlign: 'middle' }}></span> Disponible</span>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ffc107', borderRadius: '3px', marginRight: '5px', verticalAlign: 'middle' }}></span> Seleccionada</span>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc3545', borderRadius: '3px', marginRight: '5px', verticalAlign: 'middle' }}></span> Ocupada</span>
                </div>

                {butacasSeleccionadas.length > 0 && (
                  <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '12px 30px', fontSize: '1.1em', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(40,167,69,0.4)' }}>
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