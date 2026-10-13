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

    // Obtener funciones de un cine específico
    @GetMapping("/cine/{idCine}")
    public List<Funcion> obtenerPorCine(@PathVariable Integer idCine) {
        return funcionRepository.findBySala_Cine_IdCine(idCine);
    }

    // Crear una función nueva (Lo usaremos en el próximo paso con el Admin)
    @PostMapping
    public ResponseEntity<Funcion> crearFuncion(@RequestBody Funcion funcion) {
        return ResponseEntity.ok(funcionRepository.save(funcion));
    }
}