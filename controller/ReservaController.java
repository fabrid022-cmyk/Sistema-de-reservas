package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.model.Reserva;
import com.fabrizio.sistema_reservas.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    // Petición POST: http://localhost:8080/api/reservas
    @PostMapping
    public Reserva crearReserva(@RequestBody Reserva reserva) {
        return reservaService.crearReserva(reserva);
    }

    // Petición PUT: http://localhost:8080/api/reservas/1/confirmar
    @PutMapping("/{id}/confirmar")
    public void confirmarReserva(@PathVariable Integer id) {
        // @PathVariable extrae el número {id} directamente de la URL
        reservaService.confirmarReserva(id);
    }
}