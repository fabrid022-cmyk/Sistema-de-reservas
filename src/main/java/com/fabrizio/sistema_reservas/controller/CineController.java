package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Cine;
import com.fabrizio.sistema_reservas.repository.CineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/cines")
public class CineController {

    @Autowired
    private CineRepository cineRepository;

    @GetMapping
    public List<Cine> obtenerTodos() {
        return cineRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Cine> crearCine(@RequestBody Cine cine) {
        Cine nuevoCine = cineRepository.save(cine);
        return ResponseEntity.ok(nuevoCine);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCine(@PathVariable Integer id) {
        if (cineRepository.existsById(id)) {
            cineRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}