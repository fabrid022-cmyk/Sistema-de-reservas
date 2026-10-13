package com.fabrizio.sistema_reservas.service;

import com.fabrizio.sistema_reservas.model.Pelicula;
import com.fabrizio.sistema_reservas.repository.PeliculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service // Le dice a Spring que esta clase es un componente de servicio
public class PeliculaService {

    @Autowired // Inyecta automáticamente el repositorio (Inyección de Dependencias)
    private PeliculaRepository peliculaRepository;

    public List<Pelicula> obtenerTodasLasPeliculas() {
        return peliculaRepository.findAll(); // Método mágico de JpaRepository
    }

    public Optional<Pelicula> obtenerPeliculaPorId(Integer id) {
        return peliculaRepository.findById(id);
    }

    public Pelicula guardarPelicula(Pelicula pelicula) {
        return peliculaRepository.save(pelicula);
    }
}