package com.fabrizio.sistema_reservas.controller;

import com.fabrizio.sistema_reservas.dto.ReservaRequestDTO;
import com.fabrizio.sistema_reservas.model.Estado;
import com.fabrizio.sistema_reservas.model.Reserva;
import com.fabrizio.sistema_reservas.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaRepository reservaRepository;

    @PostMapping
    public ResponseEntity<?> crearReserva(@RequestBody ReservaRequestDTO request) {
        try {
            Reserva nuevaReserva = new Reserva();
            nuevaReserva.setIdUsuario(request.getIdUsuario());
            nuevaReserva.setIdFuncion(request.getIdSala()); // En nuestro frontend mandamos el idFuncion acá
            nuevaReserva.setButacas(request.getButacasSeleccionadas());
            nuevaReserva.setFechaHoraCreacion(LocalDateTime.now());
            nuevaReserva.setEstado(Estado.CONFIRMADA); // O PENDIENTE según prefieras

            Reserva guardada = reservaRepository.save(nuevaReserva);
            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al guardar la reserva: " + e.getMessage());
        }
    }

    @GetMapping("/ocupadas/{idFuncion}")
    public ResponseEntity<List<Integer>> obtenerButacasOcupadas(@PathVariable Integer idFuncion) {
        try {
            List<Reserva> reservas = reservaRepository.findByIdFuncion(idFuncion);
            List<Integer> ocupadas = new ArrayList<>();
            for (Reserva r : reservas) {
                if (r.getButacas() != null) {
                    ocupadas.addAll(r.getButacas());
                }
            }
            return ResponseEntity.ok(ocupadas);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}