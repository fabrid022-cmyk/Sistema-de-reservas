package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Pelicula;
import com.fabrizio.sistema_reservas.repository.PeliculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173") // OBLIGATORIO PARA REACT
@RestController
@RequestMapping("/api/peliculas")
public class PeliculaController {
    @Autowired private PeliculaRepository peliculaRepository;

    @GetMapping
    public List<Pelicula> obtenerTodas() { return peliculaRepository.findAll(); }

    @PostMapping
    public ResponseEntity<Pelicula> crearPelicula(@RequestBody Pelicula pelicula) {
        // Forzamos valores por defecto si vienen vacíos para que la base de datos no lo rechace
        if (pelicula.getFormato() == null) pelicula.setFormato("2D");
        if (pelicula.getDuracionMinutos() == 0) pelicula.setDuracionMinutos(120);
        return ResponseEntity.ok(peliculaRepository.save(pelicula));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPelicula(@PathVariable Integer id) {
        peliculaRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}