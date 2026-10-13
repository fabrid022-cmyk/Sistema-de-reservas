package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Funcion;
import com.fabrizio.sistema_reservas.repository.FuncionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/funciones")
public class FuncionController {

    @Autowired
    private FuncionRepository funcionRepository;

    // Todas las funciones (panel admin)
    @GetMapping
    public List<Funcion> obtenerTodas() {
        return funcionRepository.findAll();
    }

    // Obtener funciones de un cine específico
    @GetMapping("/cine/{idCine}")
    public List<Funcion> obtenerPorCine(@PathVariable Integer idCine) {
        return funcionRepository.findBySala_Cine_IdCine(idCine);
    }

    // Crear una función nueva
    @PostMapping
    public ResponseEntity<?> crearFuncion(@RequestBody Funcion funcion) {
        if (funcion.getHorario() == null) {
            return ResponseEntity.badRequest().body("Falta el horario de la función.");
        }
        return ResponseEntity.ok(funcionRepository.save(funcion));
    }

    // Actualizar el horario de una función ya programada
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarHorario(@PathVariable Integer id, @RequestBody Funcion datos) {
        if (datos.getHorario() == null) {
            return ResponseEntity.badRequest().body("Falta el horario de la función.");
        }
        return funcionRepository.findById(id).map(funcion -> {
            funcion.setHorario(datos.getHorario());
            return ResponseEntity.ok(funcionRepository.save(funcion));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Eliminar función (el frontend la llamaba pero no existía: devolvía 405 y la función nunca se borraba)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarFuncion(@PathVariable Integer id) {
        if (!funcionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        funcionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}