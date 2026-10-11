package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Pelicula;
import com.fabrizio.sistema_reservas.service.PeliculaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Indica que esta clase es un controlador REST y devolverá JSON
@RequestMapping("/api/peliculas") // Todas las rutas de esta clase empezarán con este prefijo
public class PeliculaController {

    @Autowired
    private PeliculaService peliculaService;

    // Petición GET: http://localhost:8080/api/peliculas
    @GetMapping
    public List<Pelicula> obtenerPeliculas() {
        return peliculaService.obtenerTodasLasPeliculas();
    }

    // Petición POST: http://localhost:8080/api/peliculas
    @PostMapping
    public Pelicula crearPelicula(@RequestBody Pelicula pelicula) {
        // @RequestBody agarra el JSON que nos envían y lo convierte en un objeto Pelicula
        return peliculaService.guardarPelicula(pelicula);
    }
}