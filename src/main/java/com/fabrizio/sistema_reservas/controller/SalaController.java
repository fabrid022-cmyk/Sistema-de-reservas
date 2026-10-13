package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Sala;
import com.fabrizio.sistema_reservas.repository.CineRepository;
import com.fabrizio.sistema_reservas.repository.SalaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/salas")
public class SalaController {
    @Autowired private SalaRepository salaRepository;
    @Autowired private CineRepository cineRepository;

    // Crear una sala y asignarla a un cine específico
    @PostMapping("/cine/{idCine}")
    public ResponseEntity<?> crearSala(@PathVariable Integer idCine, @RequestBody Sala sala) {
        return cineRepository.findById(idCine).map(cine -> {
            sala.setCine(cine); // Vinculamos la sala al cine
            return ResponseEntity.ok(salaRepository.save(sala));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Eliminar sala
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarSala(@PathVariable Integer id) {
        salaRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}