package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.dto.CineDTO;
import com.fabrizio.sistema_reservas.service.CineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cines")
public class CineController {

    @Autowired
    private CineService cineService;

    // Petición GET: http://localhost:8080/api/cines
    @GetMapping
    public List<CineDTO> obtenerCines() {
        return cineService.obtenerTodosLosCines();
    }
}