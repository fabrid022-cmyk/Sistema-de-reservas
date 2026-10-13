import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [cines, setCines] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [funciones, setFunciones] = useState([])
  const [butacasOcupadas, setButacasOcupadas] = useState([])

  // Formularios
  const [nuevoCineNombre, setNuevoCineNombre] = useState('')
  const [nuevoCineDireccion, setNuevoCineDireccion] = useState('')
  const [nuevaPeliTitulo, setNuevaPeliTitulo] = useState('')
  const [nuevaPeliIdioma, setNuevaPeliIdioma] = useState('')
  
  const [funcionCineId, setFuncionCineId] = useState('')
  const [funcionSalaId, setFuncionSalaId] = useState('')
  const [funcionPeliId, setFuncionPeliId] = useState('')
  const [funcionHorario, setFuncionHorario] = useState('')

  // Formularios de Sala
  const [nuevaSalaNumero, setNuevaSalaNumero] = useState('')
  const [nuevaSalaCapacidad, setNuevaSalaCapacidad] = useState(50)

  // Cliente
  const [cineSeleccionado, setCineSeleccionado] = useState(null)
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null)
  const [butacasSeleccionadas, setButacasSeleccionadas] = useState([])
  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  const cargarDatos = () => {
    fetch('http://localhost:8080/api/cines').then(r => r.json()).then(d => setCines(Array.isArray(d) ? d : []));
    if (usuario?.rol === 'ADMIN') {
      fetch('http://localhost:8080/api/peliculas').then(r => r.json()).then(d => setPeliculas(Array.isArray(d) ? d : []));
    }
  }

  useEffect(() => { if (usuario) cargarDatos(); }, [usuario])

  useEffect(() => {
    let timer;
    if (butacasSeleccionadas.length > 0 && tiempoRestante > 0 && !reservaExitosa) {
      timer = setInterval(() => setTiempoRestante(p => p - 1), 1000)
    } else if (tiempoRestante === 0) {
      alert("Tiempo expirado.")
      setButacasSeleccionadas([])
      setTiempoRestante(300)
    }
    return () => clearInterval(timer)
  }, [butacasSeleccionadas, tiempoRestante, reservaExitosa])

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setErrorLogin('')
    const res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    })
    if (res.ok) setUsuario(await res.json())
    else setErrorLogin('Email o contraseña incorrectos')
  }

  const cerrarSesion = () => {
    setUsuario(null); setCineSeleccionado(null); setFuncionSeleccionada(null); 
    setButacasSeleccionadas([]); setReservaExitosa(false);
  }

  // --- CRUD ADMIN ---
  const crearCine = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:8080/api/cines', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoCineNombre, ubicacion: { pais: "Argentina", direccion: nuevoCineDireccion }}) // Ahora se crea VACÍO (sin salas)
    })
    if (res.ok) { setNuevoCineNombre(''); setNuevoCineDireccion(''); cargarDatos(); }
  }

  const eliminarCine = async (id) => {
    if (window.confirm("¿Borrar cine?")) {
      await fetch(`http://localhost:8080/api/cines/${id}`, { method: 'DELETE' })
      cargarDatos()
    }
  }

  const agregarSala = async (e, idCine) => {
    e.preventDefault()
    const res = await fetch(`http://localhost:8080/api/salas/cine/${idCine}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: parseInt(nuevaSalaNumero), capacidad: parseInt(nuevaSalaCapacidad) })
    })
    if (res.ok) { setNuevaSalaNumero(''); setNuevaSalaCapacidad(50); cargarDatos(); }
    else alert('Error al crear la sala')
  }

  const eliminarSala = async (idSala) => {
    if (window.confirm("¿Borrar sala?")) {
      await fetch(`http://localhost:8080/api/salas/${idSala}`, { method: 'DELETE' })
      cargarDatos()
    }
  }

  const crearPelicula = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:8080/api/peliculas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: nuevaPeliTitulo, idioma: nuevaPeliIdioma, formato: "2D", duracionMinutos: 120 })
      })
      if (res.ok) {
        setNuevaPeliTitulo(''); setNuevaPeliIdioma(''); cargarDatos();
      } else {
        alert("Fallo al crear. Revisa la consola de Spring Boot.")
      }
    } catch (err) {
      alert("Error de conexión al servidor.")
    }
  }

  const eliminarPelicula = async (id) => {
    await fetch(`http://localhost:8080/api/peliculas/${id}`, { method: 'DELETE' }); cargarDatos();
  }

  const crearFuncion = async (e) => {
    e.preventDefault()
    
    // 1. Nos aseguramos de que no sean NaN ni nulos
    const idPeli = parseInt(funcionPeliId);
    const idSala = parseInt(funcionSalaId);

    if (isNaN(idPeli) || isNaN(idSala)) {
      alert("Por favor, seleccioná un Cine, una Sala y una Película válidos.");
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/funciones', {
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
      } else {
        alert('Error del servidor: No se pudo crear la función.');
      }
    } catch (error) {
      alert('Error de red: No hay conexión con Spring Boot.');
    }
  }

  // --- LÓGICA CLIENTE ---
  const manejarClickCine = async (cine) => {
    setCineSeleccionado(cine); setFuncionSeleccionada(null); setButacasSeleccionadas([]);
    const res = await fetch(`http://localhost:8080/api/funciones/cine/${cine.idCine}`)
    const data = await res.json()
    setFunciones(Array.isArray(data) ? data : [])
  }

  const seleccionarFuncion = async (funcion) => {
    setFuncionSeleccionada(funcion); setButacasSeleccionadas([]); setTiempoRestante(300); setReservaExitosa(false);
    const res = await fetch(`http://localhost:8080/api/reservas/ocupadas/${funcion.idFuncion}`)
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
      const res = await fetch('http://localhost:8080/api/reservas', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        // Agregamos las butacas recién compradas al arreglo de ocupadas para que se pongan rojas al instante
        setButacasOcupadas(prev => [...prev, ...butacasSeleccionadas])
        setReservaExitosa(true)
      } else {
        alert("Error al procesar la reserva en la base de datos.")
      }
    } catch (error) {
      alert("Error de red al intentar confirmar.")
    }
  }

  if (!usuario) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', textAlign: 'center' }}>
        <h2>Sistema de Reservas 🎬</h2>
        <form onSubmit={iniciarSesion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px' }} />
          <input type="password" placeholder="Clave" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '10px', background: '#000', color: '#fff' }}>Ingresar</button>
        </form>
      </div>
    )
  }

  if (usuario.rol === 'ADMIN') {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2>Panel de Administración ⚙️</h2>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff' }}>Salir</button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* CINES Y SALAS */}
          <div style={{ flex: 1, padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>1. Cines y Salas</h3>
            <form onSubmit={crearCine} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Nombre" value={nuevoCineNombre} onChange={e => setNuevoCineNombre(e.target.value)} required />
              <input type="text" placeholder="Dirección" value={nuevoCineDireccion} onChange={e => setNuevoCineDireccion(e.target.value)} required />
              <button type="submit">Crear Cine</button>
            </form>
            {cines.map(c => (
              <div key={c.idCine} style={{ padding: '10px', border: '1px solid #eee', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{c.nombre}</strong> <button onClick={() => eliminarCine(c.idCine)} style={{ color: 'red' }}>Borrar Cine</button>
                </div>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  {c.salas?.map(s => (
                    <li key={s.idSala} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                      <span>Sala {s.numero} (Cap: {s.capacidad})</span>
                      <button onClick={() => eliminarSala(s.idSala)} style={{ fontSize: '0.8em' }}>Eliminar</button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={(e) => agregarSala(e, c.idCine)} style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                  <input type="number" placeholder="N° Sala" value={nuevaSalaNumero} onChange={e => setNuevaSalaNumero(e.target.value)} required style={{ width: '80px' }}/>
                  <input type="number" placeholder="Capacidad" value={nuevaSalaCapacidad} onChange={e => setNuevaSalaCapacidad(e.target.value)} required style={{ width: '80px' }}/>
                  <button type="submit" style={{ fontSize: '0.8em' }}>+ Sala</button>
                </form>
              </div>
            ))}
          </div>

          {/* PELÍCULAS */}
          <div style={{ flex: 1, padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>2. Películas</h3>
            <form onSubmit={crearPelicula} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Título" value={nuevaPeliTitulo} onChange={e => setNuevaPeliTitulo(e.target.value)} required />
              <input type="text" placeholder="Idioma" value={nuevaPeliIdioma} onChange={e => setNuevaPeliIdioma(e.target.value)} required />
              <button type="submit">Crear</button>
            </form>
            <ul style={{ padding: 0 }}>
              {peliculas.map(p => (
                <li key={p.idPelicula} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{p.titulo} ({p.idioma})</span> 
                  <button onClick={() => eliminarPelicula(p.idPelicula)} style={{ color: 'red' }}>Eliminar</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* PROGRAMAR FUNCIÓN */}
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
          <h3>3. Programar Función</h3>
          <form onSubmit={crearFuncion} style={{ display: 'flex', gap: '15px' }}>
            <select value={funcionCineId} onChange={e => { setFuncionCineId(e.target.value); setFuncionSalaId(''); }} required>
              <option value="">Cine...</option>
              {cines.map(c => <option key={c.idCine} value={c.idCine}>{c.nombre}</option>)}
            </select>
            <select value={funcionSalaId} onChange={e => setFuncionSalaId(e.target.value)} required disabled={!funcionCineId}>
              <option value="">Sala...</option>
              {funcionCineId && cines.find(c => c.idCine.toString() === funcionCineId)?.salas.map(s => (
                <option key={s.idSala} value={s.idSala}>Sala {s.numero}</option>
              ))}
            </select>
            <select value={funcionPeliId} onChange={e => setFuncionPeliId(e.target.value)} required>
              <option value="">Película...</option>
              {peliculas.map(p => <option key={p.idPelicula} value={p.idPelicula}>{p.titulo}</option>)}
            </select>
            <input type="datetime-local" value={funcionHorario} onChange={e => setFuncionHorario(e.target.value)} required />
            <button type="submit" style={{ background: '#007bff', color: 'white' }}>Programar</button>
          </form>
        </div>
      </div>
    )
  }

  // --- VISTA CLIENTE ---
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Cartelera 🍿</h2>
        <button onClick={cerrarSesion} style={{ background: '#000', color: '#fff', padding: '8px' }}>Salir</button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Cines</h3>
          {cines.map(c => (
            <button key={c.idCine} onClick={() => manejarClickCine(c)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '5px' }}>{c.nombre}</button>
          ))}
          
          {cineSeleccionado && (
            <div style={{ marginTop: '20px' }}>
              <h3>Funciones en {cineSeleccionado.nombre}</h3>
              {funciones.map(f => (
                <button key={f.idFuncion} onClick={() => seleccionarFuncion(f)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '5px', background: '#007bff', color: 'white' }}>
                  {f.pelicula?.titulo} - Sala {f.sala?.numero} <br/> <small>{new Date(f.horario).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {funcionSeleccionada && (
          <div style={{ flex: 2, padding: '30px', background: '#1a1a1a', color: '#fff', borderRadius: '8px', textAlign: 'center' }}>
            {reservaExitosa ? (
              <div>
                <h2 style={{ color: '#28a745' }}>¡Reserva Confirmada! 🎉</h2>
                <p>{funcionSeleccionada.pelicula?.titulo} - Sala {funcionSeleccionada.sala?.numero}</p>
                <p>Butacas: {butacasSeleccionadas.join(', ')}</p>
              </div>
            ) : (
              <>
                <h3>Seleccioná tus butacas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px', margin: '20px auto', maxWidth: '500px' }}>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(numero => {
                    const ocupada = butacasOcupadas.includes(numero);
                    const sel = butacasSeleccionadas.includes(numero);
                    return (
                      <div key={numero} onClick={() => { if (!ocupada) sel ? setButacasSeleccionadas(butacasSeleccionadas.filter(b => b !== numero)) : setButacasSeleccionadas([...butacasSeleccionadas, numero]) }}
                           style={{ height: '40px', background: ocupada ? '#dc3545' : sel ? '#ffc107' : '#444', borderRadius: '5px', cursor: ocupada ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {numero}
                      </div>
                    )
                  })}
                </div>
                {butacasSeleccionadas.length > 0 && (
                  <button onClick={confirmarReserva} style={{ background: '#28a745', color: '#fff', padding: '15px 30px', fontSize: '1.2em', cursor: 'pointer' }}>
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